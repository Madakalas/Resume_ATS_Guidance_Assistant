"""
main.py — FastAPI Backend Server

Endpoints (all existing ones preserved + new auth + conversations):
  POST /api/chat            — main chat endpoint (all agents)
  POST /api/upload          — upload resume or JD file
  GET  /api/health          — health check
  GET  /api/key-status      — check if API key is configured
  POST /api/greeting        — greeting message

  -- Threads (kept as-is, now backed by MongoDB conversations collection) --
  GET    /api/threads
  POST   /api/threads
  PATCH  /api/threads/{thread_id}
  DELETE /api/threads/{thread_id}

  -- Auth (DB: Data, collection: users) --
  POST /api/auth/signup
  POST /api/auth/login
  GET  /api/auth/google          — redirect to Google OAuth
  GET  /auth/google/callback      — OAuth callback, redirect to frontend with tokens
  POST /api/auth/refresh
  POST /api/auth/logout
  GET  /api/auth/me
  PATCH /api/auth/me
  POST /api/auth/change-password
  GET  /api/auth/sessions
  DELETE /api/auth/sessions/{jti}
  POST /api/auth/send-otp
  POST /api/auth/verify-otp

  -- Conversations (DB: Data, collection: conversations + messages) --
  GET    /api/conversations
  POST   /api/conversations
  GET    /api/conversations/{conv_id}
  PATCH  /api/conversations/{conv_id}
  DELETE /api/conversations/{conv_id}
  GET    /api/conversations/{conv_id}/messages
  POST   /api/conversations/{conv_id}/messages

MongoDB: localhost:27017, database "Data"
Collections: users, sessions, refresh_tokens, oauth_accounts, conversations, messages
"""

import os
import json
import secrets
import time
import threading
import uuid
import hashlib
import hmac
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Optional
from urllib.parse import urlencode

import httpx
import jwt
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Header, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from pymongo import MongoClient, DESCENDING
from dotenv import load_dotenv

from backend.config import get_openai_key, make_client
from backend.resume_parser import parse_bytes
from agents.orchestrator import Orchestrator, _looks_like_resume, _looks_like_jd
from agents.diff_agent import detect_changed_sections
from agents.interviewer import handle_interview_or_chat

# Load .env
_ROOT = Path(__file__).resolve().parent
load_dotenv(dotenv_path=_ROOT / ".env", override=False)

app = FastAPI(title="ATS Resume Intelligence API", version="3.0.0")

# ── CORS ─────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ══════════════════════════════════════════════════════════════════════════════
# MongoDB — DB: "Data", all 6 collections
# ══════════════════════════════════════════════════════════════════════════════
MONGO_URI     = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
DB_NAME       = "Data"
JWT_SECRET    = os.getenv("JWT_SECRET", "change-me-in-production-use-env")
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_TTL_MINUTES  = int(os.getenv("ACCESS_TOKEN_TTL_MINUTES", "60"))
REFRESH_TOKEN_TTL_DAYS    = int(os.getenv("REFRESH_TOKEN_TTL_DAYS", "30"))

# Google OAuth (optional)
GOOGLE_CLIENT_ID     = os.getenv("GOOGLE_CLIENT_ID", "").strip()
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "").strip()
GOOGLE_REDIRECT_URI  = os.getenv("GOOGLE_REDIRECT_URI", "").strip()
FRONTEND_URL         = os.getenv("FRONTEND_URL", "http://localhost:3000").rstrip("/")
GOOGLE_AUTH_URL      = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL     = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL  = "https://www.googleapis.com/oauth2/v2/userinfo"

_mongo_client = MongoClient(MONGO_URI)
_db           = _mongo_client[DB_NAME]

users_col          = _db["users"]
sessions_col       = _db["sessions"]
refresh_tokens_col = _db["refresh_tokens"]
oauth_col          = _db["oauth_accounts"]
conversations_col  = _db["conversations"]
messages_col       = _db["messages"]
otp_col            = _db["otp_validations"]

# Indexes
try:
    users_col.create_index("email", unique=True)
    sessions_col.create_index("user_id")
    sessions_col.create_index("jti", unique=True)
    refresh_tokens_col.create_index("user_id")
    refresh_tokens_col.create_index("token", unique=True)
    oauth_col.create_index([("provider", 1), ("provider_user_id", 1)], unique=True)
    conversations_col.create_index("user_id")
    messages_col.create_index("conversation_id")
    messages_col.create_index([("conversation_id", 1), ("created_at", 1)])
    otp_col.create_index([("email", 1), ("purpose", 1)])
except Exception:
    pass

# ══════════════════════════════════════════════════════════════════════════════
# Password + JWT helpers
# ══════════════════════════════════════════════════════════════════════════════
def hash_password(password: str) -> str:
    salt = os.urandom(16).hex()
    h = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 260_000).hex()
    return f"{salt}:{h}"

def verify_password(password: str, stored: str) -> bool:
    try:
        salt, h = stored.split(":", 1)
        new_h = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 260_000).hex()
        return hmac.compare_digest(new_h, h)
    except Exception:
        return False

def _create_access_token(user_id: str, email: str, name: str):
    jti = str(uuid.uuid4())
    exp = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_TTL_MINUTES)
    payload = {"sub": user_id, "email": email, "name": name, "jti": jti,
                "type": "access", "exp": exp, "iat": datetime.now(timezone.utc)}
    token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return token, jti

