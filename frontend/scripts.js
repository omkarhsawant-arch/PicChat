// The frontend is served by Flask, so API requests work on localhost and after deployment.
const API_URL = window.location.origin;

/* ---------- State ---------- */

let chats = [];
let activeChatId = null;
let pendingImage = null;


/* ---------- DOM references ---------- */

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


/* ---------- Initialization ---------- */

init();

async function init() {

    applySettings(loadSettings());

    await loadChats();

    bindEvents();

    if (chats.length > 0) {
        await openChat(chats[0].id);
    } else {
        showWelcome();
    }
}


/* ---------- Settings ---------- */

function loadSettings() {

    try {

        const raw = localStorage.getItem("picChat.settings");

        return raw
            ? JSON.parse(raw)
            : {
                dark: false,
                learning: false
            };

    } catch (error) {

        return {
            dark: false,
            learning: false
        };
    }
}


function saveSettings(settings) {

    localStorage.setItem(
        "picChat.settings",
        JSON.stringify(settings)
    );
}


function applySettings(settings) {

    document.body.dataset.theme =
        settings.dark ? "dark" : "light";

    document.body.dataset.mode =
        settings.learning ? "learning" : "normal";

    darkModeToggle.setAttribute(
        "aria-checked",
        String(!!settings.dark)
    );

    learningModeToggle.setAttribute(
        "aria-checked",
        String(!!settings.learning)
    );

    modePill.textContent =
        settings.learning
            ? "Learning mode"
            : "Normal mode";
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


/* ---------- Load chats from Flask ---------- */

async function loadChats() {

    try {

        const response = await fetch(
            `${API_URL}/chats`
        );

        const data = await response.json();

        if (data.status !== "success") {

            console.error("Could not load chats.");

            return;
        }

        chats = data.chats;

        renderHistory();

    } catch (error) {

        console.error("Error loading chats:", error);

        alert(
            "Could not connect to the PicChat backend. " +
            "Make sure Flask is running."
        );
    }
}


/* ---------- Render chat history ---------- */

function renderHistory() {

    historyList.innerHTML = "";

    if (chats.length === 0) {

        const empty = document.createElement("div");

        empty.className = "history-empty";

        empty.textContent =
            "No chats yet — start a new one.";

        historyList.appendChild(empty);

        return;
    }


    chats.forEach((chat) => {

        const item = document.createElement("div");

        item.className =
            "history-item" +
            (chat.id === activeChatId ? " active" : "");

        item.dataset.id = chat.id;


        const title = document.createElement("span");

        title.className = "title";

        title.textContent =
            chat.title || "New chat";


        const deleteButton =
            document.createElement("button");

        deleteButton.className = "delete-btn";

        deleteButton.setAttribute(
            "aria-label",
            "Delete chat"
        );

        deleteButton.innerHTML =
            '<svg viewBox="0 0 24 24">' +
            '<path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6h16z"/>' +
            '</svg>';


        deleteButton.addEventListener(
            "click",
            async (event) => {

                event.stopPropagation();

                await deleteChat(chat.id);
            }
        );


        item.appendChild(title);

        item.appendChild(deleteButton);


        item.addEventListener(
            "click",
            () => openChat(chat.id)
        );


        historyList.appendChild(item);
    });
}


/* ---------- Create new chat ---------- */

async function createChat() {

    try {

        const response = await fetch(
            `${API_URL}/new-chat`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    title: "New chat"
                })
            }
        );


        const data = await response.json();


        if (data.status !== "success") {

            alert("Could not create chat.");

            return null;
        }


        const newChat = {

            id: data.chat_id,

            title: data.title,

            messages: []
        };


        chats.unshift(newChat);

        activeChatId = newChat.id;


        renderHistory();

        showWelcome();

        clearPendingImage();


        return newChat;


    } catch (error) {

        console.error(
            "Error creating chat:",
            error
        );

        alert(
            "Could not connect to the backend."
        );

        return null;
    }
}


/* ---------- Open chat ---------- */

