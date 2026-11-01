/**
 * EPOCH Student Portal Module
 * Manages OD applications, Leave applications, Bonafide certificates, 
 * Direct complaints to Principal, and attendance illustration.
 */
const StudentPortal = {
  requests: [],
  complaints: [],
  currentUser: null,
  draftOd: null,
  trackFilter: "ALL",
  trackSearchQuery: "",
  allTrackingRequests: [],

  async init(user) {
    this.currentUser = user;
    const nameEl = document.getElementById("studentNameBanner");
    const metaEl = document.getElementById("studentMetaBanner");
    if (nameEl) nameEl.textContent = user.name;
    if (metaEl) metaEl.textContent = `Reg No: ${user.identifier} | Dept: ${user.department || "CSE"} | Section: ${user.section || "CSE-A"} | Status: Regular Student`;

    this.renderAttendanceWidget();
    await this.loadData();
    this.renderLeaves();
    this.renderBonafides();
    this.renderTrackingPage();
    if (window.AnnouncementApp && AnnouncementApp.loadAnnouncements) {
      AnnouncementApp.loadAnnouncements();
    }
  },

  renderAttendanceWidget() {
    // Attendance & End-Sem Exam Eligibility section removed per dashboard specification
  },

  async loadData() {
    await Promise.all([
      this.loadOdRequests(),
      this.loadComplaints()
    ]);
  },

  async loadOdRequests() {
    try {
      const res = await Auth.fetchWithAuth("/api/od/student");
      if (res.ok) {
        this.requests = await res.json();
        this.renderOdRequests();
        return;
      }
    } catch (e) {
      console.warn("Falling back to local demo OD requests:", e);
    }
    if (window.DemoStore && this.currentUser) {
      this.requests = DemoStore.getOdRequestsForStudent(this.currentUser.identifier);
      this.renderOdRequests();
    }
  },

  async loadComplaints() {
    try {
      const res = await Auth.fetchWithAuth("/api/complaints/student");
      if (res.ok) {
        this.complaints = await res.json();
        this.renderComplaints();
        return;
      }
    } catch (e) {
      console.warn("Falling back to local demo complaints:", e);
    }
    if (window.DemoStore && this.currentUser) {
      this.complaints = DemoStore.getComplaintsForStudent(this.currentUser.identifier);
      this.renderComplaints();
    }
  },

  renderOdRequests() {
    const tbody = document.getElementById("studentRequestsTbody");
    if (!tbody) return;

    // Filter to purely On-Duty requests (exclude Bonafide and Leave)
    const odList = this.requests.filter(r => {
      const t = (r.odType || "").toLowerCase();
      const id = r.id || "";
      return !t.includes("bonafide") && !t.includes("leave") && !id.startsWith("EPOCH-BNF") && !id.startsWith("EPOCH-LV");
    });

    let pending = 0, approved = 0, rejected = 0;
    odList.forEach(r => {
      if (r.status === "APPROVED") approved++;
      else if (r.status === "REJECTED") rejected++;
      else pending++;
    });

    const elP = document.getElementById("stMetricPending");
    const elA = document.getElementById("stMetricApproved");
    const elR = document.getElementById("stMetricRejected");
    if (elP) elP.textContent = pending;
    if (elA) elA.textContent = approved;
    if (elR) elR.textContent = rejected;

    if (odList.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" class="text-center" style="padding:28px; color:#64748b;">📝 No On-Duty applications submitted yet. Click "Apply for OD" above to start.</td></tr>`;
      return;
    }

    tbody.innerHTML = odList.map(r => {
      const statusBadge = this.formatStatusBadge(r.status);
      const isApproved = r.status === "APPROVED";
      const isRejected = r.status === "REJECTED";

      let actionButtons = `
        <div style="display:flex; gap:6px; flex-wrap:wrap; align-items:center;">
          <button class="btn btn-sm btn-secondary" onclick="App.viewRequestDetails('${r.id}')" title="View Request Details & Timeline" style="display:inline-flex; align-items:center; gap:4px; padding:3px 8px; font-size:11px;">
            🔍 View Request
          </button>
      `;
      if (isApproved) {
        actionButtons += `
          <button class="btn btn-sm btn-primary" onclick="StudentPortal.openQrModal('${r.id}')" title="View Official QR Certificate" style="padding:3px 8px; font-size:11px;">
            🔍 QR
          </button>
          <button class="btn btn-sm btn-success" onclick="App.downloadPdf('${r.id}')" title="Download Approved Request" style="background:#059669; color:#fff; border:none; padding:3px 8px; font-size:11px; border-radius:4px; font-weight:600;">
            📥 Download Approved Request
          </button>
        `;
      }
      actionButtons += `</div>`;

      let rejectionInfo = '';
      if (isRejected && r.rejectionReason) {
        rejectionInfo = `<div style="font-size:11px; color:var(--danger); margin-top:4px;">
          <strong>Reason:</strong> ${this.escape(r.rejectionReason)}
        </div>`;
      }

      return `
        <tr>
          <td><span class="ref-badge">${r.id}</span></td>
          <td><strong>${this.escape(r.odType)}</strong></td>
          <td>
            <div style="font-weight:600; color:var(--primary);">${this.escape(r.eventDetails || r.venue || "Academic Event")}</div>
            <div style="font-size:11px; color:#64748b;">${this.escape(r.reason || "")}</div>
          </td>
          <td>${this.escape(r.fromDate || r.startDate || "")} ${r.toDate && r.toDate !== r.fromDate ? ' to ' + this.escape(r.toDate) : ''}</td>
          <td>
            ${statusBadge}
            ${rejectionInfo}
          </td>
          <td><span class="badge-tag badge-secondary">${this.escape(r.currentStage || "PROCESSING")}</span></td>
          <td>${actionButtons}</td>
        </tr>
      `;
    }).join("");
  },

  renderLeaves() {
    const tbody = document.getElementById("studentLeavesTbody");
    if (!tbody) return;

    // Filter from this.requests first, fallback to DemoStore
    let leaves = this.requests.filter(r => {
      const t = (r.odType || "").toLowerCase();
      const id = r.id || "";
      return t.includes("leave") || id.startsWith("EPOCH-LV");
    });

    if (leaves.length === 0 && window.DemoStore && this.currentUser) {
      leaves = DemoStore.getLeaveRequestsForStudent(this.currentUser.identifier);
    }

    if (leaves.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" class="text-center" style="padding:24px; color:#64748b;">🏖️ No leave applications recorded for ${this.escape(this.currentUser.name)}.</td></tr>`;
      return;
    }

    tbody.innerHTML = leaves.map(l => {
      const isApproved = l.status === "APPROVED";
      let actionButtons = `
        <div style="display:flex; gap:6px; flex-wrap:wrap; align-items:center;">
          <button class="btn btn-sm btn-secondary" onclick="App.viewRequestDetails('${l.id}')" title="View Request Details & Timeline" style="display:inline-flex; align-items:center; gap:4px; padding:3px 8px; font-size:11px;">
            🔍 View Request
          </button>
      `;
      if (isApproved) {
        actionButtons += `
          <button class="btn btn-sm btn-success" onclick="App.downloadPdf('${l.id}')" title="Download Approved Request" style="background:#059669; color:#fff; border:none; padding:3px 8px; font-size:11px; border-radius:4px; font-weight:600;">
            📥 Download Approved Request
          </button>
        `;
      }
      actionButtons += `</div>`;

      return `
        <tr>
          <td><span class="ref-badge">${l.id}</span></td>
          <td><strong>${this.escape(l.leaveType || l.odType || "Leave Application")}</strong></td>
          <td>${this.escape(l.startDate || "")} to ${this.escape(l.endDate || l.startDate || "")} (${l.numberOfDays || 1} day(s))</td>
          <td style="font-size:12px;">${this.escape(l.reason || "")}</td>
          <td>${this.formatStatusBadge(l.status)}</td>
          <td style="font-size:11px; color:#64748b;">${this.escape(l.submittedAt || "")}</td>
          <td>${actionButtons}</td>
        </tr>
      `;
    }).join("");
  },

  renderBonafides() {
    const tbody = document.getElementById("studentBonafidesTbody");
    if (!tbody) return;

    // Filter from this.requests first, fallback to DemoStore
    let bnfs = this.requests.filter(r => {
      const t = (r.odType || "").toLowerCase();
      const id = r.id || "";
      return t.includes("bonafide") || id.startsWith("EPOCH-BNF");
    });

    if (bnfs.length === 0 && window.DemoStore && this.currentUser) {
      bnfs = DemoStore.getBonafideRequestsForStudent(this.currentUser.identifier);
    }

    if (bnfs.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" class="text-center" style="padding:24px; color:#64748b;">📜 No bonafide certificate requests recorded for ${this.escape(this.currentUser.name)}.</td></tr>`;
      return;
    }

    tbody.innerHTML = bnfs.map(b => {
      const isApproved = b.status === "APPROVED";
      let actionButtons = `
        <div style="display:flex; gap:6px; flex-wrap:wrap; align-items:center;">
          <button class="btn btn-sm btn-secondary" onclick="App.viewRequestDetails('${b.id}')" title="View Bonafide Request Details & Timeline" style="display:inline-flex; align-items:center; gap:4px; padding:3px 8px; font-size:11px;">
            🔍 View Request
          </button>
      `;
      if (isApproved) {
        actionButtons += `
          <button class="btn btn-sm btn-primary" onclick="App.downloadPdf('${b.id}')" title="Download Approved Request" style="background:#0284c7; color:#fff; border:none; padding:3px 8px; font-size:11px; border-radius:4px; display:inline-flex; align-items:center; gap:4px; font-weight:600;">
            📜 Download Approved Request
          </button>
        `;
      }
      actionButtons += `</div>`;

      return `
        <tr>
          <td><span class="ref-badge">${b.id}</span></td>
          <td><strong>${this.escape(b.purpose || b.reason || "Bonafide Certificate")}</strong></td>
          <td>${this.escape(b.academicYear || "2025-2026")}</td>
          <td><code style="font-weight:700; color:var(--accent-teal);">${this.escape(b.certificateNumber || b.id)}</code></td>
          <td>${this.formatStatusBadge(b.status)}</td>
          <td style="font-size:11px; color:#64748b;">${this.escape(b.submittedAt || "")}</td>
          <td>${actionButtons}</td>
        </tr>
      `;
    }).join("");
  },

  setTrackFilter(filter) {
    this.trackFilter = filter;
    const tabs = [
      { id: "trackTabAll", key: "ALL" },
      { id: "trackTabPending", key: "PENDING" },
      { id: "trackTabApproved", key: "APPROVED" },
      { id: "trackTabRejected", key: "REJECTED" }
    ];
    tabs.forEach(t => {
      const el = document.getElementById(t.id);
      if (el) {
        el.className = t.key === filter ? "btn btn-sm btn-primary" : "btn btn-sm btn-secondary";
      }
    });
    this.renderTrackingList();
  },

  onTrackSearch(query) {
    this.trackSearchQuery = (query || "").trim().toLowerCase();
    this.renderTrackingList();
  },

  async renderTrackingPage() {
    if (!this.requests || this.requests.length === 0) {
      await this.loadData();
    }

    let list = (this.requests || []).slice();
    if ((!list || list.length === 0) && !Auth.getToken() && window.DemoStore && this.currentUser) {
      const regNo = this.currentUser.identifier;
      const demoOds = DemoStore.getOdRequestsForStudent(regNo) || [];
      const demoLeaves = DemoStore.getLeaveRequestsForStudent(regNo) || [];
      const demoBnfs = DemoStore.getBonafideRequestsForStudent(regNo) || [];
      
      const combined = [...demoOds, ...demoLeaves, ...demoBnfs];
      const seen = new Set();
      list = [];
      combined.forEach(item => {
        if (item && item.id && !seen.has(item.id)) {
          seen.add(item.id);
          list.push(item);
        }
      });
    }

    list.sort((a, b) => {
      const tA = new Date(a.submittedAt || a.createdAt || 0).getTime() || 0;
      const tB = new Date(b.submittedAt || b.createdAt || 0).getTime() || 0;
      return tB - tA;
    });

    this.allTrackingRequests = list;

    let countAll = list.length;
    let countPending = 0;
    let countApproved = 0;
    let countRejected = 0;

    list.forEach(r => {
      if (r.status === "APPROVED") countApproved++;
      else if (r.status === "REJECTED") countRejected++;
      else countPending++;
    });

    const bAll = document.getElementById("trackBadgeAll");
    const bPen = document.getElementById("trackBadgePending");
    const bApp = document.getElementById("trackBadgeApproved");
    const bRej = document.getElementById("trackBadgeRejected");
    if (bAll) bAll.textContent = countAll;
    if (bPen) bPen.textContent = countPending;
    if (bApp) bApp.textContent = countApproved;
    if (bRej) bRej.textContent = countRejected;

    this.renderTrackingList();
  },

  renderTrackingList() {
    const tbody = document.getElementById("studentTrackTbody");
    const summaryEl = document.getElementById("trackTableSummary");
    if (!tbody) return;

    let filtered = (this.allTrackingRequests || []).slice();

    if (this.trackFilter === "PENDING") {
      filtered = filtered.filter(r => r.status !== "APPROVED" && r.status !== "REJECTED");
    } else if (this.trackFilter === "APPROVED") {
      filtered = filtered.filter(r => r.status === "APPROVED");
    } else if (this.trackFilter === "REJECTED") {
      filtered = filtered.filter(r => r.status === "REJECTED");
    }

    if (this.trackSearchQuery) {
      const q = this.trackSearchQuery;
      filtered = filtered.filter(r => {
        const id = (r.id || "").toLowerCase();
        const type = (r.odType || r.leaveType || "").toLowerCase();
        const title = (r.eventTitle || r.purpose || r.reason || "").toLowerCase();
        const status = (r.status || "").toLowerCase();
        return id.includes(q) || type.includes(q) || title.includes(q) || status.includes(q);
      });
    }

    if (summaryEl) {
      summaryEl.textContent = `Showing ${filtered.length} of ${this.allTrackingRequests.length} requests`;
    }

    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" class="text-center" style="padding:32px; color:#64748b;">📋 No requests match your search or selected filter.</td></tr>`;
      return;
    }

    tbody.innerHTML = filtered.map(r => {
      const isBonafide = (r.odType && r.odType.toLowerCase().includes("bonafide")) || (r.id && r.id.startsWith("EPOCH-BNF"));
      const isLeave = (r.odType && r.odType.toLowerCase().includes("leave")) || (r.id && r.id.startsWith("EPOCH-LV"));
      const isApproved = r.status === "APPROVED";
      const isRejected = r.status === "REJECTED";

      const typeLabel = isBonafide ? "Bonafide Certificate" : (isLeave ? (r.leaveType || r.odType || "Leave Application") : (r.odType || "On-Duty Application"));
      const typeBadgeClass = isBonafide ? "badge-teal" : (isLeave ? "badge-info" : "badge-primary");
      const purposeSubtitle = r.eventTitle || r.purpose || r.reason || (isBonafide ? "Institutional Verification" : "Academic Request");

      const submittedDate = r.submittedAt || (r.createdAt ? new Date(r.createdAt).toLocaleString() : "Recent");
      const updatedDate = r.lastUpdatedAt || submittedDate;

      let currentStageHtml = "";
      if (r.status === "PENDING_ADVISOR") {
        currentStageHtml = `
          <div style="font-weight:700; color:#b45309; font-size:12px;">👩‍🏫 Stage 1: Class Advisor</div>
          <div style="font-size:11px; color:#64748b;">${this.escape(r.assignedReviewerName || 'Assigned Section Advisor')}</div>
        `;
      } else if (r.status === "PENDING_HOD") {
        currentStageHtml = `
          <div style="font-weight:700; color:#b45309; font-size:12px;">🏛️ Stage 2: Head of Department</div>
          <div style="font-size:11px; color:#64748b;">Dr. K. Gopinath (CSE)</div>
        `;
      } else if (r.status === "PENDING_PRINCIPAL") {
        currentStageHtml = `
          <div style="font-weight:700; color:#b45309; font-size:12px;">👨‍💼 Stage 3: Principal Executive</div>
          <div style="font-size:11px; color:#64748b;">Dr. B. Sanjay Gandhi</div>
        `;
      } else if (isApproved) {
        currentStageHtml = `
          <div style="font-weight:700; color:#047857; font-size:12px;">✅ Fully Sanctioned</div>
          <div style="font-size:11px; color:#64748b;">${isBonafide ? 'Principal Approved' : 'HOD Approved'}</div>
        `;
      } else if (isRejected) {
        currentStageHtml = `
          <div style="font-weight:700; color:#b91c1c; font-size:12px;">❌ Halted by ${this.escape(r.rejectedBy || 'Reviewer')}</div>
          <div style="font-size:11px; color:#64748b; max-width:180px; overflow:hidden; text-overflow:ellipsis;" title="${this.escape(r.rejectionReason || 'Policy')}">Reason: "${this.escape(r.rejectionReason || 'Declined')}"</div>
        `;
      } else {
        currentStageHtml = `<div style="font-size:12px; color:#64748b;">${this.escape(r.status)}</div>`;
      }

      let progressMiniHtml = "";
      const adv = r.advisorDecision || {};
      const hod = r.hodDecision || {};
      const prin = r.principalDecision || {};

      if (isBonafide) {
        const advDone = adv.status === "APPROVED" || r.status === "PENDING_HOD" || r.status === "PENDING_PRINCIPAL" || isApproved;
        const hodDone = hod.status === "APPROVED" || r.status === "PENDING_PRINCIPAL" || isApproved;
        const prinDone = isApproved;

        progressMiniHtml = `
          <div style="display:flex; align-items:center; gap:4px; font-size:11px; white-space:nowrap;">
            <span class="badge-tag badge-approved" style="padding:1px 6px; font-size:10px;">Sub ✓</span>
            <span style="color:#94a3b8;">→</span>
            <span class="badge-tag ${advDone ? 'badge-approved' : (r.status === 'PENDING_ADVISOR' ? 'badge-warning' : (isRejected ? 'badge-rejected' : 'badge-secondary'))}" style="padding:1px 6px; font-size:10px;">Adv ${advDone ? '✓' : (r.status === 'PENDING_ADVISOR' ? '⏳' : '')}</span>
            <span style="color:#94a3b8;">→</span>
            <span class="badge-tag ${hodDone ? 'badge-approved' : (r.status === 'PENDING_HOD' ? 'badge-warning' : (isRejected && advDone ? 'badge-rejected' : 'badge-secondary'))}" style="padding:1px 6px; font-size:10px;">HOD ${hodDone ? '✓' : (r.status === 'PENDING_HOD' ? '⏳' : '')}</span>
            <span style="color:#94a3b8;">→</span>
            <span class="badge-tag ${prinDone ? 'badge-approved' : (r.status === 'PENDING_PRINCIPAL' ? 'badge-warning' : (isRejected && hodDone ? 'badge-rejected' : 'badge-secondary'))}" style="padding:1px 6px; font-size:10px;">Prin ${prinDone ? '✓' : (r.status === 'PENDING_PRINCIPAL' ? '⏳' : '')}</span>
          </div>
        `;
      } else {
        const advDone = adv.status === "APPROVED" || r.status === "PENDING_HOD" || isApproved;
        const hodDone = isApproved;

        progressMiniHtml = `
          <div style="display:flex; align-items:center; gap:4px; font-size:11px; white-space:nowrap;">
            <span class="badge-tag badge-approved" style="padding:1px 6px; font-size:10px;">Sub ✓</span>
            <span style="color:#94a3b8;">→</span>
            <span class="badge-tag ${advDone ? 'badge-approved' : (r.status === 'PENDING_ADVISOR' ? 'badge-warning' : (isRejected ? 'badge-rejected' : 'badge-secondary'))}" style="padding:1px 6px; font-size:10px;">Advisor ${advDone ? '✓' : (r.status === 'PENDING_ADVISOR' ? '⏳' : '')}</span>
            <span style="color:#94a3b8;">→</span>
            <span class="badge-tag ${hodDone ? 'badge-approved' : (r.status === 'PENDING_HOD' ? 'badge-warning' : (isRejected && advDone ? 'badge-rejected' : 'badge-secondary'))}" style="padding:1px 6px; font-size:10px;">HOD Final ${hodDone ? '✓' : (r.status === 'PENDING_HOD' ? '⏳' : '')}</span>
          </div>
        `;
      }

      let actionButtons = `
        <div style="display:flex; gap:6px; flex-wrap:wrap; align-items:center;">
          <button class="btn btn-sm btn-secondary" onclick="App.viewRequestDetails('${r.id}')" title="View Request Details & Timeline" style="display:inline-flex; align-items:center; gap:4px; padding:4px 8px; font-size:11px;">
            🔍 View Request
          </button>
      `;
      if (isApproved) {
        const downloadLabel = isBonafide ? "📜 Download Approved Request" : "📥 Download Approved Request";
        const downloadClass = isBonafide ? "btn-primary" : "btn-success";
        actionButtons += `
          <button class="btn btn-sm ${downloadClass}" onclick="App.downloadPdf('${r.id}')" title="Download Approved Request" style="display:inline-flex; align-items:center; gap:4px; padding:4px 8px; font-size:11px; font-weight:600;">
            ${downloadLabel}
          </button>
        `;
      }
      actionButtons += `</div>`;

      return `
        <tr>
          <td><span class="ref-badge">${r.id}</span></td>
          <td>
            <span class="badge-tag ${typeBadgeClass}">${this.escape(typeLabel)}</span>
            <div style="font-size:12px; font-weight:600; color:var(--primary); margin-top:3px;">${this.escape(purposeSubtitle)}</div>
          </td>
          <td>
            <div style="font-size:12px;">${this.escape(submittedDate)}</div>
            <div style="font-size:11px; color:#64748b; margin-top:2px;">Updated: ${this.escape(updatedDate)}</div>
          </td>
          <td>${this.formatStatusBadge(r.status)}</td>
          <td>${currentStageHtml}</td>
          <td>${progressMiniHtml}</td>
          <td>${actionButtons}</td>
        </tr>
      `;
    }).join("");
  },

  renderComplaints() {
    const tbody = document.getElementById("studentComplaintsTbody");
    const cmpMetric = document.getElementById("stMetricComplaints");
    if (cmpMetric) cmpMetric.textContent = this.complaints.length;
    if (!tbody) return;

    if (this.complaints.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" class="text-center" style="padding:28px; color:#64748b;">🚨 No complaints submitted. Complaints are securely delivered directly to Principal Dr. B. Sanjay Gandhi.</td></tr>`;
      return;
    }

    tbody.innerHTML = this.complaints.map(c => {
      let statusBadge = '<span class="badge-tag badge-warning">SUBMITTED</span>';
      if (c.status === "RECEIVED") statusBadge = '<span class="badge-tag badge-info">RECEIVED</span>';
      else if (c.status === "UNDER_REVIEW") statusBadge = '<span class="badge-tag badge-warning">UNDER REVIEW</span>';
      else if (c.status === "IN_PROGRESS") statusBadge = '<span class="badge-tag badge-info">IN PROGRESS</span>';
      else if (c.status === "RESOLVED") statusBadge = '<span class="badge-tag badge-approved">RESOLVED</span>';
      else if (c.status === "CLOSED") statusBadge = '<span class="badge-tag badge-secondary">CLOSED</span>';

      let responseHtml = '<span style="color:#94a3b8; font-style:italic;">Awaiting Principal response</span>';
      if (c.principalResponse) {
        responseHtml = `<div style="background:#f0fdfa; padding:8px 12px; border-radius:6px; font-size:12px; border-left:3px solid var(--accent-teal);">
          <strong style="color:var(--accent-teal);">Principal:</strong> ${this.escape(c.principalResponse)}
          ${c.respondedAt ? `<div style="font-size:10.5px; color:#64748b; margin-top:2px;">${this.escape(c.respondedAt)}</div>` : ''}
        </div>`;
      }

      const isResolved = c.status === "RESOLVED" || c.status === "CLOSED";
      const downloadBtn = isResolved
        ? `<button class="btn btn-sm btn-success" onclick="StudentPortal.downloadComplaintPdf('${c.id}')" title="Download Official Resolution Record" style="display:inline-flex; align-items:center; gap:4px; padding:3px 8px; font-size:11px;">📥 Resolution Record</button>`
        : `<button class="btn btn-sm btn-secondary" onclick="StudentPortal.downloadComplaintPdf('${c.id}')" title="Download Complaint Acknowledgement" style="display:inline-flex; align-items:center; gap:4px; padding:3px 8px; font-size:11px;">📄 Acknowledgement</button>`;

      return `
        <tr>
          <td><span class="ref-badge">${c.id}</span></td>
          <td>
            <div style="font-size:12px; font-weight:600; color:var(--primary);">${this.escape(c.department || "CSE")} - ${this.escape(c.year || "IV Year")}</div>
            <span class="badge-tag badge-teal" style="font-size:10px; padding:1px 6px;">${this.escape(c.studentType || "Day Scholar")}</span>
          </td>
          <td><span class="badge-tag badge-info">${this.escape(c.category)}</span></td>
          <td>
            <div style="font-weight:600; color:var(--primary);">${this.escape(c.subject)}</div>
            <div style="font-size:12px; color:#475569; margin-top:2px;">${this.escape(c.description)}</div>
          </td>
          <td>${statusBadge}</td>
          <td>${responseHtml}</td>
          <td>${downloadBtn}</td>
        </tr>
      `;
    }).join("");
  },

  formatStatusBadge(status) {
    switch (status) {
      case "DRAFT":
        return '<span class="badge-tag badge-secondary">📝 Draft</span>';
      case "PENDING_ADVISOR":
        return '<span class="badge-tag badge-warning">⏳ Awaiting Advisor</span>';
      case "PENDING_HOD":
        return '<span class="badge-tag badge-warning">⏳ Awaiting HOD</span>';
      case "PENDING_PRINCIPAL":
        return '<span class="badge-tag badge-warning">⏳ Awaiting Principal</span>';
      case "APPROVED":
        return '<span class="badge-tag badge-approved">✅ Approved</span>';
      case "REJECTED":
        return '<span class="badge-tag badge-rejected">❌ Rejected</span>';
      default:
        return `<span class="badge-tag badge-secondary">${status}</span>`;
    }
  },

  currentFile: null,

  // ------------------ OD Application & Live Preview ------------------
  openOdModal() {
    const modal = document.getElementById("odModal");
    if (!modal) return;

    // Reset steps
    document.getElementById("odCategoryStep").style.display = "block";
    document.getElementById("odFormStep").style.display = "none";
    document.getElementById("odPreviewStep").style.display = "none";
    document.getElementById("odModalHeaderTitle").textContent = "📝 On-Duty (OD) Application Portal";

    // Reset form
    document.getElementById("odApplicationForm").reset();
    document.getElementById("odActiveDraftId").value = "";
    document.getElementById("odSelectedCategory").value = "";
    document.getElementById("odDaysInput").value = "1";
    this.removeFile();

    const errAlert = document.getElementById("odFormErrorAlert");
    if (errAlert) errAlert.style.display = "none";

    // Populate read-only student info from authoritative profile
    const u = this.currentUser || {};
    document.getElementById("formStudentRegNo").textContent = u.identifier || "-";
    document.getElementById("formStudentName").textContent = u.name || "-";
    document.getElementById("formStudentDept").textContent = u.department || "Computer Science & Engineering";
    document.getElementById("formStudentSection").textContent = u.section || "CSE-A";

    modal.style.display = "flex";
  },

  closeOdModal() {
    const modal = document.getElementById("odModal");
    if (modal) modal.style.display = "none";
  },

  selectCategory(cat) {
    document.getElementById("odSelectedCategory").value = cat;
    const badge = document.getElementById("odSelectedCategoryBadge");
    if (badge) badge.textContent = cat;

    document.getElementById("odCategoryStep").style.display = "none";
    document.getElementById("odFormStep").style.display = "block";
    document.getElementById("odPreviewStep").style.display = "none";
    document.getElementById("odModalHeaderTitle").textContent = "📝 Apply for OD: " + cat;
  },

  backToCategories() {
    document.getElementById("odCategoryStep").style.display = "block";
    document.getElementById("odFormStep").style.display = "none";
    document.getElementById("odPreviewStep").style.display = "none";
    document.getElementById("odModalHeaderTitle").textContent = "📝 On-Duty (OD) Application Portal";
  },

  updateDaysCount() {
    const s = document.getElementById("odStartDateInput").value;
    const e = document.getElementById("odEndDateInput").value;
    const daysInput = document.getElementById("odDaysInput");
    if (s && e) {
      const start = new Date(s);
      const end = new Date(e);
      if (end < start) {
        Toast.show("End date cannot be earlier than start date.", "warning");
        daysInput.value = 1;
        return;
      }
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      daysInput.value = diffDays;
    }
  },

  handleFileSelect(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      Toast.show("File size exceeds 5MB limit. Please choose a smaller file.", "warning");
      event.target.value = "";
      return;
    }

    // Validate type
    const validTypes = ["application/pdf", "image/jpeg", "image/png", "image/jpg"];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(pdf|jpg|jpeg|png)$/i)) {
      Toast.show("Unsupported file format. Please upload a PDF, JPG, or PNG document.", "warning");
      event.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      this.currentFile = {
        name: file.name,
        type: file.type || "application/octet-stream",
        size: file.size,
        data: reader.result
      };

      const infoEl = document.getElementById("odFileSelectedInfo");
      if (infoEl) {
        infoEl.style.display = "inline-flex";
        infoEl.innerHTML = `
          <div class="file-selected-badge">
            <span>📎 ${this.escape(file.name)} (${(file.size / 1024).toFixed(1)} KB)</span>
            <button type="button" onclick="event.stopPropagation(); StudentPortal.removeFile();" style="background:none; border:none; cursor:pointer; color:#ef4444; font-weight:700; margin-left:6px;" title="Remove file">✕</button>
          </div>
        `;
      }
      Toast.show("Supporting document attached successfully!", "success");
    };
    reader.readAsDataURL(file);
  },

  removeFile() {
    this.currentFile = null;
    const fileInput = document.getElementById("odDocFileInput");
    if (fileInput) fileInput.value = "";
    const infoEl = document.getElementById("odFileSelectedInfo");
    if (infoEl) {
      infoEl.style.display = "none";
      infoEl.innerHTML = "";
    }
  },

  validateOdForm() {
    const alertEl = document.getElementById("odFormErrorAlert");
    if (alertEl) alertEl.style.display = "none";

    const cat = document.getElementById("odSelectedCategory").value;
    const title = document.getElementById("odEventTitleInput").value.trim();
    const org = document.getElementById("odOrganizerInput").value.trim();
    const venue = document.getElementById("odVenueInput").value.trim();
    const start = document.getElementById("odStartDateInput").value;
    const end = document.getElementById("odEndDateInput").value;
    const reason = document.getElementById("odReasonInput").value.trim();

    if (!cat) {
      if (alertEl) { alertEl.textContent = "Please select an OD category."; alertEl.style.display = "block"; }
      return false;
    }
    if (!title) {
      if (alertEl) { alertEl.textContent = "Please enter the event title / competition name."; alertEl.style.display = "block"; }
      return false;
    }
    if (!org) {
      if (alertEl) { alertEl.textContent = "Please enter the organizing institution / body."; alertEl.style.display = "block"; }
      return false;
    }
    if (!venue) {
      if (alertEl) { alertEl.textContent = "Please specify the event venue / location."; alertEl.style.display = "block"; }
      return false;
    }
    if (!start) {
      if (alertEl) { alertEl.textContent = "Please specify the start date."; alertEl.style.display = "block"; }
      return false;
    }
    if (!end) {
      if (alertEl) { alertEl.textContent = "Please specify the end date."; alertEl.style.display = "block"; }
      return false;
    }
    if (start > end) {
      if (alertEl) { alertEl.textContent = "Start date cannot be after end date."; alertEl.style.display = "block"; }
      return false;
    }
    if (!reason) {
      if (alertEl) { alertEl.textContent = "Please provide an academic purpose & justification."; alertEl.style.display = "block"; }
      return false;
    }
    return true;
  },

  async saveDraftOd() {
    const cat = document.getElementById("odSelectedCategory").value || "Other";
    const title = document.getElementById("odEventTitleInput").value.trim();
    const org = document.getElementById("odOrganizerInput").value.trim();
    const venue = document.getElementById("odVenueInput").value.trim();
    const start = document.getElementById("odStartDateInput").value;
    const end = document.getElementById("odEndDateInput").value;
    const days = parseInt(document.getElementById("odDaysInput").value) || 1;
    const reason = document.getElementById("odReasonInput").value.trim();

    if (!title && !reason) {
      Toast.show("Please enter at least an event title or reason before saving a draft.", "warning");
      return;
    }

    const draftPayload = {
      id: document.getElementById("odActiveDraftId").value || null,
      odType: cat,
      eventTitle: title,
      organizer: org,
      venue: venue,
      startDate: start,
      endDate: end,
      numberOfDays: days,
      reason: reason,
      documentName: this.currentFile ? this.currentFile.name : null,
      documentType: this.currentFile ? this.currentFile.type : null,
      documentData: this.currentFile ? this.currentFile.data : null,
      documentSize: this.currentFile ? this.currentFile.size : 0
    };

    const draftBtn = document.getElementById("odSaveDraftBtn");
    if (draftBtn) draftBtn.disabled = true;

    try {
      const res = await Auth.fetchWithAuth("/api/od/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draftPayload)
      });

      if (res.ok) {
        const saved = await res.json();
        document.getElementById("odActiveDraftId").value = saved.id;
        await this.loadOdRequests();
        this.closeOdModal();
        Toast.show("OD application saved as draft! Reference: " + saved.id, "success");
      } else {
        const err = await res.json();
        Toast.show("Draft Error: " + (err.error || "Could not save draft"), "danger");
      }
    } catch (e) {
      Toast.show("Draft Error: " + e.message, "danger");
    } finally {
      if (draftBtn) draftBtn.disabled = false;
    }
  },

  previewOdApplication() {
    if (!this.validateOdForm()) return;

    const u = this.currentUser || {};
    const cat = document.getElementById("odSelectedCategory").value;
    const title = document.getElementById("odEventTitleInput").value.trim();
    const org = document.getElementById("odOrganizerInput").value.trim();
    const venue = document.getElementById("odVenueInput").value.trim();
    const start = document.getElementById("odStartDateInput").value;
    const end = document.getElementById("odEndDateInput").value;
    const days = parseInt(document.getElementById("odDaysInput").value) || 1;
    const reason = document.getElementById("odReasonInput").value.trim();
    const sec = u.section || "CSE-A";
    const advName = sec === "CSE-B" ? "Dr. Divyabharathi" : (sec === "CSE-C" ? "Mrs. Rajavathi Jayapriya" : "Mrs. P. Arularasi");

    const isBonafide = cat.toLowerCase().includes("bonafide") || title.toLowerCase().includes("bonafide");
    const isLeave = cat.toLowerCase().includes("leave") || title.toLowerCase().includes("leave");

    // Dynamic document title
    const docTypeEl = document.getElementById("prevDocTypeTitle");
    if (docTypeEl) {
      if (isBonafide) {
        docTypeEl.textContent = "OFFICIAL APPLICATION FOR BONAFIDE CERTIFICATE";
      } else if (isLeave) {
        docTypeEl.textContent = `OFFICIAL APPLICATION FOR LEAVE OF ABSENCE (${(u.studentType || 'Day Scholar').toUpperCase()})`;
      } else if (cat) {
        docTypeEl.textContent = `OFFICIAL APPLICATION FOR ON-DUTY (OD) PERMISSION – ${cat.toUpperCase()}`;
      } else {
        docTypeEl.textContent = "OFFICIAL APPLICATION FOR ON-DUTY (OD) PERMISSION";
      }
    }

    // Dynamic field labels based on request type
    const catLbl = document.getElementById("prevCatLabel");
    const evtLbl = document.getElementById("prevEventTitleLabel");
    const orgLbl = document.getElementById("prevOrganizerLabel");
    const venLbl = document.getElementById("prevVenueLabel");
    const rsnLbl = document.getElementById("prevReasonLabel");

    if (catLbl) catLbl.textContent = isLeave ? "Leave Category" : (isBonafide ? "Certificate Category" : "OD Category");
    if (evtLbl) evtLbl.textContent = isLeave ? "Leave Type / Subject" : (isBonafide ? "Certificate Purpose" : "Event Title");
    if (orgLbl) orgLbl.textContent = isLeave ? "Hostel / Residence Info" : (isBonafide ? "Issuing Institution" : "Organizing Body");
    if (venLbl) venLbl.textContent = isLeave ? "Emergency Contact / Loc" : (isBonafide ? "Campus Location" : "Event Venue / City");
    if (rsnLbl) rsnLbl.textContent = isLeave ? "Reason for Leave" : (isBonafide ? "Purpose & Justification" : "Purpose & Justification");

    // Populate Student Specific Printable Preview Details
    document.getElementById("prevRegNo").textContent = u.identifier || "-";
    document.getElementById("prevStudentName").textContent = u.name || "-";
    document.getElementById("prevDept").textContent = u.department || "Computer Science & Engineering";
    document.getElementById("prevSection").textContent = sec;
    document.getElementById("prevCategory").textContent = cat;
    document.getElementById("prevDuration").textContent = `${start} to ${end} (${days} Day(s))`;
    document.getElementById("prevEventTitle").textContent = title;
    document.getElementById("prevOrganizer").textContent = org;
    document.getElementById("prevVenue").textContent = venue;
    document.getElementById("prevReason").textContent = reason;

    const docEl = document.getElementById("prevDocumentStatus");
    if (this.currentFile) {
      docEl.innerHTML = `
        <span style="display:inline-flex; align-items:center; gap:6px; color:#0d9488; font-weight:600;">
          <span>📎</span> <span>${this.escape(this.currentFile.name)}</span>
          <span style="font-size:11px; color:#64748b;">(${(this.currentFile.size / 1024).toFixed(1)} KB - Attached)</span>
        </span>
      `;
    } else {
      docEl.textContent = isBonafide ? "Standard Institutional Verification Record" : "Self-Declaration / Institutional Record";
    }

    // STRICT APPROVAL WORKFLOW ROUTE RULES:
    // Workflow A (Bonafide Certificate ONLY): Student -> Class Advisor -> HOD -> Principal (3-Stage)
    // Workflow B (Every other student request): Student -> Class Advisor -> HOD (2-Stage)
    // Non-Bonafide requests (OD - Symposium, Hackathon, Workshop, Internship, IV, Leave, Single/Multi-day) NEVER route to Principal!
    const reqPrincipal = isBonafide;

    const pBlock = document.getElementById("prevPrincipalBlock");
    const vBlocks = document.getElementById("prevVerificationBlocks");

    // Dynamic verification signatures blocks
    const advTitle = document.getElementById("prevAdvTitle");
    const advSigner = document.getElementById("prevAdvSigner");
    if (advTitle) advTitle.textContent = `Class Advisor (${sec})`;
    if (advSigner) advSigner.textContent = advName;

    const hodTitle = document.getElementById("prevHodTitle");
    const hodSigner = document.getElementById("prevHodSigner");
    if (hodTitle) hodTitle.textContent = "Head of Department (CSE)";
    if (hodSigner) hodSigner.textContent = "Dr. K. Gopinath";

    if (pBlock) pBlock.style.display = reqPrincipal ? "block" : "none";
    if (vBlocks) vBlocks.style.gridTemplateColumns = reqPrincipal ? "1fr 1fr 1fr" : "1fr 1fr";

    document.getElementById("odCategoryStep").style.display = "none";
    document.getElementById("odFormStep").style.display = "none";
    document.getElementById("odPreviewStep").style.display = "block";
    document.getElementById("odModalHeaderTitle").textContent = isBonafide
      ? "👁️ Official Bonafide Certificate Application Preview"
      : (isLeave ? "👁️ Official Leave Application Preview" : "👁️ Official OD Application Preview");
  },

  editOdApplication() {
    const cat = (document.getElementById("odSelectedCategory") && document.getElementById("odSelectedCategory").value) || "";
    if (cat.toLowerCase().includes("bonafide")) {
      this.closeOdModal();
      this.openBonafideModal();
      return;
    }
    if (cat.toLowerCase().includes("leave")) {
      this.closeOdModal();
      this.openLeaveModal();
      return;
    }
    document.getElementById("odCategoryStep").style.display = "none";
    document.getElementById("odFormStep").style.display = "block";
    document.getElementById("odPreviewStep").style.display = "none";
    document.getElementById("odModalHeaderTitle").textContent = "📝 Edit OD Application";
  },

  printPreview() {
    const originalTitle = document.title;
    document.body.classList.add("print-active-od");
    document.title = "";
    window.print();
    setTimeout(() => {
      document.body.classList.remove("print-active-od");
      document.title = originalTitle;
    }, 600);
  },

  promptSubmitConfirmation() {
    const title = document.getElementById("odEventTitleInput").value.trim();
    const start = document.getElementById("odStartDateInput").value;
    const end = document.getElementById("odEndDateInput").value;
    const days = document.getElementById("odDaysInput").value || 1;
    const sec = (this.currentUser && this.currentUser.section) || "CSE-A";

    document.getElementById("confirmModalEventTitle").textContent = title;
    document.getElementById("confirmModalDates").textContent = `${start} to ${end} (${days} Day(s))`;
    document.getElementById("confirmModalAdvisor").textContent = `Class Advisor (${sec})`;

    const cModal = document.getElementById("odConfirmModal");
    if (cModal) cModal.style.display = "flex";
  },

  closeConfirmModal() {
    const cModal = document.getElementById("odConfirmModal");
    if (cModal) cModal.style.display = "none";
  },

  async confirmSubmitOd() {
    this.closeConfirmModal();

    const cat = document.getElementById("odSelectedCategory").value;
    if (cat.toLowerCase().includes("bonafide")) {
      this.closeOdModal();
      return this.submitBonafide();
    }
    if (cat.toLowerCase().includes("leave")) {
      this.closeOdModal();
      return this.submitLeave();
    }
    const title = document.getElementById("odEventTitleInput").value.trim();
    const org = document.getElementById("odOrganizerInput").value.trim();
    const venue = document.getElementById("odVenueInput").value.trim();
    const start = document.getElementById("odStartDateInput").value;
    const end = document.getElementById("odEndDateInput").value;
    const days = parseInt(document.getElementById("odDaysInput").value) || 1;
    const reason = document.getElementById("odReasonInput").value.trim();
    const draftId = document.getElementById("odActiveDraftId").value || null;

    const submitBtn = document.getElementById("odSubmitBtn");
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Submitting to Class Advisor...";
    }

    const payload = {
      id: draftId,
      odType: cat,
      eventTitle: title,
      organizer: org,
      venue: venue,
      startDate: start,
      endDate: end,
      numberOfDays: days,
      reason: reason,
      supportingDetails: org + " - " + venue,
      documentName: this.currentFile ? this.currentFile.name : null,
      documentType: this.currentFile ? this.currentFile.type : null,
      documentData: this.currentFile ? this.currentFile.data : null,
      documentSize: this.currentFile ? this.currentFile.size : 0
    };

    try {
      const res = await Auth.fetchWithAuth("/api/od/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const created = await res.json();
        this.closeOdModal();
        await this.loadOdRequests();
        App.refreshNotifications();
        Toast.show("On-Duty application officially submitted to Class Advisor! Ref: " + created.id, "success");
      } else {
        const err = await res.json();
        Toast.show("Submission Error: " + (err.error || "Failed to submit OD"), "danger");
      }
    } catch (err) {
      Toast.show("Submission Error: " + err.message, "danger");
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `
          <span>🚀 Submit Application</span>
          <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
        `;
      }
    }
  },

  resumeDraft(id) {
    const r = this.requests.find(x => x.id === id);
    if (!r) return;

    this.openOdModal();
    document.getElementById("odActiveDraftId").value = r.id;
    this.selectCategory(r.odType || "Symposium / Conference");

    document.getElementById("odEventTitleInput").value = r.eventTitle || "";
    document.getElementById("odOrganizerInput").value = r.organizer || "";
    document.getElementById("odVenueInput").value = r.venue || r.eventDetails || "";
    document.getElementById("odStartDateInput").value = r.startDate || r.fromDate || "";
    document.getElementById("odEndDateInput").value = r.endDate || r.toDate || "";
    document.getElementById("odDaysInput").value = r.numberOfDays || 1;
    document.getElementById("odReasonInput").value = r.reason || "";

    if (r.documentData && r.documentName) {
      this.currentFile = {
        name: r.documentName,
        type: r.documentType,
        size: r.documentSize,
        data: r.documentData
      };
      const infoEl = document.getElementById("odFileSelectedInfo");
      if (infoEl) {
        infoEl.style.display = "inline-flex";
        infoEl.innerHTML = `
          <div class="file-selected-badge">
            <span>📎 ${this.escape(r.documentName)}</span>
            <button type="button" onclick="event.stopPropagation(); StudentPortal.removeFile();" style="background:none; border:none; cursor:pointer; color:#ef4444; font-weight:700; margin-left:6px;">✕</button>
          </div>
        `;
      }
    }

    Toast.show("Resumed draft OD application: " + r.id, "info");
  },

  viewOdDetails(id) {
    App.viewRequestDetails(id);
    return;
  },

  _legacyViewOdDetails(id) {

    const modal = document.getElementById("odDetailsModal");
    if (!modal) return;

    const isBonafide = (r.odType && r.odType.toLowerCase().includes("bonafide")) || (r.id && r.id.startsWith("EPOCH-BNF"));
    const isLeave = (r.odType && r.odType.toLowerCase().includes("leave")) || (r.id && r.id.startsWith("EPOCH-LV"));

    document.getElementById("detModalId").textContent = r.id;
    document.getElementById("detEventTitle").textContent = r.eventTitle || r.odType || (isBonafide ? "Bonafide Certificate" : (isLeave ? "Leave Application" : "On-Duty Requisition"));
    document.getElementById("detCategory").textContent = `Request Type: ${r.odType || (isBonafide ? "Bonafide Certificate" : (isLeave ? "Leave Application" : "On-Duty"))} • ${isBonafide ? "3-Stage Institutional Workflow" : "2-Stage Department Workflow"}`;
    document.getElementById("detOrganizer").textContent = r.organizer || (isBonafide ? "Gnanamani College of Technology" : (isLeave ? "College Attendance / Leave" : "Academic Institution"));
    document.getElementById("detVenue").textContent = r.venue || r.eventDetails || (isBonafide ? "Campus" : (isLeave ? "Personal" : "On-site Venue"));
    document.getElementById("detDates").textContent = `${r.startDate || r.fromDate || '-'} to ${r.endDate || r.toDate || '-'} (${r.numberOfDays || 1} Day(s))`;
    document.getElementById("detReason").textContent = r.reason || "-";
    document.getElementById("detSubmittedAt").textContent = r.submittedAt || "Recent";

    const docEl = document.getElementById("detDocument");
    if (r.documentData) {
      docEl.innerHTML = `
        <a href="${r.documentData}" download="${r.documentName || 'Supporting_Document'}" class="btn btn-sm btn-secondary" style="display:inline-flex; align-items:center; gap:6px;">
          <span>📎 Download Attached Document (${this.escape(r.documentName || 'File')})</span>
        </a>
      `;
    } else {
      docEl.textContent = isBonafide ? "Standard Institutional Verification" : "Self-Declaration / Department Record";
    }

    // Status badge
    document.getElementById("detStatusBadge").innerHTML = this.formatStatusBadge(r.status);

    const timeline = document.getElementById("detApprovalTimeline");
    const adv = r.advisorDecision || {};
    const hod = r.hodDecision || {};
    const prin = r.principalDecision || {};

    const isApproved = r.status === "APPROVED";
    const isRejected = r.status === "REJECTED";

    // ---------------- WORKFLOW 1: BONAFIDE CERTIFICATE (3 APPROVAL STAGES) ----------------
    // Progress Tracker: Student Submitted → Class Advisor Approved → HOD Approved → Principal Approved → Certificate Available
    if (isBonafide) {
      const advApproved = adv.status === "APPROVED" || r.status === "PENDING_HOD" || r.status === "PENDING_PRINCIPAL" || isApproved;
      const advRejected = isRejected && (r.rejectedBy || "").includes("Advisor");
      const advActive = r.status === "PENDING_ADVISOR";

      const hodApproved = hod.status === "APPROVED" || r.status === "PENDING_PRINCIPAL" || isApproved;
      const hodRejected = isRejected && (r.rejectedBy || "").includes("HOD");
      const hodActive = r.status === "PENDING_HOD";

      const prinApproved = isApproved;
      const prinRejected = isRejected && (r.rejectedBy || "").includes("Principal");
      const prinActive = r.status === "PENDING_PRINCIPAL";

      const advNodeClass = advApproved ? "completed" : (advRejected ? "rejected" : (advActive ? "active" : ""));
      const hodNodeClass = hodApproved ? "completed" : (hodRejected ? "rejected" : (hodActive ? "active" : ""));
      const prinNodeClass = prinApproved ? "completed" : (prinRejected ? "rejected" : (prinActive ? "active" : ""));
      const certNodeClass = isApproved ? "completed" : "";

      const advIcon = advApproved ? "✓" : (advRejected ? "✕" : (advActive ? "2" : "2"));
      const hodIcon = hodApproved ? "✓" : (hodRejected ? "✕" : (hodActive ? "3" : "3"));
      const prinIcon = prinApproved ? "✓" : (prinRejected ? "✕" : (prinActive ? "4" : "4"));
      const certIcon = isApproved ? "🎓" : "🔒";

      const advText = advApproved
        ? `✅ Recommended by ${adv.approver || 'Class Advisor'} on ${adv.timestamp || ''}<br><span class="signature-stamp-badge">✍️ Registered Electronic Signature Captured</span>`
        : (advRejected ? `❌ Rejected by Class Advisor<br><strong>Reason:</strong> ${this.escape(r.rejectionReason || adv.reason || '')}` : '⏳ In Queue: Awaiting Class Advisor Review & Endorsement');

      const hodText = hodApproved
        ? `✅ Recommended by Dr. K. Gopinath (HOD) on ${hod.timestamp || ''}<br><span class="signature-stamp-badge">✍️ Registered Electronic Signature Captured</span>`
        : (hodRejected ? `❌ Rejected by Head of Department<br><strong>Reason:</strong> ${this.escape(r.rejectionReason || hod.reason || '')}` : (advApproved ? '⏳ In Queue: Awaiting HOD Endorsement to Principal' : '⏸️ Pending: Awaiting Class Advisor Endorsement'));

      const prinText = prinApproved
        ? `✅ Officially Approved & Sanctioned by Principal Dr. B. Sanjay Gandhi on ${prin.timestamp || ''}<br><span class="signature-stamp-badge">✍️ Principal Executive Signature Sealed</span>`
        : (prinRejected ? `❌ Rejected by Principal Dr. B. Sanjay Gandhi<br><strong>Reason:</strong> ${this.escape(r.rejectionReason || prin.reason || '')}` : (hodApproved ? '⏳ In Queue: Awaiting Principal Final Approval & Certificate Issue' : '⏸️ Pending: Awaiting Department Approvals'));

      const certText = isApproved
        ? `<div style="color:#047857; font-weight:700;">🎉 Bonafide Certificate Officially Issued & Digitally Signed!</div><div style="font-size:11.5px; color:#475569; margin-top:2px;">Bearing verified credentials and signatures of Class Advisor, HOD, and Principal.</div>`
        : `<div style="color:#64748b;">🔒 Certificate download will unlock immediately upon Principal executive approval.</div>`;

      timeline.innerHTML = `
        <div class="workflow-progress-tracker">
          <div class="workflow-tracker-title">
            <strong style="color:var(--primary); font-size:13px;">📜 Bonafide Certificate Progress Tracker (Three Approval Stages)</strong>
            <span class="badge-tag ${isApproved ? 'badge-approved' : (isRejected ? 'badge-rejected' : 'badge-warning')}">${this.escape(r.status)}</span>
          </div>
          <div class="workflow-stepper">
            <div class="workflow-step-node completed">
              <div class="workflow-step-circle">✓</div>
              <div class="workflow-step-label">Student<br>Submitted</div>
            </div>
            <div class="workflow-step-line ${advApproved ? 'completed' : (advActive ? 'active' : '')}"></div>
            <div class="workflow-step-node ${advNodeClass}">
              <div class="workflow-step-circle">${advIcon}</div>
              <div class="workflow-step-label">Class Advisor<br>Approved</div>
            </div>
            <div class="workflow-step-line ${hodApproved ? 'completed' : (hodActive ? 'active' : '')}"></div>
            <div class="workflow-step-node ${hodNodeClass}">
              <div class="workflow-step-circle">${hodIcon}</div>
              <div class="workflow-step-label">HOD<br>Approved</div>
            </div>
            <div class="workflow-step-line ${prinApproved ? 'completed' : (prinActive ? 'active' : '')}"></div>
            <div class="workflow-step-node ${prinNodeClass}">
              <div class="workflow-step-circle">${prinIcon}</div>
              <div class="workflow-step-label">Principal<br>Approved</div>
            </div>
            <div class="workflow-step-line ${certNodeClass}"></div>
            <div class="workflow-step-node ${certNodeClass}">
              <div class="workflow-step-circle">${certIcon}</div>
              <div class="workflow-step-label">Certificate<br>Available</div>
            </div>
          </div>
        </div>

        <div style="display:flex; flex-direction:column; gap:10px;">
          <div class="approval-step approved">
            <div style="font-size:18px;">1️⃣</div>
            <div style="flex:1;">
              <div style="font-weight:700; color:var(--primary);">Student Request Submission</div>
              <div style="font-size:12px; color:#475569; margin-top:2px;">Submitted by ${this.escape(r.studentName)} (${this.escape(r.regNo)}, ${this.escape(r.section)}) on ${this.escape(r.submittedAt || "Recent")}</div>
            </div>
          </div>
          <div class="approval-step ${advApproved ? 'approved' : (advRejected ? 'rejected' : 'pending')}">
            <div style="font-size:18px;">2️⃣</div>
            <div style="flex:1;">
              <div style="font-weight:700; color:var(--primary);">Stage 1: Class Advisor Verification (${r.section || 'CSE'})</div>
              <div style="font-size:12px; color:#475569; margin-top:2px;">${advText}</div>
            </div>
          </div>
          <div class="approval-step ${hodApproved ? 'approved' : (hodRejected ? 'rejected' : 'pending')}">
            <div style="font-size:18px;">3️⃣</div>
            <div style="flex:1;">
              <div style="font-weight:700; color:var(--primary);">Stage 2: Head of Department Endorsement (CSE)</div>
              <div style="font-size:12px; color:#475569; margin-top:2px;">${hodText}</div>
            </div>
          </div>
          <div class="approval-step ${prinApproved ? 'approved' : (prinRejected ? 'rejected' : 'pending')}">
            <div style="font-size:18px;">4️⃣</div>
            <div style="flex:1;">
              <div style="font-weight:700; color:var(--primary);">Stage 3: Principal Final Sanction (Dr. B. Sanjay Gandhi)</div>
              <div style="font-size:12px; color:#475569; margin-top:2px;">${prinText}</div>
            </div>
          </div>
          <div class="approval-step ${isApproved ? 'approved' : 'pending'}">
            <div style="font-size:18px;">📜</div>
            <div style="flex:1;">
              <div style="font-weight:700; color:var(--primary);">Final Certificate Availability</div>
              <div style="font-size:12px; margin-top:2px;">${certText}</div>
            </div>
          </div>
        </div>
      `;
    } else {
      // ---------------- WORKFLOW 2: ALL OTHER REQUESTS (2 APPROVAL STAGES) ----------------
      // Progress Tracker: Student Submitted → Class Advisor Approved → HOD Approved → Final Form Available
      // Principal is NOT part of this chain!
      const advApproved = adv.status === "APPROVED" || r.status === "PENDING_HOD" || isApproved;
      const advRejected = isRejected && (r.rejectedBy || "").includes("Advisor");
      const advActive = r.status === "PENDING_ADVISOR";

      const hodApproved = isApproved;
      const hodRejected = isRejected && (r.rejectedBy || "").includes("HOD");
      const hodActive = r.status === "PENDING_HOD";

      const advNodeClass = advApproved ? "completed" : (advRejected ? "rejected" : (advActive ? "active" : ""));
      const hodNodeClass = hodApproved ? "completed" : (hodRejected ? "rejected" : (hodActive ? "active" : ""));
      const formNodeClass = isApproved ? "completed" : "";

      const advIcon = advApproved ? "✓" : (advRejected ? "✕" : (advActive ? "2" : "2"));
      const hodIcon = hodApproved ? "✓" : (hodRejected ? "✕" : (hodActive ? "3" : "3"));
      const formIcon = isApproved ? "📄" : "🔒";

      const advText = advApproved
        ? `✅ Approved & Recommended by ${adv.approver || 'Class Advisor'} on ${adv.timestamp || ''}<br><span class="signature-stamp-badge">✍️ Registered Electronic Signature Captured</span>`
        : (advRejected ? `❌ Rejected by Class Advisor<br><strong>Reason:</strong> ${this.escape(r.rejectionReason || adv.reason || '')}` : '⏳ In Queue: Awaiting Class Advisor Review & Endorsement');

      const hodText = hodApproved
        ? `✅ Final Approval & Sanction Granted by Dr. K. Gopinath (HOD-CSE) on ${hod.timestamp || ''}<br><span class="signature-stamp-badge">✍️ Registered Electronic Signature Captured</span>`
        : (hodRejected ? `❌ Rejected by Head of Department<br><strong>Reason:</strong> ${this.escape(r.rejectionReason || hod.reason || '')}` : (advApproved ? '⏳ In Queue: Awaiting HOD Final Approval' : '⏸️ Pending: Awaiting Class Advisor Review'));

      const formText = isApproved
        ? `<div style="color:#047857; font-weight:700;">🎉 Official Sanction Form Approved & Ready for Download!</div><div style="font-size:11.5px; color:#475569; margin-top:2px;">Duly authorized with the registered electronic signatures of the Class Advisor and HOD.</div>`
        : `<div style="color:#64748b;">🔒 Form download will unlock immediately upon HOD final approval.</div>`;

      timeline.innerHTML = `
        <div class="workflow-progress-tracker">
          <div class="workflow-tracker-title">
            <strong style="color:var(--primary); font-size:13px;">📝 ${this.escape(r.odType)} Progress Tracker (Two Approval Stages)</strong>
            <span class="badge-tag ${isApproved ? 'badge-approved' : (isRejected ? 'badge-rejected' : 'badge-warning')}">${this.escape(r.status)}</span>
          </div>
          <div class="workflow-stepper">
            <div class="workflow-step-node completed">
              <div class="workflow-step-circle">✓</div>
              <div class="workflow-step-label">Student<br>Submitted</div>
            </div>
            <div class="workflow-step-line ${advApproved ? 'completed' : (advActive ? 'active' : '')}"></div>
            <div class="workflow-step-node ${advNodeClass}">
              <div class="workflow-step-circle">${advIcon}</div>
              <div class="workflow-step-label">Class Advisor<br>Approved</div>
            </div>
            <div class="workflow-step-line ${hodApproved ? 'completed' : (hodActive ? 'active' : '')}"></div>
            <div class="workflow-step-node ${hodNodeClass}">
              <div class="workflow-step-circle">${hodIcon}</div>
              <div class="workflow-step-label">HOD<br>Approved</div>
            </div>
            <div class="workflow-step-line ${formNodeClass}"></div>
            <div class="workflow-step-node ${formNodeClass}">
              <div class="workflow-step-circle">${formIcon}</div>
              <div class="workflow-step-label">Final Form<br>Available</div>
            </div>
          </div>
        </div>

        <div style="display:flex; flex-direction:column; gap:10px;">
          <div class="approval-step approved">
            <div style="font-size:18px;">1️⃣</div>
            <div style="flex:1;">
              <div style="font-weight:700; color:var(--primary);">Student Request Submission</div>
              <div style="font-size:12px; color:#475569; margin-top:2px;">Submitted by ${this.escape(r.studentName)} (${this.escape(r.regNo)}, ${this.escape(r.section)}) on ${this.escape(r.submittedAt || "Recent")}</div>
            </div>
          </div>
          <div class="approval-step ${advApproved ? 'approved' : (advRejected ? 'rejected' : 'pending')}">
            <div style="font-size:18px;">2️⃣</div>
            <div style="flex:1;">
              <div style="font-weight:700; color:var(--primary);">Stage 1: Class Advisor Review (${r.section || 'CSE'})</div>
              <div style="font-size:12px; color:#475569; margin-top:2px;">${advText}</div>
            </div>
          </div>
          <div class="approval-step ${hodApproved ? 'approved' : (hodRejected ? 'rejected' : 'pending')}">
            <div style="font-size:18px;">3️⃣</div>
            <div style="flex:1;">
              <div style="font-weight:700; color:var(--primary);">Stage 2: Head of Department Final Sanction (CSE) — Final Approver</div>
              <div style="font-size:12px; color:#475569; margin-top:2px;">${hodText}</div>
            </div>
          </div>
          <div class="approval-step ${isApproved ? 'approved' : 'pending'}">
            <div style="font-size:18px;">📄</div>
            <div style="flex:1;">
              <div style="font-weight:700; color:var(--primary);">Final Approved Form Availability</div>
              <div style="font-size:12px; margin-top:2px;">${formText}</div>
            </div>
          </div>
        </div>
      `;
    }

    // Persisted Multi-Stage Workflow Events Audit Timeline
    if (r.workflowTimeline && r.workflowTimeline.length > 0) {
      let eventsHtml = `
        <div style="margin-top:16px; border-top:1.5px dashed var(--border); padding-top:14px;">
          <h4 style="font-size:13px; font-weight:700; color:var(--primary); margin:0 0 10px 0; display:flex; align-items:center; gap:6px;">
            <span>📜</span> Recorded Workflow Event Timeline
          </h4>
          <div style="display:flex; flex-direction:column; gap:8px;">
      `;

      r.workflowTimeline.forEach(ev => {
        let badgeStyle = "badge-approved";
        if (ev.decision === "REJECTED") badgeStyle = "badge-rejected";
        else if (ev.decision === "SUBMITTED") badgeStyle = "badge-secondary";

        let roleLabel = ev.actorRole || "System";
        if (roleLabel === "CLASS_ADVISOR") roleLabel = "Class Advisor";
        else if (roleLabel === "HOD") roleLabel = "Head of Department";
        else if (roleLabel === "PRINCIPAL") roleLabel = "Principal";
        else if (roleLabel === "STUDENT") roleLabel = "Student";

        eventsHtml += `
          <div style="background:#ffffff; border:1px solid var(--border); border-left:3px solid var(--accent-teal); border-radius:6px; padding:10px 12px; font-size:12px;">
            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:6px;">
              <div>
                <strong>${this.escape(ev.actorName || ev.actorId || 'Official')}</strong>
                <span class="badge-tag badge-secondary" style="font-size:10px; padding:1px 6px; margin-left:4px;">${this.escape(roleLabel)}</span>
              </div>
              <div style="display:flex; align-items:center; gap:6px;">
                <span class="badge-tag ${badgeStyle}" style="font-size:10px; padding:1px 6px;">${this.escape(ev.decision)}</span>
                <span style="color:#94a3b8; font-size:11px;">${this.escape(ev.timestamp)}</span>
              </div>
            </div>
            ${ev.remarks ? `<div style="margin-top:4px; color:#475569;"><em>"${this.escape(ev.remarks)}"</em></div>` : ''}
            <div style="margin-top:6px; display:flex; align-items:center; gap:6px; font-size:11px; color:#0f766e;">
              <span>✍️ Registered Electronic Signature Snapshot Captured</span>
            </div>
          </div>
        `;
      });

      eventsHtml += `</div></div>`;
      timeline.innerHTML += eventsHtml;
    }

    // Action button inside details (e.g. download PDF if approved)
    const extraEl = document.getElementById("detActionExtra");
    if (extraEl) {
      if (isApproved) {
        if (isBonafide) {
          extraEl.innerHTML = `
            <button class="btn btn-primary btn-sm" onclick="StudentPortal.downloadPdf('${r.id}');">
              📥 Download Bonafide Certificate (PDF)
            </button>
          `;
        } else {
          extraEl.innerHTML = `
            <div style="display:flex; gap:8px;">
              <button class="btn btn-primary btn-sm" onclick="StudentPortal.openQrModal('${r.id}');">
                🔍 View Official QR Certificate
              </button>
              <button class="btn btn-success btn-sm" onclick="StudentPortal.downloadPdf('${r.id}');" style="background:#059669; color:#fff; border:none; padding:4px 10px; border-radius:4px; font-weight:600;">
                📥 Download Approved Form (PDF)
              </button>
            </div>
          `;
        }
      } else {
        extraEl.innerHTML = `<span style="font-size:12px; color:#64748b;">Awaiting required approvals before document download is unlocked.</span>`;
      }
    }

    modal.style.display = "flex";
  },

  closeDetailsModal() {
    App.closeRequestDetailsModal();
  },

  // ------------------ QR Document Certificate ------------------
  openQrModal(id) {
    const req = this.requests.find(r => r.id === id) || (window.DemoStore ? DemoStore.getOdRequests().find(r => r.id === id) : null);
    const modal = document.getElementById("qrCertificateModal");
    if (!modal) return;

    const idEl = document.getElementById("qrCertModalId");
    const stEl = document.getElementById("qrCertStudent");
    const typeEl = document.getElementById("qrCertType");
    const datesEl = document.getElementById("qrCertDates");
    const venueEl = document.getElementById("qrCertVenue");
    const codeEl = document.getElementById("qrCertCode");
    const docTitleEl = document.getElementById("qrCertDocTitle");

    const isBonafide = req && ((req.odType && req.odType.toLowerCase().includes("bonafide")) || (req.id && req.id.startsWith("EPOCH-BNF")));
    const isLeave = req && ((req.odType && req.odType.toLowerCase().includes("leave")) || (req.id && req.id.startsWith("EPOCH-LV")));

    if (docTitleEl) {
      if (isBonafide) {
        docTitleEl.textContent = "OFFICIAL BONAFIDE CERTIFICATE";
      } else if (isLeave) {
        docTitleEl.textContent = "OFFICIAL LEAVE SANCTION CERTIFICATE";
      } else if (req && req.odType) {
        docTitleEl.textContent = `OFFICIAL ON-DUTY (OD) SANCTION CERTIFICATE – ${req.odType.toUpperCase()}`;
      } else {
        docTitleEl.textContent = "OFFICIAL ON-DUTY (OD) SANCTION CERTIFICATE";
      }
    }

    if (idEl) idEl.textContent = req ? req.id : id;
    if (stEl) stEl.textContent = req ? `${req.studentName || this.currentUser.name} (${req.regNo || this.currentUser.identifier} - ${req.section || 'CSE-A'})` : this.currentUser.name;
    if (typeEl) typeEl.textContent = req ? (req.odType || (isBonafide ? "Bonafide Certificate" : "On-Duty")) : "On-Duty";
    if (datesEl) datesEl.textContent = req ? `${req.fromDate || req.startDate || '12 Mar 2026'} to ${req.toDate || req.endDate || '13 Mar 2026'}` : "12 Mar 2026 to 13 Mar 2026";
    if (venueEl) venueEl.textContent = req ? (req.eventDetails || req.venue || (isBonafide ? "Gnanamani College of Technology, Autonomous Campus" : "Academic Event")) : "Autonomous Campus";
    if (codeEl) codeEl.textContent = req && req.verificationCode ? req.verificationCode : `GCT-OD-VERIFIED-${Math.floor(100000 + Math.random() * 900000)}`;

    const sigsEl = document.getElementById("qrDocSignatures");
    if (sigsEl && req) {
      const adv = req.advisorDecision || {};
      const hod = req.hodDecision || {};
      const prin = req.principalDecision || {};

      const renderSigBlock = (role, decision, defaultName) => {
        const name = (decision && decision.signerName) || (decision && decision.approver) || defaultName;
        const time = (decision && decision.timestamp) || "Approved";
        const sig = decision && decision.signatureBase64;
        return `
          <div style="flex:1; text-align:center; padding:8px; border:1px solid #cbd5e1; border-radius:6px; background:#f8fafc;">
            <strong style="color:#0f2942; font-size:12px;">${role}</strong>
            <div style="height:44px; display:flex; align-items:center; justify-content:center; margin:4px 0;">
              ${sig ? `<img src="${sig}" alt="Signature" style="max-height:40px; max-width:140px; object-fit:contain;">` : `<span style="font-family:cursive; font-size:14px; color:#1e293b;">${name}</span>`}
            </div>
            <div style="font-weight:600; font-size:11px; color:#1e293b;">${name}</div>
            <div style="font-size:10px; color:#059669; font-weight:700;">✓ Digitally Signed</div>
            <div style="font-size:9.5px; color:#64748b; font-family:monospace;">${time}</div>
          </div>
        `;
      };

      const advSec = req.section || 'CSE-A';
      const advDef = advSec === 'CSE-B' ? 'Dr. Divyabharathi' : (advSec === 'CSE-C' ? 'Mrs. Rajavathi Jayapriya' : 'Mrs. P. Arularasi');

      let html = `<div style="display:flex; gap:10px; width:100%; margin-top:10px;">`;
      html += renderSigBlock(`Class Advisor (${advSec})`, adv, advDef);
      html += renderSigBlock("Head of Department (CSE)", hod, "Dr. K. Gopinath");
      if (isBonafide) {
        html += renderSigBlock("Principal", prin, "Dr. B. Sanjay Gandhi");
      }
      html += `</div>`;
      sigsEl.innerHTML = html;
    }

    modal.style.display = "flex";
  },

  closeQrModal() {
    const modal = document.getElementById("qrCertificateModal");
    if (modal) modal.style.display = "none";
  },

  printQrCertificate() {
    const originalTitle = document.title;
    document.body.classList.add("print-active-qr");
    document.title = "";
    window.print();
    setTimeout(() => {
      document.body.classList.remove("print-active-qr");
      document.title = originalTitle;
    }, 600);
  },

  // ------------------ Leave Applications (Day Scholar & Hosteller) ------------------
  openLeaveModal() {
    const modal = document.getElementById("leaveModal");
    if (!modal) return;
    const u = this.currentUser || {};
    const nameEl = document.getElementById("leaveStudentName");
    const regEl = document.getElementById("leaveStudentRegNo");
    const deptEl = document.getElementById("leaveStudentDept");
    const yearEl = document.getElementById("leaveStudentYear");
    const typeBadge = document.getElementById("leaveStudentTypeBadge");

    if (nameEl) nameEl.textContent = u.name || "-";
    if (regEl) regEl.textContent = `${u.identifier || "-"} (${u.section || "CSE-A"})`;
    if (deptEl) deptEl.textContent = u.department || "CSE";
    if (yearEl) yearEl.textContent = u.year || u.academicYear || "IV Year";
    if (typeBadge) typeBadge.textContent = u.studentType || "Day Scholar";

    this.switchLeaveCategory(u.studentType || "Day Scholar");
    modal.style.display = "flex";
  },

  switchLeaveCategory(category) {
    this.currentLeaveCategory = category;
    const tabDay = document.getElementById("leaveTabDayScholar");
    const tabHostel = document.getElementById("leaveTabHosteller");
    const dayFields = document.getElementById("leaveDayScholarFields");
    const hostelFields = document.getElementById("leaveHostellerFields");
    const titleEl = document.getElementById("leaveModalTitle");
    const typeBadge = document.getElementById("leaveStudentTypeBadge");

    if (category === "Hosteller") {
      if (tabHostel) { tabHostel.className = "btn btn-sm btn-primary"; }
      if (tabDay) { tabDay.className = "btn btn-sm btn-secondary"; }
      if (dayFields) dayFields.style.display = "none";
      if (hostelFields) hostelFields.style.display = "block";
      if (titleEl) titleEl.textContent = "🏠 Hosteller Leave Letter (Hostel Outing / Home Leave)";
      if (typeBadge) {
        typeBadge.textContent = "Hosteller";
        typeBadge.className = "badge-tag badge-info";
      }
      const phInput = document.getElementById("leaveParentPhoneHostel");
      if (phInput && !phInput.value) phInput.value = (this.currentUser && (this.currentUser.contactPhone || this.currentUser.contact)) || "";
    } else {
      if (tabDay) { tabDay.className = "btn btn-sm btn-primary"; }
      if (tabHostel) { tabHostel.className = "btn btn-sm btn-secondary"; }
      if (dayFields) dayFields.style.display = "block";
      if (hostelFields) hostelFields.style.display = "none";
      if (titleEl) titleEl.textContent = "🚶 Day Scholar Leave Letter";
      if (typeBadge) {
        typeBadge.textContent = "Day Scholar";
        typeBadge.className = "badge-tag badge-teal";
      }
      const phInput = document.getElementById("leaveParentPhoneDay");
      if (phInput && !phInput.value) phInput.value = (this.currentUser && (this.currentUser.contactPhone || this.currentUser.contact)) || "";
    }
  },

  closeLeaveModal() {
    const modal = document.getElementById("leaveModal");
    if (modal) modal.style.display = "none";
  },

  async submitLeave() {
    const category = this.currentLeaveCategory || "Day Scholar";
    const type = document.getElementById("leaveTypeInput").value;
    const start = document.getElementById("leaveStartInput").value;
    const end = document.getElementById("leaveEndInput").value || start;
    const days = parseInt(document.getElementById("leaveDaysInput").value) || 1;
    const reason = document.getElementById("leaveReasonInput").value.trim();

    if (!type || !start || !reason) {
      Toast.show("Please enter start date, leave type, and reason.", "warning");
      return;
    }

    let parentContact = "";
    let hostelDetails = "";
    let destination = "";
    let outTime = "";
    let inTime = "";

    if (category === "Hosteller") {
      hostelDetails = (document.getElementById("leaveHostelBlockRoom")?.value || "").trim();
      parentContact = (document.getElementById("leaveParentPhoneHostel")?.value || "").trim();
      destination = (document.getElementById("leaveDestination")?.value || "").trim();
      outTime = document.getElementById("leaveOutTime")?.value || "";
      inTime = document.getElementById("leaveInTime")?.value || "";
    } else {
      parentContact = (document.getElementById("leaveParentPhoneDay")?.value || "").trim();
    }

    let supportingDetails = `Residence: ${category}`;
    if (parentContact) supportingDetails += ` | Parent Phone: ${parentContact}`;
    if (hostelDetails) supportingDetails += ` | Hostel: ${hostelDetails}`;
    if (destination) supportingDetails += ` | Destination: ${destination}`;
    if (outTime || inTime) supportingDetails += ` | Timings: ${outTime || '-'} to ${inTime || '-'}`;

    const payload = {
      odType: category === "Hosteller" ? "Hosteller Leave Letter" : "Day Scholar Leave Letter",
      studentType: category,
      academicYear: this.currentUser.year || this.currentUser.academicYear || "IV Year B.E.",
      eventTitle: `${category} Leave Letter - ${type}`,
      organizer: "College Attendance / Leave",
      venue: category === "Hosteller" ? (destination ? `Hostel Outing: ${destination}` : "Home") : "Home / Personal",
      startDate: start,
      endDate: end,
      numberOfDays: days,
      reason: reason,
      hostelDetails: hostelDetails,
      parentContact: parentContact,
      supportingDetails: supportingDetails
    };

    const submitBtn = document.getElementById("leaveSubmitBtn");
    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = "Submitting to Advisor..."; }

    try {
      const res = await Auth.fetchWithAuth("/api/od/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const created = await res.json();
        Toast.show(`${category} Leave application submitted to Class Advisor! Ref: ${created.id}`, "success");
      } else {
        const errText = await res.text();
        throw new Error(errText || "Submission failed");
      }
    } catch (e) {
      if (window.DemoStore) {
        DemoStore.addLeaveRequest({
          regNo: this.currentUser.identifier,
          studentName: this.currentUser.name,
          section: this.currentUser.section || "CSE-A",
          studentType: category,
          leaveType: payload.odType,
          startDate: start,
          endDate: end,
          numberOfDays: days,
          reason: reason,
          supportingDetails: supportingDetails
        });
        Toast.show(`${category} leave recorded in demo state!`, "success");
      } else {
        Toast.show("Submission Error: " + e.message, "danger");
      }
    } finally {
      if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = "Submit Leave Letter"; }
    }

    this.closeLeaveModal();
    await this.loadOdRequests();
    App.refreshNotifications();
  },

  previewLeaveApplication() {
    const u = this.currentUser || {};
    const category = this.currentLeaveCategory || "Day Scholar";
    const type = document.getElementById("leaveTypeInput")?.value || "Casual Leave";
    const start = document.getElementById("leaveStartInput")?.value || new Date().toISOString().split("T")[0];
    const end = document.getElementById("leaveEndInput")?.value || start;
    const days = parseInt(document.getElementById("leaveDaysInput")?.value) || 1;
    const reason = (document.getElementById("leaveReasonInput")?.value || "").trim() || "Academic Leave Request";

    this.closeLeaveModal();
    this.openOdModal();

    document.getElementById("odSelectedCategory").value = category === "Hosteller" ? "Hosteller Leave Letter" : "Day Scholar Leave Letter";
    document.getElementById("odEventTitleInput").value = `${category} Leave Letter - ${type}`;
    document.getElementById("odOrganizerInput").value = "College Attendance / Leave";
    document.getElementById("odVenueInput").value = category === "Hosteller" ? "Hostel Outing / Native" : "Home / Personal";
    document.getElementById("odStartDateInput").value = start;
    document.getElementById("odEndDateInput").value = end;
    document.getElementById("odDaysInput").value = days;
    document.getElementById("odReasonInput").value = reason;

    this.previewOdApplication();
    document.getElementById("odModalHeaderTitle").textContent = "👁️ Official Leave Application Preview";
  },

  // ------------------ Bonafide Certificates ------------------
  openBonafideModal() {
    const modal = document.getElementById("bonafideModal");
    if (modal) modal.style.display = "flex";
  },

  closeBonafideModal() {
    const modal = document.getElementById("bonafideModal");
    if (modal) modal.style.display = "none";
  },

  previewBonafideApplication() {
    const u = this.currentUser || {};
    const purpose = document.getElementById("bonafidePurposeInput")?.value || "Passport Application";
    const year = document.getElementById("bonafideYearInput") ? document.getElementById("bonafideYearInput").value : "2025-2026";
    const details = document.getElementById("bonafideDetailsInput") ? document.getElementById("bonafideDetailsInput").value.trim() : "";

    this.closeBonafideModal();
    this.openOdModal();

    document.getElementById("odSelectedCategory").value = "Bonafide Certificate";
    document.getElementById("odEventTitleInput").value = "Bonafide Certificate - " + purpose;
    document.getElementById("odOrganizerInput").value = "Gnanamani College of Technology";
    document.getElementById("odVenueInput").value = "Autonomous Campus";
    document.getElementById("odStartDateInput").value = new Date().toISOString().split("T")[0];
    document.getElementById("odEndDateInput").value = new Date().toISOString().split("T")[0];
    document.getElementById("odDaysInput").value = 1;
    document.getElementById("odReasonInput").value = purpose + (details ? " - " + details : "");

    this.previewOdApplication();
    document.getElementById("odModalHeaderTitle").textContent = "👁️ Official Bonafide Certificate Application Preview";
  },

  async submitBonafide() {
    const purpose = document.getElementById("bonafidePurposeInput").value;
    const year = document.getElementById("bonafideYearInput") ? document.getElementById("bonafideYearInput").value : "2025-2026";
    const details = document.getElementById("bonafideDetailsInput") ? document.getElementById("bonafideDetailsInput").value.trim() : "";

    if (!purpose) {
      Toast.show("Please select certificate purpose.", "warning");
      return;
    }

    const payload = {
      odType: "Bonafide Certificate",
      eventTitle: "Bonafide Certificate - " + purpose,
      organizer: "Gnanamani College of Technology",
      venue: "Autonomous Institution - Campus",
      startDate: new Date().toISOString().split("T")[0],
      endDate: new Date().toISOString().split("T")[0],
      numberOfDays: 1,
      reason: purpose + (details ? " - " + details : ""),
      supportingDetails: details || ("Bonafide Certificate Requisition for Academic Year " + year)
    };

    try {
      const res = await Auth.fetchWithAuth("/api/od/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const created = await res.json();
        Toast.show("Bonafide certificate request submitted! Ref: " + created.id, "success");
      } else {
        if (window.DemoStore) {
          DemoStore.addBonafideRequest({
            regNo: this.currentUser.identifier,
            studentName: this.currentUser.name,
            section: this.currentUser.section || "CSE-A",
            purpose: purpose,
            academicYear: year,
            details: details
          });
          Toast.show("Bonafide request submitted in demo state!", "success");
        }
      }
    } catch (e) {
      if (window.DemoStore) {
        DemoStore.addBonafideRequest({
          regNo: this.currentUser.identifier,
          studentName: this.currentUser.name,
          section: this.currentUser.section || "CSE-A",
          purpose: purpose,
          academicYear: year,
          details: details
        });
        Toast.show("Bonafide request submitted in demo state!", "success");
      }
    }

    this.closeBonafideModal();
    await this.loadOdRequests();
    App.refreshNotifications();
  },

  // ------------------ Student Complaints (Direct to Principal) ------------------
  // ------------------ Student Complaints (Direct to Principal) ------------------
  openComplaintModal() {
    const modal = document.getElementById("complaintModal");
    if (!modal) return;
    const u = this.currentUser || {};
    const nameEl = document.getElementById("cmpStudentName");
    const regEl = document.getElementById("cmpStudentRegNo");
    const deptEl = document.getElementById("cmpStudentDept");
    const yearEl = document.getElementById("cmpStudentYear");
    const typeBadge = document.getElementById("cmpStudentTypeBadge");

    if (nameEl) nameEl.textContent = u.name || "-";
    if (regEl) regEl.textContent = `${u.identifier || "-"} (${u.section || "CSE-A"})`;
    if (deptEl) deptEl.textContent = u.department || "CSE";
    if (yearEl) yearEl.textContent = u.year || u.academicYear || "IV Year";
    if (typeBadge) typeBadge.textContent = u.studentType || "Day Scholar";

    modal.style.display = "flex";
  },

  closeComplaintModal() {
    const modal = document.getElementById("complaintModal");
    if (modal) modal.style.display = "none";
  },

  async submitComplaint(e) {
    if (e) e.preventDefault();
    const cat = document.getElementById("cmpCategoryInput").value;
    const sub = document.getElementById("cmpSubjectInput").value.trim();
    const desc = document.getElementById("cmpDescInput").value.trim();
    const supp = document.getElementById("cmpSupportInput").value.trim();

    if (!cat || !sub || !desc) {
      Toast.show("Please enter category, subject, and a detailed description.", "warning");
      return;
    }

    const btn = document.getElementById("cmpSubmitBtn");
    btn.disabled = true;
    btn.textContent = "Delivering directly to Principal...";

    try {
      const res = await Auth.fetchWithAuth("/api/complaints/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: cat,
          subject: sub,
          description: desc,
          supportingDetails: supp,
          department: this.currentUser.department || "CSE",
          year: this.currentUser.year || this.currentUser.academicYear || "IV Year",
          studentType: this.currentUser.studentType || "Day Scholar"
        })
      });

      if (!res.ok) {
        if (window.DemoStore) {
          DemoStore.addComplaint({
            regNo: this.currentUser.identifier,
            studentName: this.currentUser.name,
            section: this.currentUser.section || "CSE-A",
            department: this.currentUser.department || "CSE",
            year: this.currentUser.year || this.currentUser.academicYear || "IV Year",
            studentType: this.currentUser.studentType || "Day Scholar",
            category: cat,
            subject: sub,
            description: desc,
            supportingInfo: supp
          });
        }
      }

      this.closeComplaintModal();
      document.getElementById("complaintForm").reset();
      await this.loadComplaints();
      App.refreshNotifications();
      Toast.show("Confidential complaint delivered directly to Principal Dr. B. Sanjay Gandhi!", "success");
    } catch (err) {
      if (window.DemoStore) {
        DemoStore.addComplaint({
          regNo: this.currentUser.identifier,
          studentName: this.currentUser.name,
          section: this.currentUser.section || "CSE-A",
          department: this.currentUser.department || "CSE",
          year: this.currentUser.year || this.currentUser.academicYear || "IV Year",
          studentType: this.currentUser.studentType || "Day Scholar",
          category: cat,
          subject: sub,
          description: desc,
          supportingInfo: supp
        });
        this.closeComplaintModal();
        await this.loadComplaints();
        Toast.show("Confidential complaint logged in Principal inbox!", "success");
      } else {
        Toast.show("Submission Error: " + err.message, "danger");
      }
    } finally {
      btn.disabled = false;
      btn.textContent = "Confirm & Submit Directly to Principal";
    }
  },

  async downloadComplaintPdf(id) {
    return App.downloadComplaintPdf(id);
  },

  async downloadPdf(id) {
    return App.downloadPdf(id);
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

// Global Print Event Handlers to ensure browser headers/footers are suppressed
window.addEventListener("beforeprint", () => {
  window.__originalDocTitle = document.title;
  document.title = "";
  const odModal = document.getElementById("odModal");
  const qrModal = document.getElementById("qrCertificateModal");
  if (odModal && odModal.style.display !== "none") {
    document.body.classList.add("print-active-od");
  } else if (qrModal && qrModal.style.display !== "none") {
    document.body.classList.add("print-active-qr");
  }
});

window.addEventListener("afterprint", () => {
  if (window.__originalDocTitle !== undefined) {
    document.title = window.__originalDocTitle;
  }
  document.body.classList.remove("print-active-od");
  document.body.classList.remove("print-active-qr");
});