def _decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

def _create_refresh_value(user_id: str) -> str:
    raw = f"{user_id}:{uuid.uuid4()}:{time.time()}"
    return hashlib.sha256(raw.encode()).hexdigest()

def _issue_tokens(user: dict) -> dict:
    user_id = str(user["_id"])
    email   = user["email"]
    name    = user.get("name", "")
    access_token, jti = _create_access_token(user_id, email, name)
    refresh_value = _create_refresh_value(user_id)
    now = datetime.now(timezone.utc)
    sessions_col.insert_one({
        "_id": jti, "jti": jti, "user_id": user_id, "active": True,
        "created_at": now,
        "expires_at": now + timedelta(minutes=ACCESS_TOKEN_TTL_MINUTES),
    })
    refresh_tokens_col.insert_one({
        "_id": refresh_value, "token": refresh_value, "user_id": user_id, "jti": jti,
        "expires_at": now + timedelta(days=REFRESH_TOKEN_TTL_DAYS),
        "used": False, "created_at": now,
    })
    return {
        "success": True,
        "access_token": access_token,
        "refresh_token": refresh_value,
        "token_type": "Bearer",
        "expires_in": ACCESS_TOKEN_TTL_MINUTES * 60,
        "user": {"id": user_id, "email": email, "name": name,
                 "avatar": user.get("avatar"), "created_at": str(user.get("created_at", ""))},
    }

def get_current_user(authorization: Optional[str] = Header(None)) -> dict:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    payload = _decode_token(authorization.split(" ", 1)[1])
    jti = payload.get("jti")
    session = sessions_col.find_one({"jti": jti, "active": True})
    if not session:
        raise HTTPException(status_code=401, detail="Session expired or logged out")
    user = users_col.find_one({"_id": payload["sub"]})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

def get_optional_user(authorization: Optional[str] = Header(None)) -> Optional[dict]:
    try:
        return get_current_user(authorization)
    except HTTPException:
        return None


# ══════════════════════════════════════════════════════════════════════════════
# REQUEST / RESPONSE MODELS (all originals kept)
# ══════════════════════════════════════════════════════════════════════════════

class Message(BaseModel):
    role: str
    content: str
    files: list[str] = []

class ChatRequest(BaseModel):
    message: str
    history: list[Message] = []
    resume_text: str = ""
    jd_text: str = ""
    resume_name: str = ""
    jd_name: str = ""
    ats_mode: str = "HONEST"
    fresher_mode: bool = False
    fresher_profile: dict = {}
    awaiting_skill_confirm: Optional[str] = None
    resume_draft: str = ""
    active_jd_text: str = ""
    api_key: str = ""
    conversation_id: Optional[str] = None
    # Artifact tracking
    original_resume: str = ""
    last_optimization_mode: str = ""
    confirmed_facts: dict = {}
    unconfirmed_claims: dict = {}
    artifact_source: str = ""
    # Per-mode draft branches (v5)
    honest_resume_draft: str = ""
    keyword_resume_draft: str = ""
    aggressive_resume_draft: str = ""
    honest_optimize_count: int = 0
    keyword_optimize_count: int = 0
    aggressive_optimize_count: int = 0
    honest_draft_hash: str = ""
    keyword_draft_hash: str = ""
    aggressive_draft_hash: str = ""
    response_type: str = "general"  # ats_score | optimize | salary | score_advisor | interview | career | general

class ChatResponse(BaseModel):
    reply: str
    ats_mode: str
    fresher_mode: bool
    fresher_profile: dict
    awaiting_skill_confirm: Optional[str]
    resume_draft: str
    active_jd_text: str
    detected_resume: bool
    detected_jd: bool
    original_resume: str = ""
    last_optimization_mode: str = ""
    confirmed_facts: dict = {}
    unconfirmed_claims: dict = {}
    artifact_source: str = ""
    # Per-mode draft branches (v5)
    honest_resume_draft: str = ""
    keyword_resume_draft: str = ""
    aggressive_resume_draft: str = ""
    honest_optimize_count: int = 0
    keyword_optimize_count: int = 0
    aggressive_optimize_count: int = 0
    honest_draft_hash: str = ""
    keyword_draft_hash: str = ""
    aggressive_draft_hash: str = ""
    response_type: str = "general"  # ats_score | optimize | salary | score_advisor | interview | career | general
    changed_sections: list = []  # [{key, label, content}] — detected by diff_agent after OPTIMIZE

class UploadResponse(BaseModel):
    file_id: str
    filename: str
    file_type: str
    parsed_text: str
    char_count: int
    success: bool
    error: str = ""

class HealthResponse(BaseModel):
    status: str
    api_key_configured: bool
    version: str

class ThreadItem(BaseModel):
    id: str
    title: str = ""
    preview: str = ""
    updated_at: float

class ThreadCreate(BaseModel):
    id: Optional[str] = None
    title: str = ""
    preview: str = ""

class ThreadUpdate(BaseModel):
    title: Optional[str] = None
    preview: Optional[str] = None

class SignupRequest(BaseModel):
    email: str
    password: str
    name: str = ""

class LoginRequest(BaseModel):
    email: str
    password: str

class RefreshRequest(BaseModel):
    refresh_token: str

class SendOtpRequest(BaseModel):
    email: str
    purpose: str = "signup"

