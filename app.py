from fastapi import FastAPI, Request, UploadFile, File, Form
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel
from sqlalchemy import create_engine, Column, Integer, String, Text, ForeignKey, DateTime
from sqlalchemy.orm import sessionmaker, declarative_base, relationship
from datetime import datetime
import requests
import PyPDF2
import io

app = FastAPI(title="Voice Assistant Pro")

app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

DATABASE_URL = "sqlite:///./assistant.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()

class ChatSession(Base):
    __tablename__ = "chat_sessions"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, default="New Chat")
    created_at = Column(DateTime, default=datetime.utcnow)

    messages = relationship("ChatMessage", back_populates="session", cascade="all, delete")

class ChatMessage(Base):
    __tablename__ = "chat_messages"
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("chat_sessions.id"))
    role = Column(String)
    content = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    session = relationship("ChatSession", back_populates="messages")

Base.metadata.create_all(bind=engine)

OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL = "llama-3.2-3b-it:latest"

SYSTEM_PROMPT = """
You are a helpful, patient, friendly, accessibility-focused AI assistant designed especially for speech-disabled and accessibility-needs users.

Guidelines:
- Be clear, short, and easy to understand unless more detail is requested.
- Speak naturally for text-to-speech output.
- Be supportive and polite.
- Help users complete sentences when appropriate.
- If a PDF is provided, summarize it clearly and read-friendly.
"""

class ChatRequest(BaseModel):
    session_id: int
    prompt: str

class NewChatRequest(BaseModel):
    title: str = "New Chat"

class RenameChatRequest(BaseModel):
    title: str

class CompletionRequest(BaseModel):
    text: str

def build_prompt(messages, user_prompt):
    history = SYSTEM_PROMPT + "\n\n"
    for msg in messages:
        if msg.role == "user":
            history += f"User: {msg.content}\n"
        else:
            history += f"Assistant: {msg.content}\n"
    history += f"User: {user_prompt}\nAssistant:"
    return history

def ask_ollama(prompt):
    payload = {
        "model": MODEL,
        "prompt": prompt,
        "stream": False
    }
    res = requests.post(OLLAMA_URL, json=payload, timeout=120)
    res.raise_for_status()
    return res.json().get("response", "No response from model")

@app.get("/", response_class=HTMLResponse)
def home(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

@app.post("/api/new_chat")
def new_chat(data: NewChatRequest):
    db = SessionLocal()
    session = ChatSession(title=data.title)
    db.add(session)
    db.commit()
    db.refresh(session)
    db.close()
    return {"session_id": session.id, "title": session.title}

@app.get("/api/chats")
def get_chats():
    db = SessionLocal()
    chats = db.query(ChatSession).order_by(ChatSession.created_at.desc()).all()
    result = [{"id": c.id, "title": c.title, "created_at": c.created_at.isoformat()} for c in chats]
    db.close()
    return result

@app.get("/api/chat/{session_id}")
def get_chat(session_id: int):
    db = SessionLocal()
    messages = db.query(ChatMessage).filter(ChatMessage.session_id == session_id).order_by(ChatMessage.created_at.asc()).all()
    result = [{"role": m.role, "content": m.content, "created_at": m.created_at.isoformat()} for m in messages]
    db.close()
    return result

@app.post("/api/chat")
def chat(data: ChatRequest):
    db = SessionLocal()
    session = db.query(ChatSession).filter(ChatSession.id == data.session_id).first()

    if not session:
        db.close()
        return {"error": "Chat session not found"}

    previous_messages = db.query(ChatMessage).filter(ChatMessage.session_id == data.session_id).order_by(ChatMessage.created_at.asc()).all()

    user_message = ChatMessage(session_id=data.session_id, role="user", content=data.prompt)
    db.add(user_message)
    db.commit()

    full_prompt = build_prompt(previous_messages, data.prompt)

    try:
        response_text = ask_ollama(full_prompt)

        assistant_message = ChatMessage(session_id=data.session_id, role="assistant", content=response_text)
        db.add(assistant_message)

        if session.title == "New Chat":
            session.title = data.prompt[:40]

        db.commit()
        db.close()
        return {"response": response_text}
    except Exception as e:
        db.close()
        return {"response": f"Error: {str(e)}"}

@app.delete("/api/chat/{session_id}")
def delete_chat(session_id: int):
    db = SessionLocal()
    session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
    if session:
        db.delete(session)
        db.commit()
    db.close()
    return {"message": "Chat deleted successfully"}

@app.put("/api/chat/{session_id}/rename")
def rename_chat(session_id: int, data: RenameChatRequest):
    db = SessionLocal()
    session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
    if not session:
        db.close()
        return {"error": "Chat session not found"}

    session.title = data.title
    db.commit()
    db.close()
    return {"message": "Chat renamed successfully"}

@app.post("/api/complete")
def complete_sentence(data: CompletionRequest):
    prompt = f"""
Complete the user's sentence naturally and clearly.

User text: "{data.text}"

Completed sentence:
"""
    try:
        response_text = ask_ollama(prompt)
        return {"completion": response_text.strip()}
    except Exception as e:
        return {"completion": f"Error: {str(e)}"}

@app.post("/api/upload_pdf")
async def upload_pdf(session_id: int = Form(...), file: UploadFile = File(...)):
    db = SessionLocal()

    try:
        contents = await file.read()
        pdf_reader = PyPDF2.PdfReader(io.BytesIO(contents))
        extracted_text = ""

        for page in pdf_reader.pages:
            text = page.extract_text()
            if text:
                extracted_text += text + "\n"

        if not extracted_text.strip():
            db.close()
            return {"response": "Could not extract readable text from the PDF."}

        user_prompt = f"I uploaded a PDF. Please read and summarize this in an accessibility-friendly way:\n\n{extracted_text[:12000]}"

        user_message = ChatMessage(session_id=session_id, role="user", content="[PDF Uploaded]\n" + extracted_text[:3000])
        db.add(user_message)
        db.commit()

        response_text = ask_ollama(SYSTEM_PROMPT + "\n\n" + user_prompt)

        assistant_message = ChatMessage(session_id=session_id, role="assistant", content=response_text)
        db.add(assistant_message)
        db.commit()
        db.close()

        return {"response": response_text, "pdf_text": extracted_text[:3000]}
    except Exception as e:
        db.close()
        return {"response": f"PDF processing error: {str(e)}"}