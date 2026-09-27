/* =========================================================
   Lens Chat — Image Recognition Assistant
   Vanilla JS, no build step. Chat data persists in
   localStorage so refreshing the page keeps history.
   ========================================================= */
 
const STORAGE_KEY = "lensChat.chats";
const SETTINGS_KEY = "lensChat.settings";
 
/* ---------- State ---------- */
let chats = loadChats();          // { id, title, messages: [{role, text, image}] }[]
let activeChatId = null;
let pendingImage = null;          // { dataUrl, name } attached to the next message
 
/* ---------- DOM refs ---------- */
const historyList = document.getElementById("historyList");
const chatWindow = document.getElementById("chatWindow");
const welcomeScreen = document.getElementById("welcomeScreen");
const messagesEl = document.getElementById("messages");
const chatTitle = document.getElementById("chatTitle");
const modePill = document.getElementById("modePill");
 
const composerForm = document.getElementById("composerForm");
const messageInput = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");
const attachBtn = document.getElementById("attachBtn");
const imageInput = document.getElementById("imageInput");
const previewStrip = document.getElementById("imagePreviewStrip");
const previewImg = document.getElementById("previewImg");
const previewRemove = document.getElementById("previewRemove");
 
const newChatBtn = document.getElementById("newChatBtn");
const sidebarToggle = document.getElementById("sidebarToggle");
const mobileSidebarToggle = document.getElementById("mobileSidebarToggle");
 
const darkModeToggle = document.getElementById("darkModeToggle");
const learningModeToggle = document.getElementById("learningModeToggle");
 
/* ---------- Init ---------- */
init();
 
function init() {
  applySettings(loadSettings());
  renderHistory();
 
  if (chats.length > 0) {
    openChat(chats[0].id);
  } else {
    showWelcome();
  }
 
  bindEvents();
}
 
/* ---------- Persistence ---------- */
function loadChats() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("Could not load chats", e);
    return [];
  }
}
 
function saveChats() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(chats));
  } catch (e) {
    console.error("Could not save chats", e);
  }
}
 
function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? JSON.parse(raw) : { dark: false, learning: false };
  } catch (e) {
    return { dark: false, learning: false };
  }
}
 
function saveSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}
 
/* ---------- Settings (dark mode / learning mode) ---------- */
function applySettings(settings) {
  document.body.dataset.theme = settings.dark ? "dark" : "light";
  document.body.dataset.mode = settings.learning ? "learning" : "normal";
  darkModeToggle.setAttribute("aria-checked", String(!!settings.dark));
  learningModeToggle.setAttribute("aria-checked", String(!!settings.learning));
  modePill.textContent = settings.learning ? "Learning mode" : "Normal mode";
}
 
function toggleDarkMode() {
  const settings = loadSettings();
  settings.dark = !settings.dark;
  saveSettings(settings);
  applySettings(settings);
}
 
function toggleLearningMode() {
  const settings = loadSettings();
  settings.learning = !settings.learning;
  saveSettings(settings);
  applySettings(settings);
}
 
/* ---------- Sidebar / history rendering ---------- */
function renderHistory() {
  historyList.innerHTML = "";
 
  if (chats.length === 0) {
    const empty = document.createElement("div");
    empty.className = "history-empty";
    empty.textContent = "No chats yet — start a new one.";
    historyList.appendChild(empty);
    return;
  }
 
  chats.forEach((chat) => {
    const item = document.createElement("div");
    item.className = "history-item" + (chat.id === activeChatId ? " active" : "");
    item.dataset.id = chat.id;
 
    const title = document.createElement("span");
    title.className = "title";
    title.textContent = chat.title || "New chat";
 
    const delBtn = document.createElement("button");
    delBtn.className = "delete-btn";
    delBtn.setAttribute("aria-label", "Delete chat");
    delBtn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6h16z"/></svg>';
    delBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      deleteChat(chat.id);
    });
 
    item.appendChild(title);
    item.appendChild(delBtn);
    item.addEventListener("click", () => openChat(chat.id));
    historyList.appendChild(item);
  });
}
 
/* ---------- Chat CRUD ---------- */
function createChat() {
  const chat = {
    id: "chat_" + Date.now(),
    title: "New chat",
    messages: [],
  };
  chats.unshift(chat);
  saveChats();
  activeChatId = chat.id;
  renderHistory();
  showWelcome();
  clearPendingImage();
  return chat;
}
 
function deleteChat(id) {
  const idx = chats.findIndex((c) => c.id === id);
  if (idx === -1) return;
 
  chats.splice(idx, 1);
  saveChats();
 
  if (activeChatId === id) {
    if (chats.length > 0) {
      openChat(chats[0].id);
    } else {
      activeChatId = null;
      showWelcome();
    }
  }
  renderHistory();
}
 
function openChat(id) {
  const chat = chats.find((c) => c.id === id);
  if (!chat) return;
  activeChatId = id;
  chatTitle.textContent = chat.title || "New chat";
  renderHistory();
  clearPendingImage();
 
  if (chat.messages.length === 0) {
    showWelcome();
  } else {
    hideWelcome();
    messagesEl.innerHTML = "";
    chat.messages.forEach((m) => renderMessage(m.role, m.text, m.image));
    scrollToBottom();
  }
}
 
function showWelcome() {
  welcomeScreen.hidden = false;
  messagesEl.innerHTML = "";
  chatTitle.textContent = "New chat";
}
 
function hideWelcome() {
  welcomeScreen.hidden = true;
}
 