class VerifyOtpRequest(BaseModel):
    email: str
    otp: str
    purpose: str = "signup"

class ConversationCreate(BaseModel):
    title: str = "New chat"
    preview: str = ""

class ConversationPatch(BaseModel):
    title: Optional[str] = None
    preview: Optional[str] = None

class MessageCreate(BaseModel):
    role: str
    content: str


# ══════════════════════════════════════════════════════════════════════════════
# HEALTH + KEY STATUS (unchanged)
# ══════════════════════════════════════════════════════════════════════════════

@app.get("/api/health", response_model=HealthResponse)
async def health():
    key = get_openai_key()
    try:
        _mongo_client.admin.command("ping")
        db_ok = True
    except Exception:
        db_ok = False
    return HealthResponse(
        status="ok" if db_ok else "db_error",
        api_key_configured=bool(key and key != "sk-your-api-key-here"),
        version="3.0.0",
    )

@app.get("/api/key-status")
async def key_status():
    key = get_openai_key()
    configured = bool(key and key != "sk-your-api-key-here")
    return {"configured": configured, "source": "env" if configured else "none"}


# ══════════════════════════════════════════════════════════════════════════════
# THREADS — backed by MongoDB conversations (user-scoped when auth, global fallback)
# ══════════════════════════════════════════════════════════════════════════════

@app.get("/api/threads", response_model=list[ThreadItem])
async def list_threads(authorization: Optional[str] = Header(None)):
    user = get_optional_user(authorization)
    user_id = str(user["_id"]) if user else "anonymous"
    items = list(conversations_col.find({"user_id": user_id})
                 .sort("updated_at", DESCENDING).limit(200))
    return [ThreadItem(id=str(c["_id"]), title=c.get("title", "New chat"),
                       preview=c.get("preview", ""),
                       updated_at=float(c.get("updated_at", time.time()))) for c in items]

@app.post("/api/threads", response_model=ThreadItem)
async def create_thread(req: ThreadCreate, authorization: Optional[str] = Header(None)):
    user = get_optional_user(authorization)
    user_id = str(user["_id"]) if user else "anonymous"
    thread_id = (req.id or "").strip() or str(uuid.uuid4())
    now = time.time()
    doc = {"_id": thread_id, "user_id": user_id,
           "title": (req.title or "New chat").strip(),
           "preview": (req.preview or "").strip(),
           "created_at": now, "updated_at": now}
    try:
        conversations_col.insert_one(doc)
    except Exception:
        existing = conversations_col.find_one({"_id": thread_id})
        if existing:
            return ThreadItem(id=thread_id, title=existing.get("title", ""),
                              preview=existing.get("preview", ""),
                              updated_at=float(existing.get("updated_at", now)))
    return ThreadItem(id=thread_id, title=doc["title"], preview=doc["preview"], updated_at=now)

@app.patch("/api/threads/{thread_id}", response_model=ThreadItem)
async def patch_thread(thread_id: str, req: ThreadUpdate,
                       authorization: Optional[str] = Header(None)):
    tid = thread_id.strip()
    if not tid:
        raise HTTPException(status_code=400, detail="Invalid thread id")
    update: dict = {"updated_at": time.time()}
    if req.title is not None:
        update["title"] = req.title.strip()
    if req.preview is not None:
        update["preview"] = req.preview.strip()
    conversations_col.update_one({"_id": tid}, {"$set": update}, upsert=True)
    doc = conversations_col.find_one({"_id": tid})
    return ThreadItem(id=tid, title=doc.get("title", "New chat"),
                      preview=doc.get("preview", ""),
                      updated_at=float(doc.get("updated_at", time.time())))

@app.delete("/api/threads/{thread_id}")
async def delete_thread(thread_id: str, authorization: Optional[str] = Header(None)):
    tid = thread_id.strip()
    if not tid:
        raise HTTPException(status_code=400, detail="Invalid thread id")
    conversations_col.delete_one({"_id": tid})
    messages_col.delete_many({"conversation_id": tid})
    return {"success": True}


# ══════════════════════════════════════════════════════════════════════════════
# AUTH
# ══════════════════════════════════════════════════════════════════════════════

@app.post("/api/auth/signup")
async def auth_signup(req: SignupRequest):
    email = (req.email or "").strip().lower()
    if not email or not req.password:
        raise HTTPException(status_code=400, detail="Email and password required")
    if len(req.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    if users_col.find_one({"email": email}):
        raise HTTPException(status_code=409,
            detail="An account with this email already exists. Please sign in.")
    user_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)
    user_doc = {
        "_id": user_id, "email": email,
        "name": (req.name or "").strip() or email.split("@")[0],
        "password_hash": hash_password(req.password),
        "avatar": None, "is_active": True,
        "created_at": now, "updated_at": now,
    }
    users_col.insert_one(user_doc)
    return _issue_tokens(user_doc)

