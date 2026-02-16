// ================================
// CONFIG
// ================================
const WEBHOOK_URL = "https://nicolasllanossw10.app.n8n.cloud/webhook/iagency/webchat";
const BUSINESS_ID = "urban_style_01";
const USER_ID = "ig_" + Math.random().toString(36).slice(2, 6);

try {
    if (typeof lucide !== 'undefined') lucide.createIcons();
} catch (e) {
    console.error("Lucide icons error:", e);
}

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
// GA4 TRACKING HELPER
// ================================
function trackEvent(eventName, params = {}) {
    if (typeof gtag === 'function') {
        gtag('event', eventName, params);
    }
}

// Session-level flags to prevent duplicate events
window.trackingFlags = {
    demoViewed: false,
    chatEngaged: false,
    scroll75: false
};

// Counter to qualify engagement
let messagesSent = 0;

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

        // Track successful message send (server response received)
        trackEvent('chat_message_sent', {
            source: window.currentMsgSource || 'manual', // Can be extended for: voice, image, whatsapp
            message_length: text.length
        });
        messagesSent++;
        window.currentMsgSource = 'manual'; // Reset to default

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

        // GA4 tracking (Optimized: Using ID instead of long strings)
        let suggestionId = 'otro';
        const lower = text.toLowerCase();
        if (lower.includes('horario') || lower.includes('hora')) suggestionId = 'horarios';
        else if (lower.includes('precio') || lower.includes('cuanto') || lower.includes('costa')) suggestionId = 'precios';
        else if (lower.includes('ubica') || lower.includes('donde') || lower.includes('zona')) suggestionId = 'ubicacion';

        trackEvent('chat_suggestion_click', { suggestion_id: suggestionId });
        window.currentMsgSource = 'suggestion';

        sendToWebhook(text);
    });
}

// Logic for example buttons with mobile-friendly delegation
document.addEventListener("click", e => {
    const btn = e.target.closest(".example-msg-btn");
    if (!btn) return;

    e.preventDefault();
    const text = btn.dataset.text;
    if (!text) return;

    // Pulse feedback
    btn.style.opacity = "0.6";
    setTimeout(() => btn.style.opacity = "1", 150);

    // 1. Send message
    addMessage(text, "user");
    if (igSuggestions) igSuggestions.style.display = "none";

    // GA4 tracking (Optimized: Using Type instead of long strings)
    let messageType = 'otro';
    const lower = text.toLowerCase();
    if (lower.includes('horario') || lower.includes('hora')) messageType = 'horarios';
    else if (lower.includes('precio') || lower.includes('cuanto') || lower.includes('costa')) messageType = 'precios';
    else if (lower.includes('ubica') || lower.includes('donde') || lower.includes('zona')) messageType = 'ubicacion';

    trackEvent('example_message_click', {
        message_type: messageType,
        message_length: text.length
    });
    window.currentMsgSource = 'example';

    sendToWebhook(text);

    // 2. Scroll to chat (delayed for mobile stability)
    setTimeout(() => {
        const demoSection = document.getElementById("demo");
        if (demoSection) {
            demoSection.scrollIntoView({ behavior: "smooth", block: "center" });
        }
    }, 150);
});

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
// SCROLL REVEAL
// ================================
const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('active');
            revealObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.15 });

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

// ================================
// CONTACT FORM
// ================================
const contactForm = document.getElementById("contactForm");
const contactSuccess = document.getElementById("contactSuccess");
const contactError = document.getElementById("contactError");
const contactSubmitBtn = document.getElementById("contactSubmitBtn");

if (contactForm) {
    contactForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        contactSubmitBtn.disabled = true;
        contactSubmitBtn.textContent = "Enviando...";
        contactSuccess.style.display = "none";
        contactError.style.display = "none";

        const formData = new FormData(contactForm);

        try {
            const response = await fetch(contactForm.action, {
                method: "POST",
                body: formData,
                headers: { 'Accept': 'application/json' }
            });

            if (response.ok) {
                contactForm.reset();
                contactSuccess.classList.remove("hidden");
                contactSuccess.style.display = "block";

                // GA4 tracking: lead conversion
                trackEvent('lead_form_submit', {
                    form_id: 'contactForm',
                    product: 'asistente_faq'
                });
            } else {
                contactError.classList.remove("hidden");
                contactError.style.display = "block";
            }
        } catch (error) {
            contactError.classList.remove("hidden");
            contactError.style.display = "block";
        } finally {
            contactSubmitBtn.disabled = false;
            contactSubmitBtn.textContent = "Solicitar mi Asistente FAQ";
        }
    });
}

// ================================
// WELCOME
// ================================
setTimeout(() => {
    addMessage("👋 Hola soy Sofi el asistente virtual! Bienvenido a Urban Style.\n\nPodés elegir una opción rápida o escribirnos tu consulta.", "bot");
}, 400);

// ===================================
// === GA4 Tracking Implementations ===
// ===================================

// 1. demo_click Tracking
document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href*="#demo"]');
    if (link) {
        // NOTE: In the future, this click tracking can be centralized into a single global listener 
        // to reduce multiple document:click handlers.
        let location = 'other';
        if (link.closest('nav')) location = 'nav';
        else if (link.closest('header')) location = 'hero';
        else if (link.closest('footer')) location = 'footer';
        else if (link.closest('section')) location = 'features';

        trackEvent('demo_click', { location: location });
    }

    // 2. cta_comenzar_click Tracking
    const cta = e.target.closest('a[href="#contact"]');
    if (cta && cta.closest('header')) {
        trackEvent('cta_comenzar_click', { section: 'hero' });
    }
});

// 3. chat_engaged tracking (+30s of interaction)
let interactionStartTime = null;
const startInteractionTimer = () => {
    if (!interactionStartTime) {
        interactionStartTime = Date.now();
        setTimeout(() => {
            // Refined: Only engaged if user stayed 30s AND sent at least 1 message
            if (!window.trackingFlags.chatEngaged && messagesSent > 0) {
                trackEvent('chat_engaged', { time_seconds: 30 });
                window.trackingFlags.chatEngaged = true;
            }
        }, 30000);
    }
};

if (chatInput) chatInput.addEventListener('focus', startInteractionTimer);
if (chatForm) chatForm.addEventListener('click', startInteractionTimer);

// 4. demo_view Tracking (IntersectionObserver)
const demoSection = document.getElementById('demo');
if (demoSection) {
    const demoObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !window.trackingFlags.demoViewed) {
                trackEvent('demo_view', { view_type: 'demo_chat' });
                window.trackingFlags.demoViewed = true;
                demoObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });
    demoObserver.observe(demoSection);
}

// 5. scroll_75 tracking
window.addEventListener('scroll', () => {
    if (window.trackingFlags.scroll75) return;

    const h = document.documentElement;
    const b = document.body;
    const st = 'scrollTop';
    const sh = 'scrollHeight';

    const percent = (h[st] || b[st]) / ((h[sh] || b[sh]) - h.clientHeight) * 100;

    if (percent >= 75) {
        trackEvent('scroll_75');
        window.trackingFlags.scroll75 = true;
    }
}, { passive: true });
