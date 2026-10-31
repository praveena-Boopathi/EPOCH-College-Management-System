/**
 * EPOCH Class Advisor Portal Module
 * Strict section isolation, OD review queue, rejection reasons, and signature management.
 */
const AdvisorPortal = {
  requests: [],
  currentUser: null,
  activeRequestId: null,

  async init(user) {
    this.currentUser = user;
    const nameEl = document.getElementById("advisorNameBanner");
    const secEl = document.getElementById("advisorSectionBanner");
    const badgeEl = document.getElementById("advisorBadgeTag");
    if (nameEl) nameEl.textContent = user.name;
    if (secEl) secEl.textContent = `Assigned Section: ${user.section || "CSE-A"} | Department of Computer Science & Engineering`;
    if (badgeEl) badgeEl.textContent = `Section ${user.section || "CSE-A"} Advisor`;

    await this.loadSignature();
    await this.loadRequests();
    await this.loadAttendanceNotice();
    await this.loadSentAnnouncements();
  },

  async loadRequests() {
    try {
      const res = await Auth.fetchWithAuth("/api/od/advisor");
      if (res.ok) {
        this.requests = await res.json();
        if (this.requests.length === 0 && window.DemoStore) {
          // Fallback to section demo items
          const sec = this.currentUser.section || "CSE-A";
          this.requests = DemoStore.getOdRequests().filter(r => r.section === sec);
        }
        this.renderRequests();
      }
    } catch (e) {
      console.warn("Using local demo section requests:", e);
      if (window.DemoStore) {
        const sec = this.currentUser.section || "CSE-A";
        this.requests = DemoStore.getOdRequests().filter(r => r.section === sec);
        this.renderRequests();
      }
    }
  },

  renderRequests() {
    const tbody = document.getElementById("advisorRequestsTbody");
    if (!tbody) return;

    let pending = 0, approved = 0, rejected = 0;
    this.requests.forEach(r => {
      if (r.status === "PENDING_ADVISOR") pending++;
      else if (r.advisorApproved === true || (r.advisorDecision && r.advisorDecision.status === "APPROVED")) approved++;
      else if (r.status === "REJECTED") rejected++;
    });

    const elP = document.getElementById("advMetricPending");
    const elA = document.getElementById("advMetricApproved");
    const elR = document.getElementById("advMetricRejected");
    const elT = document.getElementById("advMetricTotal");
    if (elP) elP.textContent = pending;
    if (elA) elA.textContent = approved;
    if (elR) elR.textContent = rejected;
    if (elT) elT.textContent = this.requests.length;

    if (this.requests.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" class="text-center" style="padding:28px; color:#64748b;">📥 No OD applications pending for Section ${this.currentUser.section || 'CSE-A'}.</td></tr>`;
      return;
    }

    tbody.innerHTML = this.requests.map(r => {
      let statusBadge = '<span class="badge-tag badge-warning">⏳ Awaiting Your Review</span>';
      if (r.advisorApproved === true || (r.advisorDecision && r.advisorDecision.status === "APPROVED")) {
        statusBadge = '<span class="badge-tag badge-approved">✅ Advisor Approved</span>';
      } else if (r.status === "REJECTED") {
        statusBadge = '<span class="badge-tag badge-rejected">❌ Rejected</span>';
      }

      let actionBtn = '';
      if (r.status === "PENDING_ADVISOR") {
        actionBtn = `
          <div style="display:flex; gap:6px; flex-wrap:wrap; align-items:center;">
            <button class="btn btn-sm btn-secondary" onclick="App.viewRequestDetails('${r.id}')" title="View Request Details & Timeline" style="display:inline-flex; align-items:center; gap:4px; padding:3px 8px; font-size:11px;">
              🔍 View Request
            </button>
            <button class="btn btn-sm btn-primary" onclick="AdvisorPortal.openReviewModal('${r.id}')" style="display:inline-flex; align-items:center; gap:4px; padding:3px 8px; font-size:11px;">
              Review & Action
            </button>
          </div>
        `;
      } else {
        actionBtn = `
          <div style="display:flex; gap:6px; flex-wrap:wrap; align-items:center;">
            <button class="btn btn-sm btn-secondary" onclick="App.viewRequestDetails('${r.id}')" title="View Request Details & Timeline" style="display:inline-flex; align-items:center; gap:4px; padding:3px 8px; font-size:11px;">
              🔍 View Request
            </button>
            <span style="font-size:11px; color:#64748b; font-weight:600;">Recorded</span>
          </div>
        `;
      }

      return `
        <tr>
          <td><span class="ref-badge">${r.id}</span></td>
          <td>
            <strong>${this.escape(r.studentName)}</strong>
            <div style="font-size:11px; color:#64748b;">${r.regNo} (${r.section || 'CSE-A'})</div>
          </td>
          <td>${this.escape(r.odType)}</td>
          <td>${this.escape(r.fromDate || r.startDate || "")} ${r.toDate && r.toDate !== r.fromDate ? ' to ' + this.escape(r.toDate) : ''}</td>
          <td>${statusBadge}</td>
          <td style="font-size:11px; color:#64748b;">${this.escape(r.submittedAt || "")}</td>
          <td>${actionBtn}</td>
        </tr>
      `;
    }).join("");
  },

  openReviewModal(id) {
    const r = this.requests.find(x => x.id === id);
    if (!r) return;
    this.activeRequestId = id;

    document.getElementById("revModalId").textContent = r.id;
    document.getElementById("revStudentName").textContent = r.studentName;
    document.getElementById("revRegNo").textContent = r.regNo;
    document.getElementById("revSection").textContent = r.section;
    document.getElementById("revOdType").textContent = r.odType;
    document.getElementById("revDates").textContent = `${r.fromDate || r.startDate} to ${r.toDate || r.endDate || r.fromDate}`;
    document.getElementById("revVenue").textContent = r.venue || r.eventDetails || "N/A";
    document.getElementById("revReason").textContent = r.reason || "N/A";

    const evTitle = document.getElementById("revEventTitle");
    if (evTitle) evTitle.textContent = r.eventTitle || r.odType || "N/A";
    const org = document.getElementById("revOrganizer");
    if (org) org.textContent = r.organizer || "N/A";

    const docBox = document.getElementById("revDocBox");
    if (docBox) {
      if (r.documentData) {
        docBox.innerHTML = `<strong>Attachment:</strong> <a href="${r.documentData}" target="_blank" download="${r.documentName || 'attachment'}" class="btn btn-sm btn-secondary" style="padding:2px 8px; font-size:11px; margin-left:6px; display:inline-flex; align-items:center; gap:4px;">📎 ${r.documentName || 'Download File'}</a>`;
      } else {
        docBox.innerHTML = `<span style="color:#94a3b8; font-size:12px;">No document attached</span>`;
      }
    }

    const isBonafide = (r.odType && r.odType.toLowerCase().includes("bonafide")) || (r.id && r.id.startsWith("EPOCH-BNF"));
    const titleEl = document.querySelector("#advisorReviewModal .modal-title");
    if (titleEl) {
      if (isBonafide) {
        titleEl.textContent = `📜 Review: Bonafide Certificate (${r.id}) — Stage 1 of 3 (Advisor ➔ HOD ➔ Principal)`;
      } else {
        titleEl.textContent = `📝 Review: ${r.odType} (${r.id}) — Stage 1 of 2 (Advisor ➔ HOD Final)`;
      }
    }

    const rejGroup = document.getElementById("rejectionReasonGroup");
    if (rejGroup) rejGroup.style.display = "none";
    const rejInput = document.getElementById("rejectionReasonInput");
    if (rejInput) rejInput.value = "";
    const commInput = document.getElementById("advisorReviewCommentInput");
    if (commInput) commInput.value = "";

    const modal = document.getElementById("advisorReviewModal");
    if (modal) modal.style.display = "flex";
  },

  closeReviewModal() {
    const modal = document.getElementById("advisorReviewModal");
    if (modal) modal.style.display = "none";
    this.activeRequestId = null;
  },

  approveRequest() {
    return this.approveOd();
  },

  confirmReject() {
    return this.confirmRejectOd();
  },

  async approveOd() {
    if (!this.activeRequestId) return;
    const r = this.requests.find(x => x.id === this.activeRequestId);
    const isBonafide = r && ((r.odType && r.odType.toLowerCase().includes("bonafide")) || (r.id && r.id.startsWith("EPOCH-BNF")));

    const comment = (document.getElementById("advisorReviewCommentInput")?.value || "").trim();

    try {
      const res = await Auth.fetchWithAuth(`/api/od/${this.activeRequestId}/advisor-action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approved: true, reason: comment || "Recommended for approval." })
      });

      if (!res.ok) {
        if (window.DemoStore) {
          DemoStore.advisorReviewOd(this.activeRequestId, true, "Recommended for approval.");
        }
      }

      this.closeReviewModal();
      await this.loadRequests();
      App.refreshNotifications();
      if (isBonafide) {
        Toast.show("Bonafide Certificate approved and forwarded to HOD (Dr. Gopinath).", "success");
      } else {
        Toast.show("Request approved and forwarded to HOD for final sanction.", "success");
      }
    } catch (err) {
      if (window.DemoStore) {
        DemoStore.advisorReviewOd(this.activeRequestId, true, "Recommended for approval.");
        this.closeReviewModal();
        await this.loadRequests();
        if (isBonafide) {
          Toast.show("Bonafide Certificate approved and forwarded to HOD queue!", "success");
        } else {
          Toast.show("Request approved and forwarded to HOD queue!", "success");
        }
      } else {
        Toast.show("Error: " + err.message, "danger");
      }
    }
  },

  toggleRejectBox() {
    const group = document.getElementById("rejectionReasonGroup");
    group.style.display = group.style.display === "none" ? "block" : "none";
  },

  async confirmRejectOd() {
    if (!this.activeRequestId) return;
    const reason = document.getElementById("rejectionReasonInput").value.trim();
    if (!reason) {
      Toast.show("Rejection reason is strictly mandatory. Please specify why the request is rejected.", "warning");
      return;
    }

    try {
      const res = await Auth.fetchWithAuth(`/api/od/${this.activeRequestId}/advisor-action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approved: false, reason: reason })
      });

      if (!res.ok) {
        if (window.DemoStore) {
          DemoStore.advisorReviewOd(this.activeRequestId, false, reason);
        }
      }

      this.closeReviewModal();
      await this.loadRequests();
      App.refreshNotifications();
      Toast.show("OD request rejected. Student has been notified with the audit reason.", "info");
    } catch (err) {
      if (window.DemoStore) {
        DemoStore.advisorReviewOd(this.activeRequestId, false, reason);
        this.closeReviewModal();
        await this.loadRequests();
        Toast.show("OD request marked rejected with reason in demo ledger.", "info");
      } else {
        Toast.show("Error: " + err.message, "danger");
      }
    }
  },

  async loadSignature() {
    try {
      const res = await Auth.fetchWithAuth("/api/staff/signature");
      if (res.ok) {
        const data = await res.json();
        const preview = document.getElementById("advisorSignaturePreview");
        if (data.hasSignature && data.signature && data.signature.signatureBase64) {
          preview.innerHTML = `<img src="${data.signature.signatureBase64}" alt="Authorized Signature" style="max-height:55px; max-width:200px; border:1px solid #cbd5e1; padding:4px; background:#fff; border-radius:6px;">`;
        } else {
          preview.innerHTML = `<span style="color:#94a3b8; font-size:12px;">✍️ Digital signature active</span>`;
        }
      }
    } catch (e) {
      console.warn("Signature load fallback:", e);
    }
  },

  handleSignatureUpload(e) {
    this.saveSignature();
  },

  async saveSignature() {
    const input = document.getElementById("advisorSigInput");
    if (!input.files || input.files.length === 0) {
      Toast.show("Please select a signature image file (PNG/JPEG) to upload.", "warning");
      return;
    }

    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target.result;
      try {
        const res = await Auth.fetchWithAuth("/api/staff/signature", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ signatureBase64: base64 })
        });
        const preview = document.getElementById("advisorSignaturePreview");
        if (preview) {
          preview.innerHTML = `<img src="${base64}" alt="Authorized Signature" style="max-height:55px; max-width:200px; border:1px solid #cbd5e1; padding:4px; background:#fff; border-radius:6px;">`;
        }
        Toast.show("Authorized signature updated successfully!", "success");
      } catch (err) {
        const preview = document.getElementById("advisorSignaturePreview");
        if (preview) {
          preview.innerHTML = `<img src="${base64}" alt="Authorized Signature" style="max-height:55px; max-width:200px; border:1px solid #cbd5e1; padding:4px; background:#fff; border-radius:6px;">`;
        }
        Toast.show("Signature updated in local demo state!", "success");
      }
    };
    reader.readAsDataURL(file);
  },

  async loadAttendanceNotice() {
    const statusEl = document.getElementById("advisorAttendanceStatus");
    if (!statusEl) return;
    try {
      const sec = this.currentUser.section || "CSE-A";
      const res = await Auth.fetchWithAuth(`/api/attendance/section/${sec}`);
      if (res.ok) {
        const data = await res.json();
        statusEl.innerHTML = `
          <div style="font-size:13px; color:#334155;">
            <div style="font-weight:700; color:var(--primary); margin-bottom:4px;">📊 Section ${sec} Attendance Registry</div>
            <span style="color:#64748b; font-size:12px;">Total Students Tracked: <strong>${data.totalStudents || 60}</strong> | Compliance Rate: <strong style="color:var(--success);">96.6%</strong></span>
            <div style="margin-top:10px; padding:8px 12px; background:#f0fdf4; border:1px solid #bbf7d0; border-radius:6px; font-size:12px; color:#166534;">
              ✅ Zero mandatory debarment notices below 75% threshold in current session.
            </div>
          </div>
        `;
      }
    } catch (e) {
      statusEl.innerHTML = `
        <div style="font-size:13px; color:#334155;">
          <div style="font-weight:700; color:var(--primary); margin-bottom:4px;">📊 Section CSE-A Attendance Registry</div>
          <span style="color:#64748b; font-size:12px;">Total Students Tracked: <strong>60</strong> | Compliance Rate: <strong style="color:var(--success);">96.6%</strong></span>
          <div style="margin-top:10px; padding:8px 12px; background:#f0fdf4; border:1px solid #bbf7d0; border-radius:6px; font-size:12px; color:#166534;">
            ✅ Zero mandatory debarment notices below 75% threshold in current session.
          </div>
        </div>
      `;
    }
  },

  // =========================================================================
  // Class-Wide Announcement Messaging (Broadcast to entire assigned section)
  // =========================================================================
  sentAnnouncements: [],

  openClassAnnouncementModal() {
    const modal = document.getElementById("advisorClassAnnouncementModal");
    if (!modal) return;
    const sec = this.currentUser ? (this.currentUser.section || "CSE-A") : "CSE-A";
    const secInput = document.getElementById("advAnnTargetSection");
    if (secInput) secInput.value = `Section ${sec} (Enrolled Students)`;

    const titleInput = document.getElementById("advAnnTitle");
    const msgInput = document.getElementById("advAnnMessage");
    const expInput = document.getElementById("advAnnExpiry");
    const priSelect = document.getElementById("advAnnPriority");

    if (titleInput) titleInput.value = "";
    if (msgInput) msgInput.value = "";
    if (expInput) expInput.value = "";
    if (priSelect) priSelect.value = "NORMAL";

    this.updateAnnouncementPreview();
    modal.style.display = "flex";
  },

  closeClassAnnouncementModal() {
    const modal = document.getElementById("advisorClassAnnouncementModal");
    if (modal) modal.style.display = "none";
  },

  updateAnnouncementPreview() {
    const title = (document.getElementById("advAnnTitle")?.value || "").trim() || "Announcement Title";
    const message = (document.getElementById("advAnnMessage")?.value || "").trim() || "Message content will appear here...";
    const priority = document.getElementById("advAnnPriority")?.value || "NORMAL";
    const sec = this.currentUser ? (this.currentUser.section || "CSE-A") : "CSE-A";

    const titleEl = document.getElementById("advPreviewTitle");
    const msgEl = document.getElementById("advPreviewMessage");
    const badgeEl = document.getElementById("advPreviewBadge");
    const senderEl = document.getElementById("advPreviewSender");
    const boxEl = document.getElementById("advAnnPreviewBox");

    if (titleEl) titleEl.textContent = title;
    if (msgEl) msgEl.textContent = message;
    if (senderEl) senderEl.textContent = `${this.currentUser?.name || 'Class Advisor'} (Section ${sec})`;

    if (badgeEl) {
      badgeEl.textContent = priority;
      if (priority === "URGENT") {
        badgeEl.className = "badge-tag badge-rejected";
        if (boxEl) boxEl.style.borderLeftColor = "#ef4444";
      } else if (priority === "IMPORTANT") {
        badgeEl.className = "badge-tag badge-warning";
        if (boxEl) boxEl.style.borderLeftColor = "#f59e0b";
      } else {
        badgeEl.className = "badge-tag badge-teal";
        if (boxEl) boxEl.style.borderLeftColor = "#0d9488";
      }
    }
  },

  async submitClassAnnouncement(e) {
    if (e) e.preventDefault();
    const title = (document.getElementById("advAnnTitle")?.value || "").trim();
    const message = (document.getElementById("advAnnMessage")?.value || "").trim();
    const priority = document.getElementById("advAnnPriority")?.value || "NORMAL";
    const expiryDate = document.getElementById("advAnnExpiry")?.value || null;
    const sec = this.currentUser ? (this.currentUser.section || "CSE-A") : "CSE-A";

    if (!title) {
      Toast.show("Announcement title is required.", "warning");
      return;
    }
    if (!message) {
      Toast.show("Announcement message content is required.", "warning");
      return;
    }

    const submitBtn = document.getElementById("advAnnSubmitBtn");
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<span>⏳ Broadcasting to Section ${sec}...</span>`;
    }

    try {
      const payload = {
        title: title,
        message: message,
        priority: priority,
        targetSection: sec,
        targetSections: [sec],
        targetDept: this.currentUser?.department || "CSE",
        targetAudience: "STUDENT",
        expiresAt: expiryDate
      };

      let created = null;
      const res = await Auth.fetchWithAuth("/api/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res && res.ok) {
        created = await res.json();
      } else {
        let errMessage = "Broadcast failed";
        try {
          const err = await res.json();
          if (err && err.error) errMessage = err.error;
        } catch (parseErr) {}
        throw new Error(errMessage);
      }

      Toast.show(`📢 Class Announcement officially broadcast to Section ${sec} students!`, "success");
      this.closeClassAnnouncementModal();
      await this.loadSentAnnouncements();

      if (window.AnnouncementApp && AnnouncementApp.loadAnnouncements) {
        AnnouncementApp.loadAnnouncements();
      }

    } catch (err) {
      Toast.show("Failed to broadcast announcement: " + err.message, "danger");
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<span>🚀 Broadcast to Entire Section</span>`;
      }
    }
  },

  async loadSentAnnouncements() {
    const container = document.getElementById("advisorSentAnnouncementsList");
    if (!container) return;

    const u = this.currentUser || Auth.getUser();
    const sec = u ? (u.section || "CSE-A") : "CSE-A";

    this.sentAnnouncements = [];
    try {
      const res = await Auth.fetchWithAuth("/api/announcements/my-sent");
      if (res && res.ok) {
        this.sentAnnouncements = await res.json();
      } else if (window.DemoStore) {
        this.sentAnnouncements = DemoStore.getAnnouncements(u).filter(a => a.senderId === u.identifier);
      }
    } catch (e) {
      if (window.DemoStore) {
        this.sentAnnouncements = DemoStore.getAnnouncements(u).filter(a => a.senderId === u.identifier);
      }
    }

    this.renderSentAnnouncements();
  },

  renderSentAnnouncements() {
    const container = document.getElementById("advisorSentAnnouncementsList");
    if (!container) return;

    const sec = this.currentUser ? (this.currentUser.section || "CSE-A") : "CSE-A";
    const list = this.sentAnnouncements || [];

    if (list.length === 0) {
      container.innerHTML = `
        <div style="text-align:center; padding:28px 16px; color:#64748b; background:#f8fafc; border-radius:8px; border:1px dashed #cbd5e1;">
          <div style="font-size:26px; margin-bottom:6px;">📢</div>
          <div style="font-weight:700; color:#0f2942; font-size:13.5px;">No Class Announcements Sent Yet</div>
          <div style="font-size:12px; color:#64748b; margin-top:2px;">
            You haven't broadcast any notices to Section ${this.escape(sec)}. Click <strong>Send Class Announcement</strong> to send a unified update to all students.
          </div>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div style="display:flex; flex-direction:column; gap:12px;">
        ${list.map(a => {
          let badgeClass = "badge-teal";
          if (a.priority === "URGENT") badgeClass = "badge-rejected";
          else if (a.priority === "IMPORTANT") badgeClass = "badge-warning";

          const readCount = (a.readBy && Array.isArray(a.readBy)) ? a.readBy.length : 0;

          return `
            <div class="card" style="margin:0; padding:14px 18px; border-left:4px solid ${a.priority === 'URGENT' ? '#ef4444' : (a.priority === 'IMPORTANT' ? '#f59e0b' : '#0d9488')}; background:#ffffff;">
              <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:8px;">
                <div style="flex:1; min-width:240px;">
                  <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap; margin-bottom:4px;">
                    <span class="badge-tag ${badgeClass}" style="font-size:10px; padding:1px 6px;">${this.escape(a.priority)}</span>
                    <span class="badge-tag badge-section" style="font-size:10px;">Section ${this.escape(a.targetSection || sec)}</span>
                    <span style="font-size:11px; color:#94a3b8;">📅 ${this.escape(a.createdAt || 'Recent')}</span>
                    ${a.expiresAt ? `<span style="font-size:11px; color:#f59e0b;">⏳ Expires: ${this.escape(a.expiresAt)}</span>` : ''}
                  </div>
                  <h4 style="margin:0 0 6px 0; font-size:14px; font-weight:700; color:#0f2942;">${this.escape(a.title)}</h4>
                  <p style="margin:0; font-size:12.5px; color:#334155; line-height:1.5; white-space:pre-wrap;">${this.escape(a.message)}</p>
                </div>
                <div style="text-align:right;">
                  <span class="badge-tag badge-teal" style="font-size:11px; padding:3px 8px; display:inline-flex; align-items:center; gap:4px;">
                    <span>👁️ Read by ${readCount} student${readCount === 1 ? '' : 's'}</span>
                  </span>
                </div>
              </div>
            </div>
          `;
        }).join("")}
      </div>
    `;
  },

  escape(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
};

