"""backend/resume_parser.py — PDF/DOCX/TXT parser"""
import io

def parse_bytes(data: bytes, filename: str) -> str:
    fn = filename.lower()
    try:
        if fn.endswith(".pdf"):
            return _parse_pdf(data)
        elif fn.endswith(".docx"):
            return _parse_docx(data)
        elif fn.endswith(".txt"):
            return data.decode("utf-8", errors="ignore")
        else:
            return "[Unsupported file type — use PDF, DOCX, or TXT]"
    except Exception as e:
        return f"[Parse error: {e}]"

def _parse_pdf(data: bytes) -> str:
    try:
        import pdfminer.high_level as pml
        text = pml.extract_text(io.BytesIO(data))
        if text and text.strip():
            return text.strip()
    except Exception:
        pass
    try:
        import PyPDF2
        reader = PyPDF2.PdfReader(io.BytesIO(data))
        return "\n".join(p.extract_text() or "" for p in reader.pages).strip()
    except Exception as e:
        return f"[PDF parse error: {e}]"

def _parse_docx(data: bytes) -> str:
    try:
        import docx
        doc = docx.Document(io.BytesIO(data))
        return "\n".join(p.text for p in doc.paragraphs if p.text.strip()).strip()
    except Exception as e:
        return f"[DOCX parse error: {e}]"
