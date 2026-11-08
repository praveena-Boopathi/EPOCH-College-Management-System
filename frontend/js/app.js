/**
 * EPOCH Main Application Orchestrator & View Switcher
 * Fully interactive demo management, role-based routing, and profile state.
 */

const Toast = {
  show(message, type = "info") {
    let container = document.getElementById("toastContainer");
    if (!container) {
      container = document.createElement("div");
      container.id = "toastContainer";
      container.className = "toast-container";
      document.body.appendChild(container);
    }
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    
    let icon = "ℹ️";
    if (type === "success") icon = "✅";
    else if (type === "danger") icon = "❌";
    else if (type === "warning") icon = "⚠️";

    toast.innerHTML = `
      <div style="display:flex; align-items:center; gap:10px;">
        <span style="font-size:16px;">${icon}</span>
        <span>${message}</span>
      </div>
      <button onclick="this.parentElement.remove()" style="background:transparent; border:none; color:inherit; cursor:pointer; font-size:18px; line-height:1; opacity:0.8;">&times;</button>
    `;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(40px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }
};

const ProfileManager = {
  currentUser: null,

  renderProfile(user) {
    this.currentUser = user || Auth.getUser();
    if (!this.currentUser) return;

    const u = this.currentUser;
    const initial = (u.name || "U").charAt(0).toUpperCase();

    // Elements
    const avatarEl = document.getElementById("profAvatar");
    const nameEl = document.getElementById("profDisplayName");
    const roleBadgeEl = document.getElementById("profRoleBadge");
    const subtitleEl = document.getElementById("profSubtitle");

    const cardNameEl = document.getElementById("profCardName");
    const cardIdEl = document.getElementById("profCardId");
    const cardDeptEl = document.getElementById("profCardDept");
    const cardSecLabelEl = document.getElementById("profSecOrTitleLabel");
    const cardSecValEl = document.getElementById("profCardSecOrTitle");
    const cardEmailEl = document.getElementById("profCardEmail");
    const cardContactEl = document.getElementById("profCardContact");
    const cardBioEl = document.getElementById("profCardBio");

    const customBox1 = document.getElementById("profCustomBox1");
    const customLabel1 = document.getElementById("profCustomLabel1");
    const customVal1 = document.getElementById("profCustomVal1");

    const customBox2 = document.getElementById("profCustomBox2");
    const customLabel2 = document.getElementById("profCustomLabel2");
    const customVal2 = document.getElementById("profCustomVal2");

    const photoUrl = u.profilePhoto || u.photoUrl;
    if (avatarEl) {
      if (photoUrl) {
        avatarEl.innerHTML = `<img src="${photoUrl}" alt="${u.name || 'User'}" class="profile-avatar-img" style="width:100%; height:100%; object-fit:cover; border-radius:50%; display:block;">`;
      } else {
        avatarEl.textContent = initial;
      }
    }

    const removeBtn = document.getElementById("btnRemovePhotoDirect");
    if (removeBtn) {
      removeBtn.style.display = photoUrl ? "inline-flex" : "none";
    }

    if (nameEl) nameEl.textContent = u.name;
    if (cardNameEl) cardNameEl.textContent = u.name;
    if (cardIdEl) cardIdEl.textContent = u.identifier || "N/A";
    if (cardDeptEl) cardDeptEl.textContent = u.department || "Computer Science & Engineering";
    if (cardEmailEl) cardEmailEl.textContent = u.email || "demo@epoch.edu";
    if (cardContactEl) cardContactEl.textContent = u.contact || "+91 98765 00000";

    // Bio
    if (cardBioEl) {
      cardBioEl.textContent = u.bio || "Authorized member of the Gnanamani College of Technology academic community. Demo account active in isolated sandbox.";
    }

    // Role-specific badges and details
    if (u.role === "STUDENT") {
      const yearStr = u.academicYear || u.year || "IV Year B.E.";
      if (roleBadgeEl) roleBadgeEl.innerHTML = `🎓 Student`;
      if (subtitleEl) subtitleEl.textContent = `Reg No: ${u.identifier} • ${yearStr} • Dept: ${u.department || 'CSE'} (Section ${u.section || 'CSE-A'})`;
      if (cardSecLabelEl) cardSecLabelEl.textContent = "📚 Section & Class";
      if (cardSecValEl) cardSecValEl.textContent = u.section ? `Section ${u.section}` : "Section CSE-A";
      
      if (customBox1) customBox1.style.display = "block";
      if (customLabel1) customLabel1.textContent = "🎓 Academic Year";
      if (customVal1) customVal1.textContent = yearStr;

      if (customBox2) customBox2.style.display = "block";
      if (customLabel2) customLabel2.textContent = "👨‍🏫 Class Advisor";
      if (customVal2) customVal2.textContent = u.advisor || "Advisor Demo (CSE-A)";

    } else if (u.role === "ADVISOR") {
      if (roleBadgeEl) roleBadgeEl.innerHTML = `👩‍🏫 Class Advisor Demo`;
      if (subtitleEl) subtitleEl.textContent = `Class Advisor • Section ${u.section || 'CSE-A'} • Department of CSE`;
      if (cardSecLabelEl) cardSecLabelEl.textContent = "🏢 Academic Designation";
      if (cardSecValEl) cardSecValEl.textContent = u.title || "Assistant Professor & Class Advisor (CSE-A)";

      if (customBox1) customBox1.style.display = "block";
      if (customLabel1) customLabel1.textContent = "📍 Office / Cabin";
      if (customVal1) customVal1.textContent = u.cabin || "Admin Block, Room 204";

      if (customBox2) customBox2.style.display = "block";
      if (customLabel2) customLabel2.textContent = "🛡️ Advisor Jurisdiction";
      if (customVal2) customVal2.textContent = `Section ${u.section || 'CSE-A'} OD & Attendance`;

    } else if (u.role === "HOD") {
      if (roleBadgeEl) roleBadgeEl.innerHTML = `🏛️ HOD Demo`;
      if (subtitleEl) subtitleEl.textContent = `Head of Department • Computer Science & Engineering`;
      if (cardSecLabelEl) cardSecLabelEl.textContent = "🏢 Department Leadership";
      if (cardSecValEl) cardSecValEl.textContent = u.title || "Professor & Head of Department (CSE)";

      if (customBox1) customBox1.style.display = "block";
      if (customLabel1) customLabel1.textContent = "📍 Department Office";
      if (customVal1) customVal1.textContent = u.cabin || "CSE Department Head Office, Tech Block 1";

      if (customBox2) customBox2.style.display = "block";
      if (customLabel2) customLabel2.textContent = "📊 Jurisdiction";
      if (customVal2) customVal2.textContent = "All Department Sections & Labs";

    } else if (u.role === "PRINCIPAL") {
      if (roleBadgeEl) roleBadgeEl.innerHTML = `👨‍💼 Principal Demo`;
      if (subtitleEl) subtitleEl.textContent = `Principal • Gnanamani College of Technology (Autonomous)`;
      if (cardSecLabelEl) cardSecLabelEl.textContent = "🏛️ Executive Office";
      if (cardSecValEl) cardSecValEl.textContent = u.title || "Principal & Chief Academic Officer";

      if (customBox1) customBox1.style.display = "block";
      if (customLabel1) customLabel1.textContent = "📍 Executive Chamber";
      if (customVal1) customVal1.textContent = u.cabin || "Principal's Office, Main Administration Block";

      if (customBox2) customBox2.style.display = "block";
      if (customLabel2) customLabel2.textContent = "🚨 Direct Channels";
      if (customVal2) customVal2.textContent = "Direct Student Grievances & College ODs";

    } else if (u.role === "ADMIN") {
      if (roleBadgeEl) roleBadgeEl.innerHTML = `⚡ College Administrator`;
      if (subtitleEl) subtitleEl.textContent = `Administration & Finance Directorate • System Administrator`;
      if (cardSecLabelEl) cardSecLabelEl.textContent = "🏛️ Directorate Office";
      if (cardSecValEl) cardSecValEl.textContent = u.title || "Chief Finance Officer & System Administrator";

      if (customBox1) customBox1.style.display = "block";
      if (customLabel1) customLabel1.textContent = "📍 Office / Cabin";
      if (customVal1) customVal1.textContent = u.cabin || "Finance Directorate, Room 102";

      if (customBox2) customBox2.style.display = "block";
      if (customLabel2) customLabel2.textContent = "🛡️ Administration Scope";
      if (customVal2) customVal2.textContent = "Institutional Administration, Student Records & Governance";
    }
  },

  pendingPhotoFile: null,
  pendingPhotoBase64: null,

  triggerPhotoUpload() {
    const input = document.getElementById("profPhotoFileInput");
    if (input) {
      input.value = "";
      input.click();
    }
  },

  handleFileSelect(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      Toast.show("Unsupported format. Allowed: JPG, JPEG, PNG, WEBP.", "danger");
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      Toast.show("Image file exceeds maximum allowable size (5 MB).", "danger");
      return;
    }

    this.pendingPhotoFile = file;

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxDim = 400;
        let w = img.width;
        let h = img.height;

        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, w, h);

        const mime = file.type === "image/png" ? "image/png" : "image/jpeg";
        const optimizedBase64 = canvas.toDataURL(mime, 0.90);
        this.pendingPhotoBase64 = optimizedBase64;

        this.openPhotoModal(file, optimizedBase64);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  },

  openPhotoModal(file, previewData) {
    const modal = document.getElementById("profilePhotoModal");
    if (!modal) return;

    const previewImg = document.getElementById("photoPreviewImg");
    const placeholder = document.getElementById("photoPreviewPlaceholder");
    const nameEl = document.getElementById("photoFileName");
    const sizeEl = document.getElementById("photoFileSize");
    const removeBtn = document.getElementById("btnRemovePhotoModal");
    const alertEl = document.getElementById("photoModalAlert");

    if (alertEl) {
      alertEl.style.display = "none";
      alertEl.textContent = "";
    }

    if (previewData) {
      if (previewImg) {
        previewImg.src = previewData;
        previewImg.style.display = "block";
      }
      if (placeholder) placeholder.style.display = "none";
    } else {
      if (previewImg) previewImg.style.display = "none";
      if (placeholder) placeholder.style.display = "flex";
    }

    if (nameEl) nameEl.textContent = file ? file.name : "Custom Profile Photo";
    if (sizeEl) sizeEl.textContent = file ? (file.size / 1024).toFixed(1) + " KB" : "Optimized";

    const user = Auth.getUser();
    const hasPhoto = Boolean(user && (user.profilePhoto || user.photoUrl));
    if (removeBtn) removeBtn.style.display = hasPhoto ? "inline-flex" : "none";

    modal.style.display = "flex";
  },

  closePhotoModal() {
    const modal = document.getElementById("profilePhotoModal");
    if (modal) modal.style.display = "none";
    this.pendingPhotoFile = null;
    this.pendingPhotoBase64 = null;
  },

  async saveSelectedPhoto() {
    if (!this.pendingPhotoBase64) {
      Toast.show("Please select an image first.", "warning");
      return;
    }

    const saveBtn = document.getElementById("btnSavePhotoModal");
    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.innerHTML = `<span>⏳ Uploading Photo...</span>`;
    }

    try {
      const res = await Auth.fetchWithAuth("/api/user/profile-photo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photo: this.pendingPhotoBase64 })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to upload profile photo.");
      }

      const data = await res.json();
      const photoUrl = data.profilePhoto || this.pendingPhotoBase64;

      Auth.updateProfilePhoto(photoUrl);

      const user = Auth.getUser();
      this.renderProfile(user);
      if (typeof App !== 'undefined' && App.renderTopbarUser) App.renderTopbarUser(user);

      this.closePhotoModal();
      Toast.show("Profile photo updated successfully!", "success");
    } catch (err) {
      const alertEl = document.getElementById("photoModalAlert");
      if (alertEl) {
        alertEl.textContent = err.message || "Failed to upload photo.";
        alertEl.style.display = "block";
      } else {
        Toast.show(err.message, "danger");
      }
    } finally {
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.innerHTML = `<span>💾 Save Photo</span>`;
      }
    }
  },

  async confirmRemovePhoto() {
    if (!confirm("Are you sure you want to remove your profile photo and revert to default initials?")) {
      return;
    }
    await this.executeRemovePhoto();
  },

  async removePhotoFromModal() {
    await this.executeRemovePhoto();
    this.closePhotoModal();
  },

  async executeRemovePhoto() {
    try {
      const res = await Auth.fetchWithAuth("/api/user/profile-photo", {
        method: "DELETE"
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to remove profile photo.");
      }

      Auth.updateProfilePhoto("");

      const user = Auth.getUser();
      this.renderProfile(user);
      if (typeof App !== 'undefined' && App.renderTopbarUser) App.renderTopbarUser(user);

      Toast.show("Profile photo removed. Reverted to default avatar.", "info");
    } catch (err) {
      Toast.show(err.message, "danger");
    }
  },

  openEditModal() {
    const user = Auth.getUser();
    if (!user) return;

    const nameInput = document.getElementById("editProfName");
    const contactInput = document.getElementById("editProfContact");
    const bioInput = document.getElementById("editProfBio");
    const idInput = document.getElementById("editProfId");
    const yearInput = document.getElementById("editProfYear");
    const deptInput = document.getElementById("editProfDept");
    const secInput = document.getElementById("editProfSection");
    const emailInput = document.getElementById("editProfEmail");

    if (nameInput) nameInput.value = user.name || "";
    if (contactInput) contactInput.value = user.contact || "+91 98765 00000";
    if (bioInput) bioInput.value = user.bio || `Authorized student record enrolled in IV Year B.E. at Gnanamani College of Technology.`;
    if (idInput) idInput.value = user.identifier || "";
    if (yearInput) yearInput.value = user.academicYear || "IV Year B.E.";
    if (deptInput) deptInput.value = user.department || "Computer Science & Engineering";
    if (secInput) secInput.value = user.section ? `Section ${user.section}` : "Section CSE-A";
    if (emailInput) emailInput.value = user.email || "";

    const alertEl = document.getElementById("editProfileAlert");
    if (alertEl) alertEl.style.display = "none";
    const succEl = document.getElementById("editProfileSuccess");
    if (succEl) succEl.style.display = "none";

    const modal = document.getElementById("editProfileModal");
    if (modal) modal.style.display = "flex";
  },

  closeEditModal() {
    const modal = document.getElementById("editProfileModal");
    if (modal) modal.style.display = "none";
  },

  async saveProfile(e) {
    if (e) e.preventDefault();
    const user = Auth.getUser();
    if (!user) return;

    const name = document.getElementById("editProfName").value.trim();
    const contact = document.getElementById("editProfContact").value.trim();
    const bio = document.getElementById("editProfBio").value.trim();
    const alertEl = document.getElementById("editProfileAlert");
    const succEl = document.getElementById("editProfileSuccess");
    const saveBtn = document.getElementById("saveProfileBtn");

    if (alertEl) alertEl.style.display = "none";
    if (succEl) succEl.style.display = "none";

    // Validation
    if (!name) {
      if (alertEl) {
        alertEl.textContent = "Please enter your full display name.";
        alertEl.style.display = "block";
      }
      return;
    }
    if (!contact || contact.length < 7) {
      if (alertEl) {
        alertEl.textContent = "Please provide a valid contact phone number (at least 7 digits).";
        alertEl.style.display = "block";
      }
      return;
    }

    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.innerHTML = `<span>⏳ Saving to Database...</span>`;
    }

    try {
      // Connect to Spring Boot backend API: PUT /api/user/profile
      const res = await Auth.fetchWithAuth("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name,
          contact: contact,
          bio: bio
        })
      });

      if (res.ok) {
        const updatedUser = await res.json();
        
        // Update session storage
        const token = Auth.getToken();
        Auth.setSession(token, {
          ...user,
          name: updatedUser.name || name,
          contact: updatedUser.contact || contact,
          bio: updatedUser.bio || bio,
          academicYear: "IV Year B.E."
        });

        // Update Topbar and Profile UI
        const topUser = document.getElementById("topbarUserName");
        if (topUser) topUser.textContent = name;
        const topAvatar = document.getElementById("topbarUserAvatar");
        if (topAvatar) topAvatar.textContent = name.charAt(0).toUpperCase();

        const stName = document.getElementById("studentNameBanner");
        if (stName) stName.textContent = name;

        this.renderProfile(Auth.getUser());
        
        if (succEl) {
          succEl.textContent = "Profile updated and saved to database successfully!";
          succEl.style.display = "block";
        }

        setTimeout(() => {
          this.closeEditModal();
          Toast.show("Student profile updated successfully!", "success");
        }, 600);

      } else {
        const err = await res.json();
        if (alertEl) {
          alertEl.textContent = err.error || "Failed to update profile on backend.";
          alertEl.style.display = "block";
        }
      }
    } catch (err) {
      if (alertEl) {
        alertEl.textContent = "Error saving profile: " + err.message;
        alertEl.style.display = "block";
      }
    } finally {
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.innerHTML = `<span>💾 Save Profile Changes</span>`;
      }
    }
  }
};

