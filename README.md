# voice-assistant-pro
Voice Assistant to help Person with Accessibility Needs

# 🎙️ AI Voice Assistant for Accessibility

A local, accessibility-focused AI voice assistant web application powered by **Ollama** and **Llama 3.2 3B Instruct**.

This project is designed to help **speech-disabled users** and users with accessibility needs communicate more easily through:
- text input
- speech input
- spoken AI responses
- multilingual voice options
- PDF reading support
- persistent chat memory
- accessibility-friendly UI

---

## 🚀 Features

### 🤖 AI Assistant
- Runs fully with **local Ollama model**
- Uses **`llama-3.2-3b-it:latest`**
- Context-aware conversation using stored chat history
- Sentence completion support
- Friendly assistant prompting for accessibility use cases

### 🧠 Memory & Database
- SQLite database integration
- Stores chat sessions and messages
- Persistent conversation history
- Open old chats anytime

### 🗣️ Voice Capabilities
- Speech-to-text input
- Text-to-speech output
- Auto-speak AI responses
- Voice selection from browser/system voices
- Language selection support for:
  - English
  - Hindi
  - Tamil
  - Malayalam
  - Telugu

### ♿ Accessibility Features
- Accessibility Mode
- High Contrast Mode
- Large buttons and larger text
- One-Tap Voice Mode
- Quick phrase buttons
- Keyboard-friendly controls
- Press **Enter** to send message
- Send button aligned beside textbox

### 💬 Chat Features
- New chat creation
- Rename chat
- Delete chat
- Chat history sidebar
- Chat-style interface

### 📄 PDF Support
- Upload PDF files
- Extract text from text-based PDFs
- Summarize/read documents in accessible language
- Speak PDF summaries aloud

---

## 🛠️ Tech Stack

### Backend
- FastAPI
- SQLAlchemy
- SQLite
- Requests
- PyPDF2
- Jinja2

### Frontend
- HTML
- CSS
- JavaScript
- Web Speech API

### AI Model
- Ollama
- `llama-3.2-3b-it:latest`

---

## 📁 Project Structure