@app.post("/api/auth/login")
async def auth_login(req: LoginRequest):
    email = (req.email or "").strip().lower()
    if not email or not req.password:
        raise HTTPException(status_code=400, detail="Email and password required")
    user = users_col.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=401,
            detail="No account found with this email. Please sign up.")
    if not verify_password(req.password, user.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Incorrect password. Please try again.")
    return _issue_tokens(user)


@app.get("/api/auth/google")
async def auth_google_start():
    """Redirect user to Google consent screen."""
    if not GOOGLE_CLIENT_ID or not GOOGLE_REDIRECT_URI:
        raise HTTPException(status_code=503, detail="Google sign-in is not configured")
    state = secrets.token_urlsafe(32)
    params = {
        "client_id": GOOGLE_CLIENT_ID,
        "redirect_uri": GOOGLE_REDIRECT_URI,
        "response_type": "code",
        "scope": "openid email profile",
        "state": state,
        "access_type": "offline",
    }
    url = f"{GOOGLE_AUTH_URL}?{urlencode(params)}"
    return RedirectResponse(url=url)


@app.get("/auth/google/callback")
async def auth_google_callback(code: Optional[str] = None, state: Optional[str] = None, error: Optional[str] = None):
    """Handle Google OAuth callback: exchange code for tokens, find/create user, issue JWT, redirect to frontend."""
    if error:
        return RedirectResponse(url=f"{FRONTEND_URL}/login?error=access_denied")
    if not code or not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET or not GOOGLE_REDIRECT_URI:
        return RedirectResponse(url=f"{FRONTEND_URL}/login?error=config")
    async with httpx.AsyncClient() as client:
        token_resp = await client.post(
            GOOGLE_TOKEN_URL,
            data={
                "code": code,
                "client_id": GOOGLE_CLIENT_ID,
                "client_secret": GOOGLE_CLIENT_SECRET,
                "redirect_uri": GOOGLE_REDIRECT_URI,
                "grant_type": "authorization_code",
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
    if token_resp.status_code != 200:
        return RedirectResponse(url=f"{FRONTEND_URL}/login?error=token_exchange")
    token_data = token_resp.json()
    access_token = token_data.get("access_token")
    if not access_token:
        return RedirectResponse(url=f"{FRONTEND_URL}/login?error=token_exchange")
    async with httpx.AsyncClient() as client:
        user_resp = await client.get(
            GOOGLE_USERINFO_URL,
            headers={"Authorization": f"Bearer {access_token}"},
        )
    if user_resp.status_code != 200:
        return RedirectResponse(url=f"{FRONTEND_URL}/login?error=userinfo")
    profile = user_resp.json()
    provider_user_id = profile.get("id") or ""
    email = (profile.get("email") or "").strip().lower()
    name = (profile.get("name") or email.split("@")[0] or "User").strip()
    avatar = profile.get("picture")
    if not email:
        return RedirectResponse(url=f"{FRONTEND_URL}/login?error=no_email")
    def _redirect_with_tokens(t: dict):
        frag = urlencode({
            "access_token": t["access_token"],
            "refresh_token": t["refresh_token"],
            "expires_in": str(t["expires_in"]),
        })
        return RedirectResponse(url=f"{FRONTEND_URL}/auth/callback#{frag}")
    now = datetime.now(timezone.utc)
    oauth_doc = {
        "user_id": None,
        "provider": "google",
        "provider_user_id": provider_user_id,
        "email": email,
        "name": name,
        "avatar": avatar,
        "updated_at": now,
    }
    existing_oauth = oauth_col.find_one({"provider": "google", "provider_user_id": provider_user_id})
    if existing_oauth:
        user = users_col.find_one({"_id": existing_oauth["user_id"]})
        if user:
            oauth_col.update_one(
                {"provider": "google", "provider_user_id": provider_user_id},
                {"$set": {"email": email, "name": name, "avatar": avatar, "updated_at": now}},
            )
            users_col.update_one(
                {"_id": user["_id"]},
                {"$set": {"name": name, "avatar": avatar, "updated_at": now}},
            )
            tokens = _issue_tokens(user)
            return _redirect_with_tokens(tokens)
    user = users_col.find_one({"email": email})
    if user:
        oauth_col.update_one(
            {"provider": "google", "provider_user_id": provider_user_id},
            {"$set": {"user_id": user["_id"], "email": email, "name": name, "avatar": avatar, "updated_at": now}},
            upsert=True,
        )
        users_col.update_one(
            {"_id": user["_id"]},
            {"$set": {"name": name, "avatar": avatar, "updated_at": now}},
        )
        tokens = _issue_tokens(user)
        return _redirect_with_tokens(tokens)
    user_id = str(uuid.uuid4())
    user_doc = {
        "_id": user_id,
        "email": email,
        "name": name,
        "password_hash": None,
        "avatar": avatar,
        "is_active": True,
        "created_at": now,
        "updated_at": now,
    }
    users_col.insert_one(user_doc)
    oauth_col.update_one(
        {"provider": "google", "provider_user_id": provider_user_id},
        {"$set": {"user_id": user_id, "email": email, "name": name, "avatar": avatar, "updated_at": now}},
        upsert=True,
    )
    tokens = _issue_tokens(user_doc)
    return _redirect_with_tokens(tokens)


@app.post("/api/auth/refresh")
async def auth_refresh(req: RefreshRequest):
    token_doc = refresh_tokens_col.find_one({"token": req.refresh_token})
    if not token_doc:
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    if token_doc.get("used"):
        raise HTTPException(status_code=401, detail="Refresh token already used. Please log in again.")
    exp = token_doc["expires_at"]
    if exp.tzinfo is None:
        exp = exp.replace(tzinfo=timezone.utc)
    if exp < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Refresh token expired. Please log in again.")
    refresh_tokens_col.update_one({"_id": token_doc["_id"]}, {"$set": {"used": True}})
    sessions_col.update_one({"jti": token_doc["jti"]}, {"$set": {"active": False}})
    user = users_col.find_one({"_id": token_doc["user_id"]})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return _issue_tokens(user)

@app.post("/api/auth/logout")
async def auth_logout(current_user: dict = Depends(get_current_user),
                      authorization: Optional[str] = Header(None)):
    if authorization:
        token = authorization.split(" ", 1)[1]
        try:
            payload = _decode_token(token)
            jti = payload.get("jti")
            sessions_col.update_one({"jti": jti}, {"$set": {"active": False}})
            refresh_tokens_col.update_one({"jti": jti}, {"$set": {"used": True}})
        except Exception:
            pass
    return {"success": True, "message": "Logged out successfully"}

@app.get("/api/auth/me")
async def auth_me(current_user: dict = Depends(get_current_user)):
    u = current_user
    return {"id": str(u["_id"]), "email": u["email"], "name": u.get("name", ""),
            "avatar": u.get("avatar"), "created_at": str(u.get("created_at", ""))}

@app.patch("/api/auth/me")
async def auth_update_me(body: dict, current_user: dict = Depends(get_current_user)):
    allowed = {}
    if "name" in body and body["name"]:
        allowed["name"] = str(body["name"]).strip()
    if "avatar" in body:
        allowed["avatar"] = body["avatar"]
    if allowed:
        allowed["updated_at"] = datetime.now(timezone.utc)
        users_col.update_one({"_id": current_user["_id"]}, {"$set": allowed})
    u = users_col.find_one({"_id": current_user["_id"]})
    return {"id": str(u["_id"]), "email": u["email"], "name": u.get("name", ""),
            "avatar": u.get("avatar"), "created_at": str(u.get("created_at", ""))}

@app.post("/api/auth/change-password")
async def auth_change_password(body: dict, current_user: dict = Depends(get_current_user)):
    old_pw = body.get("old_password", "")
    new_pw = body.get("new_password", "")
    if not verify_password(old_pw, current_user.get("password_hash", "")):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    if len(new_pw) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters")
    users_col.update_one({"_id": current_user["_id"]},
        {"$set": {"password_hash": hash_password(new_pw),
                  "updated_at": datetime.now(timezone.utc)}})
    return {"success": True, "message": "Password updated"}

@app.get("/api/auth/sessions")
async def auth_list_sessions(current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    sessions = list(sessions_col.find({"user_id": user_id, "active": True}))
    return [{"jti": s["jti"], "created_at": str(s.get("created_at", "")),
             "expires_at": str(s.get("expires_at", ""))} for s in sessions]

@app.delete("/api/auth/sessions/{jti}")
async def auth_revoke_session(jti: str, current_user: dict = Depends(get_current_user)):
    sessions_col.update_one({"jti": jti, "user_id": str(current_user["_id"])},
                             {"$set": {"active": False}})
    refresh_tokens_col.update_one({"jti": jti}, {"$set": {"used": True}})
    return {"success": True}

@app.post("/api/auth/send-otp")
async def auth_send_otp(req: SendOtpRequest):
    import random
    email = (req.email or "").strip().lower()
    if not email:
        raise HTTPException(status_code=400, detail="Email required")
    otp = "".join(str(random.randint(0, 9)) for _ in range(6))
    otp_col.delete_many({"email": email, "purpose": req.purpose})
    otp_col.insert_one({"email": email, "otp": otp, "purpose": req.purpose,
                         "expires_at": datetime.now(timezone.utc) + timedelta(minutes=15),
                         "created_at": datetime.now(timezone.utc)})
    # In production: send email. For dev: return OTP directly.
    return {"success": True, "message": "OTP sent", "otp": otp}

@app.post("/api/auth/verify-otp")
async def auth_verify_otp(req: VerifyOtpRequest):
    email = (req.email or "").strip().lower()
    rec = otp_col.find_one({"email": email, "purpose": req.purpose})
    if not rec or rec.get("otp") != req.otp:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")
    exp = rec["expires_at"]
    if exp.tzinfo is None:
        exp = exp.replace(tzinfo=timezone.utc)
    if exp < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="OTP has expired")
    otp_col.delete_one({"_id": rec["_id"]})
    return {"success": True, "message": "OTP verified"}


# ══════════════════════════════════════════════════════════════════════════════
# CONVERSATIONS
# ══════════════════════════════════════════════════════════════════════════════

def _conv_resp(conv: dict) -> dict:
    cid = str(conv["_id"])
    return {"id": cid, "title": conv.get("title", "New chat"),
            "preview": conv.get("preview", ""),
            "updated_at": float(conv.get("updated_at", time.time())),
            "message_count": messages_col.count_documents({"conversation_id": cid})}

@app.get("/api/conversations")
async def list_conversations(current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    convs = list(conversations_col.find({"user_id": user_id})
                 .sort("updated_at", DESCENDING).limit(100))
    return [_conv_resp(c) for c in convs]

@app.post("/api/conversations")
async def create_conversation(req: ConversationCreate,
                               current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    now = time.time()
    cid = str(uuid.uuid4())
    doc = {"_id": cid, "user_id": user_id, "title": req.title or "New chat",
           "preview": req.preview or "", "created_at": now, "updated_at": now}
    conversations_col.insert_one(doc)
    return _conv_resp(doc)

@app.get("/api/conversations/{conv_id}")
async def get_conversation(conv_id: str, current_user: dict = Depends(get_current_user)):
    conv = conversations_col.find_one({"_id": conv_id, "user_id": str(current_user["_id"])})
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return _conv_resp(conv)

@app.patch("/api/conversations/{conv_id}")
async def patch_conversation(conv_id: str, req: ConversationPatch,
                              current_user: dict = Depends(get_current_user)):
    update: dict = {"updated_at": time.time()}
    if req.title is not None:
        update["title"] = req.title
    if req.preview is not None:
        update["preview"] = req.preview
    r = conversations_col.update_one(
        {"_id": conv_id, "user_id": str(current_user["_id"])}, {"$set": update})
    if r.matched_count == 0:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return _conv_resp(conversations_col.find_one({"_id": conv_id}))

@app.delete("/api/conversations/{conv_id}")
async def delete_conversation(conv_id: str, current_user: dict = Depends(get_current_user)):
    r = conversations_col.delete_one(
        {"_id": conv_id, "user_id": str(current_user["_id"])})
    if r.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Conversation not found")
    messages_col.delete_many({"conversation_id": conv_id})
    return {"success": True}

@app.get("/api/conversations/{conv_id}/messages")
async def list_messages(conv_id: str, current_user: dict = Depends(get_current_user)):
    conv = conversations_col.find_one(
        {"_id": conv_id, "user_id": str(current_user["_id"])})
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    msgs = list(messages_col.find({"conversation_id": conv_id}).sort("created_at", 1))
    return [{"id": str(m["_id"]), "conversation_id": m["conversation_id"],
             "role": m["role"], "content": m["content"],
             "created_at": float(m.get("created_at", 0))} for m in msgs]

@app.post("/api/conversations/{conv_id}/messages")
async def add_message(conv_id: str, req: MessageCreate,
                      current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    conv = conversations_col.find_one({"_id": conv_id, "user_id": user_id})
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    now = time.time()
    msg_id = str(uuid.uuid4())
    msg_doc = {"_id": msg_id, "conversation_id": conv_id, "user_id": user_id,
               "role": req.role, "content": req.content, "created_at": now}
    messages_col.insert_one(msg_doc)
    preview = req.content[:120] if req.role == "user" else conv.get("preview", "")
    conversations_col.update_one({"_id": conv_id},
        {"$set": {"updated_at": now, "preview": preview}})
    return {"id": msg_id, "conversation_id": conv_id, "role": req.role,
            "content": req.content, "created_at": now}


# ══════════════════════════════════════════════════════════════════════════════
# UPLOAD (unchanged)
# ══════════════════════════════════════════════════════════════════════════════

@app.post("/api/upload", response_model=UploadResponse)
async def upload_file(file: UploadFile = File(...), file_type: str = Form("resume")):
    try:
        raw = await file.read()
        if not raw:
            return UploadResponse(file_id="", filename=file.filename or "",
                file_type=file_type, parsed_text="", char_count=0, success=False, error="Empty file")
        parsed = parse_bytes(raw, file.filename or "file.pdf")
        if parsed.startswith("["):
            return UploadResponse(file_id="", filename=file.filename or "",
                file_type=file_type, parsed_text="", char_count=0, success=False, error=parsed)
        return UploadResponse(file_id=str(uuid.uuid4()), filename=file.filename or "",
            file_type=file_type, parsed_text=parsed, char_count=len(parsed), success=True)
    except Exception as e:
        return UploadResponse(file_id="", filename=file.filename or "",
            file_type=file_type, parsed_text="", char_count=0, success=False, error=str(e))


# ══════════════════════════════════════════════════════════════════════════════
# CHAT — now persists messages to MongoDB when conversation_id provided
# ══════════════════════════════════════════════════════════════════════════════

@app.post("/api/chat", response_model=ChatResponse)
async def chat(req: ChatRequest, authorization: Optional[str] = Header(None)):
    api_key = req.api_key.strip() if req.api_key else ""
    if not api_key:
        api_key = get_openai_key()
    if not api_key or api_key == "sk-your-api-key-here":
        raise HTTPException(status_code=401,
            detail="No valid API key. Set OPENAI_API_KEY in .env or pass it in the request.")

    history = [{"role": m.role, "content": m.content, "files": m.files} for m in req.history]

    # Load persisted conversation_state from MongoDB if available
    conv_state_doc = None
    if req.conversation_id:
        try:
            conv_state_doc = _db["conversation_state"].find_one({"_id": req.conversation_id}) or {}
        except Exception:
            conv_state_doc = {}

    def _pick(req_val, key, default=""):
        if conv_state_doc and conv_state_doc.get(key):
            return conv_state_doc[key]
        return req_val if req_val else default

    session_state = {
        "ats_mode": req.ats_mode,
        "fresher_mode": req.fresher_mode,
        "fresher_profile": req.fresher_profile,
        "awaiting_skill_confirm": req.awaiting_skill_confirm,
        "resume_draft": _pick(req.resume_draft, "resume_draft"),
        "active_jd_text": _pick(req.active_jd_text, "active_jd_text"),
        "original_resume": _pick(req.original_resume, "original_resume"),
        "last_optimization_mode": req.last_optimization_mode or (conv_state_doc or {}).get("last_optimization_mode", ""),
        "confirmed_facts": req.confirmed_facts or (conv_state_doc or {}).get("confirmed_facts", {}),
        "unconfirmed_claims": req.unconfirmed_claims or (conv_state_doc or {}).get("unconfirmed_claims", {}),
        "artifact_source": req.artifact_source or (conv_state_doc or {}).get("artifact_source", ""),
        # Per-mode draft branches
        "honest_resume_draft": _pick(req.honest_resume_draft, "honest_resume_draft"),
        "keyword_resume_draft": _pick(req.keyword_resume_draft, "keyword_resume_draft"),
        "aggressive_resume_draft": _pick(req.aggressive_resume_draft, "aggressive_resume_draft"),
        "honest_optimize_count": req.honest_optimize_count or (conv_state_doc or {}).get("honest_optimize_count", 0),
        "keyword_optimize_count": req.keyword_optimize_count or (conv_state_doc or {}).get("keyword_optimize_count", 0),
        "aggressive_optimize_count": req.aggressive_optimize_count or (conv_state_doc or {}).get("aggressive_optimize_count", 0),
        "honest_draft_hash": req.honest_draft_hash or (conv_state_doc or {}).get("honest_draft_hash", ""),
        "keyword_draft_hash": req.keyword_draft_hash or (conv_state_doc or {}).get("keyword_draft_hash", ""),
        "aggressive_draft_hash": req.aggressive_draft_hash or (conv_state_doc or {}).get("aggressive_draft_hash", ""),
    }
    file_names = {"resume": req.resume_name, "jd": req.jd_name}

    try:
        orc = Orchestrator(api_key=api_key)
        reply, new_state = orc.respond(
            user_message=req.message, history=history,
            resume=req.resume_text, jd=req.jd_text,
            file_names=file_names, session_state=session_state,
        )
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Agent error: {str(e)}")

    # Persist to MongoDB
    user = get_optional_user(authorization)
    now = time.time()
    if req.conversation_id:
        conv_id = req.conversation_id
        user_id = str(user["_id"]) if user else "anonymous"
        if not conversations_col.find_one({"_id": conv_id}):
            conversations_col.insert_one({
                "_id": conv_id, "user_id": user_id,
                "title": req.message[:60] or "New chat",
                "preview": req.message[:120],
                "created_at": now, "updated_at": now,
            })
        if user:
            messages_col.insert_one({"_id": str(uuid.uuid4()), "conversation_id": conv_id,
                "user_id": user_id, "role": "user", "content": req.message, "created_at": now})
            messages_col.insert_one({"_id": str(uuid.uuid4()), "conversation_id": conv_id,
                "user_id": user_id, "role": "assistant", "content": reply, "created_at": now + 0.001})
            conversations_col.update_one({"_id": conv_id},
                {"$set": {"updated_at": now, "preview": req.message[:120]}})
        # Persist conversation_state (works for logged-in and anonymous)
        state_doc = {
            "_id": conv_id, "user_id": user_id, "conversation_id": conv_id,
            "ats_mode": new_state.get("ats_mode", "HONEST"),
            "fresher_mode": new_state.get("fresher_mode", False),
            "awaiting_skill_confirm": new_state.get("awaiting_skill_confirm"),
            "resume_draft": new_state.get("resume_draft", ""),
            "active_jd_text": new_state.get("active_jd_text", ""),
            "original_resume": new_state.get("original_resume", ""),
            "last_optimization_mode": new_state.get("last_optimization_mode", ""),
            "confirmed_facts": new_state.get("confirmed_facts", {}),
            "unconfirmed_claims": new_state.get("unconfirmed_claims", {}),
            "artifact_source": new_state.get("artifact_source", ""),
            "honest_resume_draft": new_state.get("honest_resume_draft", ""),
            "keyword_resume_draft": new_state.get("keyword_resume_draft", ""),
            "aggressive_resume_draft": new_state.get("aggressive_resume_draft", ""),
            "honest_optimize_count": new_state.get("honest_optimize_count", 0),
            "keyword_optimize_count": new_state.get("keyword_optimize_count", 0),
            "aggressive_optimize_count": new_state.get("aggressive_optimize_count", 0),
            "honest_draft_hash": new_state.get("honest_draft_hash", ""),
            "keyword_draft_hash": new_state.get("keyword_draft_hash", ""),
            "aggressive_draft_hash": new_state.get("aggressive_draft_hash", ""),
            "updated_at": now,
        }
        try:
            _db["conversation_state"].replace_one({"_id": conv_id}, state_doc, upsert=True)
        except Exception:
            pass

    detected_resume = bool(req.resume_text or new_state.get("resume_draft")
                           or _looks_like_resume(req.message))
    detected_jd = bool(req.jd_text or new_state.get("active_jd_text")
                       or _looks_like_jd(req.message))

    # Run diff agent to detect changed sections (only for optimize responses)
    _original_resume = new_state.get('original_resume', req.original_resume)
    _response_type = new_state.get('response_type', 'general')
    _changed_sections = []
    if _response_type == 'optimize' and _original_resume:
        try:
            client = make_client(req.api_key)
            _changed_sections = detect_changed_sections(
                original_resume=_original_resume,
                bot_response=reply,
                history=[m.dict() for m in req.history],
                client=client,
            )
        except Exception as _diff_err:
            print(f'diff_agent error: {_diff_err}')
            _changed_sections = []

    return ChatResponse(
        reply=reply,
        ats_mode=new_state.get("ats_mode", "HONEST"),
        fresher_mode=new_state.get("fresher_mode", False),
        fresher_profile=new_state.get("fresher_profile", {}),
        awaiting_skill_confirm=new_state.get("awaiting_skill_confirm"),
        resume_draft=new_state.get("resume_draft", req.resume_draft),
        active_jd_text=new_state.get("active_jd_text", req.active_jd_text),
        detected_resume=detected_resume,
        detected_jd=detected_jd,
        original_resume=new_state.get("original_resume", req.original_resume),
        last_optimization_mode=new_state.get("last_optimization_mode", req.last_optimization_mode),
        confirmed_facts=new_state.get("confirmed_facts", req.confirmed_facts),
        unconfirmed_claims=new_state.get("unconfirmed_claims", req.unconfirmed_claims),
        artifact_source=new_state.get("artifact_source", req.artifact_source),
        honest_resume_draft=new_state.get("honest_resume_draft", req.honest_resume_draft),
        keyword_resume_draft=new_state.get("keyword_resume_draft", req.keyword_resume_draft),
        aggressive_resume_draft=new_state.get("aggressive_resume_draft", req.aggressive_resume_draft),
        honest_optimize_count=new_state.get("honest_optimize_count", req.honest_optimize_count),
        keyword_optimize_count=new_state.get("keyword_optimize_count", req.keyword_optimize_count),
        aggressive_optimize_count=new_state.get("aggressive_optimize_count", req.aggressive_optimize_count),
        honest_draft_hash=new_state.get("honest_draft_hash", req.honest_draft_hash),
        keyword_draft_hash=new_state.get("keyword_draft_hash", req.keyword_draft_hash),
        aggressive_draft_hash=new_state.get("aggressive_draft_hash", req.aggressive_draft_hash),
        response_type=new_state.get("response_type", "general"),
        changed_sections=_changed_sections,
    )


# ══════════════════════════════════════════════════════════════════════════════
# GREETING (unchanged, now personalized if auth)
# ══════════════════════════════════════════════════════════════════════════════

@app.get("/api/conversation-state/{conv_id}")
async def get_conversation_state(conv_id: str):
    """Load persisted AI conversation state (resume drafts, artifacts, mode) for a thread."""
    try:
        doc = _db["conversation_state"].find_one({"_id": conv_id})
        if not doc:
            return {}
        # Remove MongoDB internal fields
        doc.pop("_id", None)
        doc.pop("user_id", None)
        doc.pop("updated_at", None)
        return doc
    except Exception:
        return {}


@app.post("/api/greeting")
async def greeting(api_key: str = "", authorization: Optional[str] = Header(None)):
    user = get_optional_user(authorization)
    name = user.get("name", "") if user else ""
    key = api_key.strip() or get_openai_key()
    greeting_prefix = f"Hi {name}! " if name else ""
    if not key or key == "sk-your-api-key-here":
        return {"reply": (
            f"{greeting_prefix}I'm **RAGA** — **Resume ATS Guidance Assistant**.\n\n"
            "Here's how I can help:\n"
            "• 📊 **ATS Score** — analyze your resume against any job description\n"
            "• ✏️ **Resume Building** — create a resume step by step from scratch\n"
            "• 🔧 **Optimization** — improve existing resumes (Honest / Keyword / Aggressive modes)\n"
            "• 🧠 **Interview Prep** — tailored questions and answers\n"
            "• 💼 **Career Advice** — which companies and roles suit your profile\n\n"
            "**To get started:**\n"
            "• Upload your **Resume** or **Job Description** using the **＋** button\n"
            "• Or paste your resume / JD directly in the chat — I'll detect it automatically\n"
            "• Or say **'I am a fresher'** and I'll guide you to build one from scratch\n\n"
            "_No need to type any command — just share your documents and I'll take it from there!_ 😊"
        )}
    try:
        client = make_client(key)
        prompt = (
            f"{'You are greeting a returning user named ' + name + '. ' if name else ''}"
            "You are RAGA (Resume ATS Guidance Assistant). "
            "Write a concise, warm welcome message that:\n"
            "1) Introduces 'RAGA' and its full form\n"
            "2) Lists what you can do: ATS scoring, resume building from scratch, optimization, interview prep\n"
            "3) Gives clear entry options — NOT a single command to type:\n"
            "   - Upload resume or JD using the + button\n"
            "   - Paste resume or JD directly in chat\n"
            "   - Say 'I am a fresher' to build from scratch\n"
            "   - Just ask a question — RAGA will figure out how to help\n"
            "4) Mentions 3 modes briefly (Honest/Keyword/Aggressive)\n"
            "5) IMPORTANT: Do NOT tell user to type 'Get me ATS score' as a command — that is bad UX. "
            "Tell them to just upload/paste their documents and RAGA will detect and analyze automatically.\n"
            "Keep it under ~1000 chars. Use markdown bullets."
        )
        reply = handle_interview_or_chat(prompt, "", "", [], client)
        return {"reply": reply or f"{greeting_prefix}I'm **RAGA** — **Resume ATS Guidance Assistant**. Upload a resume + JD and ask: **Get me ATS score**."}
    except Exception as e:
        return {"reply": (
            f"{greeting_prefix}I'm **RAGA** — **Resume ATS Guidance Assistant**.\n\n"
            f"Upload a resume + JD and ask: **Get me ATS score**.\n\n"
            f"_(Backend AI error: {e})_"
        )}
