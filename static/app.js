let currentSessionId = null;
const chatWindow = document.getElementById("chatWindow");
const chatList = document.getElementById("chatList");
const messageInput = document.getElementById("messageInput");
const statusText = document.getElementById("statusText");
const micBtn = document.getElementById("micBtn");

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
  loadChats();
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
      body: JSON.stringify({
        session_id: currentSessionId,
        prompt: prompt
      })
    });

    const data = await res.json();
    addMessage("assistant", data.response);
    statusText.innerText = "Response received.";

    // Auto speak reply
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
  utterance.lang = "en-US";
  utterance.rate = 1;
  utterance.pitch = 1;
  speechSynthesis.speak(utterance);
}

function stopSpeaking() {
  speechSynthesis.cancel();
  statusText.innerText = "Voice stopped.";
}

function startListening() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    alert("Speech recognition not supported in this browser. Use Chrome.");
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = "en-US";
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  micBtn.classList.add("listening");
  statusText.innerText = "Listening...";

  recognition.onresult = function(event) {
    const transcript = event.results[0][0].transcript;
    messageInput.value = transcript;
    statusText.innerText = "Speech captured.";
  };

  recognition.onerror = function(event) {
    statusText.innerText = "Speech error: " + event.error;
    micBtn.classList.remove("listening");
  };

  recognition.onend = function() {
    micBtn.classList.remove("listening");
    if (statusText.innerText === "Listening...") {
      statusText.innerText = "Listening ended.";
    }
  };

  recognition.start();
}

window.onload = async function() {
  await loadChats();
  if (!currentSessionId) {
    await createNewChat();
  }
};