const App = {
  currentTab: "dashboard",
  currentSelectedRole: null,

  init() {
    this.bindEvents();
    this.checkSession();
  },

  selectRole(role) {
    if (role === "admin" || !["student", "advisor", "hod", "principal"].includes(role)) {
      return;
    }
    this.currentSelectedRole = role;
    const roleStep = document.getElementById("roleSelectStep");
    const formStep = document.getElementById("roleLoginFormStep");
    const roleBadge = document.getElementById("loginSelectedRoleBadge");
    const titleEl = document.getElementById("loginRoleFormTitle");
    const subTitleEl = document.getElementById("loginRoleFormSubtitle");
    const idLabel = document.getElementById("loginIdentifierLabel");
    const idInput = document.getElementById("loginIdentifier");
    const passInput = document.getElementById("loginPassword");
    const errorMsg = document.getElementById("loginErrorMsg");

    if (errorMsg) {
      errorMsg.style.display = "none";
      errorMsg.textContent = "";
    }
    if (idInput) idInput.value = "";
    if (passInput) passInput.value = "";

    // 2. Selecting Student opens a login form asking for registration number and password.
    // 3. Selecting Class Advisor or HOD opens a form asking for staff ID or official email and password.
    // 4. Selecting Principal opens a form asking for official email and password.
    // 5. Selecting a role must NEVER automatically sign in or open a dashboard.
    if (role === "student") {
      if (roleBadge) {
        roleBadge.className = "badge-tag badge-teal";
        roleBadge.textContent = "🎓 Student";
      }
      if (titleEl) titleEl.textContent = "Student Sign-In";
      if (subTitleEl) subTitleEl.textContent = "Please enter your registration number and password to sign in.";
      if (idLabel) idLabel.textContent = "Registration Number";
      if (idInput) {
        idInput.placeholder = "Enter your registration number";
        idInput.type = "text";
      }
      if (passInput) {
        passInput.placeholder = "Enter your password";
      }
    } else if (role === "advisor") {
      if (roleBadge) {
        roleBadge.className = "badge-tag badge-teal";
        roleBadge.textContent = "👩‍🏫 Class Advisor";
      }
      if (titleEl) titleEl.textContent = "Class Advisor Sign-In";
      if (subTitleEl) subTitleEl.textContent = "Please enter your staff ID or official email and password to sign in.";
      if (idLabel) idLabel.textContent = "Staff ID or Official Email";
      if (idInput) {
        idInput.placeholder = "e.g. arularasi or arularasi@gct.ac.in";
        idInput.type = "text";
      }
    } else if (role === "hod") {
      if (roleBadge) {
        roleBadge.className = "badge-tag badge-teal";
        roleBadge.textContent = "🏛️ Head of Department";
      }
      if (titleEl) titleEl.textContent = "HOD Sign-In";
      if (subTitleEl) subTitleEl.textContent = "Please enter your staff ID or official email and password to sign in.";
      if (idLabel) idLabel.textContent = "Staff ID or Official Email";
      if (idInput) {
        idInput.placeholder = "e.g. gopinath or gopinath@gct.ac.in";
        idInput.type = "text";
      }
    } else if (role === "principal") {
      if (roleBadge) {
        roleBadge.className = "badge-tag badge-teal";
        roleBadge.textContent = "👨‍💼 Principal";
      }
      if (titleEl) titleEl.textContent = "Principal Sign-In";
      if (subTitleEl) subTitleEl.textContent = "Please enter your official institutional email and password to sign in.";
      if (idLabel) idLabel.textContent = "Official Institutional Email";
      if (idInput) {
        idInput.placeholder = "e.g. principal@gct.ac.in";
        idInput.type = "email";
      }
    }

    // Render fictional demo testing accounts
    this.renderDemoAccounts(role);

    // Switch step views (Selecting a role never signs in automatically)
    if (roleStep) roleStep.style.display = "none";
    if (formStep) formStep.style.display = "block";
    if (idInput) idInput.focus();
  },

  backToRoleSelect() {
    this.currentSelectedRole = null;
    const roleStep = document.getElementById("roleSelectStep");
    const formStep = document.getElementById("roleLoginFormStep");
    const errorMsg = document.getElementById("loginErrorMsg");
    const idInput = document.getElementById("loginIdentifier");
    const passInput = document.getElementById("loginPassword");

    if (errorMsg) {
      errorMsg.style.display = "none";
      errorMsg.textContent = "";
    }
    if (idInput) idInput.value = "";
    if (passInput) passInput.value = "";

    if (formStep) formStep.style.display = "none";
    if (roleStep) roleStep.style.display = "block";
  },

  togglePasswordVisibility() {
    const passInput = document.getElementById("loginPassword");
    const toggleBtn = document.getElementById("togglePasswordBtn");
    if (!passInput) return;

    if (passInput.type === "password") {
      passInput.type = "text";
      if (toggleBtn) {
        toggleBtn.textContent = "🙈";
        toggleBtn.title = "Hide Password";
      }
    } else {
      passInput.type = "password";
      if (toggleBtn) {
        toggleBtn.textContent = "👁️";
        toggleBtn.title = "Show Password";
      }
    }
  },

  renderDemoAccounts(role) {
    const demoBox = document.getElementById("demoTestingBox");
    const container = document.getElementById("demoAccountsList");

    // Student demo-account listing is completely removed
    if (role === "student" || !window.DemoStore) {
      if (demoBox) demoBox.style.display = "none";
      if (container) container.innerHTML = "";
      return;
    }

    const accounts = DemoStore.getDemoAccountsForRole(role);
    if (!accounts || accounts.length === 0) {
      if (demoBox) demoBox.style.display = "none";
      if (container) container.innerHTML = "";
      return;
    }

    if (demoBox) demoBox.style.display = "block";
    container.innerHTML = accounts.map(acc => {
      const displayId = acc.email || acc.id;
      return `
        <div class="demo-acc-card" onclick="App.fillDemoTestingCredentials('${acc.id}', '${acc.pass}')" role="button" tabindex="0" title="Click to fill test credentials into form">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <strong style="color:var(--primary); font-size:12px;">${acc.name}</strong>
            <span class="badge-tag badge-secondary" style="font-size:10px; padding:1px 6px;">${acc.id}</span>
          </div>
          <div style="font-size:11px; color:#64748b; margin-top:3px;">${acc.meta}</div>
          <div style="display:flex; justify-content:space-between; align-items:center; margin-top:6px; font-size:10.5px; color:#0d9488;">
            <span>🔑 Password: <code>${acc.pass}</code></span>
            <span style="font-weight:600; text-decoration:underline;">Click to Fill</span>
          </div>
        </div>
      `;
    }).join("");
  },

  fillDemoTestingCredentials(identifier, password) {
    const idInput = document.getElementById("loginIdentifier");
    const passInput = document.getElementById("loginPassword");
    const errorMsg = document.getElementById("loginErrorMsg");

    if (idInput) idInput.value = identifier;
    if (passInput) passInput.value = password;
    if (errorMsg) {
      errorMsg.style.display = "none";
      errorMsg.textContent = "";
    }
    Toast.show("Fictional demo credentials filled. Click 'Sign In to Portal' to validate.", "info");
  },

  bindEvents() {
    // Dedicated role login form submit
    const roleLoginForm = document.getElementById("roleLoginForm");
    if (roleLoginForm) {
      roleLoginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const msg = document.getElementById("loginErrorMsg");
        const submitBtn = document.getElementById("loginSubmitBtn");
        const idInput = document.getElementById("loginIdentifier");
        const passInput = document.getElementById("loginPassword");

        if (!this.currentSelectedRole) {
          if (msg) {
            msg.textContent = "Please select an academic role first.";
            msg.style.display = "block";
          }
          return;
        }

        const identifier = idInput ? idInput.value.trim() : "";
        const password = passInput ? passInput.value : "";

        if (msg) {
          msg.style.display = "none";
          msg.textContent = "";
        }
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.innerHTML = `<span>Validating Role Credentials...</span>`;
        }

        try {
          await Auth.login(this.currentSelectedRole, identifier, password);
          Toast.show(`Welcome to EPOCH Academic Portal!`, "success");
          this.checkSession();
        } catch (err) {
          if (msg) {
            msg.textContent = err.message || "Invalid credentials. Please verify your account details.";
            msg.style.display = "block";
          }
        } finally {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = `
              <span>Sign In to Portal</span>
              <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
            `;
          }
        }
      });
    }

    // Bind Student Complaint form submit
    const cmpForm = document.getElementById("complaintForm");
    if (cmpForm) {
      cmpForm.addEventListener("submit", (e) => StudentPortal.submitComplaint(e));
    }
  },

  renderTopbarUser(user) {
    if (!user) user = (typeof Auth !== 'undefined' ? Auth.getUser() : null);
    if (!user) return;
    const nameEl = document.getElementById("topbarUserName");
    const roleEl = document.getElementById("topbarUserRole");
    const avatarEl = document.getElementById("topbarUserAvatar");

    if (nameEl) nameEl.textContent = user.name;
    if (roleEl) roleEl.textContent = user.role + (user.section ? ` (${user.section})` : "");
    if (avatarEl) {
      const photo = user.profilePhoto || user.photoUrl;
      if (photo) {
        avatarEl.innerHTML = `<img src="${photo}" alt="${user.name || 'User'}" class="topbar-avatar-img" style="width:100%; height:100%; object-fit:cover; border-radius:50%; display:block;">`;
      } else {
        avatarEl.textContent = (user.name || "U").charAt(0).toUpperCase();
      }
    }
  },

  checkSession() {
    const user = Auth.getUser();
    if (!user || !Auth.isAuthenticated()) {
      document.getElementById("loginView").style.display = "flex";
      document.getElementById("appView").style.display = "none";
      const asstBtn = document.getElementById("assistantFloatingBtn");
      if (asstBtn) asstBtn.style.display = "none";
      return;
    }

    document.getElementById("loginView").style.display = "none";
    document.getElementById("appView").style.display = "flex";

    // Setup Topbar User Details
    this.renderTopbarUser(user);

    // Setup Views by Role or URL Hash
    const initialHash = (window.location.hash || "").replace(/^#\/?/, "");
    if (initialHash && ["track", "profile", "messages", "notifications", "history", "announcements"].includes(initialHash)) {
      this.switchTab(initialHash);
    } else {
      this.setupRoleViews(user);
    }
    this.refreshNotifications();
    if (window.RealtimeSync) RealtimeSync.start();
  },

  setupRoleViews(user) {
    document.getElementById("studentView").style.display = "none";
    document.getElementById("advisorView").style.display = "none";
    document.getElementById("hodView").style.display = "none";
    document.getElementById("principalView").style.display = "none";
    const adminView = document.getElementById("adminView");
    if (adminView) adminView.style.display = "none";
    const annView = document.getElementById("announcementsView");
    if (annView) annView.style.display = "none";
    document.getElementById("profileView").style.display = "none";
    const chatView = document.getElementById("chatView");
    if (chatView) chatView.style.display = "none";

    const sigLink = document.getElementById("sidebarSignatureLink");
    const cmpLink = document.getElementById("sidebarComplaintsLink");
    const trackLink = document.getElementById("sidebarTrackingLink");
    const asstBtn = document.getElementById("assistantFloatingBtn");
    const annLink = document.getElementById("sidebarAnnouncementsLink");

    const historyLink = document.getElementById("nav-history")?.closest("li");
    if (historyLink) historyLink.style.display = "";
    const msgLink = document.getElementById("nav-messages")?.closest("li");
    if (msgLink) msgLink.style.display = "";
    const notifLink = document.getElementById("nav-notifications")?.closest("li");
    if (notifLink) notifLink.style.display = "";
    const topbarChat = document.querySelector(".topbar-right button[title='Messages / Chat']");
    if (topbarChat) topbarChat.style.display = "";
    const topbarNotif = document.querySelector(".topbar-right button[title='Notifications']");
    if (topbarNotif) topbarNotif.style.display = "";

    // Initialize Announcements Banner & Board
    if (window.AnnouncementApp) {
      AnnouncementApp.init(user);
    }

    if (user.role === "STUDENT") {
      document.getElementById("studentView").style.display = "block";
      if (sigLink) sigLink.style.display = "none";
      if (cmpLink) cmpLink.style.display = "flex";
      if (trackLink) trackLink.style.display = "flex";
      if (asstBtn) asstBtn.style.display = "flex";
      if (annLink) annLink.style.display = "block";
      StudentPortal.init(user);

    } else if (user.role === "ADVISOR") {
      document.getElementById("advisorView").style.display = "block";
      if (sigLink) sigLink.style.display = "flex";
      if (cmpLink) cmpLink.style.display = "none";
      if (trackLink) trackLink.style.display = "none";
      if (asstBtn) asstBtn.style.display = "none";
      if (annLink) annLink.style.display = "block";
      AdvisorPortal.init(user);

    } else if (user.role === "HOD") {
      document.getElementById("hodView").style.display = "block";
      if (sigLink) sigLink.style.display = "flex";
      if (cmpLink) cmpLink.style.display = "none";
      if (trackLink) trackLink.style.display = "none";
      if (asstBtn) asstBtn.style.display = "none";
      if (annLink) annLink.style.display = "block";
      HodPortal.init(user);

    } else if (user.role === "PRINCIPAL") {
      document.getElementById("principalView").style.display = "block";
      if (sigLink) sigLink.style.display = "flex";
      if (cmpLink) cmpLink.style.display = "none";
      if (trackLink) trackLink.style.display = "none";
      if (asstBtn) asstBtn.style.display = "none";
      if (annLink) annLink.style.display = "block";
      PrincipalPortal.init(user);

    } else if (user.role === "ADMIN") {
      if (adminView) adminView.style.display = "block";
      if (sigLink) sigLink.style.display = "none";
      if (cmpLink) cmpLink.style.display = "none";
      if (trackLink) trackLink.style.display = "none";
      if (asstBtn) asstBtn.style.display = "none";
      if (annLink) annLink.style.display = "none";

      if (historyLink) historyLink.style.display = "none";
      if (msgLink) msgLink.style.display = "none";
      if (notifLink) notifLink.style.display = "none";
      if (topbarChat) topbarChat.style.display = "none";
      if (topbarNotif) topbarNotif.style.display = "none";
    }
  },

  switchTab(tabName, subTab = null) {
    this.currentTab = tabName;
    try {
      if (window.location.hash !== `#${tabName}`) {
        history.replaceState(null, "", `#${tabName}`);
      }
    } catch(e) {}
    document.querySelectorAll(".sidebar-link").forEach(el => el.classList.remove("active"));
    const activeEl = document.getElementById(`nav-${tabName}`);
    if (activeEl) activeEl.classList.add("active");

    const user = Auth.getUser();

    // Toggle chat-active class on body to reposition assistant widget outside chat controls
    if (tabName === "messages") {
      document.body.classList.add("chat-active");
    } else {
      document.body.classList.remove("chat-active");
    }

    // Hide all view panels first
    document.getElementById("studentView").style.display = "none";
    const trackView = document.getElementById("studentTrackingView");
    if (trackView) trackView.style.display = "none";
    document.getElementById("advisorView").style.display = "none";
    document.getElementById("hodView").style.display = "none";
    document.getElementById("principalView").style.display = "none";
    const adminView = document.getElementById("adminView");
    if (adminView) adminView.style.display = "none";
    const annView = document.getElementById("announcementsView");
    if (annView) annView.style.display = "none";
    document.getElementById("notificationsContainer").style.display = "none";
    document.getElementById("historyContainer").style.display = "none";
    document.getElementById("profileView").style.display = "none";
    const chatView = document.getElementById("chatView");
    if (chatView) chatView.style.display = "none";

    if (tabName === "dashboard") {
      this.setupRoleViews(user);
    } else if (tabName === "fees" || tabName === "verify") {
      this.switchTab("dashboard");
    } else if (tabName === "announcements") {
      if (annView) annView.style.display = "block";
      const postBtn = document.getElementById("postAnnouncementBtn");
      if (postBtn) {
        postBtn.style.display = (user && (user.role === "STUDENT" || user.role === "ADMIN")) ? "none" : "inline-flex";
      }
      if (window.AnnouncementApp) {
        AnnouncementApp.init(user);
      }
    } else if (tabName === "track") {
      if (trackView) trackView.style.display = "block";
      if (window.StudentPortal && StudentPortal.renderTrackingPage) {
        StudentPortal.renderTrackingPage();
      }
    } else if (tabName === "profile") {
      document.getElementById("profileView").style.display = "block";
      ProfileManager.renderProfile(user);
    } else if (tabName === "notifications") {
      document.getElementById("notificationsContainer").style.display = "block";
      this.loadNotifications();
    } else if (tabName === "history") {
      document.getElementById("historyContainer").style.display = "block";
      this.loadOfficialHistory();
    } else if (tabName === "messages") {
      if (chatView) chatView.style.display = "block";
      if (window.ChatApp) {
        ChatApp.init(user).then(() => {
          if (subTab) {
            ChatApp.switchTab(subTab);
          }
        });
      }
    }
  },

  async refreshNotifications() {
    try {
      const res = await Auth.fetchWithAuth("/api/notifications/unread-count");
      if (res.ok) {
        const data = await res.json();
        const badge = document.getElementById("topbarNotifBadge");
        if (data.unreadCount > 0) {
          badge.textContent = data.unreadCount;
          badge.style.display = "inline-block";
        } else {
          badge.style.display = "none";
        }
      }
    } catch (e) {
      console.warn("Could not refresh notif count:", e);
    }

    // Refresh pending message request banners on dashboard
    try {
      const reqRes = await Auth.fetchWithAuth("/api/chat/requests/received");
      if (reqRes.ok) {
        const reqs = await reqRes.json();
        if (window.ChatApp) {
          ChatApp.receivedRequests = reqs;
          if (ChatApp.updateRequestBadges) ChatApp.updateRequestBadges();
        }
        const pending = (reqs || []).filter(r => r.status === 'PENDING');
        const user = Auth.getUser();
        const role = user ? user.role : '';

        const stBanner = document.getElementById("studentPendingReqBanner");
        const advBanner = document.getElementById("advisorPendingReqBanner");
        const hodBanner = document.getElementById("hodPendingReqBanner");
        const prinBanner = document.getElementById("principalPendingReqBanner");

        let targetBanner = null;
        if (role === 'STUDENT') targetBanner = stBanner;
        else if (role === 'ADVISOR') targetBanner = advBanner;
        else if (role === 'HOD') targetBanner = hodBanner;
        else if (role === 'PRINCIPAL') targetBanner = prinBanner;

        if (stBanner && stBanner !== targetBanner) stBanner.style.display = "none";
        if (advBanner && advBanner !== targetBanner) advBanner.style.display = "none";
        if (hodBanner && hodBanner !== targetBanner) hodBanner.style.display = "none";
        if (prinBanner && prinBanner !== targetBanner) prinBanner.style.display = "none";

        if (targetBanner) {
          if (pending.length > 0) {
            targetBanner.style.display = "flex";
            const titleEl = targetBanner.querySelector("strong");
            const subEl = targetBanner.querySelector("div > div");
            if (titleEl) {
              titleEl.textContent = `You have ${pending.length} pending message request${pending.length > 1 ? 's' : ''} awaiting your review.`;
            }
            if (subEl) {
              const senders = pending.map(p => p.senderName).slice(0, 2).join(", ");
              subEl.textContent = `From ${senders}${pending.length > 2 ? ' and others' : ''} • Review and accept to start direct messaging.`;
            }
          } else {
            targetBanner.style.display = "none";
          }
        }
      }
    } catch (e) {
      console.warn("Could not check pending requests for dashboard banner:", e);
    }

    if (window.ChatApp && ChatApp.refreshChatBadge) {
      ChatApp.refreshChatBadge();
    }

    // Live refresh notification inbox list if currently visible
    try {
      const notifsContainer = document.getElementById("notificationsContainer") || document.getElementById("notificationsList");
      if (notifsContainer && notifsContainer.offsetParent !== null) {
        this.loadNotifications();
      }
    } catch (e) {}
  },

  isRequestModalOpening: false,

  escape(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  },

  formatStatusBadge(status) {
    switch (status) {
      case "APPROVED":
        return '<span class="badge-tag badge-approved">✅ Approved</span>';
      case "REJECTED":
        return '<span class="badge-tag badge-rejected">❌ Rejected</span>';
      case "PENDING_ADVISOR":
        return '<span class="badge-tag badge-warning">⏳ Awaiting Advisor</span>';
      case "PENDING_HOD":
        return '<span class="badge-tag badge-warning">⏳ Awaiting HOD</span>';
      case "PENDING_PRINCIPAL":
        return '<span class="badge-tag badge-info">🏛️ Awaiting Principal</span>';
      case "DRAFT":
        return '<span class="badge-tag badge-secondary">📝 Draft</span>';
      default:
        return `<span class="badge-tag badge-secondary">${this.escape(status || 'PENDING')}</span>`;
    }
  },

  async viewRequestDetails(requestId, notifId) {
    if (!requestId) {
      Toast.show("Invalid request reference.", "warning");
      return;
    }
    const cleanId = String(requestId).trim().replace(/^[#\s]+/, '').replace(/[\s"']+$/, '');
    if (notifId) {
      this.markNotifRead(notifId);
    }

    // Defensive routing if non-academic reference was passed
    if (cleanId.startsWith("EPOCH-CMP-") || cleanId.startsWith("CMP-")) {
      return this.viewComplaintDetails(cleanId, notifId);
    }
    if (cleanId.startsWith("RCPT-")) {
      return this.downloadFeeReceipt(cleanId, notifId);
    }
    if (cleanId.startsWith("FEE-") || cleanId.startsWith("PAY-")) {
      this.switchTab('fees');
      return;
    }
    if (cleanId.startsWith("ANN-")) {
      this.switchTab('announcements');
      return;
    }
    if (cleanId.startsWith("CONV-") || cleanId.startsWith("REQ-")) {
      this.switchTab('chat');
      return;
    }

    if (this.isRequestModalOpening) return;
    this.isRequestModalOpening = true;

    const modal = document.getElementById("odDetailsModal");

    try {
      let req = null;
      try {
        const res = await Auth.fetchWithAuth(`/api/od/${encodeURIComponent(cleanId)}`);
        if (res.ok) {
          req = await res.json();
        } else if (res.status === 403) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || "Access Denied: You are not authorized to view this request.");
        } else if (res.status === 404) {
          if (window.DemoStore) {
            req = DemoStore.getOdRequests().find(x => x.id === cleanId) ||
                  DemoStore.getBonafideRequests().find(x => x.id === cleanId) ||
                  DemoStore.getLeaveRequests().find(x => x.id === cleanId);
          }
          if (!req) {
            throw new Error(`Referenced request record (${cleanId}) was not found in institutional archives.`);
          }
        } else {
          throw new Error(`Unable to load request (HTTP ${res.status})`);
        }
      } catch (fetchErr) {
        if (window.DemoStore && !req) {
          req = DemoStore.getOdRequests().find(x => x.id === cleanId) ||
                DemoStore.getBonafideRequests().find(x => x.id === cleanId) ||
                DemoStore.getLeaveRequests().find(x => x.id === cleanId);
        }
        if (!req) {
          throw fetchErr;
        }
      }

      this.renderRequestDetailsModal(req);
      if (modal) modal.style.display = "flex";
    } catch (err) {
      Toast.show(err.message || "Failed to open request details.", "danger");
    } finally {
      this.isRequestModalOpening = false;
    }
  },

  async viewComplaintDetails(complaintId, notifId) {
    if (!complaintId) return;
    if (notifId) {
      this.markNotifRead(notifId);
    }
    const user = Auth.getUser();

    // If Principal: open executive review & resolution modal
    if (user && user.role === "PRINCIPAL") {
      if (window.PrincipalPortal && typeof PrincipalPortal.openComplaintModal === "function") {
        await PrincipalPortal.openComplaintModal(complaintId);
        return;
      }
    }

    // If Student: open complaint modal or download record
    try {
      const res = await Auth.fetchWithAuth(`/api/complaints/${encodeURIComponent(complaintId)}`);
      if (res.ok) {
        const c = await res.json();
        const info = `Subject: ${c.subject || 'Student Grievance'}\nStatus: ${c.status || 'SUBMITTED'}\nCategory: ${c.category || 'General'}${c.principalResponse ? '\nPrincipal Response: ' + c.principalResponse : ''}`;
        if (window.confirm(`Confidential Student Grievance (${c.id})\n\n${info}\n\nWould you like to download the official resolution record (PDF)?`)) {
          this.downloadComplaintPdf(complaintId);
        }
        return;
      }
    } catch (e) {
      console.warn("Could not fetch complaint:", e);
    }

    this.downloadComplaintPdf(complaintId);
  },

  async downloadFeeReceipt(receiptId, notifId) {
    if (!receiptId) return;
    if (notifId) {
      this.markNotifRead(notifId);
    }
    try {
      const token = Auth.getToken();
      const res = await fetch(Auth.apiUrl(`/api/fee/receipts/${encodeURIComponent(receiptId)}/pdf`), {
        headers: { "Authorization": "Bearer " + token }
      });
      if (!res.ok) {
        Toast.show("Official verified receipt PDF is currently unavailable.", "warning");
        return;
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `EPOCH_Fee_Receipt_${receiptId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      Toast.show("Verified institutional fee receipt downloaded!", "success");
    } catch (err) {
      Toast.show("Receipt download failed: " + err.message, "danger");
    }
  },

  async markAllNotificationsRead() {
    try {
      await Auth.fetchWithAuth("/api/notifications/mark-all-read", { method: "POST" });
      await this.loadNotifications();
      this.refreshNotifications();
      Toast.show("All notifications marked as read.", "success");
    } catch (e) {
      console.error("Mark all read failed:", e);
    }
  },

  closeRequestDetailsModal() {
    const modal = document.getElementById("odDetailsModal");
    if (modal) modal.style.display = "none";
    this.isRequestModalOpening = false;
  },

  async downloadPdf(id) {
    if (!id) return;
    try {
      const token = Auth.getToken();
      const res = await fetch(Auth.apiUrl(`/api/od/${encodeURIComponent(id)}/pdf`), {
        headers: { "Authorization": "Bearer " + token }
      });
      if (!res.ok) {
        if (res.status === 400 || res.status === 403) {
          const text = await res.text();
          throw new Error(text || "Download unlocked only for final approved requests.");
        }
        throw new Error("Failed to download PDF. Status: " + res.status);
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `EPOCH-${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      Toast.show("Official digitally signed document downloaded!", "success");
    } catch (err) {
      Toast.show(err.message, "warning");
    }
  },

  async downloadComplaintPdf(id) {
    if (!id) return;
    try {
      const token = Auth.getToken();
      const res = await fetch(Auth.apiUrl(`/api/complaints/${encodeURIComponent(id)}/pdf`), {
        headers: { "Authorization": "Bearer " + token }
      });
      if (!res.ok) {
        throw new Error("Unable to download complaint record. Status: " + res.status);
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${id}-Record.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      Toast.show("Official grievance & complaint record downloaded!", "success");
    } catch (err) {
      Toast.show(err.message, "warning");
    }
  },

  renderRequestDetailsModal(r) {
    const isBonafide = (r.odType && r.odType.toLowerCase().includes("bonafide")) || (r.id && r.id.startsWith("EPOCH-BNF"));
    const isLeave = (r.odType && r.odType.toLowerCase().includes("leave")) || (r.id && r.id.startsWith("EPOCH-LV"));

    const idEl = document.getElementById("detModalId");
    if (idEl) idEl.textContent = r.id;

    const evTitleEl = document.getElementById("detEventTitle");
    if (evTitleEl) {
      evTitleEl.textContent = r.eventTitle || r.purpose || r.odType || (isBonafide ? "Bonafide Certificate" : (isLeave ? "Leave Application" : "On-Duty Requisition"));
    }

    const catEl = document.getElementById("detCategory");
    if (catEl) {
      const typeLabel = isBonafide ? "Bonafide Certificate" : (isLeave ? (r.leaveType || r.odType || "Leave Application") : (r.odType || "On-Duty Requisition"));
      const workflowLabel = isBonafide ? "Institutional Requisition" : "Academic Requisition";
      catEl.innerHTML = `<span class="badge-tag ${isBonafide ? 'badge-teal' : (isLeave ? 'badge-info' : 'badge-primary')}">${this.escape(typeLabel)}</span> <span style="color:#64748b; font-size:11.5px; margin-left:6px;">${workflowLabel}</span>`;
    }

    const statusBadgeEl = document.getElementById("detStatusBadge");
    if (statusBadgeEl) {
      statusBadgeEl.innerHTML = this.formatStatusBadge(r.status);
    }

    const stInfoEl = document.getElementById("detStudentInfo");
    if (stInfoEl) {
      stInfoEl.innerHTML = `<strong style="color:var(--primary); font-size:13px;">${this.escape(r.studentName || 'Student')}</strong> <span style="font-family:monospace; color:#64748b; margin-left:4px;">(${this.escape(r.regNo || '-')})</span>`;
    }

    const deptSecEl = document.getElementById("detDeptSection");
    if (deptSecEl) {
      deptSecEl.innerHTML = `<strong>${this.escape(r.dept || 'CSE')}</strong> — Section <strong>${this.escape(r.section || 'CSE-A')}</strong> <span style="color:#64748b; margin-left:6px;">(${this.escape(r.academicYear || 'IV Year B.E.')})</span>`;
    }

    const advInfoEl = document.getElementById("detAdvisorInfo");
    if (advInfoEl) {
      const advName = r.assignedReviewerName || (r.section === 'CSE-B' ? 'Dr. Divyabharathi' : (r.section === 'CSE-C' ? 'Mrs. Rajavathi Jayapriya' : 'Mrs. P. Arularasi'));
      advInfoEl.innerHTML = `<span class="badge-tag badge-secondary" style="font-weight:600;">👩‍🏫 ${this.escape(advName)}</span> <span style="font-size:11px; color:#64748b; margin-left:4px;">(Assigned Class Advisor, ${this.escape(r.section || 'CSE-A')})</span>`;
    }

    const orgEl = document.getElementById("detOrganizer");
    if (orgEl) orgEl.textContent = r.organizer || (isBonafide ? "Gnanamani College of Technology" : (isLeave ? "College Attendance Records" : "Academic Institution"));

    const venueEl = document.getElementById("detVenue");
    if (venueEl) venueEl.textContent = r.venue || r.eventDetails || (isBonafide ? "Campus / Institutional Office" : (isLeave ? "Personal" : "On-site"));

    const datesEl = document.getElementById("detDates");
    if (datesEl) {
      const start = r.startDate || r.fromDate || "-";
      const end = r.endDate || r.toDate || start;
      const numDays = r.numberOfDays || 1;
      datesEl.textContent = `${start} to ${end} (${numDays} day${numDays > 1 ? 's' : ''})`;
    }

    const reasonEl = document.getElementById("detReason");
    if (reasonEl) reasonEl.textContent = r.reason || r.purpose || "-";

    const docEl = document.getElementById("detDocument");
    if (docEl) {
      if (r.documentData) {
        docEl.innerHTML = `
          <a href="${r.documentData}" download="${this.escape(r.documentName || 'Supporting_Document')}" class="btn btn-sm btn-secondary" style="display:inline-flex; align-items:center; gap:6px; padding:3px 8px; font-size:11px;">
            <span>📎 Download Attached File (${this.escape(r.documentName || 'File')})</span>
          </a>
        `;
      } else {
        docEl.textContent = isBonafide ? "Standard Institutional Verification (No extra file required)" : "Self-Declaration / Institutional Record";
      }
    }

    const subAtEl = document.getElementById("detSubmittedAt");
    if (subAtEl) subAtEl.textContent = r.submittedAt || (r.createdAt ? new Date(r.createdAt).toLocaleString() : "Recent");

    const timelineEl = document.getElementById("detApprovalTimeline");
    if (timelineEl) {
      timelineEl.innerHTML = this.buildTimelineHtml(r, isBonafide);
    }

    const sigEl = document.getElementById("detDigitalSignatures");
    if (sigEl) {
      sigEl.innerHTML = this.buildDigitalSignaturesHtml(r, isBonafide);
    }

    // Render interactive decision & review action controls for authorized personnel
    this.renderActionPanel(r);
  },

  isAssignedAdvisorForRequest(user, r) {
    if (!user || user.role !== "ADVISOR") return false;
    const reqSec = (r.section || "").trim().toUpperCase();
    const userSec = (user.section || "").trim().toUpperCase();
    const cleanId = (user.identifier || user.username || "").trim().toLowerCase();

    const normalize = s => {
      if (!s) return "";
      const str = s.toUpperCase().trim();
      if (str.endsWith("-C") || str.endsWith(" C") || str.endsWith("_C") || str === "C" || str === "SEC-C" || str === "SECTION C" || str === "CSE-C") return "C";
      if (str.endsWith("-B") || str.endsWith(" B") || str.endsWith("_B") || str === "B" || str === "SEC-B" || str === "SECTION B" || str === "CSE-B") return "B";
      if (str.endsWith("-A") || str.endsWith(" A") || str.endsWith("_A") || str === "A" || str === "SEC-A" || str === "SECTION A" || str === "CSE-A") return "A";
      const m = str.match(/[-_ ]([A-C])\b/) || str.match(/\b([A-C])\b/);
      return m ? m[1] : "";
    };

    const rNorm = normalize(reqSec);
    const uNorm = normalize(userSec);

    // Section matching: when both sections are known, they MUST match
    if (uNorm && rNorm) {
      return uNorm === rNorm;
    }

    // Direct identifier matching for authoritative faculty
    if (rNorm === "A" && (cleanId.includes("arula") || cleanId.includes("arasi"))) return true;
    if (rNorm === "B" && (cleanId.includes("divya") || cleanId.includes("dhivya"))) return true;
    if (rNorm === "C" && (cleanId.includes("raja") || cleanId.includes("jayapriya"))) return true;

    if (r.assignedReviewerId && cleanId && r.assignedReviewerId.toLowerCase() === cleanId) return true;

    return false;
  },

  isHodForRequest(user, r) {
    if (!user) return false;
    if (user.role === "HOD") return true;
    const cleanId = (user.identifier || user.username || "").trim().toLowerCase();
    return cleanId.includes("gopinath") || cleanId === "hod";
  },

  isPrincipalForRequest(user, r) {
    if (!user) return false;
    if (user.role === "PRINCIPAL") return true;
    const cleanId = (user.identifier || user.username || "").trim().toLowerCase();
    return cleanId.includes("sanjay") || cleanId.includes("gandhi") || cleanId.includes("principal");
  },

  renderActionPanel(r) {
    const actionPanelEl = document.getElementById("detActionPanel");
    const actionExtraEl = document.getElementById("detActionExtra");
    if (!actionPanelEl && !actionExtraEl) return;

    const user = Auth.getUser();
    const isBonafide = (r.odType && r.odType.toLowerCase().includes("bonafide")) || (r.id && r.id.startsWith("EPOCH-BNF"));
    const isLeave = (r.odType && r.odType.toLowerCase().includes("leave")) || (r.id && r.id.startsWith("EPOCH-LV"));

    if (actionPanelEl) actionPanelEl.innerHTML = "";
    if (actionExtraEl) actionExtraEl.innerHTML = "";

    // 1. If request is APPROVED: provide official download button
    if (r.status === "APPROVED") {
      const dlBtnText = isBonafide ? "📜 Download Approved Request (Bonafide Certificate)" : "📥 Download Approved Request";
      const dlBtnClass = isBonafide ? "btn btn-primary btn-sm" : "btn btn-success btn-sm";
      const extraHtml = `
        <button class="${dlBtnClass}" onclick="App.downloadPdf('${r.id}');" style="font-weight:600; display:inline-flex; align-items:center; gap:6px;">
          ${dlBtnText}
        </button>
      `;
      if (actionExtraEl) actionExtraEl.innerHTML = extraHtml;
      if (actionPanelEl) {
        actionPanelEl.innerHTML = `
          <div style="margin-top:16px; padding:12px 16px; background:#f0fdf4; border:1px solid #bbf7d0; border-radius:6px; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:10px;">
            <div style="font-size:12.5px; color:#065f46;">
              <strong>✅ Institutional Sanction Complete:</strong> This request has been officially approved with registered electronic signatures.
            </div>
            ${extraHtml}
          </div>
        `;
      }
      return;
    }

    // 2. If request is REJECTED:
    if (r.status === "REJECTED") {
      const rejHtml = `
        <div style="margin-top:16px; padding:12px 16px; background:#fef2f2; border:1px solid #fecaca; border-radius:6px; font-size:12.5px; color:#991b1b;">
          <strong>❌ Request Halted / Rejected:</strong> ${this.escape(r.rejectionReason || "No rejection reason provided.")}
          <div style="font-size:11.5px; color:#b91c1c; margin-top:3px;">
            Rejected by: ${this.escape(r.rejectedBy || "Authorized Authority")} • Download option is unavailable for rejected requests.
          </div>
        </div>
      `;
      if (actionPanelEl) actionPanelEl.innerHTML = rejHtml;
      if (actionExtraEl) actionExtraEl.innerHTML = `<span style="font-size:12px; color:var(--danger); font-weight:600;">❌ Request halted / rejected. Download option is unavailable.</span>`;
      return;
    }

    // 3. Request is PENDING_ADVISOR:
    if (r.status === "PENDING_ADVISOR") {
      const isAssigned = this.isAssignedAdvisorForRequest(user, r);
      if (isAssigned) {
        // Authenticated & Authorized Class Advisor!
        if (actionPanelEl) {
          actionPanelEl.innerHTML = `
            <div class="card" style="margin-top:18px; border:2px solid #059669; background:#f0fdf4; border-radius:8px; padding:16px; box-shadow:0 4px 12px rgba(5,150,105,0.08);">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; flex-wrap:wrap; gap:8px;">
                <div style="display:flex; align-items:center; gap:8px;">
                  <span style="font-size:20px;">✍️</span>
                  <div>
                    <h4 style="font-size:14px; font-weight:800; color:#065f46; margin:0;">
                      Class Advisor Official Review & Endorsement (Stage 1 of ${isBonafide ? '3' : '2'})
                    </h4>
                    <div style="font-size:11.5px; color:#047857; margin-top:2px;">
                      Assigned Section: <strong>${this.escape(r.section || 'CSE')}</strong> • Signatory: <strong>${this.escape((user && user.name) || 'Class Advisor')}</strong>
                    </div>
                  </div>
                </div>
                <span class="badge-tag badge-warning">Awaiting Your Action</span>
              </div>

              <div style="background:#ffffff; border:1px solid #bbf7d0; border-radius:6px; padding:10px 12px; font-size:12px; color:#334155; margin-bottom:14px;">
                ℹ️ <strong>Advisor Verification Notice:</strong> Please verify the student applicant details, duration, and supporting documents above. Accepting will endorse this requisition with your <strong>Official Registered Electronic Signature</strong> and automatically route it to the <strong>Head of Department (Dr. K. Gopinath)</strong>.
              </div>

              <div class="form-group" style="margin-bottom:12px;">
                <label for="detReviewCommentInput" style="font-size:12px; font-weight:700; color:#1e293b; margin-bottom:4px; display:block;">
                  Advisor Review Comments / Endorsement Remarks (Optional):
                </label>
                <input type="text" id="detReviewCommentInput" class="form-control" placeholder="e.g., Records and attendance verified. Recommended for departmental sanction." style="font-size:12.5px; background:#fff; border:1px solid #cbd5e1; border-radius:6px; padding:8px 12px;">
              </div>

              <div id="detRejectionReasonGroup" style="display:none; margin-bottom:14px; background:#fef2f2; border:1px solid #fecaca; border-radius:6px; padding:12px;">
                <label for="detRejectionReasonInput" style="font-size:12px; font-weight:700; color:#b91c1c; margin-bottom:4px; display:block;">
                  Mandatory Rejection Reason * (State clear justification for student audit record):
                </label>
                <textarea id="detRejectionReasonInput" rows="2" class="form-control" placeholder="Specify reasons such as insufficient attendance, overlapping assessment schedules, or incomplete documentation..." style="font-size:12.5px; background:#fff; border:1.5px solid #dc2626; border-radius:6px; padding:8px 12px;"></textarea>
                <div style="font-size:11px; color:#991b1b; margin-top:4px;">
                  ⚠️ Rejection is final and terminates the workflow. The student will be immediately notified with this reason.
                </div>
              </div>

              <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
                <div style="display:flex; gap:10px; flex-wrap:wrap; align-items:center;">
                  <button type="button" id="btnAdvisorApprove" class="btn btn-primary" onclick="App.advisorActionFromModal('${r.id}', true)" style="display:inline-flex; align-items:center; gap:6px; font-weight:700; padding:8px 18px; font-size:13px; background:#059669; border-color:#059669; color:#fff; border-radius:6px; cursor:pointer;">
                    <span>✅</span> Accept & Endorse Request
                  </button>
                  <button type="button" id="btnAdvisorDecline" class="btn btn-danger" onclick="App.advisorActionFromModal('${r.id}', false)" style="display:inline-flex; align-items:center; gap:6px; font-weight:700; padding:8px 18px; font-size:13px; background:#dc2626; border-color:#dc2626; color:#fff; border-radius:6px; cursor:pointer;">
                    <span>❌</span> Decline Request
                  </button>
                </div>
                <div style="font-size:11.5px; color:#64748b; font-style:italic;">
                  ✍️ Authorized Electronic Signature snapshot will be applied upon acceptance.
                </div>
              </div>
            </div>
          `;
        }
        if (actionExtraEl) {
          actionExtraEl.innerHTML = `
            <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
              <button type="button" class="btn btn-sm btn-primary" onclick="App.advisorActionFromModal('${r.id}', true)" style="background:#059669; border-color:#059669; color:#fff; font-weight:600;">
                ✅ Accept & Endorse
              </button>
              <button type="button" class="btn btn-sm btn-danger" onclick="App.advisorActionFromModal('${r.id}', false)" style="background:#dc2626; border-color:#dc2626; color:#fff; font-weight:600;">
                ❌ Decline
              </button>
            </div>
          `;
        }
        return;
      } else {
        // Not the assigned advisor (could be student, another section's advisor, or other staff)
        let note = "⏳ Request is awaiting Class Advisor review & endorsement.";
        if (user && user.role === "ADVISOR") {
          const advName = r.assignedReviewerName || (r.section === 'CSE-B' ? 'Dr. Divyabharathi' : (r.section === 'CSE-C' ? 'Mrs. Rajavathi Jayapriya' : 'Mrs. P. Arularasi'));
          note = `🔒 <strong>Section Isolation Audit:</strong> This request belongs to Section <strong>${this.escape(r.section || 'CSE')}</strong> (Assigned Advisor: <strong>${this.escape(advName)}</strong>). You are viewing this record in read-only audit mode.`;
        }
        if (actionPanelEl) {
          actionPanelEl.innerHTML = `
            <div style="margin-top:16px; padding:12px 16px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:6px; font-size:12px; color:#64748b;">
              ${note}
            </div>
          `;
        }
        if (actionExtraEl) {
          actionExtraEl.innerHTML = `<span style="font-size:12px; color:#64748b;">⏳ In Queue: Awaiting Class Advisor review</span>`;
        }
        return;
      }
    }

    // 4. Request is PENDING_HOD:
    if (r.status === "PENDING_HOD") {
      const isHod = this.isHodForRequest(user, r);
      if (isHod) {
        if (actionPanelEl) {
          actionPanelEl.innerHTML = `
            <div class="card" style="margin-top:18px; border:2px solid #2563eb; background:#eff6ff; border-radius:8px; padding:16px; box-shadow:0 4px 12px rgba(37,99,235,0.08);">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; flex-wrap:wrap; gap:8px;">
                <div style="display:flex; align-items:center; gap:8px;">
                  <span style="font-size:20px;">🏛️</span>
                  <div>
                    <h4 style="font-size:14px; font-weight:800; color:#1e40af; margin:0;">
                      Head of Department Official Review & Sanction (Stage 2 of ${isBonafide ? '3' : '2'})
                    </h4>
                    <div style="font-size:11.5px; color:#1d4ed8; margin-top:2px;">
                      Department: <strong>Computer Science & Engineering</strong> • Signatory: <strong>Dr. K. Gopinath (HOD-CSE)</strong>
                    </div>
                  </div>
                </div>
                <span class="badge-tag badge-warning">Awaiting HOD Decision</span>
              </div>

              <div style="background:#ffffff; border:1px solid #bfdbfe; border-radius:6px; padding:10px 12px; font-size:12px; color:#334155; margin-bottom:14px;">
                ℹ️ <strong>Departmental Sanction Notice:</strong> Class Advisor verification is complete. ${isBonafide ? 'Approving this Bonafide Certificate will endorse it and forward to the Principal for executive institutional seal.' : 'Approving this request will apply your <strong>Official Digital Signature</strong>, grant final academic sanction, and unlock the digitally signed official requisition PDF for the student.'}
              </div>

              <div class="form-group" style="margin-bottom:12px;">
                <label for="detHodReviewCommentInput" style="font-size:12px; font-weight:700; color:#1e293b; margin-bottom:4px; display:block;">
                  HOD Official Remarks / Sanction Notes (Optional):
                </label>
                <input type="text" id="detHodReviewCommentInput" class="form-control" placeholder="e.g., Departmental sanction granted. Attendance exemption approved." style="font-size:12.5px; background:#fff; border:1px solid #cbd5e1; border-radius:6px; padding:8px 12px;">
              </div>

              <div id="detHodRejectionReasonGroup" style="display:none; margin-bottom:14px; background:#fef2f2; border:1px solid #fecaca; border-radius:6px; padding:12px;">
                <label for="detHodRejectionReasonInput" style="font-size:12px; font-weight:700; color:#b91c1c; margin-bottom:4px; display:block;">
                  Mandatory Rejection Reason * (State clear justification for student audit record):
                </label>
                <textarea id="detHodRejectionReasonInput" rows="2" class="form-control" placeholder="State departmental reason for rejection..." style="font-size:12.5px; background:#fff; border:1.5px solid #dc2626; border-radius:6px; padding:8px 12px;"></textarea>
                <div style="font-size:11px; color:#991b1b; margin-top:4px;">
                  ⚠️ Rejection is final and terminates the workflow. The student will be immediately notified with this reason.
                </div>
              </div>

              <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
                <div style="display:flex; gap:10px; flex-wrap:wrap; align-items:center;">
                  <button type="button" id="btnHodApprove" class="btn btn-primary" onclick="App.hodActionFromModal('${r.id}', true)" style="display:inline-flex; align-items:center; gap:6px; font-weight:700; padding:8px 18px; font-size:13px; background:#2563eb; border-color:#2563eb; color:#fff; border-radius:6px; cursor:pointer;">
                    <span>✅</span> ${isBonafide ? 'Endorse & Forward to Principal' : 'Final Sanction & Approve'}
                  </button>
                  <button type="button" id="btnHodDecline" class="btn btn-danger" onclick="App.hodActionFromModal('${r.id}', false)" style="display:inline-flex; align-items:center; gap:6px; font-weight:700; padding:8px 18px; font-size:13px; background:#dc2626; border-color:#dc2626; color:#fff; border-radius:6px; cursor:pointer;">
                    <span>❌</span> Decline Request
                  </button>
                </div>
                <div style="font-size:11.5px; color:#64748b; font-style:italic;">
                  ✍️ Authorized Electronic Signature snapshot will be applied upon approval.
                </div>
              </div>
            </div>
          `;
        }
        if (actionExtraEl) {
          actionExtraEl.innerHTML = `
            <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
              <button type="button" class="btn btn-sm btn-primary" onclick="App.hodActionFromModal('${r.id}', true)" style="background:#2563eb; border-color:#2563eb; color:#fff; font-weight:600;">
                ✅ ${isBonafide ? 'Endorse & Forward' : 'Sanction & Approve'}
              </button>
              <button type="button" class="btn btn-sm btn-danger" onclick="App.hodActionFromModal('${r.id}', false)" style="background:#dc2626; border-color:#dc2626; color:#fff; font-weight:600;">
                ❌ Decline
              </button>
            </div>
          `;
        }
        return;
      } else {
        if (actionPanelEl) {
          actionPanelEl.innerHTML = `
            <div style="margin-top:16px; padding:12px 16px; background:#eff6ff; border:1px solid #bfdbfe; border-radius:6px; font-size:12px; color:#1e40af;">
              ⏳ <strong>Workflow Progress:</strong> Endorsed by Class Advisor with digital signature. In queue for Head of Department (Dr. K. Gopinath) review.
            </div>
          `;
        }
        if (actionExtraEl) {
          actionExtraEl.innerHTML = `<span style="font-size:12px; color:#64748b;">⏳ In Queue: Awaiting Head of Department sanction</span>`;
        }
        return;
      }
    }

    // 5. Request is PENDING_PRINCIPAL (Bonafide only):
    if (r.status === "PENDING_PRINCIPAL") {
      const isPrin = this.isPrincipalForRequest(user, r);
      if (isPrin) {
        if (actionPanelEl) {
          actionPanelEl.innerHTML = `
            <div class="card" style="margin-top:18px; border:2px solid #7c3aed; background:#f5f3ff; border-radius:8px; padding:16px; box-shadow:0 4px 12px rgba(124,58,237,0.08);">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; flex-wrap:wrap; gap:8px;">
                <div style="display:flex; align-items:center; gap:8px;">
                  <span style="font-size:20px;">🏛️</span>
                  <div>
                    <h4 style="font-size:14px; font-weight:800; color:#5b21b6; margin:0;">
                      Principal Final Executive Sanction (Stage 3 of 3)
                    </h4>
                    <div style="font-size:11.5px; color:#6d28d9; margin-top:2px;">
                      Institutional Authority: <strong>Gnanamani College of Technology</strong> • Signatory: <strong>Dr. B. Sanjay Gandhi (Principal)</strong>
                    </div>
                  </div>
                </div>
                <span class="badge-tag badge-warning">Awaiting Principal Sanction</span>
              </div>

              <div style="background:#ffffff; border:1px solid #ddd6fe; border-radius:6px; padding:10px 12px; font-size:12px; color:#334155; margin-bottom:14px;">
                ℹ️ <strong>Executive Seal Notice:</strong> Class Advisor and HOD endorsements are verified. Granting executive sanction will apply your <strong>Official Principal Digital Signature</strong> and finalize the official Bonafide Certificate.
              </div>

              <div class="form-group" style="margin-bottom:12px;">
                <label for="detPrinReviewCommentInput" style="font-size:12px; font-weight:700; color:#1e293b; margin-bottom:4px; display:block;">
                  Principal Executive Remarks (Optional):
                </label>
                <input type="text" id="detPrinReviewCommentInput" class="form-control" placeholder="e.g., Institutional sanction granted. Certificate issued." style="font-size:12.5px; background:#fff; border:1px solid #cbd5e1; border-radius:6px; padding:8px 12px;">
              </div>

              <div id="detPrinRejectionReasonGroup" style="display:none; margin-bottom:14px; background:#fef2f2; border:1px solid #fecaca; border-radius:6px; padding:12px;">
                <label for="detPrinRejectionReasonInput" style="font-size:12px; font-weight:700; color:#b91c1c; margin-bottom:4px; display:block;">
                  Mandatory Rejection Reason * (State clear justification for student audit record):
                </label>
                <textarea id="detPrinRejectionReasonInput" rows="2" class="form-control" placeholder="State reason for rejection..." style="font-size:12.5px; background:#fff; border:1.5px solid #dc2626; border-radius:6px; padding:8px 12px;"></textarea>
              </div>

              <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
                <div style="display:flex; gap:10px; flex-wrap:wrap; align-items:center;">
                  <button type="button" id="btnPrinApprove" class="btn btn-primary" onclick="App.principalActionFromModal('${r.id}', true)" style="display:inline-flex; align-items:center; gap:6px; font-weight:700; padding:8px 18px; font-size:13px; background:#7c3aed; border-color:#7c3aed; color:#fff; border-radius:6px; cursor:pointer;">
                    <span>✅</span> Grant Institutional Sanction
                  </button>
                  <button type="button" id="btnPrinDecline" class="btn btn-danger" onclick="App.principalActionFromModal('${r.id}', false)" style="display:inline-flex; align-items:center; gap:6px; font-weight:700; padding:8px 18px; font-size:13px; background:#dc2626; border-color:#dc2626; color:#fff; border-radius:6px; cursor:pointer;">
                    <span>❌</span> Decline Request
                  </button>
                </div>
                <div style="font-size:11.5px; color:#64748b; font-style:italic;">
                  ✍️ Authorized Principal Electronic Signature snapshot will be applied upon approval.
                </div>
              </div>
            </div>
          `;
        }
        if (actionExtraEl) {
          actionExtraEl.innerHTML = `
            <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
              <button type="button" class="btn btn-sm btn-primary" onclick="App.principalActionFromModal('${r.id}', true)" style="background:#7c3aed; border-color:#7c3aed; color:#fff; font-weight:600;">
                ✅ Grant Sanction
              </button>
              <button type="button" class="btn btn-sm btn-danger" onclick="App.principalActionFromModal('${r.id}', false)" style="background:#dc2626; border-color:#dc2626; color:#fff; font-weight:600;">
                ❌ Decline
              </button>
            </div>
          `;
        }
        return;
      } else {
        if (actionPanelEl) {
          actionPanelEl.innerHTML = `
            <div style="margin-top:16px; padding:12px 16px; background:#f5f3ff; border:1px solid #ddd6fe; border-radius:6px; font-size:12px; color:#5b21b6;">
              ⏳ <strong>Workflow Progress:</strong> Endorsed by HOD. Currently in queue for Principal executive sanction.
            </div>
          `;
        }
        if (actionExtraEl) {
          actionExtraEl.innerHTML = `<span style="font-size:12px; color:#64748b;">⏳ In Queue: Awaiting Principal sanction</span>`;
        }
        return;
      }
    }

    // Default fallback
    if (actionExtraEl) {
      actionExtraEl.innerHTML = `<span style="font-size:12px; color:#64748b;">⏳ Request is pending approval.</span>`;
    }
  },

  async advisorActionFromModal(requestId, isApproved) {
    if (!requestId) return;
    const commentEl = document.getElementById("detReviewCommentInput");
    const rejGroup = document.getElementById("detRejectionReasonGroup");
    const rejInput = document.getElementById("detRejectionReasonInput");

    if (!isApproved) {
      if (rejGroup && rejGroup.style.display === "none") {
        rejGroup.style.display = "block";
        if (rejInput) rejInput.focus();
        Toast.show("Please enter the mandatory rejection reason, then click 'Decline Request' to confirm.", "warning");
        return;
      }
      const reason = rejInput ? rejInput.value.trim() : "";
      if (!reason) {
        if (rejInput) rejInput.focus();
        Toast.show("Rejection reason is strictly mandatory. Please specify why the request is rejected.", "warning");
        return;
      }
      const confirmed = window.confirm("Are you sure you want to decline/reject this request? The approval workflow will be terminated and the student will be notified.");
      if (!confirmed) return;

      try {
        const res = await Auth.fetchWithAuth(`/api/od/${encodeURIComponent(requestId)}/advisor-action`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ approved: false, reason: reason })
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `Failed to decline request (HTTP ${res.status})`);
        }
        const updated = await res.json();
        Toast.show("OD request rejected. Student has been notified with the audit reason.", "info");
        this.renderRequestDetailsModal(updated);
        this.refreshNotifications();
        if (window.AdvisorPortal && typeof AdvisorPortal.loadRequests === "function") {
          AdvisorPortal.loadRequests();
        }
        if (window.StudentPortal && typeof StudentPortal.renderTrackingPage === "function") {
          StudentPortal.renderTrackingPage();
        }
        if (document.getElementById("historyContainer") && document.getElementById("historyContainer").style.display !== "none") {
          this.loadOfficialHistory();
        }
        if (document.getElementById("notificationsContainer") && document.getElementById("notificationsContainer").style.display !== "none") {
          this.loadNotifications();
        }
      } catch (err) {
        Toast.show("Error: " + err.message, "danger");
      }
    } else {
      const comment = commentEl ? commentEl.value.trim() : "";
      const confirmed = window.confirm("Are you sure you want to accept and endorse this request? Your authorized digital signature will be applied and the request will be forwarded to the Head of Department (Dr. K. Gopinath).");
      if (!confirmed) return;

      try {
        const res = await Auth.fetchWithAuth(`/api/od/${encodeURIComponent(requestId)}/advisor-action`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ approved: true, reason: comment || "Recommended for approval." })
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `Failed to accept request (HTTP ${res.status})`);
        }
        const updated = await res.json();
        const isBonafide = (updated.odType && updated.odType.toLowerCase().includes("bonafide")) || (updated.id && updated.id.startsWith("EPOCH-BNF"));
        if (isBonafide) {
          Toast.show("Bonafide Certificate approved and forwarded to Head of Department (Dr. K. Gopinath).", "success");
        } else {
          Toast.show("Request approved and forwarded to Head of Department (Dr. K. Gopinath) for final sanction.", "success");
        }
        this.renderRequestDetailsModal(updated);
        this.refreshNotifications();
        if (window.AdvisorPortal && typeof AdvisorPortal.loadRequests === "function") {
          AdvisorPortal.loadRequests();
        }
        if (window.StudentPortal && typeof StudentPortal.renderTrackingPage === "function") {
          StudentPortal.renderTrackingPage();
        }
        if (document.getElementById("historyContainer") && document.getElementById("historyContainer").style.display !== "none") {
          this.loadOfficialHistory();
        }
        if (document.getElementById("notificationsContainer") && document.getElementById("notificationsContainer").style.display !== "none") {
          this.loadNotifications();
        }
      } catch (err) {
        Toast.show("Error: " + err.message, "danger");
      }
    }
  },

  async hodActionFromModal(requestId, isApproved) {
    if (!requestId) return;
    const commentEl = document.getElementById("detHodReviewCommentInput");
    const rejGroup = document.getElementById("detHodRejectionReasonGroup");
    const rejInput = document.getElementById("detHodRejectionReasonInput");

    if (!isApproved) {
      if (rejGroup && rejGroup.style.display === "none") {
        rejGroup.style.display = "block";
        if (rejInput) rejInput.focus();
        Toast.show("Please enter the mandatory rejection reason, then click 'Decline Request' to confirm.", "warning");
        return;
      }
      const reason = rejInput ? rejInput.value.trim() : "";
      if (!reason) {
        if (rejInput) rejInput.focus();
        Toast.show("Rejection reason is strictly mandatory. Please specify why the request is rejected.", "warning");
        return;
      }
      const confirmed = window.confirm("Are you sure you want to decline/reject this request? The approval workflow will be terminated and the student will be notified.");
      if (!confirmed) return;

      try {
        const res = await Auth.fetchWithAuth(`/api/od/${encodeURIComponent(requestId)}/hod-action`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ approved: false, reason: reason })
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `Failed to decline request (HTTP ${res.status})`);
        }
        const updated = await res.json();
        Toast.show("Request rejected by HOD. Student has been notified with the audit reason.", "info");
        this.renderRequestDetailsModal(updated);
        this.refreshNotifications();
        if (window.HodPortal && typeof HodPortal.loadDashboardData === "function") {
          HodPortal.loadDashboardData();
        }
        if (window.StudentPortal && typeof StudentPortal.renderTrackingPage === "function") {
          StudentPortal.renderTrackingPage();
        }
        if (document.getElementById("historyContainer") && document.getElementById("historyContainer").style.display !== "none") {
          this.loadOfficialHistory();
        }
        if (document.getElementById("notificationsContainer") && document.getElementById("notificationsContainer").style.display !== "none") {
          this.loadNotifications();
        }
      } catch (err) {
        Toast.show("Error: " + err.message, "danger");
      }
    } else {
      const comment = commentEl ? commentEl.value.trim() : "";
      const confirmed = window.confirm("Are you sure you want to approve this request? Your authorized digital signature will be applied.");
      if (!confirmed) return;

      try {
        const res = await Auth.fetchWithAuth(`/api/od/${encodeURIComponent(requestId)}/hod-action`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ approved: true, reason: comment || "Departmental sanction granted." })
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `Failed to approve request (HTTP ${res.status})`);
        }
        const updated = await res.json();
        const isBonafide = (updated.odType && updated.odType.toLowerCase().includes("bonafide")) || (updated.id && updated.id.startsWith("EPOCH-BNF"));
        if (isBonafide) {
          Toast.show("Bonafide Certificate approved and forwarded to Principal (Dr. B. Sanjay Gandhi).", "success");
        } else {
          Toast.show("Request granted final sanction! Student may now download the approved signed requisition.", "success");
        }
        this.renderRequestDetailsModal(updated);
        this.refreshNotifications();
        if (window.HodPortal && typeof HodPortal.loadDashboardData === "function") {
          HodPortal.loadDashboardData();
        }
        if (window.StudentPortal && typeof StudentPortal.renderTrackingPage === "function") {
          StudentPortal.renderTrackingPage();
        }
        if (document.getElementById("historyContainer") && document.getElementById("historyContainer").style.display !== "none") {
          this.loadOfficialHistory();
        }
        if (document.getElementById("notificationsContainer") && document.getElementById("notificationsContainer").style.display !== "none") {
          this.loadNotifications();
        }
      } catch (err) {
        Toast.show("Error: " + err.message, "danger");
      }
    }
  },

  async principalActionFromModal(requestId, isApproved) {
    if (!requestId) return;
    const commentEl = document.getElementById("detPrinReviewCommentInput");
    const rejGroup = document.getElementById("detPrinRejectionReasonGroup");
    const rejInput = document.getElementById("detPrinRejectionReasonInput");

    if (!isApproved) {
      if (rejGroup && rejGroup.style.display === "none") {
        rejGroup.style.display = "block";
        if (rejInput) rejInput.focus();
        Toast.show("Please enter the mandatory rejection reason, then click 'Decline Request' to confirm.", "warning");
        return;
      }
      const reason = rejInput ? rejInput.value.trim() : "";
      if (!reason) {
        if (rejInput) rejInput.focus();
        Toast.show("Rejection reason is strictly mandatory. Please specify why the request is rejected.", "warning");
        return;
      }
      const confirmed = window.confirm("Are you sure you want to decline/reject this Bonafide Certificate request? The student will be notified.");
      if (!confirmed) return;

      try {
        const res = await Auth.fetchWithAuth(`/api/od/${encodeURIComponent(requestId)}/principal-action`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ approved: false, reason: reason })
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `Failed to decline request (HTTP ${res.status})`);
        }
        const updated = await res.json();
        Toast.show("Bonafide Certificate rejected by Principal.", "info");
        this.renderRequestDetailsModal(updated);
        this.refreshNotifications();
        if (window.PrincipalPortal && typeof PrincipalPortal.loadDashboardData === "function") {
          PrincipalPortal.loadDashboardData();
        }
        if (window.StudentPortal && typeof StudentPortal.renderTrackingPage === "function") {
          StudentPortal.renderTrackingPage();
        }
        if (document.getElementById("historyContainer") && document.getElementById("historyContainer").style.display !== "none") {
          this.loadOfficialHistory();
        }
        if (document.getElementById("notificationsContainer") && document.getElementById("notificationsContainer").style.display !== "none") {
          this.loadNotifications();
        }
      } catch (err) {
        Toast.show("Error: " + err.message, "danger");
      }
    } else {
      const comment = commentEl ? commentEl.value.trim() : "";
      const confirmed = window.confirm("Are you sure you want to grant final institutional sanction and issue this Bonafide Certificate? Your authorized digital signature will be applied.");
      if (!confirmed) return;

      try {
        const res = await Auth.fetchWithAuth(`/api/od/${encodeURIComponent(requestId)}/principal-action`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ approved: true, reason: comment || "Institutional sanction granted. Certificate issued." })
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `Failed to approve request (HTTP ${res.status})`);
        }
        const updated = await res.json();
        Toast.show("Bonafide Certificate officially sanctioned and issued! Student may now download the certificate.", "success");
        this.renderRequestDetailsModal(updated);
        this.refreshNotifications();
        if (window.PrincipalPortal && typeof PrincipalPortal.loadDashboardData === "function") {
          PrincipalPortal.loadDashboardData();
        }
        if (window.StudentPortal && typeof StudentPortal.renderTrackingPage === "function") {
          StudentPortal.renderTrackingPage();
        }
        if (document.getElementById("historyContainer") && document.getElementById("historyContainer").style.display !== "none") {
          this.loadOfficialHistory();
        }
        if (document.getElementById("notificationsContainer") && document.getElementById("notificationsContainer").style.display !== "none") {
          this.loadNotifications();
        }
      } catch (err) {
        Toast.show("Error: " + err.message, "danger");
      }
    }
  },

  buildTimelineHtml(r, isBonafide) {
    const adv = r.advisorDecision || {};
    const hod = r.hodDecision || {};
    const prin = r.principalDecision || {};

    const isApproved = r.status === "APPROVED";
    const isRejected = r.status === "REJECTED";

    let html = '';

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

      const advIcon = advApproved ? "✓" : (advRejected ? "✕" : "2");
      const hodIcon = hodApproved ? "✓" : (hodRejected ? "✕" : "3");
      const prinIcon = prinApproved ? "✓" : (prinRejected ? "✕" : "4");
      const certIcon = isApproved ? "🎓" : "🔒";

      const advText = advApproved
        ? `✅ Recommended by ${this.escape(adv.approver || adv.by || 'Class Advisor')} on ${this.escape(adv.timestamp || '')}<br>${adv.notes ? '<em>"' + this.escape(adv.notes) + '"</em><br>' : ''}<span class="signature-stamp-badge">✍️ Registered Electronic Signature Captured</span>`
        : (advRejected ? `❌ Rejected by Class Advisor<br><strong>Reason:</strong> ${this.escape(r.rejectionReason || adv.reason || '')}` : '⏳ In Queue: Awaiting Class Advisor Review & Endorsement');

      const hodText = hodApproved
        ? `✅ Recommended by Dr. K. Gopinath (HOD) on ${this.escape(hod.timestamp || '')}<br>${hod.notes ? '<em>"' + this.escape(hod.notes) + '"</em><br>' : ''}<span class="signature-stamp-badge">✍️ Registered Electronic Signature Captured</span>`
        : (hodRejected ? `❌ Rejected by Head of Department<br><strong>Reason:</strong> ${this.escape(r.rejectionReason || hod.reason || '')}` : (advApproved ? '⏳ In Queue: Awaiting HOD Endorsement to Principal' : '⏸️ Pending: Awaiting Class Advisor Endorsement'));

      const prinText = prinApproved
        ? `✅ Officially Sanctioned by Principal Dr. B. Sanjay Gandhi on ${this.escape(prin.timestamp || '')}<br>${prin.notes ? '<em>"' + this.escape(prin.notes) + '"</em><br>' : ''}<span class="signature-stamp-badge">✍️ Principal Executive Signature Sealed</span>`
        : (prinRejected ? `❌ Rejected by Principal Dr. B. Sanjay Gandhi<br><strong>Reason:</strong> ${this.escape(r.rejectionReason || prin.reason || '')}` : (hodApproved ? '⏳ In Queue: Awaiting Principal Final Approval & Certificate Issue' : '⏸️ Pending: Awaiting Department Approvals'));

      const certText = isApproved
        ? `<div style="color:#047857; font-weight:700;">🎉 Bonafide Certificate Officially Issued & Digitally Signed!</div><div style="font-size:11.5px; color:#475569; margin-top:2px;">Bearing verified credentials and signatures of Class Advisor, HOD, and Principal.</div>`
        : `<div style="color:#64748b;">🔒 Certificate download will unlock immediately upon Principal executive approval.</div>`;

      html += `
        <div class="workflow-progress-tracker" style="margin-bottom:16px;">
          <div class="workflow-stepper">
            <div class="workflow-step-node completed">
              <div class="workflow-step-circle">✓</div>
              <div class="workflow-step-label">Student<br>Submitted</div>
            </div>
            <div class="workflow-step-line ${advApproved ? 'completed' : (advActive ? 'active' : '')}"></div>
            <div class="workflow-step-node ${advNodeClass}">
              <div class="workflow-step-circle">${advIcon}</div>
              <div class="workflow-step-label">Class Advisor<br>${advApproved ? 'Approved' : (advActive ? 'Reviewing' : 'Pending')}</div>
            </div>
            <div class="workflow-step-line ${hodApproved ? 'completed' : (hodActive ? 'active' : '')}"></div>
            <div class="workflow-step-node ${hodNodeClass}">
              <div class="workflow-step-circle">${hodIcon}</div>
              <div class="workflow-step-label">HOD<br>${hodApproved ? 'Approved' : (hodActive ? 'Reviewing' : 'Pending')}</div>
            </div>
            <div class="workflow-step-line ${prinApproved ? 'completed' : (prinActive ? 'active' : '')}"></div>
            <div class="workflow-step-node ${prinNodeClass}">
              <div class="workflow-step-circle">${prinIcon}</div>
              <div class="workflow-step-label">Principal<br>${prinApproved ? 'Sanctioned' : (prinActive ? 'Sanctioning' : 'Pending')}</div>
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
              <div style="font-weight:700; color:var(--primary);">Stage 1: Class Advisor Verification (${this.escape(r.section || 'CSE')})</div>
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
              <div style="font-weight:700; color:var(--primary);">Stage 3: Principal Executive Sanction (Dr. B. Sanjay Gandhi)</div>
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
      const advApproved = adv.status === "APPROVED" || r.status === "PENDING_HOD" || isApproved;
      const advRejected = isRejected && (r.rejectedBy || "").includes("Advisor");
      const advActive = r.status === "PENDING_ADVISOR";

      const hodApproved = isApproved;
      const hodRejected = isRejected && (r.rejectedBy || "").includes("HOD");
      const hodActive = r.status === "PENDING_HOD";

      const advNodeClass = advApproved ? "completed" : (advRejected ? "rejected" : (advActive ? "active" : ""));
      const hodNodeClass = hodApproved ? "completed" : (hodRejected ? "rejected" : (hodActive ? "active" : ""));
      const formNodeClass = isApproved ? "completed" : "";

      const advIcon = advApproved ? "✓" : (advRejected ? "✕" : "2");
      const hodIcon = hodApproved ? "✓" : (hodRejected ? "✕" : "3");
      const formIcon = isApproved ? "📄" : "🔒";

      const advText = advApproved
        ? `✅ Approved & Recommended by ${this.escape(adv.approver || adv.by || 'Class Advisor')} on ${this.escape(adv.timestamp || '')}<br>${adv.notes ? '<em>"' + this.escape(adv.notes) + '"</em><br>' : ''}<span class="signature-stamp-badge">✍️ Registered Electronic Signature Captured</span>`
        : (advRejected ? `❌ Rejected by Class Advisor<br><strong>Reason:</strong> ${this.escape(r.rejectionReason || adv.reason || '')}` : '⏳ In Queue: Awaiting Class Advisor Review & Endorsement');

      const hodText = hodApproved
        ? `✅ Final Approval & Sanction Granted by Dr. K. Gopinath (HOD-CSE) on ${this.escape(hod.timestamp || '')}<br>${hod.notes ? '<em>"' + this.escape(hod.notes) + '"</em><br>' : ''}<span class="signature-stamp-badge">✍️ Registered Electronic Signature Captured</span>`
        : (hodRejected ? `❌ Rejected by Head of Department<br><strong>Reason:</strong> ${this.escape(r.rejectionReason || hod.reason || '')}` : (advApproved ? '⏳ In Queue: Awaiting HOD Final Approval' : '⏸️ Pending: Awaiting Class Advisor Review'));

      const formText = isApproved
        ? `<div style="color:#047857; font-weight:700;">🎉 Official Sanction Form Approved & Ready for Download!</div><div style="font-size:11.5px; color:#475569; margin-top:2px;">Duly authorized with the registered electronic signatures of the Class Advisor and HOD. (Principal not required for OD/Leave).</div>`
        : `<div style="color:#64748b;">🔒 Form download will unlock immediately upon HOD final approval.</div>`;

      html += `
        <div class="workflow-progress-tracker" style="margin-bottom:16px;">
          <div class="workflow-stepper">
            <div class="workflow-step-node completed">
              <div class="workflow-step-circle">✓</div>
              <div class="workflow-step-label">Student<br>Submitted</div>
            </div>
            <div class="workflow-step-line ${advApproved ? 'completed' : (advActive ? 'active' : '')}"></div>
            <div class="workflow-step-node ${advNodeClass}">
              <div class="workflow-step-circle">${advIcon}</div>
              <div class="workflow-step-label">Class Advisor<br>${advApproved ? 'Approved' : (advActive ? 'Reviewing' : 'Pending')}</div>
            </div>
            <div class="workflow-step-line ${hodApproved ? 'completed' : (hodActive ? 'active' : '')}"></div>
            <div class="workflow-step-node ${hodNodeClass}">
              <div class="workflow-step-circle">${hodIcon}</div>
              <div class="workflow-step-label">HOD Final<br>${hodApproved ? 'Sanctioned' : (hodActive ? 'Reviewing' : 'Pending')}</div>
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
              <div style="font-weight:700; color:var(--primary);">Stage 1: Class Advisor Review (${this.escape(r.section || 'CSE')})</div>
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

    if (r.workflowTimeline && r.workflowTimeline.length > 0) {
      let eventsHtml = `
        <div style="margin-top:16px; border-top:1.5px dashed var(--border); padding-top:14px;">
          <h4 style="font-size:13px; font-weight:700; color:var(--primary); margin:0 0 10px 0; display:flex; align-items:center; gap:6px;">
            <span>📜</span> Recorded Chronological Audit Trail
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
      html += eventsHtml;
    }

    return html;
  },

  buildDigitalSignaturesHtml(r, isBonafide) {
    const adv = r.advisorDecision || {};
    const hod = r.hodDecision || {};
    const prin = r.principalDecision || {};

    const renderCard = (title, decision, defaultSigner, roleTitle, isRejectedAtThisStage) => {
      const isApproved = decision && decision.status === "APPROVED";
      const isRejected = (decision && decision.status === "REJECTED") || isRejectedAtThisStage;
      const signerName = (decision && decision.signerName) || (decision && decision.approver) || defaultSigner;
      const timestamp = (decision && decision.timestamp) || "";
      const sigBase64 = decision && decision.signatureBase64;

      if (isApproved) {
        return `
          <div style="background:#f8fafc; border:1.5px solid #86efac; border-radius:8px; padding:12px; text-align:center; box-shadow:0 1px 3px rgba(0,0,0,0.04);">
            <div style="font-weight:700; color:#0f2942; font-size:12px; margin-bottom:6px; border-bottom:1px solid #e2e8f0; padding-bottom:4px;">
              ${this.escape(title)}
            </div>
            <div style="height:54px; display:flex; align-items:center; justify-content:center; background:#ffffff; border:1px solid #cbd5e1; border-radius:6px; margin:6px 0; padding:2px;">
              ${sigBase64 ? `<img src="${sigBase64}" alt="Digital Signature" style="max-height:48px; max-width:180px; object-fit:contain;">` : `<span style="font-family:cursive; font-size:16px; color:#0f2942;">${this.escape(signerName)}</span>`}
            </div>
            <div style="font-weight:700; color:#1e293b; font-size:12px; margin-top:4px;">
              ${this.escape(signerName)}
            </div>
            <div style="font-size:10.5px; color:#64748b;">
              ${this.escape(roleTitle)}
            </div>
            <div style="margin-top:5px; display:flex; justify-content:center; align-items:center; gap:4px; flex-wrap:wrap;">
              <span class="badge-tag badge-approved" style="font-size:9.5px; padding:2px 6px;">✓ Digitally Signed</span>
              <span style="font-size:10px; color:#64748b; font-family:monospace;">${this.escape(timestamp)}</span>
            </div>
          </div>
        `;
      } else if (isRejected) {
        return `
          <div style="background:#fef2f2; border:1.5px dashed #f87171; border-radius:8px; padding:12px; text-align:center;">
            <div style="font-weight:700; color:#991b1b; font-size:12px; margin-bottom:6px; border-bottom:1px solid #fecaca; padding-bottom:4px;">
              ${this.escape(title)}
            </div>
            <div style="height:54px; display:flex; align-items:center; justify-content:center; color:#dc2626; font-size:11.5px; font-weight:700;">
              ❌ Rejected / Not Signed
            </div>
            <div style="font-size:11px; color:#dc2626; margin-top:4px;">
              ${this.escape((decision && decision.reason) || r.rejectionReason || "Application declined")}
            </div>
            <div style="margin-top:6px;">
              <span class="badge-tag badge-rejected" style="font-size:9.5px;">No Signature Attached</span>
            </div>
          </div>
        `;
      } else {
        return `
          <div style="background:#f8fafc; border:1.5px dashed #cbd5e1; border-radius:8px; padding:12px; text-align:center;">
            <div style="font-weight:700; color:#64748b; font-size:12px; margin-bottom:6px; border-bottom:1px solid #e2e8f0; padding-bottom:4px;">
              ${this.escape(title)}
            </div>
            <div style="height:54px; display:flex; align-items:center; justify-content:center; color:#94a3b8; font-size:11.5px; font-style:italic;">
              ⏳ Awaiting Approval
            </div>
            <div style="font-size:11px; color:#64748b; margin-top:4px;">
              ${this.escape(defaultSigner)}
            </div>
            <div style="margin-top:6px;">
              <span class="badge-tag badge-secondary" style="font-size:9.5px;">Pending Sanction</span>
            </div>
          </div>
        `;
      }
    };

    const advSection = r.section || 'CSE-A';
    const advDefault = advSection === 'CSE-B' ? 'Dr. Divyabharathi' : (advSection === 'CSE-C' ? 'Mrs. Rajavathi Jayapriya' : 'Mrs. P. Arularasi');

    let html = renderCard(
      `Class Advisor (${advSection})`,
      adv,
      advDefault,
      `Class Advisor (${advSection})`,
      r.status === "REJECTED" && (r.rejectedBy || "").includes("Advisor")
    );

    html += renderCard(
      "Head of Department (CSE)",
      hod,
      "Dr. K. Gopinath",
      "HOD • Computer Science & Engg",
      r.status === "REJECTED" && (r.rejectedBy || "").includes("HOD")
    );

    if (isBonafide) {
      html += renderCard(
        "Principal",
        prin,
        "Dr. B. Sanjay Gandhi",
        "Principal • Gnanamani College of Technology",
        r.status === "REJECTED" && (r.rejectedBy || "").includes("Principal")
      );
    }

    return html;
  },

  async loadNotifications() {
    const list = document.getElementById("notificationsList");
    if (!list) return;

    try {
      const res = await Auth.fetchWithAuth("/api/notifications");
      if (res.ok) {
        const notifs = await res.json();
        if (notifs.length === 0) {
          list.innerHTML = '<div style="padding:32px; text-align:center; color:#64748b; font-size:14px;">📭 No notifications in your institutional inbox.</div>';
          return;
        }

        const unreadCount = notifs.filter(x => !x.read).length;

        const headerHtml = `
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; padding:8px 12px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:6px;">
            <div style="font-size:12.5px; color:#475569;">
              <strong>Institutional Notifications:</strong> ${notifs.length} Total ${unreadCount > 0 ? `• <span style="color:#0284c7; font-weight:700;">${unreadCount} Unread</span>` : '• All read'}
            </div>
            ${unreadCount > 0 ? `
              <button class="btn btn-sm btn-secondary" onclick="App.markAllNotificationsRead()" style="padding:4px 10px; font-size:11px; display:inline-flex; align-items:center; gap:4px;">
                ✓ Mark All Read
              </button>
            ` : ''}
          </div>
        `;

        const cardsHtml = notifs.map(n => {
          const isRejection = n.type && n.type.includes("REJECT");
          
          // Safe date formatting without crashing on pre-formatted strings
          let dateStr = n.createdAt || "";
          if (dateStr && !isNaN(Date.parse(dateStr)) && !dateStr.includes(",")) {
            try {
              dateStr = new Date(dateStr).toLocaleString();
            } catch (e) {}
          }

          const readBtn = !n.read
            ? `<button class="btn btn-sm btn-secondary" onclick="App.markNotifRead('${n.id}')" style="padding:4px 9px; font-size:11px;">Mark Read</button>`
            : '<span style="font-size:11px; color:#94a3b8;">✓ Read</span>';

          // Determine reference ID
          let refId = n.referenceId || n.refId || null;
          if (!refId && n.message) {
            const m = n.message.match(/EPOCH-(?:OD|LV|BNF|CMP)-[A-Za-z0-9-]+/) || n.message.match(/RCPT-[A-Za-z0-9-]+/);
            if (m) refId = m[0];
          }

          // Category classification
          const category = n.category || (
            (n.type && n.type.includes("COMPLAINT")) || (refId && refId.includes("-CMP-")) ? "Student Complaint" :
            (n.type && (n.type.includes("APPROVED") || n.type.includes("REJECTED"))) ? "Official Decision" :
            (n.type && (n.type.includes("REQUEST") || n.type.includes("OD_") || n.type.includes("LEAVE") || n.type.includes("BONAFIDE"))) ? "Academic Request" :
            (n.type && (n.type.includes("FEE") || n.type.includes("PAYMENT") || n.type.includes("RECEIPT"))) ? "Fee Operations" :
            (n.type && (n.type.includes("ANNOUNCEMENT") || n.type.includes("NOTICE"))) ? "Institutional Notice" :
            (n.type && (n.type.includes("CHAT") || n.type.includes("MESSAGE"))) ? "Direct Message" : "Institutional Update"
          );

          // Working View Details action button
          let viewActionBtn = '';
          const isComplaint = (n.type && n.type.includes("COMPLAINT")) || (refId && (refId.startsWith("EPOCH-CMP-") || refId.startsWith("CMP-")));
          const isReceipt = (refId && refId.startsWith("RCPT-")) || (n.type && (n.type === "FEE_RECEIPT" || n.type.includes("RECEIPT")));
          const isFee = !isReceipt && ((refId && (refId.startsWith("FEE-") || refId.startsWith("PAY-"))) || (n.type && (n.type.includes("FEE") || n.type.includes("PAYMENT"))));
          const isNotice = n.type === "CLASS_ANNOUNCEMENT" || n.type === "ANNOUNCEMENT" || (n.type && n.type.includes("NOTICE")) || (refId && refId.startsWith("ANN-"));
          const isChat = (n.type && (n.type.includes("CHAT") || n.type.includes("MESSAGE"))) || (refId && (refId.startsWith("CONV-") || refId.startsWith("REQ-")));

          if (isComplaint && refId) {
            viewActionBtn = `
              <button class="btn btn-sm btn-primary" onclick="App.viewComplaintDetails('${refId}', '${n.id}')" title="View Confidential Grievance Details" style="display:inline-flex; align-items:center; gap:4px; padding:4px 10px; font-size:11px; background:#b91c1c; border-color:#b91c1c; color:#fff;">
                🚨 View Complaint
              </button>
            `;
          } else if (isReceipt && refId) {
            viewActionBtn = `
              <button class="btn btn-sm btn-secondary" onclick="App.downloadFeeReceipt('${refId}', '${n.id}')" title="Download Verified Official Receipt" style="display:inline-flex; align-items:center; gap:4px; padding:4px 10px; font-size:11px;">
                📄 View Receipt
              </button>
            `;
          } else if (isFee) {
            viewActionBtn = `
              <button class="btn btn-sm btn-secondary" onclick="App.switchTab('fees'); App.markNotifRead('${n.id}');" title="Review Institutional Fee Account" style="display:inline-flex; align-items:center; gap:4px; padding:4px 10px; font-size:11px;">
                💳 View Fees
              </button>
            `;
          } else if (isNotice) {
            viewActionBtn = `
              <button class="btn btn-sm btn-primary" onclick="App.switchTab('announcements'); App.markNotifRead('${n.id}');" title="View Announcement on Board" style="display:inline-flex; align-items:center; gap:4px; padding:4px 10px; font-size:11px;">
                📢 View Notice
              </button>
            `;
          } else if (isChat) {
            viewActionBtn = `
              <button class="btn btn-sm btn-primary" onclick="App.switchTab('chat'); App.markNotifRead('${n.id}');" title="Open Chat Conversation" style="display:inline-flex; align-items:center; gap:4px; padding:4px 10px; font-size:11px;">
                💬 Open Chat
              </button>
            `;
          } else if (refId) {
            viewActionBtn = `
              <button class="btn btn-sm btn-primary" onclick="App.viewRequestDetails('${refId}', '${n.id}')" title="View Request Details & Timeline" style="display:inline-flex; align-items:center; gap:4px; padding:4px 10px; font-size:11px;">
                🔍 View Request
              </button>
            `;
          }

          let rejectionDetails = '';
          if (n.rejectionReason) {
            rejectionDetails = `
              <div style="background:#fef2f2; border:1px solid #fecaca; border-radius:6px; padding:10px 14px; margin-top:8px; font-size:12px; color:#991b1b;">
                <div><strong>Rejection Reason:</strong> ${this.escape(n.rejectionReason)}</div>
                ${n.staffRole ? '<div><strong>Staff Authority:</strong> ' + this.escape(n.staffRole) + '</div>' : ''}
                ${refId ? '<div><strong>Application Ref:</strong> ' + this.escape(refId) + '</div>' : ''}
              </div>
            `;
          }

          const senderBadge = (n.senderName || n.senderRole) ? `
            <div style="font-size:11.5px; color:#475569; margin-top:4px; display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
              <span>👤</span> <strong>${this.escape(n.senderName || 'Authorized Staff')}</strong>
              ${n.senderRole ? `<span class="badge-tag badge-secondary" style="font-size:10px; padding:1px 6px;">${this.escape(n.senderRole)}</span>` : ''}
            </div>
          ` : '';

          const catBadgeClass =
            category === 'Student Complaint' ? 'badge-danger' :
            category === 'Official Decision' ? (isRejection ? 'badge-rejected' : 'badge-teal') :
            category === 'Academic Request' ? 'badge-primary' :
            category === 'Fee Operations' ? 'badge-info' :
            category === 'Institutional Notice' ? 'badge-warning' : 'badge-secondary';

          return `
            <div class="card" style="margin-bottom:12px; border-left:4px solid ${isRejection ? 'var(--danger)' : (!n.read ? 'var(--accent-teal)' : '#cbd5e1')}; background:${!n.read ? '#ffffff' : '#fcfcfd'};">
              <div class="card-body" style="display:flex; justify-content:space-between; align-items:flex-start; gap:16px; flex-wrap:wrap;">
                <div style="flex:1; min-width:260px;">
                  <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
                    <span class="badge-tag ${catBadgeClass}" style="font-weight:700;">${this.escape(category)}</span>
                    ${refId ? `<span class="ref-badge" style="font-size:11px; font-family:monospace; font-weight:600; background:#e2e8f0; color:#1e293b; padding:2px 6px; border-radius:4px;">${this.escape(refId)}</span>` : ''}
                    ${!n.read ? '<span class="badge-tag badge-teal" style="font-size:10px; padding:1px 6px;">● UNREAD</span>' : ''}
                    <span style="font-size:11px; color:#64748b; margin-left:auto;">🕒 ${this.escape(dateStr)}</span>
                  </div>
                  <div style="font-size:14px; font-weight:700; color:#0f172a; margin-top:6px;">${this.escape(n.title || category)}</div>
                  <div style="font-size:13px; color:#334155; margin-top:2px; font-weight:400; line-height:1.45;">${this.escape(n.message)}</div>
                  ${senderBadge}
                  ${rejectionDetails}
                </div>
                <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
                  ${viewActionBtn}
                  ${readBtn}
                </div>
              </div>
            </div>
          `;
        }).join("");

        list.innerHTML = headerHtml + cardsHtml;
      }
    } catch (e) {
      list.innerHTML = '<div class="alert alert-danger">Failed to load notifications.</div>';
    }
  },

  async markNotifRead(id) {
    try {
      await Auth.fetchWithAuth(`/api/notifications/${id}/read`, { method: "POST" });
      await this.loadNotifications();
      this.refreshNotifications();
    } catch (e) {
      console.error(e);
    }
  },

  async loadOfficialHistory() {
    const tbody = document.getElementById("historyTableTbody");
    if (!tbody) return;
    const user = Auth.getUser();
    if (!user) return;

    try {
      let endpoint = "/api/od/student";
      if (user.role === "ADVISOR") endpoint = "/api/od/advisor";
      else if (user.role === "HOD") endpoint = "/api/od/hod";
      else if (user.role === "PRINCIPAL") endpoint = "/api/od/principal";

      const res = await Auth.fetchWithAuth(endpoint);
      if (res.ok) {
        const records = await res.json();
        if (records.length === 0) {
          tbody.innerHTML = '<tr><td colspan="7" class="text-center" style="padding:32px; color:#64748b; font-size:14px;">📭 No archived decision history found in Firestore records.</td></tr>';
          return;
        }

        tbody.innerHTML = records.map(r => {
          const isBonafide = (r.odType && r.odType.toLowerCase().includes("bonafide")) || (r.id && r.id.startsWith("EPOCH-BNF"));
          const isApproved = r.status === 'APPROVED';

          let actionsHtml = `
            <div style="display:flex; gap:6px; flex-wrap:wrap; align-items:center;">
              <button class="btn btn-sm btn-secondary" onclick="App.viewRequestDetails('${r.id}')" title="View Request Details & Timeline" style="display:inline-flex; align-items:center; gap:4px; padding:4px 9px; font-size:11px;">
                🔍 View Request
              </button>
          `;
          if (isApproved) {
            const dlLabel = isBonafide ? "📜 Certificate" : "📥 Download Form";
            const dlClass = isBonafide ? "btn-primary" : "btn-success";
            actionsHtml += `
              <button class="btn btn-sm ${dlClass}" onclick="App.downloadPdf('${r.id}')" title="Download Official Signed PDF" style="padding:4px 8px; font-size:11px;">
                ${dlLabel}
              </button>
            `;
          }
          actionsHtml += `</div>`;

          return `
            <tr>
              <td><span class="ref-badge">${r.id}</span></td>
              <td>
                <strong style="color:var(--primary); font-size:13px;">${this.escape(r.studentName || r.regNo)}</strong>
                <div style="font-size:11px; color:#64748b; font-family:monospace; margin-top:2px;">${this.escape(r.regNo || '')} (${this.escape(r.section || "CSE")})</div>
              </td>
              <td><span class="badge-tag ${isBonafide ? 'badge-teal' : 'badge-primary'}">${this.escape(r.odType)}</span></td>
              <td>${this.escape(r.fromDate || r.startDate || "")} ${r.toDate && r.toDate !== r.fromDate ? ' to ' + this.escape(r.toDate) : ''}</td>
              <td><span class="badge-tag ${r.status === 'APPROVED' ? 'badge-approved' : (r.status === 'REJECTED' ? 'badge-rejected' : 'badge-warning')}">${r.status}</span></td>
              <td style="font-size:12px; color:#64748b;">
                ${r.rejectionReason ? '<span style="color:var(--danger); font-weight:600;">Rejected: ' + this.escape(r.rejectionReason) + '</span>' : 'Verified Decision Record'}
              </td>
              <td>${actionsHtml}</td>
            </tr>
          `;
        }).join("");
        return;
      }
    } catch (e) {
      console.warn("Backend history fetch failed, checking local store:", e);
    }

    if (window.DemoStore) {
      const records = DemoStore.getHistoryForUser(user);
      if (records.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center" style="padding:32px; color:#64748b; font-size:14px;">📭 No archived decision history found for your account.</td></tr>';
        return;
      }

      tbody.innerHTML = records.map(r => {
        const isBonafide = (r.odType && r.odType.toLowerCase().includes("bonafide")) || (r.id && r.id.startsWith("EPOCH-BNF"));
        const isApproved = r.status === 'APPROVED';

        let actionsHtml = `
          <div style="display:flex; gap:6px; flex-wrap:wrap; align-items:center;">
            <button class="btn btn-sm btn-secondary" onclick="App.viewRequestDetails('${r.id}')" title="View Request Details & Timeline" style="display:inline-flex; align-items:center; gap:4px; padding:4px 9px; font-size:11px;">
              🔍 View Request
            </button>
        `;
        if (isApproved) {
          const dlLabel = isBonafide ? "📜 Certificate" : "📥 Download Form";
          const dlClass = isBonafide ? "btn-primary" : "btn-success";
          actionsHtml += `
            <button class="btn btn-sm ${dlClass}" onclick="App.downloadPdf('${r.id}')" title="Download Official Signed PDF" style="padding:4px 8px; font-size:11px;">
              ${dlLabel}
            </button>
          `;
        }
        actionsHtml += `</div>`;

        return `
          <tr>
            <td><span class="ref-badge">${r.id}</span></td>
            <td>
              <strong style="color:var(--primary); font-size:13px;">${this.escape(r.studentName || r.regNo)}</strong>
              <div style="font-size:11px; color:#64748b; font-family:monospace; margin-top:2px;">${this.escape(r.regNo || '')} (${this.escape(r.section || "CSE")})</div>
            </td>
            <td><span class="badge-tag ${isBonafide ? 'badge-teal' : 'badge-primary'}">${this.escape(r.odType)}</span></td>
            <td>${this.escape(r.fromDate || r.startDate || "")} ${r.toDate && r.toDate !== r.fromDate ? ' to ' + this.escape(r.toDate) : ''}</td>
            <td><span class="badge-tag ${r.status === 'APPROVED' ? 'badge-approved' : (r.status === 'REJECTED' ? 'badge-rejected' : 'badge-warning')}">${r.status}</span></td>
            <td style="font-size:12px; color:#64748b;">
              ${r.rejectionReason ? '<span style="color:var(--danger); font-weight:600;">Rejected: ' + this.escape(r.rejectionReason) + '</span>' : 'Verified Decision Record'}
            </td>
            <td>${actionsHtml}</td>
          </tr>
        `;
      }).join("");
    } else {
      tbody.innerHTML = '<tr><td colspan="7" class="text-center" style="color:var(--danger); padding:20px;">Failed to load official history.</td></tr>';
    }
  },

  resetDemo() {
    if (confirm("Reset local demo data to initial defaults? All temporary edits and custom profile names will be reset.")) {
      if (window.RealtimeSync) RealtimeSync.stop();
      DemoStore.resetDemoData();
      Auth.clearSession();
      Toast.show("Demo state reset to initial defaults.", "info");
      setTimeout(() => {
        window.location.reload();
      }, 500);
    }
  }
};

// =========================================================================
// Real-Time Background Synchronization Engine
// Automatically polls /api/realtime/sync-state and synchronizes changes
// =========================================================================
window.RealtimeSync = {
  timer: null,
  isSyncing: false,
  pollIntervalMs: 4000,
  lastState: null,

  start() {
    this.stop();
    this.poll();
    this.timer = setInterval(() => this.poll(), this.pollIntervalMs);
  },

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.lastState = null;
    this.isSyncing = false;
  },

  async poll() {
    if (this.isSyncing) return;
    const user = Auth.getUser();
    if (!user || !Auth.isAuthenticated()) {
      this.stop();
      return;
    }

    this.isSyncing = true;
    try {
      const res = await Auth.fetchWithAuth("/api/realtime/sync-state");
      if (!res.ok) return;
      const state = await res.json();
      this.handleStateDiff(state, user);
      this.lastState = state;
    } catch (e) {
      // Background network safeguard
    } finally {
      this.isSyncing = false;
    }
  },

  handleStateDiff(current, user) {
    if (!this.lastState) return; // Baseline snapshot established
    const prev = this.lastState;

    // 1. Unread notifications
    if (current.unreadNotificationsCount !== prev.unreadNotificationsCount) {
      if (window.App && App.refreshNotifications) {
        App.refreshNotifications();
      }
    }

    // 2. Academic requests updates (OD, Leave, Bonafide)
    if (current.pendingRequestsCount !== prev.pendingRequestsCount ||
        current.latestRequestTimestamp !== prev.latestRequestTimestamp) {
      if (user.role === "STUDENT" && window.StudentPortal && StudentPortal.loadData) {
        StudentPortal.loadData().then(() => {
          if (StudentPortal.renderLeaves) StudentPortal.renderLeaves();
          if (StudentPortal.renderBonafides) StudentPortal.renderBonafides();
          if (StudentPortal.renderTrackingPage) StudentPortal.renderTrackingPage();
        });
      } else if (user.role === "ADVISOR" && window.AdvisorPortal && AdvisorPortal.loadRequests) {
        AdvisorPortal.loadRequests();
      } else if (user.role === "HOD" && window.HodPortal && HodPortal.loadRequests) {
        HodPortal.loadRequests();
      } else if (user.role === "PRINCIPAL" && window.PrincipalPortal && PrincipalPortal.loadOdRequests) {
        PrincipalPortal.loadOdRequests();
      }
    }

    // 3. Institutional Announcements
    if (current.latestAnnouncementId && current.latestAnnouncementId !== prev.latestAnnouncementId) {
      if (window.AnnouncementApp && AnnouncementApp.loadAnnouncements) {
        AnnouncementApp.loadAnnouncements();
      }
      Toast.show("📢 New institutional announcement posted!", "info");
    }

    // 4. Chat Messages & Direct Requests
    if (current.unreadChatMessagesCount !== prev.unreadChatMessagesCount ||
        current.pendingChatRequestsCount !== prev.pendingChatRequestsCount) {
      if (window.ChatApp && ChatApp.refreshChatBadge) {
        ChatApp.refreshChatBadge();
      }
      if (window.App && App.refreshNotifications) {
        App.refreshNotifications();
      }
    }
  }
};

window.App = App;
window.ProfileManager = ProfileManager;
window.FeeApp = {
  downloadReceiptPdf: (id) => App.downloadFeeReceipt(id)
};

// Bootstrap application on DOM ready
document.addEventListener("DOMContentLoaded", () => {
  App.init();
});
