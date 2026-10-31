/**
 * EPOCH Interactive AI Student Assistant
 * Powered by localized knowledge base for academic workflows, regulations, & guidance.
 */
const Assistant = {
  isOpen: false,
  messages: [],

  init() {
    this.renderSuggestions();
  },

  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  },

  open() {
    const drawer = document.getElementById("assistantDrawer");
    if (drawer) {
      drawer.style.display = "flex";
      this.isOpen = true;
      const input = document.getElementById("assistantInput");
      if (input) setTimeout(() => input.focus(), 150);
    }
  },

  close() {
    const drawer = document.getElementById("assistantDrawer");
    if (drawer) {
      drawer.style.display = "none";
      this.isOpen = false;
      const chatInput = document.getElementById("chatMessageInput");
      const chatView = document.getElementById("chatView");
      if (chatInput && chatView && chatView.style.display !== "none") {
        chatInput.focus();
      }
    }
  },

  renderSuggestions() {
    const container = document.getElementById("assistantSuggestions");
    if (!container) return;

    const suggestions = [
      "📝 How to apply for OD?",
      "📊 Attendance rules & shortage?",
      "🚨 How to file a confidential complaint?",
      "📜 How to get a Bonafide Certificate?",
      "🏖️ Applying for medical leave"
    ];

    container.innerHTML = suggestions.map(s => `
      <button type="button" class="assistant-chip" onclick="Assistant.askDirect('${s.replace(/'/g, "\\'")}')">
        ${s}
      </button>
    `).join("");
  },

  askDirect(text) {
    // Strip leading emojis for query matching
    const cleanText = text.replace(/^[^\w\s]+/g, '').trim();
    const input = document.getElementById("assistantInput");
    if (input) input.value = cleanText;
    this.send();
  },

  send() {
    const input = document.getElementById("assistantInput");
    if (!input) return;
    const text = input.value.trim();
    if (!text) return;

    // Append user message
    this.appendMessage("user", text);
    input.value = "";

    // Show bot reply
    setTimeout(() => {
      const res = DemoStore.queryAssistant(text);
      this.appendMessage("bot", res.answer, res.category);
    }, 300);
  },

  appendMessage(sender, text, category = "") {
    const msgBox = document.getElementById("assistantMessages");
    if (!msgBox) return;

    const div = document.createElement("div");
    div.className = `assistant-msg msg-${sender}`;

    if (sender === "bot") {
      div.innerHTML = `
        <div style="font-size:10px; font-weight:700; color:var(--accent-teal); text-transform:uppercase; margin-bottom:4px; display:flex; align-items:center; gap:4px;">
          <span>🤖</span> EPOCH Assistant ${category ? '• ' + category : ''}
        </div>
        <div>${this.escape(text)}</div>
      `;
    } else {
      div.innerHTML = `<div>${this.escape(text)}</div>`;
    }

    msgBox.appendChild(div);
    msgBox.scrollTop = msgBox.scrollHeight;
  },

  escape(str) {
    if (!str) return "";
    return str.replace(/[&<>"']/g, m => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    })[m]);
  }
};

document.addEventListener("DOMContentLoaded", () => {
  Assistant.init();
});