async function openChat(chatId) {

    try {

        const response = await fetch(
            `${API_URL}/chats/${chatId}`
        );


        const data = await response.json();


        if (data.status !== "success") {

            alert("Could not open chat.");

            return;
        }


        activeChatId = chatId;


        const chat =
            chats.find(
                (item) => item.id === chatId
            );


        if (chat) {

            chat.title =
                chat.title || "New chat";

            chat.messages =
                data.messages;
        }


        renderHistory();


        if (!chat || data.messages.length === 0) {

            showWelcome();

        } else {

            hideWelcome();

            messagesEl.innerHTML = "";


            data.messages.forEach(
                (message) => {

                    renderMessage(
                        message.role,
                        message.message
                    );
                }
            );


            chatTitle.textContent =
                chat.title || "New chat";


            scrollToBottom();
        }


        clearPendingImage();


    } catch (error) {

        console.error(
            "Error opening chat:",
            error
        );

        alert(
            "Could not load this chat."
        );
    }
}


/* ---------- Delete chat ---------- */

async function deleteChat(chatId) {

    const confirmed =
        confirm(
            "Delete this chat?"
        );

    if (!confirmed) {

        return;
    }


    try {

        const response = await fetch(
            `${API_URL}/chats/${chatId}`,
            {
                method: "DELETE"
            }
        );


        const data = await response.json();


        if (data.status !== "success") {

            alert(
                "Could not delete chat."
            );

            return;
        }


        chats =
            chats.filter(
                (chat) => chat.id !== chatId
            );


        if (activeChatId === chatId) {

            if (chats.length > 0) {

                await openChat(
                    chats[0].id
                );

            } else {

                activeChatId = null;

                showWelcome();
            }
        }


        renderHistory();


    } catch (error) {

        console.error(
            "Error deleting chat:",
            error
        );

        alert(
            "Could not connect to backend."
        );
    }
}


/* ---------- Welcome screen ---------- */

function showWelcome() {

    welcomeScreen.hidden = false;

    messagesEl.innerHTML = "";

    chatTitle.textContent = "New chat";
}


function hideWelcome() {

    welcomeScreen.hidden = true;
}


/* ---------- Event binding ---------- */

function bindEvents() {

    newChatBtn.addEventListener(
        "click",
        async () => {

            await createChat();
        }
    );


    sidebarToggle.addEventListener(
        "click",
        () => {

            document
                .getElementById("sidebar")
                .classList
                .toggle("collapsed");
        }
    );


    mobileSidebarToggle.addEventListener(
        "click",
        () => {

            document.body.classList.toggle(
                "sidebar-open"
            );
        }
    );


    darkModeToggle.addEventListener(
        "click",
        toggleDarkMode
    );


    learningModeToggle.addEventListener(
        "click",
        toggleLearningMode
    );


    attachBtn.addEventListener(
        "click",
        () => {

            imageInput.click();
        }
    );


    imageInput.addEventListener(
        "change",
        handleImageSelect
    );


    previewRemove.addEventListener(
        "click",
        clearPendingImage
    );


    composerForm.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();

            await sendMessage();
        }
    );


    document
        .querySelectorAll(".suggestion-card")
        .forEach((card) => {

            card.addEventListener(
                "click",
                async () => {

                    messageInput.value =
                        card.dataset.suggestion;

                    await sendMessage();
                }
            );
        });
}


/* ---------- Image selection ---------- */

