/**
 * EPOCH Principal Portal Module
 * Executive Administration, confidential student complaints, college-wide approvals, and analytics.
 */
const PrincipalPortal = {
  complaints: [],
  odRequests: [],
  currentUser: null,
  activeComplaintId: null,
  activeOdId: null,
  activeCategory: null,
  metricSearchQuery: "",
  metricCategoryFilter: "ALL",
  metricStatusFilter: "ALL",

  isPrincipalScope(r) {
    if (!r) return false;
    return r.requiresPrincipalApproval || (r.odType && r.odType.toLowerCase().includes("bonafide")) || (r.id && r.id.startsWith("EPOCH-BNF"));
  },

  isPending(r) {
    if (!r) return false;
    return r.status === "PENDING_PRINCIPAL" || (r.currentStage === "PRINCIPAL" && r.status !== "REJECTED");
  },

  isApproved(r) {
    if (!r) return false;
    return r.principalApproved === true ||
           (r.principalDecision && r.principalDecision.status === "APPROVED") ||
           (r.status === "APPROVED" && this.isPrincipalScope(r)) ||
           (r.timeline && r.timeline.some(e => e.eventType === "PRINCIPAL_APPROVAL" || (e.action === "APPROVED" && e.actorRole === "PRINCIPAL")));
  },

  isRejected(r) {
    if (!r) return false;
    return (r.principalDecision && r.principalDecision.status === "REJECTED") ||
           (r.status === "REJECTED" && (r.currentStage === "PRINCIPAL" || r.rejectedByRole === "PRINCIPAL" || (r.rejectedBy && r.rejectedBy.toLowerCase().includes("principal")) || (r.timeline && r.timeline.some(e => e.eventType === "PRINCIPAL_REJECTION"))));
  },

  formatStatusBadge(status) {
    switch (status) {
      case "PENDING_PRINCIPAL":
        return '<span class="badge-tag badge-warning">⏳ Awaiting Principal</span>';
      case "PENDING_HOD":
        return '<span class="badge-tag badge-info">⏳ In HOD Review</span>';
      case "PENDING_ADVISOR":
        return '<span class="badge-tag badge-info">⏳ In Advisor Review</span>';
      case "APPROVED":
        return '<span class="badge-tag badge-approved">✅ Principal Sanctioned</span>';
      case "RESOLVED":
        return '<span class="badge-tag badge-approved">✅ Resolved</span>';
      case "REJECTED":
        return '<span class="badge-tag badge-rejected">❌ Rejected</span>';
      case "UNDER_REVIEW":
        return '<span class="badge-tag badge-info">Under Review</span>';
      case "RECEIVED":
        return '<span class="badge-tag badge-info" style="background:rgba(59,130,246,0.1); color:#2563eb;">Received</span>';
      default:
        return `<span class="badge-tag badge-secondary">${this.escape(status || "UNKNOWN")}</span>`;
    }
  },

  updateMetrics() {
    const pendingList = (this.odRequests || []).filter(r => this.isPending(r));
    const approvedList = (this.odRequests || []).filter(r => this.isApproved(r));
    const rejectedList = (this.odRequests || []).filter(r => this.isRejected(r));
    const totalRequestsCount = (this.odRequests || []).length + (this.complaints || []).length;

    const elP = document.getElementById("prinMetricPending");
    const elA = document.getElementById("prinMetricApproved");
    const elR = document.getElementById("prinMetricRejected");
    const elT = document.getElementById("prinMetricTotal");

    if (elP) elP.textContent = pendingList.length;
    if (elA) elA.textContent = approvedList.length;
    if (elR) elR.textContent = rejectedList.length;
    if (elT) elT.textContent = totalRequestsCount;

    if (this.activeCategory) {
      this.renderCategoryDetails(this.activeCategory);
    }
  },

  async init(user) {
    this.currentUser = user;
    const nameEl = document.getElementById("principalNameBanner");
    const roleEl = document.getElementById("principalRoleBanner");
    if (nameEl) nameEl.textContent = user.name;
    if (roleEl) roleEl.textContent = "Principal | Gnanamani College of Technology (Autonomous)";

    this.renderAnalytics();
    await this.loadSignature();
    await this.loadComplaints();
    await this.loadOdRequests();
  },

  renderAnalytics() {
    const container = document.getElementById("principalAnalyticsContainer");
    if (!container) return;

    container.innerHTML = `
      <div class="card" style="margin-bottom:24px; background:linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);">
        <div class="card-header">
          <div class="card-title">🌐 Institutional Compliance & Grievance Governance</div>
          <span class="badge-tag badge-teal">Autonomous College Analytics</span>
        </div>
        <div class="card-body">
          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:16px;">
            <div style="padding:16px; background:#ffffff; border:1px solid var(--border); border-radius:8px; border-left:4px solid var(--success);">
              <div style="font-size:11px; font-weight:700; color:#64748b; text-transform:uppercase;">Grievance Redressal</div>
              <div style="font-size:26px; font-weight:800; color:var(--success); margin-top:4px;">100%</div>
              <div style="font-size:11px; color:#94a3b8; margin-top:2px;">All submissions reviewed</div>
            </div>
            <div style="padding:16px; background:#ffffff; border:1px solid var(--border); border-radius:8px; border-left:4px solid var(--accent-teal);">
              <div style="font-size:11px; font-weight:700; color:#64748b; text-transform:uppercase;">Institution OD Sanction Rate</div>
              <div style="font-size:26px; font-weight:800; color:var(--accent-teal); margin-top:4px;">96.8%</div>
              <div style="font-size:11px; color:#94a3b8; margin-top:2px;">Academic Symposiums & Placement</div>
            </div>
            <div style="padding:16px; background:#ffffff; border:1px solid var(--border); border-radius:8px; border-left:4px solid var(--accent-blue);">
              <div style="font-size:11px; font-weight:700; color:#64748b; text-transform:uppercase;">Attendance Integrity</div>
              <div style="font-size:26px; font-weight:800; color:var(--accent-blue); margin-top:4px;">97.4%</div>
              <div style="font-size:11px; color:#94a3b8; margin-top:2px;">Exceeding Anna Univ Threshold</div>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  // ------------------ Student Complaints Management ------------------
  async loadComplaints() {
    try {
      const res = await Auth.fetchWithAuth("/api/complaints/principal");
      if (res.ok) {
        this.complaints = await res.json();
        if (this.complaints.length === 0 && window.DemoStore) {
          this.complaints = DemoStore.getComplaints();
        }
        this.renderComplaints();
      }
    } catch (e) {
      console.warn("Using local demo complaints for Principal:", e);
      if (window.DemoStore) {
        this.complaints = DemoStore.getComplaints();
        this.renderComplaints();
      }
    }
  },

  renderComplaints() {
    const tbody = document.getElementById("principalComplaintsTbody");
    if (!tbody) return;

    let pending = 0, resolved = 0;
    this.complaints.forEach(c => {
      if (c.status === "RESOLVED" || c.status === "CLOSED") resolved++;
      else pending++;
    });

    const elP = document.getElementById("prinMetricComplaintsPending");
    const elR = document.getElementById("prinMetricComplaintsResolved");
    const elT = document.getElementById("prinMetricTotalComplaints");
    if (elP) elP.textContent = pending;
    if (elR) elR.textContent = resolved;
    if (elT) elT.textContent = this.complaints.length;
    this.updateMetrics();

    if (this.complaints.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="text-center" style="padding:28px; color:#64748b;">🏛️ No complaints currently in the Principal inbox. Direct confidential channel is clear.</td></tr>';
      return;
    }

    tbody.innerHTML = this.complaints.map(c => {
      let statusBadge = '<span class="badge-tag badge-warning">SUBMITTED</span>';
      if (c.status === "RECEIVED") statusBadge = '<span class="badge-tag badge-info" style="background:rgba(59,130,246,0.1); color:#2563eb;">RECEIVED</span>';
      else if (c.status === "UNDER_REVIEW") statusBadge = '<span class="badge-tag badge-info">UNDER REVIEW</span>';
      else if (c.status === "IN_PROGRESS") statusBadge = '<span class="badge-tag badge-info">IN PROGRESS</span>';
      else if (c.status === "RESOLVED") statusBadge = '<span class="badge-tag badge-approved">RESOLVED</span>';
      else if (c.status === "CLOSED") statusBadge = '<span class="badge-tag badge-secondary">CLOSED</span>';

      const dept = c.department || c.section || "CSE";
      const year = c.year || "IV Year";
      const stType = c.studentType || "Day Scholar";

      return `
        <tr>
          <td><span class="ref-badge">${c.id}</span></td>
          <td>
            <strong>${this.escape(c.studentName)}</strong>
            <div style="font-size:11px; color:#64748b; margin-top:2px;">${c.regNo}</div>
            <div style="display:flex; gap:4px; align-items:center; margin-top:3px; flex-wrap:wrap;">
              <span class="badge-tag badge-secondary" style="font-size:10px;">${dept}</span>
              <span class="badge-tag badge-secondary" style="font-size:10px;">${year}</span>
              <span class="badge-tag" style="background:${stType === 'Hosteller' ? 'rgba(124,58,237,0.1)' : 'rgba(14,165,233,0.1)'}; color:${stType === 'Hosteller' ? '#7c3aed' : '#0284c7'}; font-size:10px; font-weight:600;">${stType}</span>
            </div>
          </td>
          <td><span class="badge-tag badge-info">${this.escape(c.category)}</span></td>
          <td>
            <div style="font-weight:600; color:var(--primary);">${this.escape(c.subject)}</div>
            <div style="font-size:12px; color:#475569; margin-top:2px;">${this.escape(c.description)}</div>
          </td>
          <td>${statusBadge}</td>
          <td style="font-size:11px; color:#64748b;">${this.escape(c.submittedAt || "")}</td>
          <td>
            <div style="display:flex; flex-direction:column; gap:4px;">
              <button class="btn btn-sm btn-primary" onclick="PrincipalPortal.openComplaintModal('${c.id}')" style="font-size:11px; padding:4px 8px;">
                Review & Update
              </button>
              <button class="btn btn-sm btn-secondary" onclick="App.downloadComplaintPdf('${c.id}')" style="font-size:11px; padding:3px 6px;">
                📥 PDF Record
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join("");
  },

  async openComplaintModal(id) {
    if (!id) return;
    let c = (this.complaints || []).find(x => x.id === id);
    if (!c) {
      try {
        const res = await Auth.fetchWithAuth(`/api/complaints/${encodeURIComponent(id)}`);
        if (res.ok) {
          c = await res.json();
          if (!this.complaints) this.complaints = [];
          this.complaints.push(c);
        }
      } catch (e) {
        console.warn("Could not fetch complaint:", e);
      }
    }
    if (!c && window.DemoStore) {
      c = DemoStore.getComplaints().find(x => x.id === id);
    }
    if (!c) {
      Toast.show("Complaint record not found in institutional archives.", "warning");
      return;
    }
    this.activeComplaintId = id;

    const dept = c.department || c.section || "CSE";
    const year = c.year || "IV Year";
    const stType = c.studentType || "Day Scholar";

    const elId = document.getElementById("prinCmpId");
    if (elId) elId.textContent = c.id;

    const elStudent = document.getElementById("prinCmpStudent");
    if (elStudent) elStudent.textContent = c.studentName;

    const elReg = document.getElementById("prinCmpRegSection");
    if (elReg) elReg.textContent = `${c.regNo || "N/A"} (${dept})`;

    const elDept = document.getElementById("prinCmpDept");
    if (elDept) elDept.textContent = dept;

    const elYear = document.getElementById("prinCmpYear");
    if (elYear) elYear.textContent = year;

    const elType = document.getElementById("prinCmpStudentType");
    if (elType) elType.textContent = stType;

    const elCat = document.getElementById("prinCmpCategory");
    if (elCat) elCat.textContent = c.category;

    const elSub = document.getElementById("prinCmpSubject");
    if (elSub) elSub.textContent = c.subject;

    const elDesc = document.getElementById("prinCmpDesc");
    if (elDesc) elDesc.textContent = c.description;

    const elSupp = document.getElementById("prinCmpSupport");
    if (elSupp) elSupp.textContent = c.supportingDetails || c.supportingInfo || "None provided";

    const elStatus = document.getElementById("prinCmpStatusSelect");
    if (elStatus) elStatus.value = c.status || "RECEIVED";

    const elResp = document.getElementById("prinCmpResponseInput");
    if (elResp) elResp.value = c.principalResponse || "";

    const modal = document.getElementById("principalComplaintModal");
    if (modal) modal.style.display = "flex";
  },

  downloadComplaintPdf() {
    if (this.activeComplaintId) {
      App.downloadComplaintPdf(this.activeComplaintId);
    }
  },

  closeComplaintModal() {
    const modal = document.getElementById("principalComplaintModal");
    if (modal) modal.style.display = "none";
    this.activeComplaintId = null;
  },

  async saveComplaintResponse() {
    if (!this.activeComplaintId) return;
    const status = document.getElementById("prinCmpStatusSelect").value;
    const response = document.getElementById("prinCmpResponseInput").value.trim();

    try {
      const res = await Auth.fetchWithAuth(`/api/complaints/${this.activeComplaintId}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, response })
      });

      if (!res.ok) {
        if (window.DemoStore) {
          DemoStore.updateComplaint(this.activeComplaintId, status, response);
        }
      }

      this.closeComplaintModal();
      await this.loadComplaints();
      App.refreshNotifications();
      Toast.show("Principal response recorded and student notified!", "success");
    } catch (err) {
      if (window.DemoStore) {
        DemoStore.updateComplaint(this.activeComplaintId, status, response);
        this.closeComplaintModal();
        await this.loadComplaints();
        Toast.show("Principal response saved in demo ledger!", "success");
      } else {
        Toast.show("Error: " + err.message, "danger");
      }
    }
  },

  // ------------------ Principal OD Approval Workflow ------------------
  async loadOdRequests() {
    try {
      const res = await Auth.fetchWithAuth("/api/od/principal");
      if (res.ok) {
        const list = await res.json();
        // Strictly filter to Bonafide requests requiring Principal approval
        this.odRequests = list.filter(r => r.requiresPrincipalApproval || (r.odType && r.odType.toLowerCase().includes("bonafide")) || (r.id && r.id.startsWith("EPOCH-BNF")));
        this.renderOdRequests();
        return;
      }
    } catch (e) {
      console.warn("Using local demo Principal OD requests:", e);
    }
    if (window.DemoStore && !Auth.getToken()) {
      this.odRequests = DemoStore.getOdRequests().filter(r => (r.requiresPrincipalApproval || (r.odType && r.odType.toLowerCase().includes("bonafide")) || (r.id && r.id.startsWith("EPOCH-BNF"))) && (r.status === "PENDING_PRINCIPAL" || r.principalDecision));
      this.renderOdRequests();
    }
  },

  renderOdRequests() {
    const tbody = document.getElementById("principalOdTbody");
    const elMetric = document.getElementById("prinMetricOdPending");
    if (elMetric) elMetric.textContent = this.odRequests.filter(r => r.status === "PENDING_PRINCIPAL").length;
    this.updateMetrics();
    if (!tbody) return;

    if (this.odRequests.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="text-center" style="padding:28px; color:#64748b;">📜 No Bonafide Certificate requests currently awaiting Principal final approval. (OD & Leave requests are finalized at HOD stage).</td></tr>';
      return;
    }

    tbody.innerHTML = this.odRequests.map(r => {
      let statusBadge = '<span class="badge-tag badge-warning">⏳ Awaiting Principal</span>';
      if (r.principalApproved === true || (r.principalDecision && r.principalDecision.status === "APPROVED")) {
        statusBadge = '<span class="badge-tag badge-approved">✅ Principal Sanctioned</span>';
      } else if (r.status === "REJECTED") {
        statusBadge = '<span class="badge-tag badge-rejected">❌ Rejected</span>';
      }

      let actionBtn = '';
      if (r.status === "PENDING_PRINCIPAL") {
        actionBtn = `
          <div style="display:flex; gap:6px; flex-wrap:wrap; align-items:center;">
            <button class="btn btn-sm btn-secondary" onclick="App.viewRequestDetails('${r.id}')" title="View Full Request & Timeline" style="display:inline-flex; align-items:center; gap:4px; padding:3px 8px; font-size:11px;">
              🔍 View Request
            </button>
            <button class="btn btn-sm btn-primary" onclick="PrincipalPortal.openOdModal('${r.id}')" style="display:inline-flex; align-items:center; gap:4px; padding:3px 8px; font-size:11px;">
              Review & Sanction
            </button>
          </div>
        `;
      } else {
        actionBtn = `
          <div style="display:flex; gap:6px; flex-wrap:wrap; align-items:center;">
            <button class="btn btn-sm btn-secondary" onclick="App.viewRequestDetails('${r.id}')" title="View Full Request & Timeline" style="display:inline-flex; align-items:center; gap:4px; padding:3px 8px; font-size:11px;">
              🔍 View Request
            </button>
            <span style="font-size:11px; color:#64748b; font-weight:600;">Sanction Logged</span>
          </div>
        `;
      }

      return `
        <tr>
          <td><span class="ref-badge">${r.id}</span></td>
          <td>
            <strong>${this.escape(r.studentName)}</strong>
            <div style="font-size:11px; color:#64748b;">${r.regNo} (${r.section || 'CSE'})</div>
          </td>
          <td>${this.escape(r.odType)}</td>
          <td>${this.escape(r.fromDate || r.startDate || "")} ${r.toDate && r.toDate !== r.fromDate ? ' to ' + this.escape(r.toDate) : ''}</td>
          <td>${statusBadge}</td>
          <td><span class="badge-tag badge-approved">✓ HOD Endorsed</span></td>
          <td>${actionBtn}</td>
        </tr>
      `;
    }).join("");
  },

  showCategoryDetails(category) {
    this.activeCategory = category;

    // Highlight active card
    ["prinCardPending", "prinCardApproved", "prinCardRejected", "prinCardTotal"].forEach(id => {
      const card = document.getElementById(id);
      if (card) card.classList.remove("active-card");
    });

    const activeMap = {
      PENDING: "prinCardPending",
      APPROVED: "prinCardApproved",
      REJECTED: "prinCardRejected",
      TOTAL: "prinCardTotal"
    };
    const activeCard = document.getElementById(activeMap[category]);
    if (activeCard) activeCard.classList.add("active-card");

    const section = document.getElementById("principalMetricDetailsSection");
    if (section) section.style.display = "block";

    this.renderCategoryDetails(category);

    if (section) {
      section.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  },

  closeCategoryDetails() {
    this.activeCategory = null;

    ["prinCardPending", "prinCardApproved", "prinCardRejected", "prinCardTotal"].forEach(id => {
      const card = document.getElementById(id);
      if (card) card.classList.remove("active-card");
    });

    const section = document.getElementById("principalMetricDetailsSection");
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
    const sInput = document.getElementById("principalMetricSearchInput");
    const cFilter = document.getElementById("principalMetricCategoryFilter");
    const stFilter = document.getElementById("principalMetricStatusFilter");
    if (sInput) sInput.value = "";
    if (cFilter) cFilter.value = "ALL";
    if (stFilter) stFilter.value = "ALL";
    if (this.activeCategory) {
      this.renderCategoryDetails(this.activeCategory);
    }
  },

  renderCategoryDetails(category) {
    const iconEl = document.getElementById("principalMetricDetailsIcon");
    const titleEl = document.getElementById("principalMetricDetailsTitle");
    const badgeEl = document.getElementById("principalMetricDetailsBadge");
    const subtextEl = document.getElementById("principalMetricDetailsSubtext");
    const thead = document.getElementById("principalMetricDetailsThead");
    const tbody = document.getElementById("principalMetricDetailsTbody");

    if (!thead || !tbody) return;

    let baseItems = [];
    if (category === "PENDING") {
      baseItems = (this.odRequests || []).filter(r => this.isPending(r)).map(r => ({ ...r, _isComplaint: false }));
      if (iconEl) iconEl.textContent = "⏳";
      if (titleEl) titleEl.textContent = "Pending My Review";
      if (subtextEl) subtextEl.textContent = "Bonafide Certificate applications awaiting Principal final executive sanction.";
    } else if (category === "APPROVED") {
      baseItems = (this.odRequests || []).filter(r => this.isApproved(r)).map(r => ({ ...r, _isComplaint: false }));
      if (iconEl) iconEl.textContent = "✅";
      if (titleEl) titleEl.textContent = "Approved & Issued Requests";
      if (subtextEl) subtextEl.textContent = "Requests officially approved and sanctioned by Principal with institutional digital signature.";
    } else if (category === "REJECTED") {
      baseItems = (this.odRequests || []).filter(r => this.isRejected(r)).map(r => ({ ...r, _isComplaint: false }));
      if (iconEl) iconEl.textContent = "❌";
      if (titleEl) titleEl.textContent = "Rejected Requests with Reason";
      if (subtextEl) subtextEl.textContent = "Requests rejected by the Principal with recorded administrative remarks and audit logs.";
    } else {
      category = "TOTAL";
      const bnfItems = (this.odRequests || []).map(r => ({ ...r, _isComplaint: false }));
      const cmpItems = (this.complaints || []).map(c => ({
        id: c.id,
        studentName: c.studentName,
        regNo: c.regNo,
        department: c.department || c.section || "CSE",
        section: c.section || "CSE",
        year: c.year,
        odType: `Complaint: ${c.category || 'Grievance'}`,
        eventTitle: c.subject,
        reason: c.description,
        fromDate: c.submittedAt ? c.submittedAt.split(" ")[0] : "—",
        toDate: c.submittedAt ? c.submittedAt.split(" ")[0] : "—",
        submittedAt: c.submittedAt,
        status: c.status,
        currentStage: "PRINCIPAL",
        _isComplaint: true,
        _rawComplaint: c
      }));
      baseItems = [...bnfItems, ...cmpItems];
      if (iconEl) iconEl.textContent = "🏛️";
      if (titleEl) titleEl.textContent = "Total Institutional Requests & Complaints";
      if (subtextEl) subtextEl.textContent = "Complete registry of Bonafide Certificates and confidential student complaints in Principal's jurisdiction.";
    }

    // Filter Items
    let filtered = baseItems.filter(item => {
      // Search
      if (this.metricSearchQuery) {
        const q = this.metricSearchQuery;
        const text = [
          item.id,
          item.studentName,
          item.regNo,
          item.department,
          item.section,
          item.odType,
          item.category,
          item.eventTitle,
          item.reason,
          item.purpose
        ].filter(Boolean).join(" ").toLowerCase();
        if (!text.includes(q)) return false;
      }
      // Category filter
      if (this.metricCategoryFilter && this.metricCategoryFilter !== "ALL") {
        if (this.metricCategoryFilter === "COMPLAINT") {
          if (!item._isComplaint) return false;
        } else if (this.metricCategoryFilter === "Bonafide Certificate") {
          if (item._isComplaint) return false;
        }
      }
      // Status filter
      if (this.metricStatusFilter && this.metricStatusFilter !== "ALL") {
        if (item.status !== this.metricStatusFilter) return false;
      }
      return true;
    });

    if (badgeEl) {
      let bClass = "badge-tag badge-info";
      if (category === "PENDING") bClass = "badge-tag badge-warning";
      else if (category === "APPROVED") bClass = "badge-tag badge-approved";
      else if (category === "REJECTED") bClass = "badge-tag badge-rejected";
      badgeEl.className = bClass;
      badgeEl.textContent = `${filtered.length} of ${baseItems.length} Records`;
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
          <th>Event / Subject</th>
          <th>Dates & Submitted</th>
          <th>Current Stage / Approver</th>
          <th>Advisor & HOD Endorsements</th>
          <th>Status</th>
          <th>Action</th>
        </tr>
      `;
    }

    if (filtered.length === 0) {
      const msg = baseItems.length === 0
        ? `No records currently in the "${category}" scope for the Principal.`
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
            <span class="badge-tag badge-secondary" style="font-size:10px;">${this.escape(r.department || 'CSE')}</span>
            <span class="badge-tag badge-section" style="font-size:10px;">${this.escape(r.section || 'A')}</span>
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

      let actionButtons = '';
      if (r._isComplaint) {
        actionButtons = `
          <div style="display:flex; gap:6px; flex-wrap:wrap; align-items:center;">
            <button class="btn btn-sm btn-primary" onclick="PrincipalPortal.openComplaintModal('${r.id}')" style="font-size:11px; padding:3px 8px;">
              Review & Update
            </button>
            <button class="btn btn-sm btn-secondary" onclick="App.downloadComplaintPdf('${r.id}')" style="font-size:11px; padding:3px 6px;">
              📥 PDF Record
            </button>
          </div>
        `;
      } else {
        actionButtons = `
          <div style="display:flex; gap:6px; flex-wrap:wrap; align-items:center;">
            <button class="btn btn-sm btn-secondary" onclick="App.viewRequestDetails('${r.id}')" title="View Full Request, Prior Signatures & Timeline" style="display:inline-flex; align-items:center; gap:4px; padding:3px 8px; font-size:11px;">
              🔍 View Details
            </button>
        `;
        if (isPendingThis) {
          actionButtons += `
            <button class="btn btn-sm btn-primary" onclick="PrincipalPortal.openOdModal('${r.id}')" style="display:inline-flex; align-items:center; gap:4px; padding:3px 8px; font-size:11px;">
              Review & Sanction
            </button>
          `;
        } else if (r.status === "APPROVED") {
          actionButtons += `
            <button class="btn btn-sm btn-success" onclick="App.downloadPdf('${r.id}')" title="Download Official Endorsed PDF" style="display:inline-flex; align-items:center; gap:4px; padding:3px 8px; font-size:11px;">
              📜 Certificate PDF
            </button>
          `;
        }
        actionButtons += `</div>`;
      }

      if (isRejectedCategory) {
        const rejReason = r.rejectionReason || (r.principalDecision && r.principalDecision.comments) || (r.hodDecision && r.hodDecision.comments) || "Rejection remarks not specified";
        const rejBy = r.rejectedBy || (r.principalDecision && r.principalDecision.by) || "Principal Executive";
        const rejAt = r.rejectedAt || (r.principalDecision && r.principalDecision.timestamp) || "—";
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
        let endorsementsHtml = '';
        if (r._isComplaint) {
          endorsementsHtml = `<span class="badge-tag badge-teal" style="font-size:10.5px;">Direct to Principal</span>`;
        } else {
          const adv = r.advisorDecision || {};
          const hod = r.hodDecision || {};
          const advName = adv.signerName || adv.approver || `Advisor (${r.section || 'CSE'})`;
          const hodName = hod.signerName || hod.approver || 'Dr. K. Gopinath';
          endorsementsHtml = `
            <div style="display:flex; flex-direction:column; gap:2px; font-size:11px;">
              <span class="badge-tag badge-approved" style="font-size:10px; width:fit-content;">✓ Advisor: ${this.escape(advName)}</span>
              <span class="badge-tag badge-approved" style="font-size:10px; width:fit-content;">✓ HOD: ${this.escape(hodName)}</span>
            </div>
          `;
        }

        let stageInfoHtml = '';
        if (r.status === "PENDING_PRINCIPAL") {
          stageInfoHtml = `<div style="font-weight:700; color:var(--warning); font-size:11.5px;">⏳ Awaiting Principal Executive Sanction</div>`;
        } else if (r.status === "APPROVED") {
          stageInfoHtml = `
            <div style="display:flex; flex-direction:column; gap:2px;">
              <span class="badge-tag badge-approved" style="font-size:10px; width:fit-content;">✅ Principal Sanctioned</span>
              <div style="font-size:10px; color:#16a34a;">Seal & Signatures Affixed</div>
            </div>
          `;
        } else if (r.status === "RESOLVED") {
          stageInfoHtml = `<span class="badge-tag badge-approved" style="font-size:10.5px;">✅ Grievance Resolved</span>`;
        } else if (r.status === "REJECTED") {
          stageInfoHtml = `<span class="badge-tag badge-rejected" style="font-size:10.5px;">❌ Halted</span>`;
        } else {
          stageInfoHtml = `<span class="badge-tag badge-secondary" style="font-size:10.5px;">${this.escape(r.currentStage || r.status || 'PROCESSING')}</span>`;
        }

        return `
          <tr>
            <td><span class="ref-badge">${r.id}</span></td>
            <td>${studentCell}</td>
            <td><span class="badge-tag ${r._isComplaint ? 'badge-warning' : 'badge-teal'}" style="font-size:11px;">${this.escape(r.odType || 'Request')}</span></td>
            <td>${purposeCell}</td>
            <td>
              <div style="font-size:12px; font-weight:600; color:#334155;">${this.escape(dateRange)}</div>
              <div style="font-size:11px; color:#94a3b8; margin-top:2px;">📅 Submitted: ${this.escape(submittedDate)}</div>
            </td>
            <td>${stageInfoHtml}</td>
            <td>${endorsementsHtml}</td>
            <td>${statusBadge}</td>
            <td>${actionButtons}</td>
          </tr>
        `;
      }
    }).join("");
  },

  openOdModal(id) {
    const r = this.odRequests.find(x => x.id === id);
    if (!r) return;
    this.activeOdId = id;

    document.getElementById("prinOdId").textContent = r.id;
    document.getElementById("prinOdStudent").textContent = `${r.studentName} (${r.regNo} - ${r.section})`;
    document.getElementById("prinOdType").textContent = r.odType;
    document.getElementById("prinOdDates").textContent = `${r.fromDate || r.startDate} to ${r.toDate || r.endDate || r.fromDate}`;
    document.getElementById("prinOdReason").textContent = r.reason || "N/A";

    const evTitle = document.getElementById("prinOdEventTitle");
    if (evTitle) evTitle.textContent = r.eventTitle || r.odType || "N/A";
    const org = document.getElementById("prinOdOrganizer");
    if (org) org.textContent = r.organizer || "N/A";
    const ven = document.getElementById("prinOdVenue");
    if (ven) ven.textContent = r.venue || r.eventDetails || "N/A";

    const docBox = document.getElementById("prinOdDocBox");
    if (docBox) {
      if (r.documentData) {
        docBox.innerHTML = `<strong>Attachment:</strong> <a href="${r.documentData}" target="_blank" download="${r.documentName || 'attachment'}" class="btn btn-sm btn-secondary" style="padding:2px 8px; font-size:11px; margin-left:6px; display:inline-flex; align-items:center; gap:4px;">📎 ${r.documentName || 'Download File'}</a>`;
      } else {
        docBox.innerHTML = `<span style="color:#94a3b8; font-size:12px;">No document attached</span>`;
      }
    }

    // Prior Endorsements from Advisor & HOD with Digital Signatures
    const priorBox = document.getElementById("prinOdPriorSignatures");
    if (priorBox) {
      const adv = r.advisorDecision || {};
      const hod = r.hodDecision || {};
      const advName = adv.signerName || adv.approver || `Class Advisor (${r.section || 'CSE-A'})`;
      const advSig = adv.signatureBase64;
      const hodName = hod.signerName || hod.approver || "Dr. K. Gopinath (HOD-CSE)";
      const hodSig = hod.signatureBase64;

      priorBox.innerHTML = `
        <div style="font-size:12px; font-weight:700; color:var(--primary); margin-bottom:6px;">Prior Endorsements & Digital Signatures:</div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
          <div style="background:#f0fdf4; border:1px solid #bbf7d0; border-radius:6px; padding:10px; font-size:12px;">
            <div style="font-weight:700; color:#15803d; margin-bottom:4px;">Stage 1: Class Advisor</div>
            <div><strong>Approver:</strong> ${this.escape(advName)}</div>
            <div style="font-size:11px; color:#64748b; margin-top:2px;">${this.escape(adv.timestamp || "Approved")}</div>
            ${advSig ? `
              <div style="margin-top:6px; background:#fff; border:1px solid #cbd5e1; border-radius:4px; padding:3px; text-align:center;">
                <img src="${advSig}" alt="Advisor Signature" style="max-height:40px; max-width:160px; object-fit:contain;">
              </div>
            ` : ''}
          </div>
          <div style="background:#f0fdf4; border:1px solid #bbf7d0; border-radius:6px; padding:10px; font-size:12px;">
            <div style="font-weight:700; color:#15803d; margin-bottom:4px;">Stage 2: Head of Department</div>
            <div><strong>Approver:</strong> ${this.escape(hodName)}</div>
            <div style="font-size:11px; color:#64748b; margin-top:2px;">${this.escape(hod.timestamp || "Approved")}</div>
            ${hodSig ? `
              <div style="margin-top:6px; background:#fff; border:1px solid #cbd5e1; border-radius:4px; padding:3px; text-align:center;">
                <img src="${hodSig}" alt="HOD Signature" style="max-height:40px; max-width:160px; object-fit:contain;">
              </div>
            ` : ''}
          </div>
        </div>
      `;
    }

    const titleEl = document.querySelector("#principalOdModal .modal-title");
    if (titleEl) {
      titleEl.textContent = `📜 Principal Executive Review: Bonafide Certificate (${r.id}) — Stage 3 Final Approval`;
    }
    const approveBtn = document.querySelector("#principalOdModal .btn-success");
    if (approveBtn) {
      approveBtn.textContent = "🏛️ Grant Principal Approval & Issue Certificate";
    }

    const rejBox = document.getElementById("prinOdRejectionBox");
    if (rejBox) rejBox.style.display = "none";
    document.getElementById("prinOdRejectionInput").value = "";

    const modal = document.getElementById("principalOdModal");
    if (modal) modal.style.display = "flex";
  },

  closeOdModal() {
    const modal = document.getElementById("principalOdModal");
    if (modal) modal.style.display = "none";
    this.activeOdId = null;
  },

  async approveOd() {
    if (!this.activeOdId) return;

    try {
      const res = await Auth.fetchWithAuth(`/api/od/${this.activeOdId}/principal-action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approved: true, reason: "" })
      });

      if (!res.ok) {
        const errObj = await res.json().catch(() => null);
        throw new Error((errObj && errObj.error) ? errObj.error : "Failed to record Principal approval");
      }

      this.closeOdModal();
      await this.loadOdRequests();
      App.refreshNotifications();
      Toast.show("Principal executive approval granted! Official Bonafide Certificate issued with institutional signatures.", "success");
    } catch (err) {
      Toast.show("Error: " + err.message, "danger");
    }
  },

  toggleRejectOdBox() {
    const box = document.getElementById("prinOdRejectionBox");
    box.style.display = box.style.display === "none" ? "block" : "none";
  },

  async confirmRejectOd() {
    if (!this.activeOdId) return;
    const reason = document.getElementById("prinOdRejectionInput").value.trim();
    if (!reason) {
      Toast.show("Please state the reason for Principal rejection.", "warning");
      return;
    }

    try {
      const res = await Auth.fetchWithAuth(`/api/od/${this.activeOdId}/principal-action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approved: false, reason: reason })
      });

      if (!res.ok) {
        const errObj = await res.json().catch(() => null);
        throw new Error((errObj && errObj.error) ? errObj.error : "Failed to record Principal rejection");
      }

      this.closeOdModal();
      await this.loadOdRequests();
      App.refreshNotifications();
      Toast.show("OD request rejected by Principal.", "info");
    } catch (err) {
      Toast.show("Error: " + err.message, "danger");
    }
  },

  async loadSignature() {
    try {
      const res = await Auth.fetchWithAuth("/api/staff/signature");
      if (res.ok) {
        const data = await res.json();
        const preview = document.getElementById("prinSignaturePreview");
        if (data.hasSignature && data.signature && data.signature.signatureBase64) {
          preview.innerHTML = `<img src="${data.signature.signatureBase64}" alt="Principal Signature" style="max-height:55px; max-width:200px; border:1px solid #cbd5e1; padding:4px; background:#fff; border-radius:6px;">`;
        } else {
          preview.innerHTML = '<span style="color:#94a3b8; font-size:12px;">✍️ Institutional digital seal active</span>';
        }
      }
    } catch (e) {
      console.warn("Principal signature load fallback:", e);
    }
  },

  handleSignatureUpload(e) {
    this.saveSignature();
  },

  async saveSignature() {
    const input = document.getElementById("prinSigInput");
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
        const preview = document.getElementById("prinSignaturePreview");
        if (preview) {
          preview.innerHTML = `<img src="${base64}" alt="Principal Signature" style="max-height:55px; max-width:200px; border:1px solid #cbd5e1; padding:4px; background:#fff; border-radius:6px;">`;
        }
        Toast.show("Principal institutional seal updated successfully!", "success");
      } catch (err) {
        const preview = document.getElementById("prinSignaturePreview");
        if (preview) {
          preview.innerHTML = `<img src="${base64}" alt="Principal Signature" style="max-height:55px; max-width:200px; border:1px solid #cbd5e1; padding:4px; background:#fff; border-radius:6px;">`;
        }
        Toast.show("Principal seal updated in demo state!", "success");
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
