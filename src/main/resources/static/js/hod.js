/**
 * EPOCH Head of Department (HOD) Portal Module
 * Department overview, advisor-approved OD reviews, signature, and analytics.
 */
const HodPortal = {
  requests: [],
  currentUser: null,
  activeRequestId: null,
  activeFilter: "PENDING_HOD",
  searchQuery: "",

  async init(user) {
    this.currentUser = user;
    const nameEl = document.getElementById("hodNameBanner");
    const deptEl = document.getElementById("hodDeptBanner");
    if (nameEl) nameEl.textContent = user.name;
    if (deptEl) deptEl.textContent = "Head of the Department | Department of Computer Science & Engineering";

    this.renderAnalytics();
    await this.loadSignature();
    await this.loadRequests();
  },

  renderAnalytics() {
    const container = document.getElementById("hodAnalyticsContainer");
    if (!container) return;

    container.innerHTML = `
      <div class="card" style="margin-bottom:24px; background:linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);">
        <div class="card-header">
          <div class="card-title">📊 Department Performance & OD Analytics (CSE)</div>
          <span class="badge-tag badge-teal">Live Department Metrics</span>
        </div>
        <div class="card-body">
          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:16px;">
            <div style="padding:16px; background:#ffffff; border:1px solid var(--border); border-radius:8px; border-left:4px solid var(--accent-teal);">
              <div style="font-size:11px; font-weight:700; color:#64748b; text-transform:uppercase;">Endorsement Rate</div>
              <div style="font-size:26px; font-weight:800; color:var(--accent-teal); margin-top:4px;">94.2%</div>
              <div style="font-size:11px; color:#94a3b8; margin-top:2px;">Academic & Placement Events</div>
            </div>
            <div style="padding:16px; background:#ffffff; border:1px solid var(--border); border-radius:8px; border-left:4px solid var(--accent-blue);">
              <div style="font-size:11px; font-weight:700; color:#64748b; text-transform:uppercase;">Inter-College Participation</div>
              <div style="font-size:26px; font-weight:800; color:var(--accent-blue); margin-top:4px;">38 Students</div>
              <div style="font-size:11px; color:#94a3b8; margin-top:2px;">Symposiums & Hackathons</div>
            </div>
            <div style="padding:16px; background:#ffffff; border:1px solid var(--border); border-radius:8px; border-left:4px solid var(--success);">
              <div style="font-size:11px; font-weight:700; color:#64748b; text-transform:uppercase;">Average Turnaround</div>
              <div style="font-size:26px; font-weight:800; color:var(--success); margin-top:4px;">4.2 Hours</div>
              <div style="font-size:11px; color:#94a3b8; margin-top:2px;">From Advisor to HOD</div>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  setFilter(filter) {
    this.activeFilter = filter;
    const tabs = [
      { id: "hodTabPending", key: "PENDING_HOD" },
      { id: "hodTabApproved", key: "APPROVED" },
      { id: "hodTabRejected", key: "REJECTED" },
      { id: "hodTabAll", key: "ALL" }
    ];
    tabs.forEach(t => {
      const btn = document.getElementById(t.id);
      if (btn) {
        if (t.key === filter) {
          btn.className = "btn btn-sm btn-primary";
        } else {
          btn.className = "btn btn-sm btn-secondary";
        }
      }
    });
    this.renderRequests();
  },

  onSearchInput(val) {
    this.searchQuery = (val || "").trim().toLowerCase();
    this.renderRequests();
  },

  async loadRequests() {
    const tbody = document.getElementById("hodRequestsTbody");
    if (tbody && (!this.requests || this.requests.length === 0)) {
      tbody.innerHTML = '<tr><td colspan="8" class="text-center" style="padding:32px; color:#64748b;"><div class="loading-spinner" style="margin:0 auto 10px auto;"></div> Loading official department queue...</td></tr>';
    }

    try {
      const res = await Auth.fetchWithAuth("/api/od/hod");
      if (res.ok) {
        this.requests = await res.json();
        // Only if guest/demo mode without auth token, use DemoStore fallback
        if ((!this.requests || this.requests.length === 0) && !Auth.getToken() && window.DemoStore) {
          this.requests = DemoStore.getOdRequests().filter(r => r.status === "PENDING_HOD" || r.hodDecision || r.currentStage === "HOD");
        }
        this.renderRequests();
      } else {
        throw new Error("HTTP " + res.status);
      }
    } catch (e) {
      console.warn("Error loading HOD requests:", e);
      if (!Auth.getToken() && window.DemoStore) {
        this.requests = DemoStore.getOdRequests().filter(r => r.status === "PENDING_HOD" || r.hodDecision || r.currentStage === "HOD");
        this.renderRequests();
      } else {
        if (tbody) {
          tbody.innerHTML = `<tr><td colspan="8" class="text-center" style="padding:28px; color:var(--danger);">⚠️ Unable to load HOD review queue: ${this.escape(e.message)}. <button class="btn btn-sm btn-secondary" onclick="HodPortal.loadRequests()" style="margin-left:8px; display:inline-flex; align-items:center; gap:4px;">🔄 Retry</button></td></tr>`;
        }
      }
    }
  },

  isRejected(r) {
    if (!r) return false;
    return r.status === "REJECTED" || (r.hodDecision && r.hodDecision.status === "REJECTED");
  },

  isApproved(r) {
    if (!r || this.isRejected(r)) return false;
    if (r.status === "APPROVED") return true;
    if (r.status === "PENDING_PRINCIPAL") return true;
    if (r.hodApproved === true) return true;
    if (r.hodDecision && r.hodDecision.status === "APPROVED") return true;
    return false;
  },

  isPending(r) {
    if (!r || this.isRejected(r) || this.isApproved(r)) return false;
    return r.status === "PENDING_HOD" || r.currentStage === "HOD" || r.assignedReviewerRole === "HOD" || r.assignedReviewerId === "gopinath";
  },

  renderRequests() {
    const tbody = document.getElementById("hodRequestsTbody");
    if (!tbody) return;

    let pending = 0, approved = 0, rejected = 0;
    this.requests.forEach(r => {
      if (this.isPending(r)) pending++;
      else if (this.isApproved(r)) approved++;
      else if (this.isRejected(r)) rejected++;
    });

    const elP = document.getElementById("hodMetricPending");
    const elA = document.getElementById("hodMetricApproved");
    const elR = document.getElementById("hodMetricRejected");
    const elT = document.getElementById("hodMetricTotal");
    const qBadge = document.getElementById("hodQueueCountBadge");

    if (elP) elP.textContent = pending;
    if (elA) elA.textContent = approved;
    if (elR) elR.textContent = rejected;
    if (elT) elT.textContent = this.requests.length;
    if (qBadge) {
      qBadge.textContent = `${pending} Pending`;
      qBadge.className = pending > 0 ? "badge-tag badge-warning" : "badge-tag badge-approved";
    }

    const bP = document.getElementById("hodFilterBadgePending");
    const bA = document.getElementById("hodFilterBadgeApproved");
    const bR = document.getElementById("hodFilterBadgeRejected");
    const bAll = document.getElementById("hodFilterBadgeAll");
    if (bP) bP.textContent = pending;
    if (bA) bA.textContent = approved;
    if (bR) bR.textContent = rejected;
    if (bAll) bAll.textContent = this.requests.length;

    // Filter requests
    let filtered = this.requests.slice();
    if (this.activeFilter === "PENDING_HOD") {
      filtered = filtered.filter(r => this.isPending(r));
    } else if (this.activeFilter === "APPROVED") {
      filtered = filtered.filter(r => this.isApproved(r));
    } else if (this.activeFilter === "REJECTED") {
      filtered = filtered.filter(r => this.isRejected(r));
    }

    // Apply search filter
    if (this.searchQuery) {
      const q = this.searchQuery;
      filtered = filtered.filter(r => {
        const id = (r.id || "").toLowerCase();
        const name = (r.studentName || "").toLowerCase();
        const reg = (r.regNo || "").toLowerCase();
        const type = (r.odType || "").toLowerCase();
        const sec = (r.section || "").toLowerCase();
        return id.includes(q) || name.includes(q) || reg.includes(q) || type.includes(q) || sec.includes(q);
      });
    }

    if (filtered.length === 0) {
      let msg = "No requests found matching the current filter.";
      if (this.activeFilter === "PENDING_HOD") {
        msg = "📋 No pending requests currently awaiting HOD review. Requests arrive here immediately after Class Advisor approval.";
      }
      tbody.innerHTML = `<tr><td colspan="8" class="text-center" style="padding:32px; color:#64748b;">${msg}</td></tr>`;
      return;
    }

    tbody.innerHTML = filtered.map(r => {
      const isBonafide = (r.odType && r.odType.toLowerCase().includes("bonafide")) || (r.id && r.id.startsWith("EPOCH-BNF"));
      const isLeave = (r.odType && r.odType.toLowerCase().includes("leave")) || (r.id && r.id.startsWith("EPOCH-LV"));
      const pendingReview = this.isPending(r);
      const approvedReq = this.isApproved(r);
      const rejectedReq = this.isRejected(r);

      // Current Approval Stage Badge
      let stageBadge = '<span class="badge-tag badge-warning">⏳ Awaiting HOD</span>';
      if (pendingReview) {
        stageBadge = '<span class="badge-tag badge-warning">⏳ Awaiting HOD Review</span>';
      } else if (rejectedReq) {
        stageBadge = '<span class="badge-tag badge-rejected">❌ Rejected</span>';
      } else if (r.status === "PENDING_PRINCIPAL") {
        stageBadge = '<span class="badge-tag badge-info">🏛️ Forwarded to Principal</span>';
      } else if (approvedReq) {
        stageBadge = isBonafide ? '<span class="badge-tag badge-approved">✅ Principal Sanctioned</span>' : '<span class="badge-tag badge-approved">✅ HOD Approved</span>';
      }

      // Class Advisor Decision Summary
      const adv = r.advisorDecision || {};
      let advDecisionHtml = '';
      if (adv.status === "APPROVED" || r.advisorApproved || r.status === "PENDING_HOD" || r.status === "PENDING_PRINCIPAL" || approvedReq) {
        const advName = adv.by || adv.approver || (r.section === 'CSE-B' ? 'Dr. Divyabharathi' : (r.section === 'CSE-C' ? 'Mrs. Rajavathi Jayapriya' : 'Mrs. P. Arularasi'));
        const advTime = adv.timestamp || (r.advisorApprovalDate ? new Date(r.advisorApprovalDate).toLocaleString() : 'Verified');
        advDecisionHtml = `
          <div style="display:flex; flex-direction:column; gap:2px;">
            <span class="badge-tag badge-approved" style="width:fit-content; font-size:10.5px;">✓ Advisor Approved</span>
            <div style="font-size:11px; color:#475569; margin-top:2px;">${this.escape(advName)}</div>
            <div style="font-size:10px; color:#94a3b8;">${this.escape(advTime)}</div>
          </div>
        `;
      } else if (adv.status === "REJECTED") {
        advDecisionHtml = `<span class="badge-tag badge-rejected">❌ Advisor Rejected</span>`;
      } else {
        advDecisionHtml = `<span class="badge-tag badge-secondary">Pending Advisor</span>`;
      }

      // Action buttons
      let actionButtons = '';
      if (pendingReview) {
        actionButtons = `
          <div style="display:flex; gap:6px; flex-wrap:wrap; align-items:center;">
            <button class="btn btn-sm btn-secondary" onclick="App.viewRequestDetails('${r.id}')" title="View full submitted form & timeline" style="display:inline-flex; align-items:center; gap:4px; padding:3px 8px; font-size:11px;">
              🔍 View Request
            </button>
            <button class="btn btn-sm btn-primary" onclick="HodPortal.openReviewModal('${r.id}')" title="Open HOD Review Modal" style="display:inline-flex; align-items:center; gap:4px; padding:3px 8px; font-size:11px;">
              Review
            </button>
            <button class="btn btn-sm btn-success" onclick="HodPortal.quickApprove('${r.id}')" title="Grant HOD Endorsement" style="padding:3px 8px; font-size:11px; background:#059669; color:#fff;">
              ✅ Approve
            </button>
            <button class="btn btn-sm btn-danger" onclick="HodPortal.openRejectModal('${r.id}')" title="Reject Request with reason" style="padding:3px 8px; font-size:11px; background:#dc2626; color:#fff;">
              ❌ Reject
            </button>
          </div>
        `;
      } else {
        actionButtons = `
          <div style="display:flex; gap:6px; align-items:center;">
            <button class="btn btn-sm btn-secondary" onclick="App.viewRequestDetails('${r.id}')" title="View full submitted form & timeline" style="display:inline-flex; align-items:center; gap:4px; padding:3px 8px; font-size:11px;">
              🔍 View Request
            </button>
            <span style="font-size:11px; color:#64748b; font-weight:600;">Recorded</span>
          </div>
        `;
      }

      const reqTypeLabel = isBonafide ? "Bonafide Certificate" : (isLeave ? (r.odType || "Leave Application") : (r.odType || "On-Duty Requisition"));
      const reqTypeBadgeClass = isBonafide ? "badge-teal" : (isLeave ? "badge-info" : "badge-primary");
      const submittedDateStr = r.submittedAt || (r.createdAt ? new Date(r.createdAt).toLocaleDateString() : "Recent");

      return `
        <tr>
          <td><span class="ref-badge">${r.id}</span></td>
          <td>
            <strong style="color:var(--primary); font-size:13px;">${this.escape(r.studentName)}</strong>
            <div style="font-size:11px; color:#64748b; font-family:monospace; margin-top:2px;">${this.escape(r.regNo)}</div>
          </td>
          <td>
            <span class="badge-tag badge-secondary" style="font-weight:700;">${this.escape(r.dept || 'CSE')} - ${this.escape(r.section || 'CSE-A')}</span>
          </td>
          <td>
            <span class="badge-tag ${reqTypeBadgeClass}" style="white-space:nowrap;">${this.escape(reqTypeLabel)}</span>
          </td>
          <td>
            <span style="font-size:11.5px; color:#475569;">${this.escape(submittedDateStr)}</span>
          </td>
          <td>${stageBadge}</td>
          <td>${advDecisionHtml}</td>
          <td>${actionButtons}</td>
        </tr>
      `;
    }).join("");
  },

  openReviewModal(id) {
    const r = this.requests.find(x => x.id === id);
    if (!r) return;
    this.activeRequestId = id;

    const isBonafide = (r.odType && r.odType.toLowerCase().includes("bonafide")) || (r.id && r.id.startsWith("EPOCH-BNF"));
    const isLeave = (r.odType && r.odType.toLowerCase().includes("leave")) || (r.id && r.id.startsWith("EPOCH-LV"));
    const pendingReview = this.isPending(r);

    document.getElementById("hodRevModalId").textContent = r.id;
    document.getElementById("hodRevStudentName").textContent = r.studentName || "Student";
    document.getElementById("hodRevRegNo").textContent = `${r.regNo || "-"} (${r.section || "CSE-A"})`;
    document.getElementById("hodRevDept").textContent = `${r.dept || "Computer Science & Engineering"}`;
    document.getElementById("hodRevOdType").textContent = r.odType || (isBonafide ? "Bonafide Certificate" : (isLeave ? "Leave Application" : "On-Duty"));
    document.getElementById("hodRevEventTitle").textContent = r.eventTitle || r.odType || (isBonafide ? "Bonafide Certificate" : "Academic Event");
    document.getElementById("hodRevOrganizer").textContent = r.organizer || (isBonafide ? "Gnanamani College of Technology" : "Academic Body");
    document.getElementById("hodRevVenue").textContent = r.venue || r.eventDetails || "Campus";
    document.getElementById("hodRevDates").textContent = `${r.startDate || r.fromDate || "-"} to ${r.endDate || r.toDate || r.startDate || r.fromDate || "-"} (${r.numberOfDays || 1} day(s))`;
    document.getElementById("hodRevReason").textContent = r.reason || "N/A";

    // Status Badge in modal header
    const statusBadgeEl = document.getElementById("hodRevStatusBadge");
    if (statusBadgeEl) {
      if (pendingReview) {
        statusBadgeEl.className = "badge-tag badge-warning";
        statusBadgeEl.textContent = "⏳ Awaiting HOD Review";
      } else if (this.isApproved(r)) {
        statusBadgeEl.className = "badge-tag badge-approved";
        statusBadgeEl.textContent = "✅ Approved";
      } else {
        statusBadgeEl.className = "badge-tag badge-rejected";
        statusBadgeEl.textContent = "❌ Rejected";
      }
    }

    // Document Attachment
    const docBox = document.getElementById("hodRevDocBox");
    if (docBox) {
      if (r.documentData) {
        docBox.innerHTML = `<strong>Attachment:</strong> <a href="${r.documentData}" target="_blank" download="${r.documentName || 'attachment'}" class="btn btn-sm btn-secondary" style="padding:2px 8px; font-size:11px; margin-left:6px; display:inline-flex; align-items:center; gap:4px;">📎 ${r.documentName || 'Download File'}</a>`;
      } else {
        docBox.innerHTML = `<span style="color:#94a3b8; font-size:12px;">No additional document attached (Standard institutional submission)</span>`;
      }
    }

    // Class Advisor Note & Signature
    const adv = r.advisorDecision || {};
    const advName = adv.signerName || adv.by || adv.approver || `Class Advisor (${r.section || 'CSE-A'})`;
    const advDate = adv.timestamp || (r.advisorApprovalDate ? new Date(r.advisorApprovalDate).toLocaleString() : "Official Ledger");
    const advNotes = adv.reason || adv.notes || "Endorsed and verified student attendance & academic record.";
    const advSig = adv.signatureBase64;
    const advNoteEl = document.getElementById("hodRevAdvisorNote");
    if (advNoteEl) {
      advNoteEl.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:10px;">
          <div style="flex:1; min-width:220px;">
            <div><strong>Verified By:</strong> ${this.escape(advName)} on ${this.escape(advDate)}</div>
            <div style="margin-top:4px;"><strong>Advisor Remarks:</strong> "${this.escape(advNotes)}"</div>
            <div style="margin-top:6px; display:flex; align-items:center; gap:6px;">
              <span class="badge-tag badge-approved" style="font-size:10.5px;">✓ Authorized Digital Signature Recorded</span>
            </div>
          </div>
          ${advSig ? `
            <div style="background:#ffffff; border:1px solid #cbd5e1; border-radius:6px; padding:4px 8px; text-align:center;">
              <img src="${advSig}" alt="Class Advisor Signature" style="max-height:45px; max-width:180px; object-fit:contain;">
              <div style="font-size:9.5px; color:#64748b; margin-top:2px;">Digital Signature • ${this.escape(advName)}</div>
            </div>
          ` : ''}
        </div>
      `;
    }

    // Render Timeline in Modal
    this.renderModalTimeline(r);

    // Rejection Box
    const rejGroup = document.getElementById("hodRejectionReasonGroup");
    if (rejGroup) rejGroup.style.display = "none";
    const rejInput = document.getElementById("hodRejectionReasonInput");
    if (rejInput) rejInput.value = "";
    const commInput = document.getElementById("hodReviewCommentInput");
    if (commInput) commInput.value = "";

    // Buttons
    const approveBtn = document.getElementById("hodApproveBtn");
    const rejectBtn = document.getElementById("hodRejectBtn");
    if (approveBtn && rejectBtn) {
      if (pendingReview) {
        approveBtn.style.display = "inline-flex";
        rejectBtn.style.display = "inline-flex";
        if (isBonafide) {
          approveBtn.textContent = "Endorse & Forward to Principal ➔";
          approveBtn.className = "btn btn-primary";
        } else {
          approveBtn.textContent = "Grant Final Approval & Sanction Form ✓";
          approveBtn.className = "btn btn-success";
        }
      } else {
        approveBtn.style.display = "none";
        rejectBtn.style.display = "none";
      }
    }

    const modal = document.getElementById("hodReviewModal");
    if (modal) modal.style.display = "flex";
  },

  renderModalTimeline(r) {
    const container = document.getElementById("hodRevTimeline");
    if (!container) return;

    const isBonafide = (r.odType && r.odType.toLowerCase().includes("bonafide")) || (r.id && r.id.startsWith("EPOCH-BNF"));
    const adv = r.advisorDecision || {};
    const hod = r.hodDecision || {};
    const prin = r.principalDecision || {};

    const advApproved = adv.status === "APPROVED" || r.status === "PENDING_HOD" || r.status === "PENDING_PRINCIPAL" || r.status === "APPROVED";
    const hodApproved = this.isApproved(r);
    const prinApproved = r.status === "APPROVED" && isBonafide;

    let stepperHtml = '';
    if (isBonafide) {
      stepperHtml = `
        <div class="workflow-stepper" style="margin-bottom:14px; background:#ffffff; padding:12px; border-radius:8px; border:1px solid var(--border);">
          <div class="workflow-step-node completed">
            <div class="workflow-step-circle">✓</div>
            <div class="workflow-step-label">Student<br>Submitted</div>
          </div>
          <div class="workflow-step-line ${advApproved ? 'completed' : ''}"></div>
          <div class="workflow-step-node ${advApproved ? 'completed' : 'active'}">
            <div class="workflow-step-circle">${advApproved ? '✓' : '2'}</div>
            <div class="workflow-step-label">Advisor<br>Approved</div>
          </div>
          <div class="workflow-step-line ${hodApproved ? 'completed' : (advApproved ? 'active' : '')}"></div>
          <div class="workflow-step-node ${hodApproved ? 'completed' : (advApproved ? 'active' : '')}">
            <div class="workflow-step-circle">${hodApproved ? '✓' : '3'}</div>
            <div class="workflow-step-label">HOD<br>${hodApproved ? 'Approved' : 'Pending'}</div>
          </div>
          <div class="workflow-step-line ${prinApproved ? 'completed' : ''}"></div>
          <div class="workflow-step-node ${prinApproved ? 'completed' : ''}">
            <div class="workflow-step-circle">${prinApproved ? '✓' : '4'}</div>
            <div class="workflow-step-label">Principal<br>Sanction</div>
          </div>
        </div>
      `;
    } else {
      stepperHtml = `
        <div class="workflow-stepper" style="margin-bottom:14px; background:#ffffff; padding:12px; border-radius:8px; border:1px solid var(--border);">
          <div class="workflow-step-node completed">
            <div class="workflow-step-circle">✓</div>
            <div class="workflow-step-label">Student<br>Submitted</div>
          </div>
          <div class="workflow-step-line ${advApproved ? 'completed' : ''}"></div>
          <div class="workflow-step-node ${advApproved ? 'completed' : 'active'}">
            <div class="workflow-step-circle">${advApproved ? '✓' : '2'}</div>
            <div class="workflow-step-label">Advisor<br>Approved</div>
          </div>
          <div class="workflow-step-line ${hodApproved ? 'completed' : (advApproved ? 'active' : '')}"></div>
          <div class="workflow-step-node ${hodApproved ? 'completed' : (advApproved ? 'active' : '')}">
            <div class="workflow-step-circle">${hodApproved ? '✓' : '3'}</div>
            <div class="workflow-step-label">HOD Final<br>${hodApproved ? 'Sanctioned' : 'Pending'}</div>
          </div>
        </div>
      `;
    }

    container.innerHTML = stepperHtml;
  },

  closeReviewModal() {
    const modal = document.getElementById("hodReviewModal");
    if (modal) modal.style.display = "none";
    this.activeRequestId = null;
  },

  openRejectModal(id) {
    this.openReviewModal(id);
    const rejGroup = document.getElementById("hodRejectionReasonGroup");
    if (rejGroup) {
      rejGroup.style.display = "block";
      const input = document.getElementById("hodRejectionReasonInput");
      if (input) input.focus();
    }
  },

  quickApprove(id) {
    this.activeRequestId = id;
    const r = this.requests.find(x => x.id === id);
    const isBonafide = r && ((r.odType && r.odType.toLowerCase().includes("bonafide")) || (r.id && r.id.startsWith("EPOCH-BNF")));
    const promptMsg = isBonafide
      ? `Endorse Bonafide Certificate request (${id}) and forward to Principal Dr. B. Sanjay Gandhi for final approval?`
      : `Grant official HOD final approval for request (${id})?`;

    if (confirm(promptMsg)) {
      this.approveOd();
    }
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

    const comment = (document.getElementById("hodReviewCommentInput")?.value || "").trim();

    try {
      const res = await Auth.fetchWithAuth(`/api/od/${this.activeRequestId}/hod-action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approved: true, reason: comment || "Department endorsement granted." })
      });

      if (!res.ok) {
        if (window.DemoStore) {
          DemoStore.hodReviewOd(this.activeRequestId, true, "HOD endorsement granted.");
        }
      }

      this.closeReviewModal();
      await this.loadRequests();
      if (window.App && App.refreshNotifications) App.refreshNotifications();

      if (isBonafide) {
        Toast.show("Bonafide Certificate endorsed and forwarded to Principal for final approval!", "success");
      } else {
        Toast.show("Request officially approved and finalized by HOD! Form & Certificate enabled.", "success");
      }
    } catch (err) {
      if (window.DemoStore) {
        DemoStore.hodReviewOd(this.activeRequestId, true, "HOD endorsement granted.");
        this.closeReviewModal();
        await this.loadRequests();
        if (isBonafide) {
          Toast.show("Bonafide Certificate forwarded to Principal in demo ledger!", "success");
        } else {
          Toast.show("Request officially approved by HOD in demo ledger! PDF download enabled.", "success");
        }
      } else {
        Toast.show("Error: " + err.message, "danger");
      }
    }
  },

  toggleRejectBox() {
    const group = document.getElementById("hodRejectionReasonGroup");
    if (!group) return;
    group.style.display = group.style.display === "none" ? "block" : "none";
    if (group.style.display === "block") {
      const input = document.getElementById("hodRejectionReasonInput");
      if (input) input.focus();
    }
  },

  async confirmRejectOd() {
    if (!this.activeRequestId) return;
    const reason = document.getElementById("hodRejectionReasonInput").value.trim();
    if (!reason) {
      Toast.show("Please provide the HOD rejection reason.", "warning");
      return;
    }

    try {
      const res = await Auth.fetchWithAuth(`/api/od/${this.activeRequestId}/hod-action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approved: false, reason: reason })
      });

      if (!res.ok) {
        if (window.DemoStore) {
          DemoStore.hodReviewOd(this.activeRequestId, false, reason);
        }
      }

      this.closeReviewModal();
      await this.loadRequests();
      if (window.App && App.refreshNotifications) App.refreshNotifications();
      Toast.show("Request rejected. Student and advisor have been notified with the reason.", "info");
    } catch (err) {
      if (window.DemoStore) {
        DemoStore.hodReviewOd(this.activeRequestId, false, reason);
        this.closeReviewModal();
        await this.loadRequests();
        Toast.show("Request rejected with reason in demo ledger.", "info");
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
        const preview = document.getElementById("hodSignaturePreview");
        if (data.hasSignature && data.signature && data.signature.signatureBase64) {
          preview.innerHTML = `<img src="${data.signature.signatureBase64}" alt="HOD Signature" style="max-height:55px; max-width:200px; border:1px solid #cbd5e1; padding:4px; background:#fff; border-radius:6px;">`;
        } else {
          preview.innerHTML = '<span style="color:#94a3b8; font-size:12px;">✍️ Department seal active</span>';
        }
      }
    } catch (e) {
      console.warn("HOD signature load fallback:", e);
    }
  },

  handleSignatureUpload(e) {
    this.saveSignature();
  },

  async saveSignature() {
    const input = document.getElementById("hodSigInput");
    if (!input.files || input.files.length === 0) {
      Toast.show("Please select a signature image file (PNG/JPEG) to upload.", "warning");
      return;
    }

    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target.result;
      try {
        await Auth.fetchWithAuth("/api/staff/signature", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ signatureBase64: base64 })
        });
        const preview = document.getElementById("hodSignaturePreview");
        if (preview) {
          preview.innerHTML = `<img src="${base64}" alt="HOD Signature" style="max-height:55px; max-width:200px; border:1px solid #cbd5e1; padding:4px; background:#fff; border-radius:6px;">`;
        }
        Toast.show("HOD authorized signature saved securely!", "success");
      } catch (err) {
        const preview = document.getElementById("hodSignaturePreview");
        if (preview) {
          preview.innerHTML = `<img src="${base64}" alt="HOD Signature" style="max-height:55px; max-width:200px; border:1px solid #cbd5e1; padding:4px; background:#fff; border-radius:6px;">`;
        }
        Toast.show("HOD signature updated in demo state!", "success");
      }
    };
    reader.readAsDataURL(file);
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

if (typeof window !== "undefined") {
  window.HodPortal = HodPortal;
}
if (typeof module !== "undefined" && module.exports) {
  module.exports = HodPortal;
}
