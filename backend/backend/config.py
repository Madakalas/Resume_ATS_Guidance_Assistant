"""backend/config.py — API key + OpenAI client factory

.env BUG FIX:
  load_dotenv() without a path only works if the process is launched
  from the same directory as .env.
  We now resolve the .env path relative to THIS file, so it always works
  whether you run `python main.py` or `uvicorn main:app` from anywhere.
"""
import os
from pathlib import Path
from dotenv import load_dotenv

# Always find .env relative to the project root (one level above backend/)
_ROOT = Path(__file__).resolve().parent.parent
_ENV  = _ROOT / ".env"
load_dotenv(dotenv_path=_ENV, override=False)


def get_openai_key() -> str:
    return os.getenv("OPENAI_API_KEY", "")


def make_client(api_key: str = ""):
    from openai import OpenAI
    key = api_key.strip() if api_key else ""
    if not key:
        key = get_openai_key().strip()
    if not key or key == "sk-your-api-key-here":
        raise ValueError(
            "No valid OpenAI API key found. "
            "Set OPENAI_API_KEY in .env or pass it in the request."
        )
    return OpenAI(api_key=key)


# Model assignments per agent — cost + quality balanced
MODELS = {
    "router":      "gpt-4o-mini",   # Fast intent detection
    "scorer":      "gpt-4o",        # Precise ATS evaluation
    "optimizer":   "gpt-4o",        # Resume optimization
    "builder":     "gpt-4o",        # Interactive fresher builder
    "advisor":     "gpt-4o",        # Score advisor
    "reframer":    "gpt-4o",        # Role reframing
    "interviewer": "gpt-4o-mini",   # Interview prep / general chat
    "chat":        "gpt-4o-mini",   # General conversation
}
