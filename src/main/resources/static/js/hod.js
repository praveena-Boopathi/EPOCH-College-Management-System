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
  activeCategory: null,
  metricSearchQuery: "",
  metricCategoryFilter: "ALL",
  metricStatusFilter: "ALL",

  formatStatusBadge(status) {
    switch (status) {
      case "PENDING_ADVISOR":
        return '<span class="badge-tag badge-warning">⏳ Awaiting Advisor</span>';
      case "PENDING_HOD":
        return '<span class="badge-tag badge-warning">⏳ Awaiting HOD</span>';
      case "PENDING_PRINCIPAL":
        return '<span class="badge-tag badge-info">🏛️ Forwarded to Principal</span>';
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
    return (r.hodDecision && r.hodDecision.status === "REJECTED") ||
           (r.status === "REJECTED" && (r.currentStage === "HOD" || r.rejectedByRole === "HOD" || (r.rejectedBy && r.rejectedBy.toLowerCase().includes("hod")) || (r.timeline && r.timeline.some(e => e.eventType === "HOD_REJECTION"))));
  },

  isApproved(r) {
    if (!r || this.isRejected(r)) return false;
    if (r.hodApproved === true) return true;
    if (r.hodDecision && r.hodDecision.status === "APPROVED") return true;
    if (r.status === "PENDING_PRINCIPAL") return true;
    if (r.status === "APPROVED") return true;
    if (r.timeline && r.timeline.some(e => e.eventType === "HOD_APPROVAL" || (e.action === "APPROVED" && e.actorRole === "HOD"))) return true;
    return false;
  },

  isPending(r) {
    if (!r || this.isRejected(r) || this.isApproved(r)) return false;
    return r.status === "PENDING_HOD" || r.currentStage === "HOD" || r.assignedReviewerRole === "HOD" || r.assignedReviewerId === "gopinath";
  },

  renderRequests() {
    const tbody = document.getElementById("hodRequestsTbody");

    const pendingList = (this.requests || []).filter(r => this.isPending(r));
    const approvedList = (this.requests || []).filter(r => this.isApproved(r));
    const rejectedList = (this.requests || []).filter(r => this.isRejected(r));
    const totalList = this.requests || [];

    const elP = document.getElementById("hodMetricPending");
    const elA = document.getElementById("hodMetricApproved");
    const elR = document.getElementById("hodMetricRejected");
    const elT = document.getElementById("hodMetricTotal");
    const qBadge = document.getElementById("hodQueueCountBadge");

    if (elP) elP.textContent = pendingList.length;
    if (elA) elA.textContent = approvedList.length;
    if (elR) elR.textContent = rejectedList.length;
    if (elT) elT.textContent = totalList.length;
    if (qBadge) {
      qBadge.textContent = `${pendingList.length} Pending`;
      qBadge.className = pendingList.length > 0 ? "badge-tag badge-warning" : "badge-tag badge-approved";
    }

    const bP = document.getElementById("hodFilterBadgePending");
    const bA = document.getElementById("hodFilterBadgeApproved");
    const bR = document.getElementById("hodFilterBadgeRejected");
    const bAll = document.getElementById("hodFilterBadgeAll");
    if (bP) bP.textContent = pendingList.length;
    if (bA) bA.textContent = approvedList.length;
    if (bR) bR.textContent = rejectedList.length;
    if (bAll) bAll.textContent = totalList.length;

    // Refresh interactive category details if currently open
    if (this.activeCategory) {
      this.renderCategoryDetails(this.activeCategory);
    }

    if (!tbody) return;

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
      const isUndertaking = (r.odType && (r.odType.toLowerCase().includes("undertaking") || r.odType.includes("75%"))) || (r.id && r.id.startsWith("EPOCH-UT"));
      const is3Stage = isBonafide || isUndertaking;
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
        stageBadge = is3Stage ? '<span class="badge-tag badge-approved">✅ Principal Sanctioned</span>' : '<span class="badge-tag badge-approved">✅ HOD Approved</span>';
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

      const reqTypeLabel = isUndertaking ? "75% Attendance Undertaking" : (isBonafide ? "Bonafide Certificate" : (isLeave ? (r.odType || "Leave Application") : (r.odType || "On-Duty Requisition")));
      const reqTypeBadgeClass = isUndertaking ? "badge-warning" : (isBonafide ? "badge-teal" : (isLeave ? "badge-info" : "badge-primary"));
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

  showCategoryDetails(category) {
    this.activeCategory = category;

    // Highlight active card
    ["hodCardPending", "hodCardApproved", "hodCardRejected", "hodCardTotal"].forEach(id => {
      const card = document.getElementById(id);
      if (card) card.classList.remove("active-card");
    });

    const activeMap = {
      PENDING: "hodCardPending",
      APPROVED: "hodCardApproved",
      REJECTED: "hodCardRejected",
      TOTAL: "hodCardTotal"
    };
    const activeCard = document.getElementById(activeMap[category]);
    if (activeCard) activeCard.classList.add("active-card");

    const section = document.getElementById("hodMetricDetailsSection");
    if (section) section.style.display = "block";

    this.renderCategoryDetails(category);

    if (section) {
      section.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  },

  closeCategoryDetails() {
    this.activeCategory = null;

    ["hodCardPending", "hodCardApproved", "hodCardRejected", "hodCardTotal"].forEach(id => {
      const card = document.getElementById(id);
      if (card) card.classList.remove("active-card");
    });

    const section = document.getElementById("hodMetricDetailsSection");
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
    const sInput = document.getElementById("hodMetricSearchInput");
    const cFilter = document.getElementById("hodMetricCategoryFilter");
    const stFilter = document.getElementById("hodMetricStatusFilter");
    if (sInput) sInput.value = "";
    if (cFilter) cFilter.value = "ALL";
    if (stFilter) stFilter.value = "ALL";
    if (this.activeCategory) {
      this.renderCategoryDetails(this.activeCategory);
    }
  },

  renderCategoryDetails(category) {
    const iconEl = document.getElementById("hodMetricDetailsIcon");
    const titleEl = document.getElementById("hodMetricDetailsTitle");
    const badgeEl = document.getElementById("hodMetricDetailsBadge");
    const subtextEl = document.getElementById("hodMetricDetailsSubtext");
    const thead = document.getElementById("hodMetricDetailsThead");
    const tbody = document.getElementById("hodMetricDetailsTbody");

    if (!thead || !tbody) return;

    let baseList = [];
    if (category === "PENDING") {
      baseList = (this.requests || []).filter(r => this.isPending(r));
      if (iconEl) iconEl.textContent = "⏳";
      if (titleEl) titleEl.textContent = "Pending My Review";
      if (subtextEl) subtextEl.textContent = "Department requests endorsed by Class Advisors awaiting your official executive decision.";
    } else if (category === "APPROVED") {
      baseList = (this.requests || []).filter(r => this.isApproved(r));
      if (iconEl) iconEl.textContent = "✅";
      if (titleEl) titleEl.textContent = "Approved & Forwarded Requests";
      if (subtextEl) subtextEl.textContent = "Requests approved by HOD (forwarded to Principal for Bonafide or finalized for OD/Leave).";
    } else if (category === "REJECTED") {
      baseList = (this.requests || []).filter(r => this.isRejected(r));
      if (iconEl) iconEl.textContent = "❌";
      if (titleEl) titleEl.textContent = "Rejected Requests with Reason";
      if (subtextEl) subtextEl.textContent = "Department requests rejected during HOD review with recorded rejection reasons.";
    } else {
      category = "TOTAL";
      baseList = this.requests || [];
      if (iconEl) iconEl.textContent = "🏛️";
      if (titleEl) titleEl.textContent = "Total Department Requests (CSE)";
      if (subtextEl) subtextEl.textContent = "Complete registry of all student requests across CSE-A, CSE-B, and CSE-C sections.";
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
          r.dept,
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
          <th>Advisor Endorsement</th>
          <th>Status</th>
          <th>Action</th>
        </tr>
      `;
    }

    if (filtered.length === 0) {
      const msg = baseList.length === 0
        ? `No requests recorded in the "${category}" category for Department of CSE.`
        : "No requests match your current search and filter criteria.";
      tbody.innerHTML = `<tr><td colspan="9" class="text-center" style="padding:32px; color:#64748b;">ℹ️ ${msg}</td></tr>`;
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
            <span class="badge-tag badge-secondary" style="font-size:10px;">${this.escape(r.dept || r.department || 'CSE')}</span>
            <span class="badge-tag badge-section" style="font-size:10px;">${this.escape(r.section || 'CSE-A')}</span>
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
          <button class="btn btn-sm btn-primary" onclick="HodPortal.openReviewModal('${r.id}')" style="display:inline-flex; align-items:center; gap:4px; padding:3px 8px; font-size:11px;">
            Review & Action
          </button>
          <button class="btn btn-sm btn-success" onclick="HodPortal.quickApprove('${r.id}')" style="display:inline-flex; align-items:center; gap:4px; padding:3px 8px; font-size:11px; background:#059669; color:#fff;">
            ⚡ Quick Approve
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
        const rejReason = r.rejectionReason || (r.hodDecision && r.hodDecision.comments) || (r.advisorDecision && r.advisorDecision.comments) || "Rejection remarks not specified";
        const rejBy = r.rejectedBy || (r.hodDecision && r.hodDecision.by) || "Head of Department";
        const rejAt = r.rejectedAt || (r.hodDecision && r.hodDecision.timestamp) || "—";
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
        const adv = r.advisorDecision || {};
        let advEndorsementHtml = '';
        if (adv.status === "APPROVED" || r.advisorApproved || r.status === "PENDING_HOD" || r.status === "PENDING_PRINCIPAL" || r.status === "APPROVED") {
          const advName = adv.by || adv.approver || (r.section === 'CSE-B' ? 'Dr. Divyabharathi' : (r.section === 'CSE-C' ? 'Mrs. Rajavathi Jayapriya' : 'Mrs. P. Arularasi'));
          advEndorsementHtml = `
            <div>
              <span class="badge-tag badge-approved" style="font-size:10px; width:fit-content;">✓ Endorsed</span>
              <div style="font-size:11px; color:#475569; margin-top:2px;">${this.escape(advName)}</div>
            </div>
          `;
        } else if (adv.status === "REJECTED") {
          advEndorsementHtml = `<span class="badge-tag badge-rejected" style="font-size:10.5px;">❌ Advisor Rejected</span>`;
        } else {
          advEndorsementHtml = `<span class="badge-tag badge-secondary" style="font-size:10.5px;">Pending Advisor</span>`;
        }

        let stageInfoHtml = '';
        if (r.status === "PENDING_HOD") {
          stageInfoHtml = `<div style="font-weight:700; color:var(--warning); font-size:11.5px;">⏳ Awaiting HOD Action</div>`;
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
            <td>${advEndorsementHtml}</td>
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

    const isBonafide = (r.odType && r.odType.toLowerCase().includes("bonafide")) || (r.id && r.id.startsWith("EPOCH-BNF"));
    const isUndertaking = (r.odType && (r.odType.toLowerCase().includes("undertaking") || r.odType.includes("75%"))) || (r.id && r.id.startsWith("EPOCH-UT"));
    const is3Stage = isBonafide || isUndertaking;
    const isLeave = (r.odType && r.odType.toLowerCase().includes("leave")) || (r.id && r.id.startsWith("EPOCH-LV"));
    const pendingReview = this.isPending(r);

    document.getElementById("hodRevModalId").textContent = r.id;
    document.getElementById("hodRevStudentName").textContent = r.studentName || "Student";
    document.getElementById("hodRevRegNo").textContent = `${r.regNo || "-"} (${r.section || "CSE-A"})`;
    document.getElementById("hodRevDept").textContent = `${r.dept || "Computer Science & Engineering"}`;
    document.getElementById("hodRevOdType").textContent = r.odType || (isUndertaking ? "75% Attendance Undertaking" : (isBonafide ? "Bonafide Certificate" : (isLeave ? "Leave Application" : "On-Duty")));
    document.getElementById("hodRevEventTitle").textContent = r.eventTitle || r.odType || (isUndertaking ? "75% Attendance Undertaking" : (isBonafide ? "Bonafide Certificate" : "Academic Event"));
    document.getElementById("hodRevOrganizer").textContent = r.organizer || ((isBonafide || isUndertaking) ? "Gnanamani College of Technology" : "Academic Body");
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
        if (is3Stage) {
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
    const isUndertaking = (r.odType && (r.odType.toLowerCase().includes("undertaking") || r.odType.includes("75%"))) || (r.id && r.id.startsWith("EPOCH-UT"));
    const is3Stage = isBonafide || isUndertaking;
    const adv = r.advisorDecision || {};
    const hod = r.hodDecision || {};
    const prin = r.principalDecision || {};

    const advApproved = adv.status === "APPROVED" || r.status === "PENDING_HOD" || r.status === "PENDING_PRINCIPAL" || r.status === "APPROVED";
    const hodApproved = this.isApproved(r);
    const prinApproved = r.status === "APPROVED" && is3Stage;

    let stepperHtml = '';
    if (is3Stage) {
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
    const isUndertaking = r && ((r.odType && (r.odType.toLowerCase().includes("undertaking") || r.odType.includes("75%"))) || (r.id && r.id.startsWith("EPOCH-UT")));
    const promptMsg = isUndertaking
      ? `Endorse 75% Attendance Undertaking (${id}) and forward to Principal Dr. B. Sanjay Gandhi for final approval?`
      : (isBonafide
        ? `Endorse Bonafide Certificate request (${id}) and forward to Principal Dr. B. Sanjay Gandhi for final approval?`
        : `Grant official HOD final approval for request (${id})?`);

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
    const isUndertaking = r && ((r.odType && (r.odType.toLowerCase().includes("undertaking") || r.odType.includes("75%"))) || (r.id && r.id.startsWith("EPOCH-UT")));

    const comment = (document.getElementById("hodReviewCommentInput")?.value || "").trim();

    try {
      const res = await Auth.fetchWithAuth(`/api/od/${this.activeRequestId}/hod-action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approved: true, reason: comment || "Department endorsement granted." })
      });

      if (!res.ok) {
        const errObj = await res.json().catch(() => null);
        throw new Error((errObj && errObj.error) ? errObj.error : "Failed to record HOD approval");
      }

      this.closeReviewModal();
      await this.loadRequests();
      if (window.App && App.refreshNotifications) App.refreshNotifications();

      if (isBonafide) {
        Toast.show("Bonafide Certificate endorsed and forwarded to Principal for final approval!", "success");
      } else if (isUndertaking) {
        Toast.show("75% Attendance Undertaking endorsed and forwarded to Principal for final approval!", "success");
      } else {
        Toast.show("Request officially approved and finalized by HOD! Form & Certificate enabled.", "success");
      }
    } catch (err) {
      Toast.show("Error: " + err.message, "danger");
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
        const errObj = await res.json().catch(() => null);
        throw new Error((errObj && errObj.error) ? errObj.error : "Failed to record HOD rejection");
      }

      this.closeReviewModal();
      await this.loadRequests();
      if (window.App && App.refreshNotifications) App.refreshNotifications();
      Toast.show("Request rejected. Student and advisor have been notified with the reason.", "info");
    } catch (err) {
      Toast.show("Error: " + err.message, "danger");
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
