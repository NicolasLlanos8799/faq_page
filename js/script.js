// ================================
// CONFIG
// ================================
const WEBHOOK_URL = "https://nicolasllanossw10.app.n8n.cloud/webhook/iagency/webchat";
const BUSINESS_ID = "urban_style_01";
const USER_ID = "ig_" + Math.random().toString(36).slice(2, 6);

lucide.createIcons(); // Inicializar iconos

// ================================
// DOM
// ================================
const chatMessages = document.getElementById("chat-box");
const chatForm = document.getElementById("chat-form");
const chatInput = document.getElementById("chat-input");
const igSuggestions = document.getElementById("ig-suggestions");
const sendBtn = document.getElementById("send-btn");
const extraIcons = document.getElementById("extra-icons");
const typingIndicator = document.getElementById("typing-indicator");

// ================================
// HELPERS
// ================================
function addMessage(text, from) {
    const msg = document.createElement("div");
    msg.className = "message " + from + " msg-anim";
    msg.textContent = text;

    const group = document.createElement("div");
    group.className = "message-group";
    group.appendChild(msg);

    if (from === "user") {
        const seen = document.createElement("div");
        seen.className = "seen-status";
        seen.textContent = "Visto";
        seen.id = "seen_" + Date.now();
        group.appendChild(seen);

        // Hide previous seen statuses
        document.querySelectorAll(".seen-status").forEach(s => s.style.display = "none");
        setTimeout(() => seen.style.display = "block", 500);
    }

    chatMessages.appendChild(group);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

async function sendToWebhook(text) {
    typingIndicator.style.display = "flex";
    chatMessages.scrollTop = chatMessages.scrollHeight;

    const payload = { id_negocio: BUSINESS_ID, user_id: USER_ID, texto: text };

    try {
        const res = await fetch(WEBHOOK_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const data = await res.json().catch(() => null);
        const reply = data?.reply || data?.respuesta || data?.message || "Gracias por tu mensaje 😊";

        setTimeout(() => {
            typingIndicator.style.display = "none";
            addMessage(reply, "bot");
        }, 1200);

    } catch (err) {
        console.error(err);
        typingIndicator.style.display = "none";
        addMessage("⚠️ No pudimos conectarnos.", "bot");
    }
}

// ================================
// UI LOGIC
// ================================
if (chatInput) {
    chatInput.addEventListener("input", () => {
        const hasText = chatInput.value.trim().length > 0;
        sendBtn.style.display = hasText ? "block" : "none";
        extraIcons.style.display = hasText ? "none" : "flex";
    });
}

if (igSuggestions) {
    igSuggestions.addEventListener("click", e => {
        const btn = e.target.closest("button");
        if (!btn || !btn.dataset.text) return;
        const text = btn.dataset.text;
        addMessage(text, "user");
        igSuggestions.style.display = "none";
        sendToWebhook(text);
    });
}

function handleSubmit() {
    const text = chatInput.value.trim();
    if (!text) return;
    chatInput.value = "";
    sendBtn.style.display = "none";
    extraIcons.style.display = "flex";
    igSuggestions.style.display = "none";
    addMessage(text, "user");
    sendToWebhook(text);
}

if (chatForm) {
    chatForm.addEventListener("submit", e => { e.preventDefault(); handleSubmit(); });
}
if (sendBtn) {
    sendBtn.addEventListener("click", e => { e.preventDefault(); handleSubmit(); });
}

// ================================
// WELCOME
// ================================
setTimeout(() => {
    addMessage("👋 Hola! Bienvenido a Urban Style.\n\nPodés elegir una opción rápida o escribirnos tu consulta.", "bot");
}, 400);
