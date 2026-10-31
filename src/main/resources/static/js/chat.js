/**
 * EPOCH Institutional Academic Messaging & WhatsApp-Style Chat Module
 * Direct, role-permissioned, instant institutional communication between Students,
 * Class Advisors, HOD, Principal, and Peer Students.
 *
 * Modern Chat Architecture:
 * - Direct 1-to-1 institutional messaging: instant chat creation without request/accept gates
 * - WhatsApp-style two-pane + contact profile drawer responsive layout
 * - Mobile responsive view with seamless back navigation
 * - Persistent chats restored from Firestore across logins, refreshes, and app restarts
 * - Status ticks (⏳ sending, ✓ sent, grey ✓✓ delivered, cyan ✓✓ read)
 * - Date separators ("Today", "Yesterday", "DD MMM YYYY")
 * - Voice message recording & inline playback with audio waveform/progress seeker
 * - Quoted message replies with click-to-scroll to original message
 * - Message deletion / unsend for everyone
 * - Real-time typing indicators
 * - In-conversation message search with match counter and highlights
 * - Smart registered user directory with instant filters (All, Faculty & Staff, Students)
 * - Image lightbox viewer modal and document/PDF cards
 * - Floating scroll-to-bottom button with unread counter
 * - LocalStorage-backed Pinning (📌) and Muting (🔕)
 */