function handleImageSelect(event) {

    const file =
        event.target.files[0];


    if (!file) {

        return;
    }


    pendingImage = file;


    const reader =
        new FileReader();


    reader.onload = function(event) {

        previewImg.src =
            event.target.result;

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


/* ---------- Send message ---------- */

async function sendMessage() {

    const text =
        messageInput.value.trim();


    if (!text && !pendingImage) {

        return;
    }


    /* Create a chat automatically
       if no chat is currently open */

    if (!activeChatId) {

        const newChat =
            await createChat();


        if (!newChat) {

            return;
        }
    }


    hideWelcome();


    /* Display user's message immediately */

    const imagePreview =
        pendingImage
            ? await fileToDataURL(pendingImage)
            : null;


    renderMessage(
        "user",
        text,
        imagePreview
    );


    const typingElement =
        renderTyping();


    scrollToBottom();


    /* Prepare request */

    const formData =
        new FormData();


    formData.append(
        "question",
        text
    );


    formData.append(
        "chat_id",
        activeChatId
    );


    const settings =
        loadSettings();


    formData.append(
        "learning_mode",
        settings.learning
            ? "true"
            : "false"
    );


    if (pendingImage) {

        formData.append(
            "image",
            pendingImage
        );
    }


    /* Clear composer */

    messageInput.value = "";

    clearPendingImage();


    try {

        sendBtn.disabled = true;


        const response =
            await fetch(
                `${API_URL}/ask`,
                {
                    method: "POST",
                    body: formData
                }
            );


        const data =
            await response.json();


        typingElement.remove();


        if (data.status !== "success") {

            renderMessage(
                "ai",
                "Sorry, something went wrong: " +
                data.message
            );

            return;
        }


        /* Display Gemini's real answer */

        renderMessage(
            "ai",
            data.answer
        );


        /* Reload chat history from backend */

        await loadChats();


        /* Keep current chat selected */

        const currentChat =
            chats.find(
                (chat) =>
                    chat.id === activeChatId
            );


        if (currentChat) {

            chatTitle.textContent =
                currentChat.title;
        }


        renderHistory();

        scrollToBottom();


    } catch (error) {

        console.error(
            "Error sending message:",
            error
        );


        typingElement.remove();


        renderMessage(
            "ai",
            "Could not connect to the PicChat backend. " +
            "Please make sure Flask is running."
        );


    } finally {

        sendBtn.disabled = false;
    }
}


/* ---------- Convert image to preview ---------- */

function fileToDataURL(file) {

    return new Promise(
        (resolve, reject) => {

            const reader =
                new FileReader();


            reader.onload =
                () => resolve(
                    reader.result
                );


            reader.onerror =
                reject;


            reader.readAsDataURL(file);
        }
    );
}


/* ---------- Render messages ---------- */

function renderMessage(
    role,
    text,
    image = null
) {

    const wrap =
        document.createElement("div");


    /*
       Backend uses:
       role = "user"
       role = "assistant"

       CSS uses:
       user
       ai
    */

    const cssRole =
        role === "assistant"
            ? "ai"
            : role;


    wrap.className =
        "message " + cssRole;


    const avatar =
        document.createElement("div");


    avatar.className =
        "avatar";


    avatar.innerHTML =
        cssRole === "user"

            ? '<svg viewBox="0 0 24 24">' +
              '<path d="M20 21a8 8 0 1 0-16 0M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"/>' +
              '</svg>'

            : '<svg viewBox="0 0 24 24">' +
              '<path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8z"/>' +
              '</svg>';


    const bubbleWrap =
        document.createElement("div");


    bubbleWrap.className =
        "bubble-wrap";


    const bubble =
        document.createElement("div");


    bubble.className =
        "bubble";


    if (image) {

        const img =
            document.createElement("img");


        img.className =
            "msg-image";


        img.src = image;


        img.alt =
            "Uploaded image";


        bubble.appendChild(img);
    }


    if (text) {

        const textElement =
            document.createElement("span");


        textElement.textContent =
            text;


        bubble.appendChild(
            textElement
        );
    }


    bubbleWrap.appendChild(
        bubble
    );


    wrap.appendChild(
        avatar
    );


    wrap.appendChild(
        bubbleWrap
    );


    messagesEl.appendChild(
        wrap
    );


    return wrap;
}


/* ---------- Typing animation ---------- */

function renderTyping() {

    const wrap =
        document.createElement("div");


    wrap.className =
        "message ai";


    wrap.innerHTML = `
        <div class="avatar">
            <svg viewBox="0 0 24 24">
                <path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8z"/>
            </svg>
        </div>

        <div class="bubble-wrap">
            <div class="bubble typing-dots">
                <span></span>
                <span></span>
                <span></span>
            </div>
        </div>
    `;


    messagesEl.appendChild(
        wrap
    );


    return wrap;
}


/* ---------- Scroll ---------- */

function scrollToBottom() {

    chatWindow.scrollTop =
        chatWindow.scrollHeight;
}