/* ---------- Sending messages ---------- */
function bindEvents() {
  newChatBtn.addEventListener("click", createChat);
 
  sidebarToggle.addEventListener("click", () => {
    document.getElementById("sidebar").classList.toggle("collapsed");
  });
  mobileSidebarToggle.addEventListener("click", () => {
    document.body.classList.toggle("sidebar-open");
  });
 
  darkModeToggle.addEventListener("click", toggleDarkMode);
  learningModeToggle.addEventListener("click", toggleLearningMode);
 
  attachBtn.addEventListener("click", () => imageInput.click());
  imageInput.addEventListener("change", handleImageSelect);
  previewRemove.addEventListener("click", clearPendingImage);
 
  composerForm.addEventListener("submit", (e) => {
    e.preventDefault();
    sendMessage();
  });
 
  document.querySelectorAll(".suggestion-card").forEach((card) => {
    card.addEventListener("click", () => {
      messageInput.value = card.dataset.suggestion;
      sendMessage();
    });
  });
}
 
function handleImageSelect(e) {
  const file = e.target.files[0];
  if (!file) return;
 
  const reader = new FileReader();
  reader.onload = (ev) => {
    pendingImage = { dataUrl: ev.target.result, name: file.name };
    previewImg.src = pendingImage.dataUrl;
    previewStrip.hidden = false;
  };
  reader.readAsDataURL(file);
}
 
function clearPendingImage() {
  pendingImage = null;
  imageInput.value = "";
  previewStrip.hidden = true;
  previewImg.src = "";
}
 
function sendMessage() {
  const text = messageInput.value.trim();
  if (!text && !pendingImage) return;
 
  let chat = chats.find((c) => c.id === activeChatId);
  if (!chat) chat = createChat();
 
  hideWelcome();
 
  const userMsg = { role: "user", text, image: pendingImage ? pendingImage.dataUrl : null };
  chat.messages.push(userMsg);
 
  if (chat.title === "New chat" || !chat.title) {
    chat.title = text ? text.slice(0, 40) : "Image chat";
    chatTitle.textContent = chat.title;
  }
 
  renderMessage("user", text, userMsg.image);
  const hadImage = !!pendingImage;
  clearPendingImage();
  messageInput.value = "";
  scrollToBottom();
  saveChats();
  renderHistory();
 
  const typingEl = renderTyping();
  scrollToBottom();
 
  // Simulated recognition response. Swap generateResponse() for a real
  // vision API call (e.g. the Anthropic API with an image content block)
  // to make this a fully working image-recognition backend.
  setTimeout(() => {
    typingEl.remove();
    const settings = loadSettings();
    const reply = generateResponse(text, hadImage, settings.learning);
    chat.messages.push({ role: "ai", text: reply, image: null });
    renderMessage("ai", reply);
    saveChats();
    scrollToBottom();
  }, 900 + Math.random() * 700);
}
 
/* ---------- Rendering ---------- */
function renderMessage(role, text, image) {
  const wrap = document.createElement("div");
  wrap.className = "message " + role;
 
  const avatar = document.createElement("div");
  avatar.className = "avatar";
  avatar.innerHTML =
    role === "user"
      ? '<svg viewBox="0 0 24 24"><path d="M20 21a8 8 0 1 0-16 0M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"/></svg>'
      : '<svg viewBox="0 0 24 24"><path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8z"/></svg>';
 
  const bubbleWrap = document.createElement("div");
  bubbleWrap.className = "bubble-wrap";
 
  const bubble = document.createElement("div");
  bubble.className = "bubble";
 
  if (image) {
    const img = document.createElement("img");
    img.className = "msg-image";
    img.src = image;
    img.alt = "Uploaded image";
    bubble.appendChild(img);
  }
  if (text) {
    const p = document.createElement("span");
    p.textContent = text;
    bubble.appendChild(p);
  }
 
  bubbleWrap.appendChild(bubble);
  wrap.appendChild(avatar);
  wrap.appendChild(bubbleWrap);
  messagesEl.appendChild(wrap);
  return wrap;
}
 
function renderTyping() {
  const wrap = document.createElement("div");
  wrap.className = "message ai";
  wrap.innerHTML = `
    <div class="avatar"><svg viewBox="0 0 24 24"><path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8z"/></svg></div>
    <div class="bubble-wrap"><div class="bubble typing-dots"><span></span><span></span><span></span></div></div>
  `;
  messagesEl.appendChild(wrap);
  return wrap;
}
 
function scrollToBottom() {
  chatWindow.scrollTop = chatWindow.scrollHeight;
}
 
/* ---------- Simulated recognition response ---------- */
function generateResponse(userText, hasImage, learningMode) {
  if (hasImage) {
    if (learningMode) {
      return (
        "Here's what I'm noticing in the image, step by step:\n\n" +
        "1. Overall composition — the main subject sits roughly in the center, with the background giving context.\n" +
        "2. Key objects — I can identify distinct shapes and colors that suggest the primary subject.\n" +
        "3. Details worth a closer look — texture, lighting, and any visible text.\n\n" +
        "In learning mode I break things down this way so you can see the reasoning, not just the answer. " +
        "Want me to focus on one part of the image — like the text, the colors, or a specific object?"
      );
    }
    return "I can see the image you uploaded. It looks like it contains a clear main subject with some background detail. Ask me to zoom into anything specific — objects, text, or colors — and I'll break it down.";
  }
 
  if (learningMode) {
    return (
      "Good question. Let's work through it together: to give you a precise answer, it helps if you attach an image " +
      "using the image icon in the message bar — that way I can walk you through exactly what I'm seeing and why."
    );
  }
  return "I'm ready when you are — attach an image using the image icon and ask me anything about it.";
}
 