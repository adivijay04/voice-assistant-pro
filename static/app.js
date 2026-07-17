let currentSessionId = null;
let selectedLanguage = "en-US";
let availableVoices = [];

const chatWindow = document.getElementById("chatWindow");
const chatList = document.getElementById("chatList");
const messageInput = document.getElementById("messageInput");
const statusText = document.getElementById("statusText");
const micBtn = document.getElementById("micBtn");
const voiceSelect = document.getElementById("voiceSelect");
const languageSelect = document.getElementById("languageSelect");
const oneTapVoiceToggle = document.getElementById("oneTapVoiceToggle");

async function createNewChat() {
  const res = await fetch("/api/new_chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: "New Chat" })
  });
  const data = await res.json();
  currentSessionId = data.session_id;
  chatWindow.innerHTML = "";
  messageInput.value = "";
  statusText.innerText = "New chat created.";
  await loadChats();
}

async function loadChats() {
  const res = await fetch("/api/chats");
  const chats = await res.json();

  chatList.innerHTML = "";
  chats.forEach(chat => {
    const div = document.createElement("div");
    div.className = "chat-item" + (chat.id === currentSessionId ? " active" : "");
    div.innerHTML = `
      <div onclick="openChat(${chat.id})">${chat.title}</div>
      <small>${new Date(chat.created_at).toLocaleString()}</small>
    `;
    chatList.appendChild(div);
  });
}

async function openChat(sessionId) {
  currentSessionId = sessionId;
  const res = await fetch(`/api/chat/${sessionId}`);
  const messages = await res.json();

  chatWindow.innerHTML = "";
  messages.forEach(msg => addMessage(msg.role, msg.content));
  loadChats();
}

function addMessage(role, text) {
  const msg = document.createElement("div");
  msg.className = `message ${role}`;
  msg.innerText = text;
  chatWindow.appendChild(msg);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

async function sendMessage() {
  const prompt = messageInput.value.trim();
  if (!prompt) {
    statusText.innerText = "Please enter a message.";
    return;
  }

  if (!currentSessionId) {
    await createNewChat();
  }

  addMessage("user", prompt);
  messageInput.value = "";
  statusText.innerText = "Thinking...";

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: currentSessionId, prompt })
    });

    const data = await res.json();
    addMessage("assistant", data.response);
    statusText.innerText = "Response received.";
    autoSpeak(data.response);
    loadChats();
  } catch (err) {
    addMessage("assistant", "Error connecting to server.");
    statusText.innerText = "Server error.";
  }
}

function autoSpeak(text) {
  speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = selectedLanguage;
  const selectedVoice = availableVoices.find(v => v.name === voiceSelect.value);
  if (selectedVoice) utterance.voice = selectedVoice;
  speechSynthesis.speak(utterance);
}

function stopSpeaking() {
  speechSynthesis.cancel();
  statusText.innerText = "Voice stopped.";
}

function updateLanguage() {
  selectedLanguage = languageSelect.value;
  loadVoices();
}

function loadVoices() {
  availableVoices = speechSynthesis.getVoices();
  voiceSelect.innerHTML = "";

  const filteredVoices = availableVoices.filter(v => v.lang.startsWith(selectedLanguage.split("-")[0]));

  (filteredVoices.length ? filteredVoices : availableVoices).forEach(voice => {
    const option = document.createElement("option");
    option.value = voice.name;
    option.textContent = `${voice.name} (${voice.lang})`;
    voiceSelect.appendChild(option);
  });
}

function startListening() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    alert("Speech recognition not supported in this browser. Use Chrome.");
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = selectedLanguage;
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  micBtn.classList.add("listening");
  statusText.innerText = "Listening...";

  recognition.onresult = function(event) {
    const transcript = event.results[0][0].transcript;
    messageInput.value = transcript;
    statusText.innerText = "Speech captured.";
    if (oneTapVoiceToggle.checked) {
      sendMessage();
    }
  };

  recognition.onerror = function(event) {
    statusText.innerText = "Speech error: " + event.error;
    micBtn.classList.remove("listening");
  };

  recognition.onend = function() {
    micBtn.classList.remove("listening");
  };

  recognition.start();
}

function toggleHighContrast() {
  document.body.classList.toggle("high-contrast");
}

function toggleAccessibilityMode() {
  document.body.classList.toggle("accessibility-mode");
}

function useQuickPhrase(text) {
  messageInput.value = text;
  messageInput.focus();
}

async function deleteCurrentChat() {
  if (!currentSessionId) return;
  if (!confirm("Delete this chat?")) return;

  await fetch(`/api/chat/${currentSessionId}`, { method: "DELETE" });
  currentSessionId = null;
  chatWindow.innerHTML = "";
  await loadChats();
  await createNewChat();
}

async function renameCurrentChat() {
  if (!currentSessionId) return;
  const newTitle = prompt("Enter new chat name:");
  if (!newTitle) return;

  await fetch(`/api/chat/${currentSessionId}/rename`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: newTitle })
  });

  await loadChats();
}

async function completeSentence() {
  const text = messageInput.value.trim();
  if (!text) {
    statusText.innerText = "Enter text to complete.";
    return;
  }

  statusText.innerText = "Completing sentence...";

  const res = await fetch("/api/complete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text })
  });

  const data = await res.json();
  messageInput.value = data.completion;
  statusText.innerText = "Sentence completed.";
}

async function uploadPDF() {
  const fileInput = document.getElementById("pdfUpload");
  const file = fileInput.files[0];

  if (!file) {
    statusText.innerText = "Please select a PDF file.";
    return;
  }

  if (!currentSessionId) {
    await createNewChat();
  }

  const formData = new FormData();
  formData.append("session_id", currentSessionId);
  formData.append("file", file);

  statusText.innerText = "Uploading and reading PDF...";

  const res = await fetch("/api/upload_pdf", {
    method: "POST",
    body: formData
  });

  const data = await res.json();
  addMessage("user", "[PDF Uploaded]");
  addMessage("assistant", data.response);
  autoSpeak(data.response);
  statusText.innerText = "PDF processed.";
  loadChats();
}

messageInput.addEventListener("keydown", function(event) {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    sendMessage();
  }
});

window.speechSynthesis.onvoiceschanged = loadVoices;

window.onload = async function() {
  await loadChats();
  await createNewChat();
  loadVoices();
};