const ChatApp = {
  currentUser: null,
  conversations: [],
  activeConversation: null,
  activeRecipient: null,
  messages: [],
  currentFilter: 'all',          // 'all' | 'unread' | 'staff' | 'students' | 'pinned'
  searchQuery: '',
  inConvSearchQuery: '',
  replyingTo: null,              // { id, senderName, text }
  pendingAttachment: null,       // { dataUrl, name, type, size }
  isEmojiPickerOpen: false,
  isProfileOpen: false,
  isSending: false,
  isLoadingMessages: false,
  pollTimer: null,
  typingPollTimer: null,
  typingTimeout: null,
  isTypingBroadcasted: false,

  // Voice recording state
  isVoiceRecording: false,
  voiceMediaRecorder: null,
  voiceAudioChunks: [],
  voiceTimerInterval: null,
  voiceSeconds: 0,

  // Inline audio playback state
  currentlyPlayingAudio: null,
  currentlyPlayingId: null,

  // Directory state
  directoryUsers: [],
  directoryCategory: 'all',      // 'all' | 'staff' | 'students'
  directorySearchQuery: '',
  _directorySearchTimer: null,

  // ------------------ Helper & Identifier Utilities ------------------
  getAuthHeaders(extra = {}) {
    const headers = { 'Accept': 'application/json', ...extra };
    let token = null;
    try {
      if (typeof Auth !== 'undefined' && Auth.getToken) token = Auth.getToken();
      else if (window.Auth && window.Auth.getToken) token = window.Auth.getToken();
    } catch (e) {}
    if (!token) {
      try {
        token = localStorage.getItem('epoch_auth_token') || sessionStorage.getItem('epoch_auth_token');
      } catch (e) {}
    }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  },

  getUserIdentifier(u) {
    if (!u) return '';
    return String(u.identifier || u.regNo || u.username || u.id || '').trim();
  },

  getCurrentUserId() {
    const u = this.currentUser || (window.Auth ? Auth.getUser() : null);
    return this.getUserIdentifier(u).toLowerCase();
  },

  // Pinning Storage & Helpers
  getPinnedIds() {
    const uid = this.getCurrentUserId();
    if (!uid) return new Set();
    try {
      const stored = localStorage.getItem(`epoch_chat_pinned_${uid}`);
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch (e) {
      return new Set();
    }
  },

  setPinnedIds(set) {
    const uid = this.getCurrentUserId();
    if (!uid) return;
    try {
      localStorage.setItem(`epoch_chat_pinned_${uid}`, JSON.stringify(Array.from(set)));
    } catch (e) {}
  },

  isConversationPinned(convId) {
    if (!convId) return false;
    return this.getPinnedIds().has(convId);
  },

  togglePin(convId) {
    if (!convId) return;
    const pinned = this.getPinnedIds();
    const isNowPinned = !pinned.has(convId);
    if (isNowPinned) {
      pinned.add(convId);
      if (window.Toast) Toast.show("Conversation pinned to top 📌", "info");
    } else {
      pinned.delete(convId);
      if (window.Toast) Toast.show("Conversation unpinned", "info");
    }
    this.setPinnedIds(pinned);
    this.renderConversations();
    this.updateActiveChatPinIndicator();
    this.renderProfilePanel();
  },

  // Muting Storage & Helpers
  getMutedIds() {
    const uid = this.getCurrentUserId();
    if (!uid) return new Set();
    try {
      const stored = localStorage.getItem(`epoch_chat_muted_${uid}`);
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch (e) {
      return new Set();
    }
  },

  setMutedIds(set) {
    const uid = this.getCurrentUserId();
    if (!uid) return;
    try {
      localStorage.setItem(`epoch_chat_muted_${uid}`, JSON.stringify(Array.from(set)));
    } catch (e) {}
  },

  isConversationMuted(convId) {
    if (!convId) return false;
    return this.getMutedIds().has(convId);
  },

  toggleMute(convId) {
    if (!convId) return;
    const muted = this.getMutedIds();
    const isNowMuted = !muted.has(convId);
    if (isNowMuted) {
      muted.add(convId);
      if (window.Toast) Toast.show("Conversation notifications muted 🔕", "info");
    } else {
      muted.delete(convId);
      if (window.Toast) Toast.show("Conversation notifications unmuted 🔔", "info");
    }
    this.setMutedIds(muted);
    this.renderConversations();
    this.renderProfilePanel();
  },

  togglePinActiveConversation() {
    if (this.activeConversation && this.activeConversation.id) {
      this.togglePin(this.activeConversation.id);
    }
  },

  toggleMuteActiveConversation() {
    if (this.activeConversation && this.activeConversation.id) {
      this.toggleMute(this.activeConversation.id);
    }
  },

  updateActiveChatPinIndicator() {
    const pinEl = document.getElementById('activeChatPinIndicator');
    if (!pinEl) return;
    if (this.activeConversation && this.isConversationPinned(this.activeConversation.id)) {
      pinEl.style.display = 'inline';
    } else {
      pinEl.style.display = 'none';
    }
  },

  // ------------------ Recipient Resolution ------------------
  getConversationRecipient(conv, currentUser) {
    if (!conv) return null;
    const curId = (currentUser ? this.getUserIdentifier(currentUser) : this.getCurrentUserId()).toLowerCase();
    const curEmail = (currentUser && currentUser.email ? currentUser.email : '').toLowerCase();
    const curUid = (currentUser && currentUser.uid ? currentUser.uid : '').toLowerCase();

    const parts = conv.participants || [];
    let otherId = null;
    for (const p of parts) {
      if (!p) continue;
      const cleanP = String(p).trim().toLowerCase();
      if (cleanP !== curId && cleanP !== curEmail && cleanP !== curUid && !cleanP.includes('@')) {
        otherId = cleanP;
        break;
      }
    }

    const regA = String(conv.studentRegNo || '').toLowerCase();
    const regB = String(conv.staffUsername || '').toLowerCase();
    const isMatchA = (regA === curId || regA === curEmail || regA === curUid);
    const isMatchB = (regB === curId || regB === curEmail || regB === curUid);

    if (isMatchA && !isMatchB) {
      return {
        id: conv.staffUsername || otherId,
        identifier: conv.staffUsername || otherId,
        name: conv.staffName || conv.staffUsername || "Academic Official",
        role: conv.staffRole || "STAFF",
        department: conv.staffDepartment || "Academic Department",
        section: conv.section || "",
        avatar: (conv.staffName ? conv.staffName.charAt(0) : "S").toUpperCase(),
        profilePhoto: conv.staffPhoto || conv.staffProfilePhoto || conv.profilePhoto || conv.photoUrl || ""
      };
    } else if (!isMatchA && isMatchB) {
      return {
        id: conv.studentRegNo || otherId,
        identifier: conv.studentRegNo || otherId,
        name: conv.studentName || conv.studentRegNo || "Student",
        role: "STUDENT",
        department: conv.studentDepartment || "Computer Science (CSE)",
        section: conv.section || conv.studentSection || "CSE-A",
        academicYear: conv.studentAcademicYear || "IV Year B.E.",
        avatar: (conv.studentName ? conv.studentName.charAt(0) : "S").toUpperCase(),
        profilePhoto: conv.studentPhoto || conv.studentProfilePhoto || conv.profilePhoto || conv.photoUrl || ""
      };
    } else {
      // Symmetric / Peer chat fallback
      if (conv.id && conv.id.startsWith("conv_")) {
        const idParts = conv.id.substring(5).split("_");
        if (idParts.length >= 2) {
          const part0 = idParts[0].toLowerCase();
          const part1 = idParts[1].toLowerCase();
          const candidate = (part0 === curId) ? idParts[1] : idParts[0];
          return this.resolveUserQuick(candidate, conv);
        }
      }
      return {
        id: otherId || conv.staffUsername || conv.studentRegNo || "Contact",
        identifier: otherId || conv.staffUsername || conv.studentRegNo || "Contact",
        name: conv.staffName || conv.studentName || otherId || "Academic Contact",
        role: conv.staffRole || "MEMBER",
        department: conv.staffDepartment || conv.studentDepartment || "EPOCH Institution",
        section: conv.section || "",
        avatar: "U"
      };
    }
  },

  resolveUserQuick(identifier, convFallback) {
    if (!identifier) return { name: "Contact", role: "MEMBER", avatar: "U" };
    const clean = identifier.toLowerCase().trim();

    if (clean === "arularasi") {
      return { id: "arularasi", identifier: "arularasi", name: "Mrs. P. Arularasi", role: "ADVISOR", department: "Computer Science & Engineering", section: "CSE-A", avatar: "A" };
    } else if (clean === "divyabharathi" || clean === "dhivyabharathi") {
      return { id: "divyabharathi", identifier: "divyabharathi", name: "Mrs. S. Divyabharathi", role: "ADVISOR", department: "Computer Science & Engineering", section: "CSE-B", avatar: "D" };
    } else if (clean === "gopinath") {
      return { id: "gopinath", identifier: "gopinath", name: "Dr. Gopinath", role: "HOD", department: "Computer Science & Engineering", section: "Department", avatar: "H" };
    } else if (clean === "principal@gct.ac.in" || clean === "bsanjaygandhi") {
      return { id: "bsanjaygandhi", identifier: "principal@gct.ac.in", name: "Dr. B. Sanjay Gandhi", role: "PRINCIPAL", department: "Institution Administration", section: "Executive", avatar: "P" };
    }

    // Check directory cached users
    if (this.directoryUsers && this.directoryUsers.length > 0) {
      const found = this.directoryUsers.find(u =>
        (u.identifier && u.identifier.toLowerCase() === clean) ||
        (u.regNo && u.regNo.toLowerCase() === clean) ||
        (u.id && u.id.toLowerCase() === clean)
      );
      if (found) {
        return {
          id: found.identifier || found.regNo || found.id,
          identifier: found.identifier || found.regNo || found.id,
          name: found.name || "Student",
          role: found.role || "STUDENT",
          department: found.department || "Computer Science & Engineering",
          section: found.section || "CSE-A",
          academicYear: found.academicYear || "IV Year B.E.",
          avatar: (found.name ? found.name.charAt(0) : "S").toUpperCase(),
          profilePhoto: found.profilePhoto || found.photoUrl || ""
        };
      }
    }

    // Default fallback
    const isStudentReg = /^\d{12}$/.test(clean);
    return {
      id: identifier,
      identifier: identifier,
      name: (convFallback && convFallback.studentName) ? convFallback.studentName : (isStudentReg ? `Student (${identifier})` : identifier),
      role: isStudentReg ? "STUDENT" : "STAFF",
      department: "Computer Science & Engineering",
      section: isStudentReg ? "CSE" : "",
      avatar: (identifier.charAt(0) || "U").toUpperCase()
    };
  },

  // ------------------ Initialization & Lifecycle ------------------
  async init(user) {
    if (user) this.currentUser = user;
    if (!this.currentUser) this.currentUser = window.Auth ? Auth.getUser() : null;
    if (!this.currentUser) {
      console.warn("[ChatApp] Session not ready yet, skipping init.");
      return;
    }

    this.setupEmojiGrid();
    this.setupAutoExpandingTextarea();
    await this.loadConversations();
    this.startGlobalPoll();
  },

  stopPolling() {
    if (this.pollTimer) clearInterval(this.pollTimer);
    if (this.typingPollTimer) clearInterval(this.typingPollTimer);
    this.pollTimer = null;
    this.typingPollTimer = null;
  },

  switchTab(tab) {
    if (tab === 'unread') {
      this.setFilter('unread');
    } else {
      this.setFilter('all');
    }
  },

  refreshChatBadge() {
    this.updateUnreadBadges();
  },

  updateRequestBadges() {
    this.updateUnreadBadges();
  },

  startGlobalPoll() {
    if (this.pollTimer) clearInterval(this.pollTimer);
    this.pollTimer = setInterval(async () => {
      // If messages tab is visible, refresh conversations and active messages
      const chatView = document.getElementById('chatView');
      if (chatView && chatView.style.display !== 'none') {
        await this.loadConversations(true);
        if (this.activeConversation) {
          await this.loadMessages(this.activeConversation.id, true);
          await this.pollTypingStatus();
        }
      }
    }, 2800);
  },

  // ------------------ Conversation List Management ------------------
  async loadConversations(isSilent = false) {
    try {
      const res = await fetch('/api/chat/conversations', {
        headers: this.getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        this.conversations = Array.isArray(data) ? data : [];
        this.renderConversations();
        this.updateUnreadBadges();
      }
    } catch (err) {
      if (!isSilent) console.error("[ChatApp] Error loading conversations:", err);
    }
  },

  setFilter(filter) {
    this.currentFilter = filter;
    const pills = document.querySelectorAll('.chat-filter-pill');
    pills.forEach(pill => {
      if (pill.dataset.filter === filter) {
        pill.classList.add('active');
      } else {
        pill.classList.remove('active');
      }
    });
    this.renderConversations();
  },

  filterConversations(query) {
    this.searchQuery = (query || '').toLowerCase().trim();
    const clearBtn = document.getElementById('chatSearchClearBtn');
    if (clearBtn) {
      clearBtn.style.display = this.searchQuery ? 'inline-flex' : 'none';
    }
    this.renderConversations();
  },

  clearSearch() {
    const input = document.getElementById('chatSearchInput');
    if (input) input.value = '';
    this.filterConversations('');
  },

  updateUnreadBadges() {
    let unreadCount = 0;
    const curId = this.getCurrentUserId();
    for (const c of this.conversations) {
      const isStudentSide = (c.studentRegNo && c.studentRegNo.toLowerCase() === curId);
      const unread = isStudentSide ? (c.unreadCountStudent || 0) : (c.unreadCountStaff || 0);
      unreadCount += unread;
    }

    const unreadPillCount = document.getElementById('chatUnreadFilterCount');
    if (unreadPillCount) {
      if (unreadCount > 0) {
        unreadPillCount.textContent = unreadCount;
        unreadPillCount.style.display = 'inline-block';
      } else {
        unreadPillCount.style.display = 'none';
      }
    }

    const navBadge = document.getElementById('messagesNavBadge');
    if (navBadge) {
      if (unreadCount > 0) {
        navBadge.textContent = unreadCount;
        navBadge.style.display = 'inline-flex';
      } else {
        navBadge.style.display = 'none';
      }
    }
  },

  renderConversations() {
    const container = document.getElementById('chatConversationsList');
    if (!container) return;

    const curId = this.getCurrentUserId();
    const pinnedSet = this.getPinnedIds();

    let list = this.conversations.filter(c => {
      // 1. Filter by category pill
      if (this.currentFilter === 'unread') {
        const isStudentSide = (c.studentRegNo && c.studentRegNo.toLowerCase() === curId);
        const unread = isStudentSide ? (c.unreadCountStudent || 0) : (c.unreadCountStaff || 0);
        if (unread <= 0) return false;
      } else if (this.currentFilter === 'pinned') {
        if (!pinnedSet.has(c.id)) return false;
      } else if (this.currentFilter === 'staff') {
        const recip = this.getConversationRecipient(c, this.currentUser);
        if (!recip || recip.role === 'STUDENT') return false;
      } else if (this.currentFilter === 'students') {
        const recip = this.getConversationRecipient(c, this.currentUser);
        if (!recip || recip.role !== 'STUDENT') return false;
      }

      // 2. Filter by search input
      if (this.searchQuery) {
        const recip = this.getConversationRecipient(c, this.currentUser);
        const name = (recip ? recip.name : '').toLowerCase();
        const id = (recip ? recip.identifier : '').toLowerCase();
        const lastMsg = (c.lastMessage || '').toLowerCase();
        const dept = (recip && recip.department ? recip.department : '').toLowerCase();
        return name.includes(this.searchQuery) || id.includes(this.searchQuery) || lastMsg.includes(this.searchQuery) || dept.includes(this.searchQuery);
      }
      return true;
    });

    // Sort: Pinned first, then by updatedAt descending
    list.sort((a, b) => {
      const pinA = pinnedSet.has(a.id) ? 1 : 0;
      const pinB = pinnedSet.has(b.id) ? 1 : 0;
      if (pinA !== pinB) return pinB - pinA;
      return (b.updatedAt || 0) - (a.updatedAt || 0);
    });

    if (list.length === 0) {
      container.innerHTML = `
        <div class="chat-empty-list" style="padding:40px 20px; text-align:center; color:#94a3b8;">
          <div style="font-size:32px; margin-bottom:8px;">💬</div>
          <div style="font-weight:600; font-size:13px; color:#475569;">No conversations found</div>
          <p style="font-size:11.5px; margin:4px 0 14px 0;">Start a direct institutional conversation with any student or staff member.</p>
          <button type="button" class="btn btn-sm btn-outline-primary" onclick="ChatApp.openNewChatModal()">➕ New Chat</button>
        </div>
      `;
      return;
    }

    container.innerHTML = list.map(c => {
      const recip = this.getConversationRecipient(c, this.currentUser);
      const isSelected = this.activeConversation && (this.activeConversation.id === c.id);
      const isPinned = pinnedSet.has(c.id);
      const isMuted = this.isConversationMuted(c.id);

      const isStudentSide = (c.studentRegNo && c.studentRegNo.toLowerCase() === curId);
      const unread = isStudentSide ? (c.unreadCountStudent || 0) : (c.unreadCountStaff || 0);

      const timeText = this.formatConversationTime(c.updatedAt || c.lastMessageTime);
      const lastMsgText = this.truncateText(c.lastMessage || "No messages yet", 45);

      const roleBadge = recip && recip.role ? this.getRoleBadgeHtml(recip.role) : '';

      return `
        <div class="chat-conv-item ${isSelected ? 'active' : ''} ${unread > 0 ? 'unread' : ''}" 
             onclick="ChatApp.selectConversation('${c.id}')"
             data-id="${c.id}">
          <div class="chat-conv-avatar">
            ${(recip && (recip.profilePhoto || recip.photoUrl)) ? `<img src="${recip.profilePhoto || recip.photoUrl}" alt="Avatar" class="chat-conv-avatar-img">` : (recip ? recip.avatar : 'U')}
            <span class="online-indicator"></span>
          </div>
          <div class="chat-conv-content">
            <div class="chat-conv-top">
              <div class="chat-conv-name-wrap">
                <span class="chat-conv-name">${this.escapeHtml(recip ? recip.name : 'Direct Channel')}</span>
                ${roleBadge}
              </div>
              <span class="chat-conv-time">${timeText}</span>
            </div>
            <div class="chat-conv-bottom">
              <span class="chat-conv-snippet">${this.escapeHtml(lastMsgText)}</span>
              <div class="chat-conv-meta-badges">
                ${isPinned ? '<span class="pinned-badge" title="Pinned">📌</span>' : ''}
                ${isMuted ? '<span class="muted-badge" title="Muted">🔕</span>' : ''}
                ${unread > 0 ? `<span class="unread-pill">${unread}</span>` : ''}
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');
  },

  // ------------------ Active Conversation Selection & Room Setup ------------------
  async selectConversation(convId) {
    if (!convId) return;

    let conv = this.conversations.find(c => c.id === convId);
    if (!conv) {
      try {
        const res = await fetch('/api/chat/conversations', {
          headers: this.getAuthHeaders()
        });
        if (res.ok) {
          const list = await res.json();
          this.conversations = Array.isArray(list) ? list : [];
          conv = this.conversations.find(c => c.id === convId);
        }
      } catch (e) {}
    }

    if (!conv) {
      conv = { id: convId, participants: [] };
    }

    this.activeConversation = conv;
    this.activeRecipient = this.getConversationRecipient(conv, this.currentUser);

    // Mobile layout toggle
    const sidebar = document.querySelector('.chat-sidebar');
    if (sidebar && window.innerWidth <= 768) {
      sidebar.classList.add('mobile-hidden');
    }

    // Toggle main view panes
    const emptyState = document.getElementById('chatEmptyState');
    const activePane = document.getElementById('chatActivePane');
    if (emptyState) emptyState.style.display = 'none';
    if (activePane) activePane.style.display = 'flex';

    this.renderHeader();
    this.renderConversations();
    this.updateActiveChatPinIndicator();
    this.renderProfilePanel();

    await this.loadMessages(conv.id);
    this.markAsRead(conv.id);
  },

  closeActiveConversationMobile() {
    const sidebar = document.querySelector('.chat-sidebar');
    if (sidebar) sidebar.classList.remove('mobile-hidden');
    const activePane = document.getElementById('chatActivePane');
    const emptyState = document.getElementById('chatEmptyState');
    if (activePane) activePane.style.display = 'none';
    if (emptyState) emptyState.style.display = 'flex';
    this.activeConversation = null;
  },

  renderHeader() {
    const recip = this.activeRecipient;
    if (!recip) return;

    const avatarEl = document.getElementById('activeChatAvatar');
    const nameEl = document.getElementById('activeChatName');
    const roleEl = document.getElementById('activeChatRoleBadge');
    const subEl = document.getElementById('activeChatSub');

    if (avatarEl) {
      const p = recip.profilePhoto || recip.photoUrl;
      if (p) {
        avatarEl.innerHTML = `<img src="${p}" alt="${recip.name || 'User'}" class="topbar-avatar-img" style="width:100%; height:100%; object-fit:cover; border-radius:50%; display:block;">`;
      } else {
        avatarEl.textContent = recip.avatar || 'U';
      }
    }
    if (nameEl) nameEl.textContent = recip.name || 'Direct Channel';
    if (roleEl) {
      roleEl.textContent = recip.role || 'Member';
      roleEl.className = 'badge-tag ' + this.getRoleBadgeClass(recip.role);
    }
    if (subEl) {
      const details = [recip.department, recip.section, recip.academicYear].filter(Boolean).join(' • ');
      subEl.textContent = details || 'Institutional Communication Channel';
    }
  },

  async markAsRead(convId) {
    if (!convId) return;
    try {
      await fetch(`/api/chat/conversations/${encodeURIComponent(convId)}/read`, {
        method: 'POST',
        headers: this.getAuthHeaders({ 'Content-Type': 'application/json' })
      });
      // Locally clear unread count for current user
      const curId = this.getCurrentUserId();
      const conv = this.conversations.find(c => c.id === convId);
      if (conv) {
        if (conv.studentRegNo && conv.studentRegNo.toLowerCase() === curId) {
          conv.unreadCountStudent = 0;
        } else {
          conv.unreadCountStaff = 0;
        }
      }
      this.updateUnreadBadges();
      this.renderConversations();
    } catch (e) {}
  },

  // ------------------ Message Stream Loading & Rendering ------------------
  async loadMessages(convId, isPolling = false) {
    if (!convId) return;
    if (this.isLoadingMessages && !isPolling) return;
    this.isLoadingMessages = true;

    try {
      const res = await fetch(`/api/chat/conversations/${encodeURIComponent(convId)}/messages`, {
        headers: this.getAuthHeaders()
      });
      if (res.ok) {
        const msgs = await res.json();
        const prevCount = this.messages ? this.messages.length : 0;
        this.messages = Array.isArray(msgs) ? msgs : [];

        // Check if user is scrolled to bottom
        const area = document.getElementById('chatMessagesArea');
        const isNearBottom = area ? (area.scrollHeight - area.scrollTop - area.clientHeight < 120) : true;

        this.renderMessages();

        if (!isPolling || isNearBottom || this.messages.length > prevCount) {
          if (isNearBottom) {
            this.scrollToBottom();
          } else if (this.messages.length > prevCount) {
            this.showNewMessagePill();
          }
        }
      }
    } catch (err) {
      if (!isPolling) console.error("[ChatApp] Error loading messages:", err);
    } finally {
      this.isLoadingMessages = false;
    }
  },

  renderMessages() {
    const area = document.getElementById('chatMessagesArea');
    if (!area) return;

    if (!this.messages || this.messages.length === 0) {
      area.innerHTML = `
        <div class="chat-room-welcome">
          <div class="welcome-shield">🛡️</div>
          <h4>Verified Institutional Direct Channel</h4>
          <p>Messages exchanged in this channel are encrypted and archived under EPOCH institutional compliance governance. Type a message or send an attachment below to start communicating.</p>
        </div>
      `;
      return;
    }

    const curId = this.getCurrentUserId();
    let lastDateStr = null;
    let html = '';

    for (let i = 0; i < this.messages.length; i++) {
      const msg = this.messages[i];
      const isOutgoing = (msg.senderId && msg.senderId.toLowerCase() === curId);

      // 1. Date Separator Check
      const msgDateStr = this.extractDateLabel(msg.createdAt || msg.timestamp);
      if (msgDateStr !== lastDateStr) {
        html += `
          <div class="chat-date-separator">
            <span class="chat-date-pill">${msgDateStr}</span>
          </div>
        `;
        lastDateStr = msgDateStr;
      }

      // 2. Render Message Bubble
      html += this.renderMessageBubble(msg, isOutgoing);
    }

    area.innerHTML = html;
  },

  renderMessageBubble(msg, isOutgoing) {
    const isDeleted = Boolean(msg.deleted || msg.isDeleted);
    const bubbleClass = isOutgoing ? 'outgoing' : 'incoming';
    const timeFormatted = this.formatMessageTime(msg.createdAt || msg.timestamp);

    // If message is deleted, render tombstone bubble
    if (isDeleted) {
      return `
        <div class="chat-message-row ${bubbleClass}" id="msg-row-${msg.id}">
          <div class="chat-bubble ${bubbleClass} deleted-message">
            <div class="chat-message-text">🚫 This message was deleted</div>
            <div class="chat-bubble-footer">
              <span class="chat-bubble-time">${timeFormatted}</span>
            </div>
          </div>
        </div>
      `;
    }

    // Quoted reply snippet
    let replyQuoteHtml = '';
    if (msg.replyToText) {
      replyQuoteHtml = `
        <div class="bubble-reply-preview" onclick="ChatApp.scrollToMessage('${msg.replyToId}')" title="Jump to quoted message">
          <div class="reply-line"></div>
          <div class="reply-body">
            <strong class="reply-sender">${this.escapeHtml(msg.replyToSender || 'Quoted Message')}</strong>
            <span class="reply-text">${this.escapeHtml(this.truncateText(msg.replyToText, 80))}</span>
          </div>
        </div>
      `;
    }

    // Media & Attachments
    let attachmentHtml = '';
    if (msg.attachmentUrl) {
      const isImage = msg.attachmentType && msg.attachmentType.startsWith('image/');
      const isAudio = msg.attachmentType && msg.attachmentType.startsWith('audio/');

      if (isImage) {
        attachmentHtml = `
          <div class="bubble-image-wrap" onclick="ChatApp.openImageModal('${msg.attachmentUrl}', '${this.escapeHtml(msg.attachmentName || '')}')">
            <img src="${msg.attachmentUrl}" alt="${this.escapeHtml(msg.attachmentName || 'Image')}" class="bubble-thumbnail-img" loading="lazy" />
          </div>
        `;
      } else if (isAudio) {
        attachmentHtml = this.renderAudioPlayerHtml(msg);
      } else {
        attachmentHtml = `
          <a href="${msg.attachmentUrl}" download="${this.escapeHtml(msg.attachmentName || 'document')}" class="bubble-doc-card" target="_blank" rel="noopener">
            <div class="doc-icon">📄</div>
            <div class="doc-info">
              <div class="doc-name">${this.escapeHtml(msg.attachmentName || 'Document')}</div>
              <div class="doc-size">${this.formatFileSize(msg.attachmentSize)} • Click to download</div>
            </div>
            <div class="doc-download-icon">⬇️</div>
          </a>
        `;
      }
    }

    // Text Content (auto-link URLs, format line breaks)
    let textHtml = '';
    if (msg.content && !msg.content.startsWith('🎙️ Voice message')) {
      const formatted = this.formatMessageText(msg.content);
      textHtml = `<div class="chat-message-text">${formatted}</div>`;
    }

    // Status ticks for outgoing messages
    let statusTick = '';
    if (isOutgoing) {
      if (msg.read || msg.status === 'READ') {
        statusTick = '<span class="chat-msg-tick read" title="Read by recipient">✓✓</span>';
      } else if (msg.delivered || msg.status === 'DELIVERED') {
        statusTick = '<span class="chat-msg-tick delivered" title="Delivered">✓✓</span>';
      } else {
        statusTick = '<span class="chat-msg-tick sent" title="Sent">✓</span>';
      }
    }

    // Hover Action Bar: Reply, Copy, Delete
    const actionsHtml = `
      <div class="chat-message-actions">
        <button type="button" class="chat-action-btn" onclick="ChatApp.startReply('${msg.id}')" title="Reply">↩</button>
        <button type="button" class="chat-action-btn" onclick="ChatApp.copyMessageText('${msg.id}')" title="Copy text">📋</button>
        ${isOutgoing ? `<button type="button" class="chat-action-btn delete-btn" onclick="ChatApp.confirmDeleteMessage('${msg.id}')" title="Delete for everyone">🗑️</button>` : ''}
      </div>
    `;

    return `
      <div class="chat-message-row ${bubbleClass}" id="msg-row-${msg.id}">
        ${actionsHtml}
        <div class="chat-bubble ${bubbleClass}">
          ${replyQuoteHtml}
          ${attachmentHtml}
          ${textHtml}
          <div class="chat-bubble-footer">
            <span class="chat-bubble-time">${timeFormatted}</span>
            ${statusTick}
          </div>
        </div>
      </div>
    `;
  },

  renderAudioPlayerHtml(msg) {
    const audioId = `audio-${msg.id}`;
    return `
      <div class="chat-audio-player" id="player-${msg.id}">
        <button type="button" class="chat-audio-btn" id="btn-${audioId}" onclick="ChatApp.toggleAudioPlayback('${audioId}', '${msg.attachmentUrl}')" title="Play voice message">
          ▶
        </button>
        <div class="chat-audio-timeline">
          <div class="chat-audio-progress-wrap" onclick="ChatApp.seekAudio(event, '${audioId}')">
            <div class="chat-audio-progress-bar" id="prog-${audioId}"></div>
          </div>
          <div class="chat-audio-time-row">
            <span id="time-${audioId}">0:00</span>
            <span>🎙️ Voice Note</span>
          </div>
        </div>
        <audio id="${audioId}" src="${msg.attachmentUrl}" preload="metadata" onended="ChatApp.handleAudioEnded('${audioId}')" ontimeupdate="ChatApp.handleAudioTimeUpdate('${audioId}')"></audio>
      </div>
    `;
  },

  // ------------------ Inline Audio Player Engine ------------------
  toggleAudioPlayback(audioId, url) {
    const audio = document.getElementById(audioId);
    const btn = document.getElementById(`btn-${audioId}`);
    if (!audio || !btn) return;

    if (this.currentlyPlayingAudio && this.currentlyPlayingAudio !== audio) {
      this.currentlyPlayingAudio.pause();
      const prevBtn = document.getElementById(`btn-${this.currentlyPlayingId}`);
      if (prevBtn) prevBtn.textContent = '▶';
    }

    if (audio.paused) {
      audio.play().then(() => {
        btn.textContent = '⏸';
        this.currentlyPlayingAudio = audio;
        this.currentlyPlayingId = audioId;
      }).catch(err => {
        console.error("[ChatApp] Audio play error:", err);
      });
    } else {
      audio.pause();
      btn.textContent = '▶';
    }
  },

  handleAudioTimeUpdate(audioId) {
    const audio = document.getElementById(audioId);
    const prog = document.getElementById(`prog-${audioId}`);
    const timeEl = document.getElementById(`time-${audioId}`);
    if (!audio || !prog || !timeEl) return;

    const cur = audio.currentTime || 0;
    const dur = audio.duration || 1;
    const pct = Math.min(100, Math.max(0, (cur / dur) * 100));
    prog.style.width = pct + '%';

    const mins = Math.floor(cur / 60);
    const secs = Math.floor(cur % 60).toString().padStart(2, '0');
    timeEl.textContent = `${mins}:${secs}`;
  },

  handleAudioEnded(audioId) {
    const btn = document.getElementById(`btn-${audioId}`);
    const prog = document.getElementById(`prog-${audioId}`);
    const timeEl = document.getElementById(`time-${audioId}`);
    if (btn) btn.textContent = '▶';
    if (prog) prog.style.width = '0%';
    if (timeEl) timeEl.textContent = '0:00';
    if (this.currentlyPlayingAudio && this.currentlyPlayingAudio.id === audioId) {
      this.currentlyPlayingAudio = null;
      this.currentlyPlayingId = null;
    }
  },

  seekAudio(event, audioId) {
    const audio = document.getElementById(audioId);
    if (!audio || !audio.duration) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const pct = clickX / rect.width;
    audio.currentTime = pct * audio.duration;
  },

  // ------------------ Sending Messages ------------------
  async handleSendMessage(event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    if (this.isSending) {
      console.warn("[ChatApp] Message send already in progress.");
      return false;
    }

    if (!this.activeConversation || !this.activeConversation.id) {
      if (window.Toast) Toast.show("Please select an active conversation first.", "warning");
      return false;
    }

    const input = document.getElementById('chatMessageInput');
    const content = input ? input.value.trim() : '';

    if (!content && !this.pendingAttachment) {
      if (input) input.focus();
      return false;
    }

    this.isSending = true;
    const sendBtn = document.getElementById('chatSendBtn');
    if (sendBtn) {
      sendBtn.disabled = true;
      sendBtn.style.opacity = '0.6';
    }

    const convId = this.activeConversation.id;
    const curId = this.getCurrentUserId();
    const recipId = this.activeRecipient ? this.activeRecipient.identifier : '';

    const payload = {
      content: content,
      recipientId: recipId,
      replyToId: this.replyingTo ? this.replyingTo.id : null,
      replyToSender: this.replyingTo ? this.replyingTo.senderName : null,
      replyToText: this.replyingTo ? this.replyingTo.text : null,
      attachmentUrl: this.pendingAttachment ? this.pendingAttachment.dataUrl : null,
      attachmentName: this.pendingAttachment ? this.pendingAttachment.name : null,
      attachmentType: this.pendingAttachment ? this.pendingAttachment.type : null,
      attachmentSize: this.pendingAttachment ? this.pendingAttachment.size : null
    };

    // Optimistic UI Append
    const tempId = 'temp-' + Date.now();
    const optimisticMsg = {
      id: tempId,
      conversationId: convId,
      senderId: curId,
      senderName: this.currentUser ? this.currentUser.name : 'You',
      content: content,
      createdAt: Date.now(),
      status: 'SENDING',
      ...payload
    };
    this.messages.push(optimisticMsg);
    this.renderMessages();
    this.scrollToBottom();

    // Reset composer inputs immediately
    if (input) {
      input.value = '';
      input.style.height = 'auto';
    }
    this.cancelReply();
    this.cancelAttachment();
    this.broadcastTyping(false);

    try {
      const res = await fetch(`/api/chat/conversations/${encodeURIComponent(convId)}/messages`, {
        method: 'POST',
        headers: this.getAuthHeaders({
          'Content-Type': 'application/json'
        }),
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Failed to send (HTTP ${res.status})`);
      }

      const confirmedMsg = await res.json();
      // Replace optimistic message with confirmed
      const idx = this.messages.findIndex(m => m.id === tempId);
      if (idx !== -1) {
        this.messages[idx] = confirmedMsg;
      } else {
        this.messages.push(confirmedMsg);
      }
      this.renderMessages();
      this.scrollToBottom();

      // Refresh conversation list preview
      await this.loadConversations(true);
    } catch (err) {
      console.error("[ChatApp] Send failed:", err);
      if (window.Toast) Toast.show(err.message || "Message delivery failed. Please retry.", "error");
      const idx = this.messages.findIndex(m => m.id === tempId);
      if (idx !== -1) {
        this.messages[idx].status = 'FAILED';
        this.renderMessages();
      }
    } finally {
      this.isSending = false;
      if (sendBtn) {
        sendBtn.disabled = false;
        sendBtn.style.opacity = '1';
      }
      if (input) input.focus();
    }
    return false;
  },

  handleInputKeydown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      this.handleSendMessage(e);
    }
  },

  handleInputChange() {
    this.broadcastTyping(true);
    if (this.typingTimeout) clearTimeout(this.typingTimeout);
    this.typingTimeout = setTimeout(() => {
      this.broadcastTyping(false);
    }, 2500);
  },

  // ------------------ Voice Recording Module ------------------
  async toggleVoiceRecording() {
    if (this.isVoiceRecording) {
      this.sendVoiceRecording();
      return;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      if (window.Toast) Toast.show("Audio recording is not supported in this browser.", "warning");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.voiceAudioChunks = [];
      const options = { mimeType: 'audio/webm' };
      if (!MediaRecorder.isTypeSupported('audio/webm')) {
        delete options.mimeType;
      }

      this.voiceMediaRecorder = new MediaRecorder(stream, options);
      this.voiceMediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          this.voiceAudioChunks.push(e.data);
        }
      };

      this.voiceMediaRecorder.start();
      this.isVoiceRecording = true;
      this.voiceSeconds = 0;

      // Show recording UI
      const recBar = document.getElementById('chatVoiceRecordingBar');
      const timerEl = document.getElementById('chatVoiceTimer');
      if (recBar) recBar.style.display = 'flex';
      if (timerEl) timerEl.textContent = '0:00';

      this.voiceTimerInterval = setInterval(() => {
        this.voiceSeconds++;
        const mins = Math.floor(this.voiceSeconds / 60);
        const secs = (this.voiceSeconds % 60).toString().padStart(2, '0');
        if (timerEl) timerEl.textContent = `${mins}:${secs}`;
      }, 1000);
    } catch (err) {
      console.error("[ChatApp] Microphone access denied:", err);
      if (window.Toast) Toast.show("Microphone permission required for voice notes.", "warning");
    }
  },

  cancelVoiceRecording() {
    if (this.voiceMediaRecorder && this.voiceMediaRecorder.state !== 'inactive') {
      this.voiceMediaRecorder.stop();
      this.voiceMediaRecorder.stream.getTracks().forEach(track => track.stop());
    }
    if (this.voiceTimerInterval) clearInterval(this.voiceTimerInterval);
    this.isVoiceRecording = false;
    this.voiceAudioChunks = [];

    const recBar = document.getElementById('chatVoiceRecordingBar');
    if (recBar) recBar.style.display = 'none';
  },

  async sendVoiceRecording() {
    if (!this.voiceMediaRecorder) return;

    if (this.voiceTimerInterval) clearInterval(this.voiceTimerInterval);
    const recordedSecs = this.voiceSeconds;

    this.voiceMediaRecorder.onstop = async () => {
      this.voiceMediaRecorder.stream.getTracks().forEach(track => track.stop());
      const mime = this.voiceMediaRecorder.mimeType || 'audio/webm';
      const audioBlob = new Blob(this.voiceAudioChunks, { type: mime });

      if (audioBlob.size < 500) {
        if (window.Toast) Toast.show("Voice note too short.", "info");
        this.cancelVoiceRecording();
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Data = reader.result;
        this.pendingAttachment = {
          dataUrl: base64Data,
          name: `Voice Note (${recordedSecs}s)`,
          type: mime,
          size: audioBlob.size
        };
        const input = document.getElementById('chatMessageInput');
        if (input) input.value = `🎙️ Voice message (${recordedSecs}s)`;
        this.handleSendMessage();
      };
      reader.readAsDataURL(audioBlob);

      this.isVoiceRecording = false;
      const recBar = document.getElementById('chatVoiceRecordingBar');
      if (recBar) recBar.style.display = 'none';
    };

    if (this.voiceMediaRecorder.state !== 'inactive') {
      this.voiceMediaRecorder.stop();
    }
  },

  // ------------------ Message Deletion / Unsend ------------------
  async confirmDeleteMessage(messageId) {
    if (!messageId) return;
    const confirm = window.confirm("Delete this message for everyone in this institutional channel?");
    if (!confirm) return;

    if (!this.activeConversation || !this.activeConversation.id) return;
    const convId = this.activeConversation.id;

    try {
      const res = await fetch(`/api/chat/conversations/${encodeURIComponent(convId)}/messages/${encodeURIComponent(messageId)}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      });
      if (res.ok) {
        // Locally mark as deleted
        const msg = this.messages.find(m => m.id === messageId);
        if (msg) {
          msg.deleted = true;
          msg.content = "This message was deleted";
          msg.attachmentUrl = null;
        }
        this.renderMessages();
        if (window.Toast) Toast.show("Message deleted for everyone 🗑️", "info");
      } else {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to delete message");
      }
    } catch (e) {
      if (window.Toast) Toast.show(e.message || "Deletion failed", "error");
    }
  },

  // ------------------ Quoted Replies ------------------
  startReply(messageId) {
    const msg = this.messages.find(m => m.id === messageId);
    if (!msg) return;

    this.replyingTo = {
      id: msg.id,
      senderName: msg.senderName || 'Contact',
      text: msg.content || (msg.attachmentName ? `📎 ${msg.attachmentName}` : 'Attachment')
    };

    const banner = document.getElementById('chatReplyBanner');
    const senderEl = document.getElementById('chatReplySender');
    const snippetEl = document.getElementById('chatReplySnippet');

    if (banner && senderEl && snippetEl) {
      senderEl.textContent = this.replyingTo.senderName;
      snippetEl.textContent = this.truncateText(this.replyingTo.text, 90);
      banner.style.display = 'flex';
    }

    const input = document.getElementById('chatMessageInput');
    if (input) input.focus();
  },

  cancelReply() {
    this.replyingTo = null;
    const banner = document.getElementById('chatReplyBanner');
    if (banner) banner.style.display = 'none';
  },

  scrollToMessage(messageId) {
    if (!messageId) return;
    const row = document.getElementById(`msg-row-${messageId}`);
    if (row) {
      row.scrollIntoView({ behavior: 'smooth', block: 'center' });
      row.classList.add('highlight-target');
      setTimeout(() => row.classList.remove('highlight-target'), 2000);
    }
  },

  // ------------------ Attachments & Lightbox ------------------
  triggerFileInput() {
    const fileInput = document.getElementById('chatFileInput');
    if (fileInput) fileInput.click();
  },

  handleFileSelected(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      if (window.Toast) Toast.show("Attachment must be smaller than 10MB.", "warning");
      event.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      this.pendingAttachment = {
        dataUrl: e.target.result,
        name: file.name,
        type: file.type || 'application/octet-stream',
        size: file.size
      };

      const banner = document.getElementById('chatAttachmentBanner');
      const nameEl = document.getElementById('chatAttachName');
      const sizeEl = document.getElementById('chatAttachSize');
      const iconEl = document.getElementById('chatAttachIcon');

      if (banner && nameEl && sizeEl) {
        nameEl.textContent = file.name;
        sizeEl.textContent = `(${this.formatFileSize(file.size)})`;
        if (iconEl) iconEl.textContent = file.type.startsWith('image/') ? '🖼️' : '📄';
        banner.style.display = 'flex';
      }

      const input = document.getElementById('chatMessageInput');
      if (input) input.focus();
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  },

  cancelAttachment() {
    this.pendingAttachment = null;
    const banner = document.getElementById('chatAttachmentBanner');
    if (banner) banner.style.display = 'none';
  },

  openImageModal(imgSrc, caption) {
    const modal = document.getElementById('chatImageModal');
    const img = document.getElementById('chatModalImage');
    const capEl = document.getElementById('chatModalCaption');
    const dlBtn = document.getElementById('chatImageModalDownload');

    if (modal && img) {
      img.src = imgSrc;
      if (capEl) capEl.textContent = decodeURIComponent(caption || '');
      if (dlBtn) dlBtn.href = imgSrc;
      modal.style.display = 'flex';
    }
  },

  closeImageModal() {
    const modal = document.getElementById('chatImageModal');
    if (modal) modal.style.display = 'none';
  },

  // ------------------ Typing Indicator Broadcast & Polling ------------------
  async broadcastTyping(isTyping) {
    if (!this.activeConversation || !this.activeConversation.id) return;
    if (this.isTypingBroadcasted === isTyping) return;
    this.isTypingBroadcasted = isTyping;

    try {
      await fetch(`/api/chat/conversations/${encodeURIComponent(this.activeConversation.id)}/typing`, {
        method: 'POST',
        headers: this.getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ isTyping: isTyping })
      });
    } catch (e) {}
  },

  async pollTypingStatus() {
    if (!this.activeConversation || !this.activeConversation.id) return;
    try {
      const res = await fetch(`/api/chat/conversations/${encodeURIComponent(this.activeConversation.id)}/typing`, {
        headers: this.getAuthHeaders()
      });
      if (res.ok) {
        const typers = await res.json();
        const indicator = document.getElementById('chatTypingIndicator');
        const textEl = document.getElementById('chatTypingText');
        const subEl = document.getElementById('activeChatSub');

        if (Array.isArray(typers) && typers.length > 0) {
          const names = typers.map(t => t.name).join(', ');
          if (indicator && textEl) {
            textEl.textContent = `${names} is typing...`;
            indicator.style.display = 'flex';
          }
          if (subEl) subEl.textContent = 'Typing... 💬';
        } else {
          if (indicator) indicator.style.display = 'none';
          if (subEl && this.activeRecipient) {
            const details = [this.activeRecipient.department, this.activeRecipient.section].filter(Boolean).join(' • ');
            subEl.textContent = details || 'Institutional Channel';
          }
        }
      }
    } catch (e) {}
  },

  // ------------------ In-Conversation Search ------------------
  toggleSearchInChat() {
    const wrap = document.getElementById('chatInConvSearchWrap');
    if (!wrap) return;
    const isVisible = wrap.style.display === 'flex';
    wrap.style.display = isVisible ? 'none' : 'flex';
    if (!isVisible) {
      const input = document.getElementById('chatInConvSearchInput');
      if (input) {
        input.value = '';
        input.focus();
      }
      this.handleSearchInChat('');
    }
  },

  closeSearchInChat() {
    const wrap = document.getElementById('chatInConvSearchWrap');
    if (wrap) wrap.style.display = 'none';
    this.handleSearchInChat('');
  },

  handleSearchInChat(query) {
    this.inConvSearchQuery = (query || '').toLowerCase().trim();
    const matchCountEl = document.getElementById('chatInConvMatchCount');

    // Remove old highlights
    const oldMarks = document.querySelectorAll('.chat-search-highlight');
    oldMarks.forEach(m => {
      const parent = m.parentNode;
      parent.replaceChild(document.createTextNode(m.textContent), m);
      parent.normalize();
    });

    if (!this.inConvSearchQuery) {
      if (matchCountEl) matchCountEl.textContent = '';
      return;
    }

    let matchCount = 0;
    let firstMatchRow = null;
    const bubbleTexts = document.querySelectorAll('.chat-bubble .chat-message-text');

    bubbleTexts.forEach(el => {
      const text = el.textContent;
      if (text.toLowerCase().includes(this.inConvSearchQuery)) {
        matchCount++;
        if (!firstMatchRow) firstMatchRow = el.closest('.chat-message-row');

        const regex = new RegExp(`(${this.escapeRegex(this.inConvSearchQuery)})`, 'gi');
        el.innerHTML = this.escapeHtml(text).replace(regex, '<mark class="chat-search-highlight" style="background:#fef08a; padding:1px 3px; border-radius:3px;">$1</mark>');
      }
    });

    if (matchCountEl) {
      matchCountEl.textContent = matchCount === 0 ? 'No matches' : `${matchCount} found`;
    }
    if (firstMatchRow) {
      firstMatchRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  },

  // ------------------ Scroll-to-Bottom Button & Pill ------------------
  scrollToBottom(smooth = false) {
    const area = document.getElementById('chatMessagesArea');
    if (!area) return;
    area.scrollTo({
      top: area.scrollHeight,
      behavior: smooth ? 'smooth' : 'auto'
    });
    this.hideNewMessagePill();
  },

  showNewMessagePill() {
    const btn = document.getElementById('chatScrollBottomBtn');
    const pill = document.getElementById('chatNewMsgPill');
    if (btn) btn.style.display = 'flex';
    if (pill) pill.style.display = 'inline-block';
  },

  hideNewMessagePill() {
    const btn = document.getElementById('chatScrollBottomBtn');
    const pill = document.getElementById('chatNewMsgPill');
    if (btn) btn.style.display = 'none';
    if (pill) pill.style.display = 'none';
  },

  // ------------------ Emoji Picker ------------------
  setupEmojiGrid() {
    const grid = document.getElementById('chatEmojiGrid');
    if (!grid) return;
    const commonEmojis = [
      '👍', '🙏', '😊', '👏', '✅', '🎓', '📚', '🤝', '💡', '🔥',
      '💯', '✨', '🎯', '📌', '🎉', '😃', '🙌', '👌', '⭐', '🚀'
    ];
    grid.innerHTML = commonEmojis.map(emo => `
      <button type="button" class="emoji-cell-btn" onclick="ChatApp.insertEmoji('${emo}')">${emo}</button>
    `).join('');
  },

  toggleEmojiPicker(forceState) {
    const picker = document.getElementById('chatEmojiPicker');
    if (!picker) return;
    const nextState = forceState !== undefined ? forceState : (picker.style.display === 'none');
    picker.style.display = nextState ? 'block' : 'none';
  },

  insertEmoji(emoji) {
    const input = document.getElementById('chatMessageInput');
    if (!input) return;
    const start = input.selectionStart || input.value.length;
    const end = input.selectionEnd || input.value.length;
    input.value = input.value.substring(0, start) + emoji + input.value.substring(end);
    input.selectionStart = input.selectionEnd = start + emoji.length;
    input.focus();
    this.handleInputChange();
  },

  // ------------------ Contact & Profile Details Panel ------------------
  toggleProfilePanel(forceState) {
    const panel = document.getElementById('chatProfilePanel');
    if (!panel) return;
    const nextState = forceState !== undefined ? forceState : (panel.style.display === 'none');
    panel.style.display = nextState ? 'flex' : 'none';
    this.isProfileOpen = nextState;
    if (nextState) this.renderProfilePanel();
  },

  renderProfilePanel() {
    const recip = this.activeRecipient;
    if (!recip) return;

    const avatarEl = document.getElementById('panelAvatar');
    const nameEl = document.getElementById('panelContactName');
    const roleEl = document.getElementById('panelRoleBadge');
    const idEl = document.getElementById('panelIdentifier');
    const deptEl = document.getElementById('panelDept');
    const secEl = document.getElementById('panelSection');
    const desEl = document.getElementById('panelDesignation');
    const convIdEl = document.getElementById('panelConvId');
    const countEl = document.getElementById('panelMsgCount');

    if (avatarEl) {
      const p = recip.profilePhoto || recip.photoUrl;
      if (p) {
        avatarEl.innerHTML = `<img src="${p}" alt="${recip.name || 'User'}" class="topbar-avatar-img" style="width:100%; height:100%; object-fit:cover; border-radius:50%; display:block;">`;
      } else {
        avatarEl.textContent = recip.avatar || 'U';
      }
    }
    if (nameEl) nameEl.textContent = recip.name || 'Academic Contact';
    if (roleEl) {
      roleEl.textContent = recip.role || 'Member';
      roleEl.className = 'badge-tag ' + this.getRoleBadgeClass(recip.role);
    }
    if (idEl) idEl.textContent = recip.identifier || '-';
    if (deptEl) deptEl.textContent = recip.department || 'Computer Science & Engineering';
    if (secEl) secEl.textContent = recip.section || '-';
    if (desEl) desEl.textContent = recip.academicYear || recip.role || 'Institution Member';
    if (convIdEl && this.activeConversation) convIdEl.textContent = this.activeConversation.id;
    if (countEl) countEl.textContent = this.messages ? this.messages.length : 0;

    // Pin & Mute Button States
    const pinText = document.getElementById('panelPinText');
    const muteText = document.getElementById('panelMuteText');
    const isPinned = this.activeConversation && this.isConversationPinned(this.activeConversation.id);
    const isMuted = this.activeConversation && this.isConversationMuted(this.activeConversation.id);

    if (pinText) pinText.textContent = isPinned ? 'Unpin Conversation' : 'Pin Conversation';
    if (muteText) muteText.textContent = isMuted ? 'Unmute Notifications' : 'Mute Notifications';
  },

  copyIdentifier() {
    if (this.activeRecipient && this.activeRecipient.identifier) {
      navigator.clipboard.writeText(this.activeRecipient.identifier);
      if (window.Toast) Toast.show("Identifier copied to clipboard 📋", "info");
    }
  },

  copyConvId() {
    if (this.activeConversation && this.activeConversation.id) {
      navigator.clipboard.writeText(this.activeConversation.id);
      if (window.Toast) Toast.show("Conversation ID copied 📋", "info");
    }
  },

  copyMessageText(messageId) {
    const msg = this.messages.find(m => m.id === messageId);
    if (msg && msg.content) {
      navigator.clipboard.writeText(msg.content);
      if (window.Toast) Toast.show("Message copied 📋", "info");
    }
  },

  // ------------------ Direct Directory & Instant Chat Creation ------------------
  openNewChatModal() {
    const modal = document.getElementById('newChatModal');
    if (!modal) return;
    modal.style.display = 'flex';
    this.directoryCategory = 'all';
    this.updateDirectoryCategoryTabs();
    this.loadDirectoryUsers();
  },

  closeNewChatModal() {
    const modal = document.getElementById('newChatModal');
    if (modal) modal.style.display = 'none';
  },

  switchContactCategory(category) {
    this.directoryCategory = category;
    this.updateDirectoryCategoryTabs();
    this.loadDirectoryUsers();
  },

  updateDirectoryCategoryTabs() {
    const allTab = document.getElementById('catTabAll');
    const staffTab = document.getElementById('catTabStaff');
    const studTab = document.getElementById('catTabStudents');

    if (allTab) allTab.className = 'new-chat-tab ' + (this.directoryCategory === 'all' ? 'active' : '');
    if (staffTab) staffTab.className = 'new-chat-tab ' + (this.directoryCategory === 'staff' ? 'active' : '');
    if (studTab) studTab.className = 'new-chat-tab ' + (this.directoryCategory === 'students' ? 'active' : '');
  },

  handleDirectorySearchInput(query) {
    this.directorySearchQuery = (query || '').toLowerCase().trim();
    if (this._directorySearchTimer) clearTimeout(this._directorySearchTimer);
    this._directorySearchTimer = setTimeout(() => {
      this.loadDirectoryUsers();
    }, 250);
  },

  async loadDirectoryUsers() {
    const listContainer = document.getElementById('newChatDirectoryList');
    if (!listContainer) return;

    listContainer.innerHTML = `
      <div style="padding:24px; text-align:center; color:#64748b; font-size:12.5px;">
        <span class="spinner-border spinner-border-sm text-primary" style="margin-right:6px;"></span> Searching registered users...
      </div>
    `;

    try {
      let roleParam = '';
      if (this.directoryCategory === 'staff') roleParam = '&role=STAFF';
      if (this.directoryCategory === 'students') roleParam = '&role=STUDENT';

      const url = `/api/chat/users/search?query=${encodeURIComponent(this.directorySearchQuery)}${roleParam}&limit=40`;
      const res = await fetch(url, {
        headers: this.getAuthHeaders()
      });
      if (!res.ok) throw new Error("Failed to load users from directory.");

      const users = await res.json();
      this.directoryUsers = Array.isArray(users) ? users : [];
      this.renderDirectoryUsers();
    } catch (err) {
      console.error("[ChatApp] Directory loading error:", err);
      listContainer.innerHTML = `
        <div style="padding:20px; text-align:center; color:#ef4444; font-size:12.5px;">
          Failed to load users from directory. Please check network connectivity.
        </div>
      `;
    }
  },

  renderDirectoryUsers() {
    const container = document.getElementById('newChatDirectoryList');
    if (!container) return;

    const curId = this.getCurrentUserId();
    const filtered = this.directoryUsers.filter(u => {
      const id = String(u.identifier || u.regNo || u.username || u.id || '').toLowerCase();
      return id !== curId;
    });

    if (filtered.length === 0) {
      container.innerHTML = `
        <div style="padding:30px; text-align:center; color:#94a3b8; font-size:12.5px;">
          No matching registered students or staff found.
        </div>
      `;
      return;
    }

    container.innerHTML = filtered.map(u => {
      const targetId = u.identifier || u.regNo || u.username || u.id;
      const name = u.name || targetId;
      const role = u.role || 'STUDENT';
      const meta = [
        u.regNo ? `Reg: ${u.regNo}` : (u.staffId ? `Staff ID: ${u.staffId}` : ''),
        u.section ? `Sec: ${u.section}` : '',
        u.department || 'Computer Science'
      ].filter(Boolean).join(' • ');

      return `
        <div class="directory-user-card" onclick="ChatApp.openDirectChatWithUser('${targetId}')" title="Click to chat directly">
          <div style="display:flex; align-items:center; gap:12px; min-width:0; flex:1;">
            <div style="width:38px; height:38px; border-radius:50%; background:linear-gradient(135deg, #0b132b, #0d9488); color:#ffffff; font-weight:700; font-size:14px; display:flex; align-items:center; justify-content:center; flex-shrink:0; overflow:hidden;">
              ${(u.profilePhoto || u.photoUrl) ? `<img src="${u.profilePhoto || u.photoUrl}" alt="Avatar" style="width:100%; height:100%; object-fit:cover; display:block;">` : (name.charAt(0) || 'U').toUpperCase()}
            </div>
            <div style="min-width:0; flex:1;">
              <div style="display:flex; align-items:center; gap:8px;">
                <span style="font-weight:700; font-size:13.5px; color:var(--primary); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${this.escapeHtml(name)}</span>
                ${this.getRoleBadgeHtml(role)}
              </div>
              <div style="font-size:11.5px; color:#64748b; margin-top:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${this.escapeHtml(meta)}</div>
            </div>
          </div>
          <button type="button" class="btn btn-sm btn-outline-primary btn-send-req-chip" style="font-size:11.5px; padding:4px 12px; border-radius:14px; font-weight:600;">
            💬 Chat
          </button>
        </div>
      `;
    }).join('');
  },

  async openDirectChatWithUser(targetIdentifier) {
    if (!targetIdentifier) return;
    this.closeNewChatModal();

    if (window.Toast) Toast.show("Opening direct verified channel...", "info");

    try {
      const res = await fetch('/api/chat/conversations', {
        method: 'POST',
        headers: this.getAuthHeaders({
          'Content-Type': 'application/json'
        }),
        body: JSON.stringify({ targetIdentifier: targetIdentifier })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        console.error("[ChatApp] Direct chat creation HTTP error: " + res.status + " " + JSON.stringify(err));
        throw new Error(err.error || `Failed to open conversation channel (HTTP ${res.status})`);
      }

      const conv = await res.json();
      await this.loadConversations(true);
      await this.selectConversation(conv.id);
    } catch (err) {
      console.error("[ChatApp] Direct chat creation error:", err);
      if (window.Toast) Toast.show(err.message || "Failed to initiate chat channel", "error");
    }
  },

  // ------------------ Formatting Helpers ------------------
  setupAutoExpandingTextarea() {
    const textarea = document.getElementById('chatMessageInput');
    if (!textarea) return;
    textarea.addEventListener('input', function() {
      this.style.height = 'auto';
      this.style.height = (this.scrollHeight) + 'px';
    });
  },

  formatMessageText(text) {
    if (!text) return '';
    // Auto-link URLs securely
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const escaped = this.escapeHtml(text);
    return escaped.replace(urlRegex, url => `<a href="${url}" target="_blank" rel="noopener noreferrer" style="color:var(--accent-teal); text-decoration:underline;">${url}</a>`);
  },

  extractDateLabel(ts) {
    if (!ts) return "Today";
    const date = typeof ts === 'number' ? new Date(ts) : new Date(ts);
    if (isNaN(date.getTime())) return "Recent";

    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === yesterday.toDateString()) return "Yesterday";

    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  },

  formatMessageTime(ts) {
    if (!ts) return "";
    const date = typeof ts === 'number' ? new Date(ts) : new Date(ts);
    if (isNaN(date.getTime())) return String(ts).split(',')[1] || String(ts);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  },

  formatConversationTime(ts) {
    if (!ts) return "";
    const date = typeof ts === 'number' ? new Date(ts) : new Date(ts);
    if (isNaN(date.getTime())) return String(ts);

    const now = new Date();
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    }
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
  },

  formatFileSize(bytes) {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  },

  truncateText(str, max) {
    if (!str) return '';
    return str.length > max ? str.substring(0, max - 3) + '...' : str;
  },

  escapeHtml(text) {
    if (!text) return '';
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  },

  escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  },

  getRoleBadgeHtml(role) {
    if (!role) return '';
    const r = String(role).toUpperCase();
    if (r.includes('STUDENT')) return '<span class="badge-tag badge-teal" style="font-size:10px;">🎓 Student</span>';
    if (r.includes('ADVISOR')) return '<span class="badge-tag badge-indigo" style="font-size:10px;">👨‍🏫 Advisor</span>';
    if (r.includes('HOD')) return '<span class="badge-tag badge-purple" style="font-size:10px;">🏛️ HOD</span>';
    if (r.includes('PRINCIPAL')) return '<span class="badge-tag badge-rose" style="font-size:10px;">👑 Principal</span>';
    return `<span class="badge-tag badge-slate" style="font-size:10px;">${r}</span>`;
  },

  getRoleBadgeClass(role) {
    if (!role) return 'badge-slate';
    const r = String(role).toUpperCase();
    if (r.includes('STUDENT')) return 'badge-teal';
    if (r.includes('ADVISOR')) return 'badge-indigo';
    if (r.includes('HOD')) return 'badge-purple';
    if (r.includes('PRINCIPAL')) return 'badge-rose';
    return 'badge-slate';
  }
};

window.ChatApp = ChatApp;