```bash
voice-assistant-pro/
│
├── app.py
├── requirements.txt
├── assistant.db
│
├── templates/
│   └── index.html
│
└── static/
    ├── style.css
    └── app.js


 Prerequisites
Before running the project, install:

Python 3.10+
Ollama
A supported browser:
Google Chrome (recommended)
Microsoft Edge
📥 Install Ollama
Download and install Ollama:

👉 https://ollama.com/download

Verify installation:



ollama --version
📦 Pull the Required Model


ollama pull llama-3.2-3b-it:latest
Check installed models:



ollama list
Expected output should include:



llama-3.2-3b-it:latest
⚙️ Setup Instructions
1. Clone or create project folder


mkdir voice-assistant-pro
cd voice-assistant-pro
mkdir templates static
Add the project files:

app.py
requirements.txt
templates/index.html
static/style.css
static/app.js
2. Create virtual environment
Windows


python -m venv venv
venv\Scripts\activate
macOS/Linux


python3 -m venv venv
source venv/bin/activate
3. Install dependencies


pip install -r requirements.txt
If needed:



pip install fastapi uvicorn requests sqlalchemy jinja2 python-multipart pydantic PyPDF2
4. Start Ollama
Test Ollama locally:



curl http://localhost:11434/api/generate -d "{\"model\":\"llama-3.2-3b-it:latest\",\"prompt\":\"Hello\",\"stream\":false}"
If working, you should receive a JSON response.

5. Run the application


uvicorn app:app --reload
You should see:



Uvicorn running on http://127.0.0.1:8000
6. Open in browser
Go to:



http://127.0.0.1:8000
👋 First-Time User Guide
If you are using the assistant for the first time, follow these steps:

Step 1: Open the app
Open:



http://127.0.0.1:8000
You will see:

sidebar
new chat button
language selector
voice selector
quick phrases
chat area
text input
microphone button
send button
PDF upload option
Step 2: Select language
In the sidebar, choose your preferred language:

English
Hindi
Tamil
Malayalam
Telugu
Note: actual speech support depends on your browser and installed system voices.

Step 3: Select voice
Choose a preferred voice from the Voice dropdown.

The voices shown depend on your browser and operating system.

Step 4: Start a chat
Click:



+ New Chat
A fresh conversation starts.

Step 5: Send a typed message
Type your question or message in the textbox.

Examples:

Hello
Can you help me communicate?
Please explain this simply.
Send it by:

clicking Send
or pressing Enter
Use Shift + Enter for a new line.

Step 6: Speak instead of typing
Click the microphone button:



🎤
Speak clearly.

Your spoken words will be converted into text and placed in the textbox.

If One-Tap Voice Mode is enabled, the message will be sent automatically.

Step 7: Listen to the reply
After your message is processed:

the AI response appears in the chat
the assistant automatically reads it aloud
To stop voice playback:

click Stop Voice
Step 8: Use quick phrases
Use quick phrase buttons from the sidebar for faster communication, such as:

Hello
Help me
Need assistance
Read for me
Explain simply
Step 9: Try sentence completion
Type an incomplete sentence, such as:



I would like to
Then click:



Complete Sentence
The assistant will complete it using the local model.

Step 10: Upload a PDF
To have the assistant read a PDF:

Click Choose File
Select a PDF
Click Upload PDF
The assistant will:

extract PDF text
summarize it
explain it in accessible language
speak the summary aloud
Best results are with text-based PDFs.

Step 11: Rename or delete a chat
Use the buttons in the top bar:

Rename Chat
Delete Chat
Step 12: Enable accessibility options
Use the sidebar to enable:

Accessibility Mode
High Contrast Mode
One-Tap Voice Mode
These settings improve usability for accessibility-focused interaction.

🧪 Example First-Time Usage Flow
A new user can follow this exact flow:

Start Ollama
Run the FastAPI app
Open http://127.0.0.1:8000
Choose language
Choose voice
Click + New Chat
Type Hello
Press Enter
Listen to the assistant reply
Try microphone input
Use quick phrases
Upload a PDF
Enable Accessibility Mode if needed
🌐 Browser Recommendation
For the best experience, use:

Google Chrome
Microsoft Edge
These browsers generally provide better support for:

speech recognition
speech synthesis voices
📝 Notes on Indian Language Support
The app includes selectors for:

Hindi (hi-IN)
Tamil (ta-IN)
Malayalam (ml-IN)
Telugu (te-IN)
However, browser speech features depend on:

browser support
operating system language packs
installed system voices
If a language voice is not available, the browser may use a fallback voice.

🗄️ Database
This project uses SQLite.

Database file:



assistant.db
It stores:

chat sessions
user messages
assistant messages
This allows persistent chat memory.

🔌 API Endpoints
Home


GET /
Create new chat


POST /api/new_chat
List chats


GET /api/chats
Get a chat by session


GET /api/chat/{session_id}
Send chat message


POST /api/chat
Rename chat


PUT /api/chat/{session_id}/rename
Delete chat


DELETE /api/chat/{session_id}
Sentence completion


POST /api/complete
Upload PDF


POST /api/upload_pdf
⚠️ Troubleshooting
Assistant keeps thinking forever
Check:

Ollama is installed
Ollama is running
model name is correct
Run:



ollama list
Make sure it shows:



llama-3.2-3b-it:latest
Test Ollama:



curl http://localhost:11434/api/generate -d "{\"model\":\"llama-3.2-3b-it:latest\",\"prompt\":\"Hello\",\"stream\":false}"
Microphone not working
Use Chrome or Edge
Allow microphone permission in browser
Ensure your microphone is connected and active
Voice output not working
Check system volume
Check browser audio permissions
Some voices/languages may not exist on your OS
PDF text not extracted properly
Currently this version works best with text-based PDFs.

Scanned PDFs may need OCR support, which is not included yet.

Indian language voices not showing
This depends on system/browser voice availability.

Try:

Chrome/Edge
installing OS language packs
adding more system speech voices
🔮 Future Improvements
Possible next upgrades:

OCR for scanned PDFs
Whisper-based multilingual STT
Offline TTS for Indian languages
User profiles with saved preferences
Export chat history
Docker support
PostgreSQL support
Communication board for day-to-day use
🤝 Acknowledgements
Ollama
FastAPI
PyPDF2
Browser Web Speech API support in Chrome/Edge
📜 License
This project is suitable for:

learning
local AI experiments
accessibility demos
showcase projects
assistive technology prototypes
