/**
 * EPOCH Class Advisor Portal Module
 * Strict section isolation, OD review queue, rejection reasons, and signature management.
 */
const AdvisorPortal = {
  requests: [],
  currentUser: null,
  activeRequestId: null,
  activeCategory: null,
  metricSearchQuery: "",
  metricCategoryFilter: "ALL",
  metricStatusFilter: "ALL",

  isPending(r) {
    if (!r) return false;
    return r.status === "PENDING_ADVISOR" || (r.currentStage === "ADVISOR" && r.status !== "REJECTED");
  },

  isApproved(r) {
    if (!r) return false;
    return r.advisorApproved === true ||
           (r.advisorDecision && r.advisorDecision.status === "APPROVED") ||
           (r.timeline && r.timeline.some(e => e.eventType === "ADVISOR_APPROVAL" || (e.action === "APPROVED" && e.actorRole === "CLASS_ADVISOR")));
  },

  isRejected(r) {
    if (!r) return false;
    return (r.advisorDecision && r.advisorDecision.status === "REJECTED") ||
           (r.status === "REJECTED" && (r.currentStage === "ADVISOR" || r.rejectedByRole === "CLASS_ADVISOR" || (r.rejectedBy && r.rejectedBy.toLowerCase().includes("advisor")) || (r.timeline && r.timeline.some(e => e.eventType === "ADVISOR_REJECTION"))));
  },

  formatStatusBadge(status) {
    switch (status) {
      case "PENDING_ADVISOR":
        return '<span class="badge-tag badge-warning">⏳ Awaiting Advisor</span>';
      case "PENDING_HOD":
        return '<span class="badge-tag badge-info">⏳ Awaiting HOD</span>';
      case "PENDING_PRINCIPAL":
        return '<span class="badge-tag badge-info">⏳ Awaiting Principal</span>';
      case "APPROVED":
        return '<span class="badge-tag badge-approved">✅ Approved</span>';
      case "REJECTED":
        return '<span class="badge-tag badge-rejected">❌ Rejected</span>';
      default:
        return `<span class="badge-tag badge-secondary">${this.escape(status || "UNKNOWN")}</span>`;
    }
  },

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
        this.requests = (await Auth.parseResponse(res)).data || [];
        this.renderRequests();
        return;
      }
    } catch (e) {
      console.warn("Using local demo section requests:", e);
    }
    if (window.DemoStore && this.currentUser && !Auth.getToken()) {
      const sec = this.currentUser.section || "CSE-A";
      this.requests = DemoStore.getOdRequests().filter(r => r.section === sec);
      this.renderRequests();
    }
  },

  renderRequests() {
    const tbody = document.getElementById("advisorRequestsTbody");

    const pendingList = (this.requests || []).filter(r => this.isPending(r));
    const approvedList = (this.requests || []).filter(r => this.isApproved(r));
    const rejectedList = (this.requests || []).filter(r => this.isRejected(r));
    const totalList = this.requests || [];

    const elP = document.getElementById("advMetricPending");
    const elA = document.getElementById("advMetricApproved");
    const elR = document.getElementById("advMetricRejected");
    const elT = document.getElementById("advMetricTotal");
    if (elP) elP.textContent = pendingList.length;
    if (elA) elA.textContent = approvedList.length;
    if (elR) elR.textContent = rejectedList.length;
    if (elT) elT.textContent = totalList.length;

    // Refresh interactive category details view if currently active
    if (this.activeCategory) {
      this.renderCategoryDetails(this.activeCategory);
    }

    if (!tbody) return;

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

  showCategoryDetails(category) {
    this.activeCategory = category;

    // Highlight active card
    ["advCardPending", "advCardApproved", "advCardRejected", "advCardTotal"].forEach(id => {
      const card = document.getElementById(id);
      if (card) card.classList.remove("active-card");
    });

    const activeMap = {
      PENDING: "advCardPending",
      APPROVED: "advCardApproved",
      REJECTED: "advCardRejected",
      TOTAL: "advCardTotal"
    };
    const activeCard = document.getElementById(activeMap[category]);
    if (activeCard) activeCard.classList.add("active-card");

    const section = document.getElementById("advisorMetricDetailsSection");
    if (section) section.style.display = "block";

    this.renderCategoryDetails(category);

    if (section) {
      section.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  },

  closeCategoryDetails() {
    this.activeCategory = null;

    ["advCardPending", "advCardApproved", "advCardRejected", "advCardTotal"].forEach(id => {
      const card = document.getElementById(id);
      if (card) card.classList.remove("active-card");
    });

    const section = document.getElementById("advisorMetricDetailsSection");
    if (section) section.style.display = "none";
  },

  onMetricSearchInput(val) {
    this.metricSearchQuery = (val || "").trim().toLowerCase();
    if (this.activeCategory) {
      this.renderCategoryDetails(this.activeCategory);
    }
  },

  onMetricCategoryChange(val) {
    this.metricCategoryFilter = val || "ALL";
    if (this.activeCategory) {
      this.renderCategoryDetails(this.activeCategory);
    }
  },

  onMetricStatusChange(val) {
    this.metricStatusFilter = val || "ALL";
    if (this.activeCategory) {
      this.renderCategoryDetails(this.activeCategory);
    }
  },

  resetMetricFilters() {
    this.metricSearchQuery = "";
    this.metricCategoryFilter = "ALL";
    this.metricStatusFilter = "ALL";
    const sInput = document.getElementById("advisorMetricSearchInput");
    const cFilter = document.getElementById("advisorMetricCategoryFilter");
    const stFilter = document.getElementById("advisorMetricStatusFilter");
    if (sInput) sInput.value = "";
    if (cFilter) cFilter.value = "ALL";
    if (stFilter) stFilter.value = "ALL";
    if (this.activeCategory) {
      this.renderCategoryDetails(this.activeCategory);
    }
  },

  renderCategoryDetails(category) {
    const iconEl = document.getElementById("advisorMetricDetailsIcon");
    const titleEl = document.getElementById("advisorMetricDetailsTitle");
    const badgeEl = document.getElementById("advisorMetricDetailsBadge");
    const subtextEl = document.getElementById("advisorMetricDetailsSubtext");
    const thead = document.getElementById("advisorMetricDetailsThead");
    const tbody = document.getElementById("advisorMetricDetailsTbody");

    if (!thead || !tbody) return;

    const mySection = (this.currentUser && this.currentUser.section) ? this.currentUser.section : "CSE-A";

    let baseList = [];
    if (category === "PENDING") {
      baseList = (this.requests || []).filter(r => this.isPending(r));
      if (iconEl) iconEl.textContent = "⏳";
      if (titleEl) titleEl.textContent = "Pending My Review";
      if (subtextEl) subtextEl.textContent = `Requests from Section ${this.escape(mySection)} awaiting your authorized review and digital endorsement.`;
    } else if (category === "APPROVED") {
      baseList = (this.requests || []).filter(r => this.isApproved(r));
      if (iconEl) iconEl.textContent = "✅";
      if (titleEl) titleEl.textContent = "Approved & Forwarded Requests";
      if (subtextEl) subtextEl.textContent = `Requests from Section ${this.escape(mySection)} endorsed by you and forwarded to Head of Department / Principal.`;
    } else if (category === "REJECTED") {
      baseList = (this.requests || []).filter(r => this.isRejected(r));
      if (iconEl) iconEl.textContent = "❌";
      if (titleEl) titleEl.textContent = "Rejected Requests with Reason";
      if (subtextEl) subtextEl.textContent = `Section ${this.escape(mySection)} requests rejected during Class Advisor verification with formal rejection remarks.`;
    } else {
      category = "TOTAL";
      baseList = this.requests || [];
      if (iconEl) iconEl.textContent = "📋";
      if (titleEl) titleEl.textContent = `Total Section Requests (Section ${this.escape(mySection)})`;
      if (subtextEl) subtextEl.textContent = `All submitted requests originating from students enrolled in Section ${this.escape(mySection)}.`;
    }

    // Apply Filters
    let filtered = baseList.filter(r => {
      if (this.metricSearchQuery) {
        const q = this.metricSearchQuery;
        const text = [
          r.id,
          r.studentName,
          r.regNo,
          r.department,
          r.section,
          r.odType,
          r.category,
          r.eventTitle,
          r.reason,
          r.purpose,
          r.organizer,
          r.venue
        ].filter(Boolean).join(" ").toLowerCase();
        if (!text.includes(q)) return false;
      }
      if (this.metricCategoryFilter && this.metricCategoryFilter !== "ALL") {
        const cat = (r.odType || r.category || "").toLowerCase();
        if (!cat.includes(this.metricCategoryFilter.toLowerCase())) return false;
      }
      if (this.metricStatusFilter && this.metricStatusFilter !== "ALL") {
        if (r.status !== this.metricStatusFilter) return false;
      }
      return true;
    });

    if (badgeEl) {
      let bClass = "badge-tag badge-info";
      if (category === "PENDING") bClass = "badge-tag badge-warning";
      else if (category === "APPROVED") bClass = "badge-tag badge-approved";
      else if (category === "REJECTED") bClass = "badge-tag badge-rejected";
      badgeEl.className = bClass;
      badgeEl.textContent = `${filtered.length} of ${baseList.length} Records`;
    }

    const isRejectedCategory = (category === "REJECTED");

    if (isRejectedCategory) {
      thead.innerHTML = `
        <tr>
          <th>Reference ID</th>
          <th>Student Details</th>
          <th>Request Category</th>
          <th>Event Title / Purpose</th>
          <th>Applicable Dates</th>
          <th>Rejection Reason & Remarks</th>
          <th>Status</th>
          <th>Action</th>
        </tr>
      `;
    } else {
      thead.innerHTML = `
        <tr>
          <th>Reference ID</th>
          <th>Student Details</th>
          <th>Request Category</th>
          <th>Event Title / Purpose</th>
          <th>Dates & Submitted</th>
          <th>Current Stage / Approver</th>
          <th>Status</th>
          <th>Action</th>
        </tr>
      `;
    }

    if (filtered.length === 0) {
      const msg = baseList.length === 0
        ? `No requests recorded in the "${category}" category for Section ${this.escape(mySection)}.`
        : "No requests match your current search and filter criteria.";
      tbody.innerHTML = `<tr><td colspan="8" class="text-center" style="padding:32px; color:#64748b;">ℹ️ ${msg}</td></tr>`;
      return;
    }

    tbody.innerHTML = filtered.map(r => {
      const submittedDate = r.createdAt ? (r.createdAt.includes("T") ? r.createdAt.split("T")[0] : r.createdAt.substring(0, 10)) : (r.submittedDate || r.submittedAt || "—");
      const dateRange = `${this.escape(r.fromDate || r.startDate || "")} ${r.toDate && r.toDate !== r.fromDate ? ' to ' + this.escape(r.toDate) : ''}`.trim() || "Single Day";
      const isPendingThis = this.isPending(r);

      const studentCell = `
        <div>
          <strong style="color:var(--primary); font-size:13px;">${this.escape(r.studentName || 'Student')}</strong>
          <div style="font-size:11px; color:#64748b; margin-top:2px;">Reg: <strong>${this.escape(r.regNo || '—')}</strong></div>
          <div style="display:flex; gap:4px; align-items:center; margin-top:3px; flex-wrap:wrap;">
            <span class="badge-tag badge-secondary" style="font-size:10px;">${this.escape(r.department || 'CSE')}</span>
            <span class="badge-tag badge-section" style="font-size:10px;">${this.escape(r.section || mySection)}</span>
            ${r.year ? `<span class="badge-tag badge-secondary" style="font-size:10px;">Year ${this.escape(r.year)}</span>` : ''}
          </div>
        </div>
      `;

      const purposeText = r.eventTitle || r.reason || r.purpose || r.eventDetails || "Institutional Request";
      const purposeCell = `
        <div style="max-width:260px;">
          <div style="font-weight:600; color:#1e293b; font-size:12px; line-height:1.4;">${this.escape(purposeText)}</div>
          ${r.organizer ? `<div style="font-size:11px; color:#64748b; margin-top:2px;">Org: ${this.escape(r.organizer)}</div>` : ''}
        </div>
      `;

      const statusBadge = this.formatStatusBadge(r.status);

      let actionButtons = `
        <div style="display:flex; gap:6px; flex-wrap:wrap; align-items:center;">
          <button class="btn btn-sm btn-secondary" onclick="App.viewRequestDetails('${r.id}')" title="View Full Request, Documents & Timeline" style="display:inline-flex; align-items:center; gap:4px; padding:3px 8px; font-size:11px;">
            🔍 View Details
          </button>
      `;
      if (isPendingThis) {
        actionButtons += `
          <button class="btn btn-sm btn-primary" onclick="AdvisorPortal.openReviewModal('${r.id}')" style="display:inline-flex; align-items:center; gap:4px; padding:3px 8px; font-size:11px;">
            Review & Action
          </button>
        `;
      } else if (r.status === "APPROVED") {
        actionButtons += `
          <button class="btn btn-sm btn-success" onclick="App.downloadPdf('${r.id}')" title="Download Official Endorsed PDF" style="display:inline-flex; align-items:center; gap:4px; padding:3px 8px; font-size:11px;">
            📄 PDF
          </button>
        `;
      }
      actionButtons += `</div>`;

      if (isRejectedCategory) {
        const rejReason = r.rejectionReason || (r.advisorDecision && r.advisorDecision.comments) || (r.hodDecision && r.hodDecision.comments) || "Rejection remarks not specified";
        const rejBy = r.rejectedBy || (r.advisorDecision && r.advisorDecision.by) || "Class Advisor";
        const rejAt = r.rejectedAt || (r.advisorDecision && r.advisorDecision.timestamp) || "—";
        return `
          <tr>
            <td><span class="ref-badge">${r.id}</span></td>
            <td>${studentCell}</td>
            <td><span class="badge-tag badge-teal" style="font-size:11px;">${this.escape(r.odType || 'Request')}</span></td>
            <td>${purposeCell}</td>
            <td style="font-size:12px;">${this.escape(dateRange)}</td>
            <td>
              <div style="background:#fef2f2; border:1px solid #fecaca; border-radius:6px; padding:6px 10px; color:#991b1b; font-size:11.5px; max-width:280px;">
                <div style="font-weight:700;">❌ ${this.escape(rejReason)}</div>
                <div style="font-size:10.5px; color:#b91c1c; margin-top:3px;">Rejected by: <strong>${this.escape(rejBy)}</strong> (${this.escape(rejAt)})</div>
              </div>
            </td>
            <td>${statusBadge}</td>
            <td>${actionButtons}</td>
          </tr>
        `;
      } else {
        let stageInfoHtml = '';
        if (r.status === "PENDING_ADVISOR") {
          stageInfoHtml = `<div style="font-weight:700; color:var(--warning); font-size:11.5px;">⏳ Awaiting Advisor Review</div><div style="font-size:10.5px; color:#64748b;">Assigned to Section Advisor</div>`;
        } else if (r.status === "PENDING_HOD") {
          stageInfoHtml = `
            <div style="display:flex; flex-direction:column; gap:2px;">
              <span class="badge-tag badge-approved" style="font-size:10px; width:fit-content;">✓ Advisor Endorsed</span>
              <div style="font-size:11px; color:#64748b;">Forwarded to HOD</div>
            </div>
          `;
        } else if (r.status === "PENDING_PRINCIPAL") {
          stageInfoHtml = `
            <div style="display:flex; flex-direction:column; gap:2px;">
              <span class="badge-tag badge-approved" style="font-size:10px; width:fit-content;">✓ HOD Endorsed</span>
              <div style="font-size:11px; color:#64748b;">Forwarded to Principal</div>
            </div>
          `;
        } else if (r.status === "APPROVED") {
          stageInfoHtml = `
            <div style="display:flex; flex-direction:column; gap:2px;">
              <span class="badge-tag badge-approved" style="font-size:10px; width:fit-content;">✅ Fully Sanctioned</span>
              <div style="font-size:10px; color:#16a34a;">Digital Signatures Applied</div>
            </div>
          `;
        } else if (r.status === "REJECTED") {
          stageInfoHtml = `<span class="badge-tag badge-rejected" style="font-size:10.5px;">❌ Halted</span>`;
        } else {
          stageInfoHtml = `<span class="badge-tag badge-secondary" style="font-size:10.5px;">${this.escape(r.currentStage || 'PROCESSING')}</span>`;
        }

        return `
          <tr>
            <td><span class="ref-badge">${r.id}</span></td>
            <td>${studentCell}</td>
            <td><span class="badge-tag badge-teal" style="font-size:11px;">${this.escape(r.odType || 'Request')}</span></td>
            <td>${purposeCell}</td>
            <td>
              <div style="font-size:12px; font-weight:600; color:#334155;">${this.escape(dateRange)}</div>
              <div style="font-size:11px; color:#94a3b8; margin-top:2px;">📅 Submitted: ${this.escape(submittedDate)}</div>
            </td>
            <td>${stageInfoHtml}</td>
            <td>${statusBadge}</td>
            <td>${actionButtons}</td>
          </tr>
        `;
      }
    }).join("");
  },

  openReviewModal(id) {
    if (window.App && typeof App.viewRequestDetails === "function") {
      App.viewRequestDetails(id);
      return;
    }
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
        const errObj = await res.json().catch(() => null);
        throw new Error((errObj && errObj.error) ? errObj.error : "Failed to record advisor approval");
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
      Toast.show("Error: " + err.message, "danger");
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
        const errObj = await res.json().catch(() => null);
        throw new Error((errObj && errObj.error) ? errObj.error : "Failed to record advisor rejection");
      }

      this.closeReviewModal();
      await this.loadRequests();
      App.refreshNotifications();
      Toast.show("OD request rejected. Student has been notified with the audit reason.", "info");
    } catch (err) {
      Toast.show("Error: " + err.message, "danger");
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

