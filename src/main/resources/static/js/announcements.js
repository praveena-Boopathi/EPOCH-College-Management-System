/**
 * EPOCH Institutional Announcement Management System
 * Supports Role-Based Audience Filtering (CSE-A, CSE-B, CSE-C, All Students),
 * Real-Time Delivery to Students Only, Priority Classifications,
 * Authenticated Sender Identity & Class Advisor Scope Enforcement.
 */

const AnnouncementApp = {
  currentUser: null,
  announcements: [],
  currentFilter: 'ALL',

  init(user) {
    if (!user) return;
    this.currentUser = user;

    // Permissions: Only Class Advisors, HOD, and Principal can send announcements.
    // Admin and Students must NOT have permission to create or send official announcements.
    const postBtn = document.getElementById('postAnnouncementBtn');
    if (postBtn) {
      if (user.role === 'STUDENT' || user.role === 'ADMIN') {
        postBtn.style.setProperty('display', 'none', 'important');
      } else {
        postBtn.style.display = 'inline-flex';
      }
    }

    this.loadAnnouncements();
  },

  async loadAnnouncements() {
    try {
      const user = this.currentUser || (typeof Auth !== 'undefined' ? Auth.getUser() : null);
      if (!user) return;

      let list = [];
      try {
        const res = await Auth.fetchWithAuth('/api/announcements');
        if (res && res.ok) {
          list = await res.json();
        }
      } catch (netErr) {
        console.warn('[AnnouncementApp] Network fetch error:', netErr);
      }

      if (!list || list.length === 0) {
        if (typeof DemoStore !== 'undefined' && DemoStore.getAnnouncements) {
          list = DemoStore.getAnnouncements(user);
        }
      }

      this.announcements = list || [];
      this.renderAnnouncementsList();
      this.renderUrgentBanner();
      this.renderStudentDashboardAnnouncements();
    } catch (e) {
      console.warn('[AnnouncementApp] Failed to load announcements:', e);
    }
  },

  renderStudentDashboardAnnouncements() {
    const container = document.getElementById('studentDashboardAnnouncementsList');
    if (!container) return;

    const user = this.currentUser || (typeof Auth !== 'undefined' ? Auth.getUser() : null);
    if (!user || user.role !== 'STUDENT') return;

    let items = [...(this.announcements || [])];
    items.sort((a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0));

    if (items.length === 0) {
      container.innerHTML = `
        <div style="text-align:center; padding:24px 16px; color:#64748b; background:#f8fafc; border-radius:8px; border:1px dashed #cbd5e1;">
          <div style="font-size:24px; margin-bottom:4px;">📢</div>
          <div style="font-weight:700; color:#0f2942; font-size:13px;">No Active Announcements</div>
          <div style="font-size:11.5px; color:#64748b; margin-top:2px;">There are no circulars currently published for your section.</div>
        </div>
      `;
      return;
    }

    const top = items.slice(0, 3);
    container.innerHTML = top.map(ann => {
      const isUrgent = ann.priority === 'URGENT';
      const isImportant = ann.priority === 'IMPORTANT';
      const badgeClass = isUrgent ? 'badge-rejected' : (isImportant ? 'badge-pending' : 'badge-teal');
      const badgeIcon = isUrgent ? '🚨' : (isImportant ? '⚠️' : 'ℹ️');

      let senderHeading = ann.senderDisplay;
      if (!senderHeading) {
        if (ann.senderRole === 'ADVISOR') {
          senderHeading = `Class Advisor (${ann.senderSection || 'CSE-A'})`;
        } else if (ann.senderRole === 'HOD') {
          senderHeading = 'Head of Department (HOD)';
        } else if (ann.senderRole === 'PRINCIPAL') {
          senderHeading = 'Principal';
        } else {
          senderHeading = ann.senderName || 'Authority';
        }
      }

      return `
        <div style="padding:14px; margin-bottom:10px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; border-left:4px solid ${isUrgent ? '#ef4444' : (isImportant ? '#f59e0b' : '#0d9488')};">
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; margin-bottom:6px;">
            <div style="display:flex; align-items:center; gap:8px;">
              <span class="badge-tag ${badgeClass}" style="font-size:10.5px;">${badgeIcon} ${ann.priority}</span>
              <strong style="color:var(--primary); font-size:13.5px; cursor:pointer;" onclick="AnnouncementApp.openDetailsModal('${ann.id}')">${ann.title}</strong>
            </div>
            <span style="font-size:11px; color:#64748b; font-weight:600;">🕒 ${ann.createdAt || 'Recent'}</span>
          </div>
          <p style="font-size:12.5px; color:#334155; margin:0 0 6px 0; line-height:1.45;">${ann.message}</p>
          <div style="display:flex; justify-content:space-between; align-items:center; font-size:11px; color:#0284c7; font-weight:600;">
            <span>📢 ${senderHeading} • Target: ${ann.targetAudienceLabel || 'Your Section'}</span>
            <button class="btn btn-sm btn-secondary" onclick="AnnouncementApp.openDetailsModal('${ann.id}')" style="padding:2px 8px; font-size:10.5px;">View Details</button>
          </div>
        </div>
      `;
    }).join('');
  },

  renderUrgentBanner() {
    const bannerContainer = document.getElementById('urgentAnnouncementsBanner');
    if (!bannerContainer) return;

    const urgentList = this.announcements.filter(a => a.priority === 'URGENT');
    if (urgentList.length === 0) {
      bannerContainer.style.display = 'none';
      bannerContainer.innerHTML = '';
      return;
    }

    const latest = urgentList[0];
    const senderText = latest.senderDisplay || (latest.senderName ? `${latest.senderName} (${latest.senderRole})` : 'College Leadership');
    bannerContainer.style.display = 'block';
    bannerContainer.innerHTML = `
      <div class="urgent-announcement-card" style="background: linear-gradient(135deg, #7f1d1d, #991b1b); color:#ffffff; padding:12px 18px; border-radius:10px; display:flex; align-items:center; justify-content:space-between; gap:14px; box-shadow: 0 4px 15px rgba(220, 38, 38, 0.25); margin-bottom: 20px; border-left: 6px solid #ef4444; animation: pulseGlow 2.5s infinite;">
        <div style="display:flex; align-items:flex-start; gap:12px;">
          <span style="font-size:22px; line-height:1;">🚨</span>
          <div>
            <div style="display:flex; align-items:center; gap:8px;">
              <span style="background:#fee2e2; color:#991b1b; font-size:10.5px; font-weight:800; padding:2px 8px; border-radius:12px; text-transform:uppercase; letter-spacing:0.5px;">Urgent Official Notice</span>
              <span style="font-size:11.5px; color:#fca5a5; font-weight:500;">${senderText} • ${latest.createdAt || 'Recent'}</span>
            </div>
            <h4 style="margin:4px 0 2px; font-size:14px; font-weight:700; color:#ffffff;">${latest.title}</h4>
            <p style="margin:0; font-size:12px; color:#fecaca; line-height:1.4;">${latest.message}</p>
          </div>
        </div>
        <div style="display:flex; align-items:center; gap:8px; flex-shrink:0;">
          <button class="btn btn-sm" style="background:#ffffff; color:#991b1b; font-weight:700; font-size:11.5px; border:none; padding:5px 12px; border-radius:6px; cursor:pointer;" onclick="App.switchTab('announcements')">
            View All (${urgentList.length})
          </button>
          <button class="btn btn-sm" style="background:transparent; color:#fca5a5; border:none; font-size:14px; cursor:pointer; padding:4px 8px;" onclick="document.getElementById('urgentAnnouncementsBanner').style.display='none';" title="Dismiss Banner">
            ✕
          </button>
        </div>
      </div>
    `;
  },

  setFilter(priority) {
    this.currentFilter = priority;
    document.querySelectorAll('.announcement-filter-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.priority === priority);
    });
    this.renderAnnouncementsList();
  },

  renderAnnouncementsList() {
    const container = document.getElementById('announcementsListContainer');
    if (!container) return;

    const user = this.currentUser || (typeof Auth !== 'undefined' ? Auth.getUser() : null);

    const postBtn = document.getElementById('postAnnouncementBtn');
    if (postBtn && user) {
      if (user.role === 'STUDENT' || user.role === 'ADMIN') {
        postBtn.style.setProperty('display', 'none', 'important');
      } else {
        postBtn.style.display = 'inline-flex';
      }
    }

    let items = [...this.announcements];
    if (this.currentFilter !== 'ALL') {
      items = items.filter(a => a.priority === this.currentFilter);
    }

    // Sort by created descending
    items.sort((a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0));

    if (items.length === 0) {
      container.innerHTML = `
        <div style="text-align:center; padding:50px 20px; color:#64748b; background:var(--card-bg, #ffffff); border-radius:12px; border:1px solid #e2e8f0;">
          <div style="font-size:36px; margin-bottom:10px;">📢</div>
          <h4 style="font-size:16px; font-weight:700; color:var(--primary); margin:0;">No Announcements Found</h4>
          <p style="font-size:12.5px; margin-top:4px; color:#64748b;">No announcements published matching the selected criteria.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = items.map(ann => {
      const isUrgent = ann.priority === 'URGENT';
      const isImportant = ann.priority === 'IMPORTANT';
      const badgeClass = isUrgent ? 'badge-rejected' : (isImportant ? 'badge-pending' : 'badge-teal');
      const badgeIcon = isUrgent ? '🚨' : (isImportant ? '⚠️' : 'ℹ️');
      const borderLeft = isUrgent ? 'border-left: 5px solid #ef4444;' : (isImportant ? 'border-left: 5px solid #f59e0b;' : 'border-left: 5px solid #0d9488;');

      // Target Audience Label
      let targetLabel = ann.targetAudienceLabel;
      if (!targetLabel) {
        const secs = ann.targetSections;
        if (secs && secs.length > 0) {
          if (secs.includes('ALL')) {
            targetLabel = 'All Students';
          } else {
            targetLabel = secs.join(', ');
          }
        } else if (!ann.targetSection || ann.targetSection === 'ALL') {
          targetLabel = 'All Students';
        } else {
          targetLabel = ann.targetSection;
        }
      }

      // Sender line formatting:
      // Examples:
      // "Announcement by Arularasi — Class Advisor, CSE-A"
      // "Announcement by Dhivya Bharathi — Class Advisor, CSE-B"
      // "Announcement by Rajavathi Jaya Priya — Class Advisor, CSE-C"
      // "Announcement by HOD"
      // "Announcement by Principal"
      // "Announcement by Admin"
      let senderHeading = ann.senderDisplay;
      if (!senderHeading) {
        if (ann.senderRole === 'ADVISOR' || ann.senderRole === 'CLASS_ADVISOR') {
          const sec = ann.senderSection || ann.targetSection || 'CSE-A';
          senderHeading = `Announcement by ${ann.senderName || 'Class Advisor'} — Class Advisor, ${sec}`;
        } else if (ann.senderRole === 'HOD') {
          senderHeading = `Announcement by ${ann.senderName ? ann.senderName + ' — ' : ''}HOD`;
        } else if (ann.senderRole === 'PRINCIPAL') {
          senderHeading = `Announcement by ${ann.senderName ? ann.senderName + ' — ' : ''}Principal`;
        } else if (ann.senderRole === 'ADMIN') {
          senderHeading = `Announcement by ${ann.senderName ? ann.senderName + ' — ' : ''}Admin`;
        } else {
          senderHeading = `Announcement by ${ann.senderName || 'College Authority'}`;
        }
      }

      // Read / Unread Status
      const isStudent = user && user.role === 'STUDENT';
      const hasRead = Boolean(user && ann.readBy && (ann.readBy.includes(user.identifier) || ann.readBy.includes(user.id)));

      let readStatusBadge = '';
      let markReadAction = '';

      if (isStudent) {
        if (hasRead) {
          readStatusBadge = `<span class="badge-tag" style="background:#ecfdf5; color:#047857; font-weight:700; font-size:11px; border:1px solid #a7f3d0;">✓ Read</span>`;
        } else {
          readStatusBadge = `<span class="badge-tag" style="background:#fef2f2; color:#b91c1c; font-weight:700; font-size:11px; border:1px solid #fecaca; animation: pulseGlow 2s infinite;">● Unread</span>`;
          markReadAction = `<button class="btn btn-sm btn-primary" onclick="AnnouncementApp.markRead('${ann.id}')" style="font-size:11px; padding:3px 10px; font-weight:700;">Mark as Read</button>`;
        }
      } else {
        const readCount = ann.readBy ? ann.readBy.length : 0;
        readStatusBadge = `<span class="badge-tag" style="background:#f1f5f9; color:#475569; font-size:11px; font-weight:600;">👁️ ${readCount} student(s) read</span>`;
      }

      return `
        <div class="announcement-item-card card" id="ann-card-${ann.id}" style="margin-bottom:16px; padding:20px; border-radius:12px; ${borderLeft} background:var(--card-bg, #ffffff); box-shadow:0 2px 10px rgba(0,0,0,0.04);">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:10px; margin-bottom:10px; flex-wrap:wrap;">
            <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
              <span class="badge-tag ${badgeClass}" style="font-size:11px; font-weight:800;">
                ${badgeIcon} ${ann.priority}
              </span>
              <span class="badge-tag" style="background:#e0f2fe; color:#0369a1; font-size:11px; font-weight:700; border:1px solid #bae6fd;">
                🎯 Target: ${targetLabel}
              </span>
              ${readStatusBadge}
            </div>
            <span style="font-size:11.5px; color:#64748b; font-weight:600; white-space:nowrap;">
              🕒 ${ann.createdAt || 'Recent'}
            </span>
          </div>

          <div style="display:flex; align-items:center; gap:8px; margin-bottom:6px;">
            <div style="width:24px; height:24px; border-radius:50%; background:#e0f2fe; color:#0369a1; font-weight:700; font-size:11px; display:flex; align-items:center; justify-content:center; overflow:hidden; border:1px solid #bae6fd; flex-shrink:0;">
              ${(ann.senderPhoto || ann.photoUrl) ? `<img src="${ann.senderPhoto || ann.photoUrl}" style="width:100%; height:100%; object-fit:cover;">` : (ann.senderName ? ann.senderName.charAt(0).toUpperCase() : 'A')}
            </div>
            <div style="font-size:12.5px; font-weight:700; color:#0284c7; letter-spacing:0.3px;">
              ${senderHeading}
            </div>
          </div>

          <h3 style="margin:2px 0 10px; font-size:16px; font-weight:800; color:var(--primary); line-height:1.35; cursor:pointer;" onclick="AnnouncementApp.openDetailsModal('${ann.id}')">
            ${ann.title}
          </h3>

          <div style="font-size:13.5px; color:#334155; line-height:1.55; white-space:pre-wrap; margin-bottom:14px;">
            ${ann.message}
          </div>

          <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px dashed #e2e8f0; padding-top:12px; margin-top:10px; flex-wrap:wrap; gap:10px;">
            <div style="display:flex; align-items:center; gap:6px; font-size:11.5px; color:#64748b;">
              <span>Official circular delivered to students only • Recipient scope verified.</span>
            </div>
            <div style="display:flex; align-items:center; gap:8px;">
              <button class="btn btn-sm btn-secondary" onclick="AnnouncementApp.openDetailsModal('${ann.id}')" style="font-size:11px; padding:3px 10px; font-weight:700;">📄 View Details</button>
              ${markReadAction}
            </div>
          </div>
        </div>
      `;
    }).join('');
  },

  // Selected audiences state (e.g. ['ALL'] or ['CSE-A', 'CSE-B'])
  selectedAudiences: ['ALL'],

  openPostAnnouncementModal() {
    const user = this.currentUser || (typeof Auth !== 'undefined' ? Auth.getUser() : null);
    if (!user) {
      alert('Please sign in to publish announcements.');
      return;
    }

    if (user.role === 'STUDENT' || user.role === 'ADMIN') {
      alert('Unauthorized: Only Class Advisors, HOD, and Principal can create or publish official announcements.');
      return;
    }

    const modal = document.getElementById('postAnnouncementModal');
    if (!modal) return;

    // Reset form fields
    const form = document.getElementById('postAnnouncementForm');
    if (form) form.reset();

    const restrictionBox = document.getElementById('annAdvisorRestrictionNotice');
    const chkAll = document.getElementById('annAudience_ALL');
    const chkA = document.getElementById('annAudience_CSEA');
    const chkB = document.getElementById('annAudience_CSEB');
    const chkC = document.getElementById('annAudience_CSEC');

    const lblAll = document.getElementById('lblAudience_ALL');
    const lblA = document.getElementById('lblAudience_CSEA');
    const lblB = document.getElementById('lblAudience_CSEB');
    const lblC = document.getElementById('lblAudience_CSEC');

    if (user.role === 'ADVISOR' || user.role === 'CLASS_ADVISOR') {
      // Determine advisor's authoritative assigned section
      let userSec = (user.section || 'CSE-A').trim().toUpperCase();
      const cleanId = (user.identifier || '').trim().toLowerCase();
      if (cleanId === 'arularasi') userSec = 'CSE-A';
      else if (cleanId === 'divyabharathi' || cleanId === 'dhivyabharathi') userSec = 'CSE-B';
      else if (cleanId === 'rajavathijayapriya' || cleanId === 'rajavathi') userSec = 'CSE-C';

      // "All Students" option is strictly hidden and disabled for Class Advisors
      if (lblAll) lblAll.style.display = 'none';
      if (chkAll) {
        chkAll.checked = false;
        chkAll.disabled = true;
      }

      if (restrictionBox) {
        restrictionBox.style.display = 'block';
        restrictionBox.innerHTML = `🔒 <strong>Class Advisor Restriction:</strong> You are authorized to publish official announcements to your assigned section (<strong>${userSec}</strong>) only. Other sections are locked.`;
      }

      // Lock to assigned section only
      this.selectedAudiences = [userSec];

      [
        { chk: chkA, lbl: lblA, val: 'CSE-A' },
        { chk: chkB, lbl: lblB, val: 'CSE-B' },
        { chk: chkC, lbl: lblC, val: 'CSE-C' }
      ].forEach(item => {
        if (!item.chk) return;
        const isAssigned = (item.val === userSec);
        item.chk.disabled = true; // Locked
        item.chk.checked = isAssigned;
        if (item.lbl) {
          item.lbl.style.display = 'flex';
          item.lbl.style.cursor = isAssigned ? 'default' : 'not-allowed';
          item.lbl.style.opacity = isAssigned ? '1' : '0.45';
          item.lbl.style.background = isAssigned ? '#f0fdfa' : '#f1f5f9';
          item.lbl.style.borderColor = isAssigned ? '#0d9488' : '#cbd5e1';
          item.lbl.title = isAssigned ? `Your assigned section (${userSec})` : `Locked: You are assigned to Section ${userSec} only`;
        }
      });
    } else {
      // HOD & Principal have full multi-select authorization including All Students
      if (restrictionBox) restrictionBox.style.display = 'none';
      if (lblAll) lblAll.style.display = 'flex';

      // Default: All Students selected
      this.selectedAudiences = ['ALL'];

      const items = [
        { chk: chkAll, lbl: lblAll, val: 'ALL' },
        { chk: chkA, lbl: lblA, val: 'CSE-A' },
        { chk: chkB, lbl: lblB, val: 'CSE-B' },
        { chk: chkC, lbl: lblC, val: 'CSE-C' }
      ];

      items.forEach(item => {
        if (!item.chk) return;
        item.chk.disabled = false;
        item.chk.checked = (item.val === 'ALL');
        if (item.lbl) {
          item.lbl.style.display = 'flex';
          item.lbl.style.opacity = '1';
          item.lbl.style.background = (item.val === 'ALL') ? '#f0fdfa' : '#ffffff';
          item.lbl.style.borderColor = (item.val === 'ALL') ? '#0d9488' : '#e2e8f0';
          item.lbl.style.cursor = 'pointer';
          item.lbl.title = '';
        }
      });
    }

    this.updateAudienceDisplay();

    // Reset submit button state
    const submitBtn = document.getElementById('postAnnouncementSubmitBtn');
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<span>Publish Official Announcement</span>';
    }

    modal.style.display = 'flex';
  },

  onAudienceCheckboxChange(changedVal) {
    const user = this.currentUser || (typeof Auth !== 'undefined' ? Auth.getUser() : null);
    const isStaff = user && (user.role === 'ADVISOR' || user.role === 'CLASS_ADVISOR');
    if (isStaff) {
      // Advisors cannot change audience away from their assigned section
      return;
    }

    const chkAll = document.getElementById('annAudience_ALL');
    const chkA = document.getElementById('annAudience_CSEA');
    const chkB = document.getElementById('annAudience_CSEB');
    const chkC = document.getElementById('annAudience_CSEC');

    if (changedVal === 'ALL') {
      if (isStaff) {
        if (chkAll) chkAll.checked = false;
        return;
      }
      if (chkAll && chkAll.checked) {
        // Deselect individual section checkboxes
        if (chkA) chkA.checked = false;
        if (chkB) chkB.checked = false;
        if (chkC) chkC.checked = false;
        this.selectedAudiences = ['ALL'];
      } else {
        this.selectedAudiences = [];
      }
    } else {
      // An individual section was clicked, deselect ALL
      if (chkAll) chkAll.checked = false;

      const checked = [];
      if (chkA && chkA.checked) checked.push('CSE-A');
      if (chkB && chkB.checked) checked.push('CSE-B');
      if (chkC && chkC.checked) checked.push('CSE-C');

      this.selectedAudiences = checked;
    }

    this.syncCheckboxStyles();
    this.updateAudienceDisplay();
  },

  removeSection(secToRemove) {
    const user = this.currentUser || (typeof Auth !== 'undefined' ? Auth.getUser() : null);
    const isStaff = user && (user.role === 'ADVISOR' || user.role === 'CLASS_ADVISOR');
    if (isStaff) {
      // Advisors cannot remove their assigned section
      return;
    }

    if (secToRemove === 'ALL') {
      const chkAll = document.getElementById('annAudience_ALL');
      if (chkAll) chkAll.checked = false;
      this.selectedAudiences = this.selectedAudiences.filter(s => s !== 'ALL');
    } else {
      const idMap = { 'CSE-A': 'annAudience_CSEA', 'CSE-B': 'annAudience_CSEB', 'CSE-C': 'annAudience_CSEC' };
      const chk = document.getElementById(idMap[secToRemove]);
      if (chk) chk.checked = false;
      this.selectedAudiences = this.selectedAudiences.filter(s => s !== secToRemove);
    }

    this.syncCheckboxStyles();
    this.updateAudienceDisplay();
  },

  syncCheckboxStyles() {
    const list = [
      { id: 'annAudience_ALL', lblId: 'lblAudience_ALL' },
      { id: 'annAudience_CSEA', lblId: 'lblAudience_CSEA' },
      { id: 'annAudience_CSEB', lblId: 'lblAudience_CSEB' },
      { id: 'annAudience_CSEC', lblId: 'lblAudience_CSEC' }
    ];
    list.forEach(item => {
      const chk = document.getElementById(item.id);
      const lbl = document.getElementById(item.lblId);
      if (chk && lbl && !chk.disabled) {
        if (chk.checked) {
          lbl.style.background = '#f0fdfa';
          lbl.style.borderColor = '#0d9488';
        } else {
          lbl.style.background = '#ffffff';
          lbl.style.borderColor = '#e2e8f0';
        }
      }
    });
  },

  updateAudienceDisplay() {
    const user = this.currentUser || (typeof Auth !== 'undefined' ? Auth.getUser() : null);
    const isAdvisor = user && (user.role === 'ADVISOR' || user.role === 'CLASS_ADVISOR');

    const textEl = document.getElementById('annSelectedAudienceText');
    const chipsEl = document.getElementById('annSelectedAudienceChips');
    const noticeEl = document.getElementById('annAudienceNotice');
    const countBadge = document.getElementById('annAudienceCountBadge');

    const selected = this.selectedAudiences || [];

    if (countBadge) {
      if (selected.includes('ALL')) {
        countBadge.textContent = 'All Students';
        countBadge.className = 'badge-tag badge-teal';
      } else if (selected.length === 0) {
        countBadge.textContent = 'None selected';
        countBadge.className = 'badge-tag badge-rejected';
      } else {
        countBadge.textContent = `${selected.length} section${selected.length > 1 ? 's' : ''} selected`;
        countBadge.className = 'badge-tag badge-teal';
      }
    }

    if (selected.length === 0) {
      if (textEl) {
        textEl.textContent = '⚠️ No target audience selected';
        textEl.style.color = '#ef4444';
      }
      if (chipsEl) chipsEl.innerHTML = '';
      if (noticeEl) {
        noticeEl.innerHTML = '<span style="color:#ef4444;">Please check at least one audience section or All Students before publishing.</span>';
      }
      return;
    }

    if (selected.includes('ALL')) {
      if (textEl) {
        textEl.textContent = 'All Students selected';
        textEl.style.color = '#0369a1';
      }
      if (chipsEl) {
        chipsEl.innerHTML = `
          <span class="badge-tag badge-teal" style="font-size:11.5px; padding:3px 10px; display:inline-flex; align-items:center; gap:6px;">
            🏛️ All Students
            ${!isAdvisor ? `<button type="button" onclick="AnnouncementApp.removeSection('ALL')" style="background:none; border:none; color:#0f766e; font-weight:800; cursor:pointer; font-size:13px; line-height:1; padding:0 2px;" title="Remove All Students">&times;</button>` : ''}
          </span>
        `;
      }
      if (noticeEl) {
        noticeEl.innerHTML = '🏛️ <strong>College-Wide Broadcast:</strong> This announcement will be delivered in real-time to all eligible students across every section.';
      }
      return;
    }

    // Multiple sections e.g. ["CSE-A", "CSE-C"]
    // Display format: "CSE-A, CSE-C selected"
    const formattedText = `${selected.join(', ')} selected`;
    if (textEl) {
      textEl.textContent = formattedText;
      textEl.style.color = '#0f766e';
    }

    if (chipsEl) {
      chipsEl.innerHTML = selected.map(sec => `
        <span class="badge-tag badge-teal" style="font-size:11.5px; padding:3px 10px; display:inline-flex; align-items:center; gap:6px;">
          👥 ${sec}
          <button type="button" onclick="AnnouncementApp.removeSection('${sec}')" title="Remove ${sec}" style="background:none; border:none; color:#0f766e; font-weight:800; cursor:pointer; font-size:13px; line-height:1; padding:0 2px;">&times;</button>
        </span>
      `).join('');
    }

    if (noticeEl) {
      const secList = selected.join(', ');
      noticeEl.innerHTML = `👥 <strong>Targeted Delivery:</strong> Announcement will be delivered to enrolled students in Section(s) <strong>${secList}</strong>. Unselected sections will not receive it.`;
    }
  },

  closePostAnnouncementModal() {
    const modal = document.getElementById('postAnnouncementModal');
    if (modal) modal.style.display = 'none';
    const form = document.getElementById('postAnnouncementForm');
    if (form) form.reset();
  },

  async submitAnnouncement(e) {
    if (e && e.preventDefault) e.preventDefault();

    const user = this.currentUser || (typeof Auth !== 'undefined' ? Auth.getUser() : null);
    if (!user) {
      alert('Authentication required.');
      return;
    }

    if (user.role === 'STUDENT' || user.role === 'ADMIN') {
      alert('Unauthorized: Only Class Advisors, HOD, and Principal can publish official announcements.');
      return;
    }

    const title = (document.getElementById('announcementTitle')?.value || '').trim();
    const message = (document.getElementById('announcementMessage')?.value || '').trim();
    const priority = document.getElementById('announcementPriority')?.value || 'NORMAL';
    const expiryDate = document.getElementById('announcementExpiryDate')?.value || null;

    if (!title || !message) {
      if (typeof Toast !== 'undefined' && Toast.show) {
        Toast.show('Please provide both announcement title and message content.', 'warning');
      } else {
        alert('Please provide both announcement title and message content.');
      }
      return;
    }

    let targetSections = [...(this.selectedAudiences || [])];
    if (user.role === 'ADVISOR' || user.role === 'CLASS_ADVISOR') {
      let userSec = (user.section || 'CSE-A').trim().toUpperCase();
      const cleanId = (user.identifier || '').trim().toLowerCase();
      if (cleanId === 'arularasi') userSec = 'CSE-A';
      else if (cleanId === 'divyabharathi' || cleanId === 'dhivyabharathi') userSec = 'CSE-B';
      else if (cleanId === 'rajavathijayapriya' || cleanId === 'rajavathi') userSec = 'CSE-C';
      targetSections = [userSec];
    }

    if (targetSections.length === 0) {
      const msg = (user.role === 'ADVISOR' || user.role === 'CLASS_ADVISOR')
        ? 'Please select at least one target section (CSE-A, CSE-B, or CSE-C).'
        : 'Please select at least one target audience (CSE-A, CSE-B, CSE-C, or All Students).';
      if (typeof Toast !== 'undefined' && Toast.show) {
        Toast.show(msg, 'warning');
      } else {
        alert(msg);
      }
      return;
    }

    const submitBtn = document.getElementById('postAnnouncementSubmitBtn');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span>⏳ Publishing Official Announcement...</span>';
    }

    const audienceLabel = targetSections.includes('ALL') ? 'All Students' : targetSections.join(', ');

    const payload = {
      title,
      message,
      priority,
      targetSections: targetSections,
      targetSection: targetSections.includes('ALL') ? 'ALL' : targetSections.join(', '),
      targetAudienceLabel: audienceLabel,
      targetAudience: 'STUDENT',
      targetDept: user.department || 'CSE',
      expiresAt: expiryDate
    };

    try {
      let saved = null;
      const res = await Auth.fetchWithAuth('/api/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res && res.ok) {
        saved = await res.json();
      } else {
        let errMessage = 'Failed to publish announcement';
        try {
          const errData = await res.json();
          if (errData && errData.error) errMessage = errData.error;
        } catch (parseErr) {}
        throw new Error(errMessage);
      }

      // Success workflow: Sender sees success message only after announcement is saved
      const targetText = targetSections.includes('ALL') ? 'All Eligible Students' : `Section(s) ${targetSections.join(', ')}`;
      if (typeof Toast !== 'undefined' && Toast.show) {
        Toast.show(`📢 Announcement officially published to ${targetText}!`, 'success');
      } else {
        alert(`Announcement officially published to ${targetText}!`);
      }

      this.closePostAnnouncementModal();
      await this.loadAnnouncements();

    } catch (err) {
      console.error('[AnnouncementApp] Error publishing announcement:', err);
      if (typeof Toast !== 'undefined' && Toast.show) {
        Toast.show(err.message || 'Failed to send announcement.', 'danger');
      } else {
        alert('Error: ' + (err.message || 'Failed to send announcement.'));
      }
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span>Publish Official Announcement</span>';
      }
    }
  },

  async openDetailsModal(annId) {
    if (!this.announcements || this.announcements.length === 0) {
      await this.loadAnnouncements();
    }
    let ann = (this.announcements || []).find(a => a.id === annId);
    if (!ann && this.announcements && this.announcements.length > 0) {
      ann = this.announcements[0];
    }
    if (!ann) return;

    const modal = document.getElementById('announcementDetailsModal');
    if (!modal) return;

    const user = this.currentUser || (typeof Auth !== 'undefined' ? Auth.getUser() : null);

    const isUrgent = ann.priority === 'URGENT';
    const isImportant = ann.priority === 'IMPORTANT';
    const badgeClass = isUrgent ? 'badge-rejected' : (isImportant ? 'badge-pending' : 'badge-teal');
    const badgeIcon = isUrgent ? '🚨' : (isImportant ? '⚠️' : 'ℹ️');

    const badgeElem = document.getElementById('annDetailsModalBadge');
    if (badgeElem) {
      badgeElem.className = `badge-tag ${badgeClass}`;
      badgeElem.textContent = `${badgeIcon} ${ann.priority}`;
    }

    const avatarElem = document.getElementById('annDetailsModalAvatar');
    if (avatarElem) {
      if (ann.senderPhoto || ann.photoUrl) {
        avatarElem.innerHTML = `<img src="${ann.senderPhoto || ann.photoUrl}" style="width:100%; height:100%; object-fit:cover;">`;
      } else {
        avatarElem.textContent = ann.senderName ? ann.senderName.charAt(0).toUpperCase() : 'A';
      }
    }

    const senderElem = document.getElementById('annDetailsModalSender');
    if (senderElem) {
      let senderHeading = ann.senderDisplay;
      if (!senderHeading) {
        if (ann.senderRole === 'ADVISOR' || ann.senderRole === 'CLASS_ADVISOR') {
          const sec = ann.senderSection || ann.targetSection || 'CSE-A';
          senderHeading = `${ann.senderName || 'Class Advisor'} (Class Advisor, ${sec})`;
        } else if (ann.senderRole === 'HOD') {
          senderHeading = `${ann.senderName || 'HOD'} (Head of Department)`;
        } else if (ann.senderRole === 'PRINCIPAL') {
          senderHeading = `${ann.senderName || 'Principal'} (Principal)`;
        } else {
          senderHeading = ann.senderName || 'Authority';
        }
      }
      senderElem.textContent = senderHeading;
    }

    const targetElem = document.getElementById('annDetailsModalTarget');
    if (targetElem) {
      targetElem.textContent = `🎯 Audience: ${ann.targetAudienceLabel || ann.targetSection || 'Students'}`;
    }

    const timeElem = document.getElementById('annDetailsModalTime');
    if (timeElem) {
      timeElem.textContent = `🕒 ${ann.createdAt || 'Recent'}`;
    }

    const titleElem = document.getElementById('annDetailsModalTitle');
    if (titleElem) {
      titleElem.textContent = ann.title;
    }

    const msgElem = document.getElementById('annDetailsModalMessage');
    if (msgElem) {
      msgElem.textContent = ann.message;
    }

    const isStudent = user && user.role === 'STUDENT';
    const hasRead = Boolean(user && ann.readBy && (ann.readBy.includes(user.identifier) || ann.readBy.includes(user.id)));

    const actionSlot = document.getElementById('annDetailsModalActionSlot');
    if (actionSlot) {
      if (isStudent && !hasRead) {
        actionSlot.innerHTML = `<button class="btn btn-sm btn-primary" onclick="AnnouncementApp.markRead('${ann.id}'); AnnouncementApp.closeDetailsModal();" style="font-size:11.5px; padding:4px 12px; font-weight:700;">✓ Mark as Read</button>`;
      } else if (isStudent && hasRead) {
        actionSlot.innerHTML = `<span class="badge-tag" style="background:#ecfdf5; color:#047857; font-weight:700; font-size:11px;">✓ Read</span>`;
      } else {
        const count = ann.readBy ? ann.readBy.length : 0;
        actionSlot.innerHTML = `<span style="font-size:11.5px; color:#64748b; font-weight:600;">👁️ ${count} student(s) read</span>`;
      }
    }

    modal.style.display = 'flex';
  },

  closeDetailsModal() {
    const modal = document.getElementById('announcementDetailsModal');
    if (modal) modal.style.display = 'none';
  },

  async markRead(announcementId) {
    try {
      const user = this.currentUser || (typeof Auth !== 'undefined' ? Auth.getUser() : null);
      if (!user) return;

      const res = await Auth.fetchWithAuth(`/api/announcements/${announcementId}/read`, { method: 'POST' });
      if (res && res.ok) {
        // Optimistically update read status locally
        const ann = (this.announcements || []).find(a => a.id === announcementId);
        if (ann) {
          if (!ann.readBy) ann.readBy = [];
          if (!ann.readBy.includes(user.identifier)) {
            ann.readBy.push(user.identifier);
          }
        }
        this.renderAnnouncementsList();
        if (typeof Toast !== 'undefined' && Toast.show) {
          Toast.show('Notice marked as read.', 'info');
        }
      }
    } catch (e) {
      console.warn('[AnnouncementApp] Failed to mark notice as read:', e);
    }
  }
};

window.AnnouncementApp = AnnouncementApp;
