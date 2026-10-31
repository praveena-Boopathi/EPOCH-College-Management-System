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

  async viewRequestDetails(requestId) {
    if (!requestId) {
      Toast.show("Invalid request reference.", "warning");
      return;
    }
    if (this.isRequestModalOpening) return;
    this.isRequestModalOpening = true;

    const modal = document.getElementById("odDetailsModal");

    try {
      let req = null;
      try {
        const res = await Auth.fetchWithAuth(`/api/od/${encodeURIComponent(requestId)}`);
        if (res.ok) {
          req = await res.json();
        } else if (res.status === 403) {
          throw new Error("Access Denied: You are not authorized to view this request.");
        } else if (res.status === 404) {
          throw new Error("Referenced request record was not found in institutional archives.");
        } else {
          throw new Error(`Unable to load request (HTTP ${res.status})`);
        }
      } catch (fetchErr) {
        if (!Auth.getToken() && window.DemoStore) {
          req = DemoStore.getOdRequests().find(x => x.id === requestId) ||
                DemoStore.getBonafideRequests().find(x => x.id === requestId) ||
                DemoStore.getLeaveRequests().find(x => x.id === requestId);
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

  closeRequestDetailsModal() {
    const modal = document.getElementById("odDetailsModal");
    if (modal) modal.style.display = "none";
    this.isRequestModalOpening = false;
  },

  async downloadPdf(id) {
    if (!id) return;
    try {
      const token = Auth.getToken();
      const res = await fetch(`/api/od/${encodeURIComponent(id)}/pdf`, {
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
      const res = await fetch(`/api/complaints/${encodeURIComponent(id)}/pdf`, {
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
      const workflowLabel = isBonafide ? "3-Stage Institutional Workflow (Advisor ➔ HOD ➔ Principal)" : "2-Stage Department Workflow (Advisor ➔ HOD Final)";
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

    const actionExtraEl = document.getElementById("detActionExtra");
    if (actionExtraEl) {
      if (r.status === "APPROVED") {
        if (isBonafide) {
          actionExtraEl.innerHTML = `
            <button class="btn btn-primary btn-sm" onclick="App.downloadPdf('${r.id}');" style="display:inline-flex; align-items:center; gap:6px; font-weight:600;">
              📜 Download Approved Request (Bonafide Certificate)
            </button>
          `;
        } else {
          actionExtraEl.innerHTML = `
            <button class="btn btn-success btn-sm" onclick="App.downloadPdf('${r.id}');" style="background:#059669; color:#fff; border:none; padding:6px 14px; border-radius:4px; font-weight:600; display:inline-flex; align-items:center; gap:6px;">
              📥 Download Approved Request
            </button>
          `;
        }
      } else if (r.status === "REJECTED") {
        actionExtraEl.innerHTML = `<span style="font-size:12px; color:var(--danger); font-weight:600;">❌ Request halted / rejected. Download option is unavailable for rejected requests.</span>`;
      } else {
        actionExtraEl.innerHTML = `<span style="font-size:12px; color:#64748b;">⏳ Request is pending approval. Download Approved Request option will unlock upon final sanction.</span>`;
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

        list.innerHTML = notifs.map(n => {
          const isRejection = n.type && n.type.includes("REJECT");
          const dateStr = n.createdAt ? new Date(n.createdAt).toLocaleString() : "";
          const readBtn = !n.read
            ? `<button class="btn btn-sm btn-secondary" onclick="App.markNotifRead('${n.id}')" style="padding:4px 9px; font-size:11px;">Mark Read</button>`
            : '<span style="font-size:11px; color:#94a3b8;">✓ Read</span>';

          const reqId = n.referenceId || n.refId || (n.message && n.message.match(/EPOCH-(?:OD|LV|BNF)-[A-Za-z0-9-]+/) ? n.message.match(/EPOCH-(?:OD|LV|BNF)-[A-Za-z0-9-]+/)[0] : null);

          let viewReqBtn = '';
          if (reqId) {
            viewReqBtn = `
              <button class="btn btn-sm btn-primary" onclick="App.viewRequestDetails('${reqId}')" title="View Request Details & Timeline" style="display:inline-flex; align-items:center; gap:4px; padding:4px 10px; font-size:11px;">
                🔍 View Request
              </button>
            `;
          } else if (n.referenceId && (n.referenceId.startsWith("RCPT-") || n.type === "ADVISOR_RECEIPT_DELIVERY" || n.type === "PAYMENT_CONFIRMED")) {
            viewReqBtn = `
              <button class="btn btn-sm btn-secondary" onclick="FeeApp.downloadReceiptPdf('${n.referenceId}')" title="Download Verified Official Receipt" style="display:inline-flex; align-items:center; gap:4px; padding:4px 10px; font-size:11px;">
                📄 View Receipt
              </button>
            `;
          } else if (n.type === "CLASS_ANNOUNCEMENT" || n.type === "ANNOUNCEMENT") {
            viewReqBtn = `
              <button class="btn btn-sm btn-primary" onclick="App.switchTab('announcements')" title="View Announcement on Board" style="display:inline-flex; align-items:center; gap:4px; padding:4px 10px; font-size:11px;">
                📢 View Notice
              </button>
            `;
          }

          let rejectionDetails = '';
          if (n.rejectionReason) {
            rejectionDetails = `
              <div style="background:#fef2f2; border:1px solid #fecaca; border-radius:6px; padding:10px 14px; margin-top:8px; font-size:12px; color:#991b1b;">
                <div><strong>Rejection Reason:</strong> ${this.escape(n.rejectionReason)}</div>
                ${n.staffRole ? '<div><strong>Staff Authority:</strong> ' + this.escape(n.staffRole) + '</div>' : ''}
                ${reqId ? '<div><strong>Application Ref:</strong> ' + this.escape(reqId) + '</div>' : ''}
              </div>
            `;
          }

          return `
            <div class="card" style="margin-bottom:12px; border-left:4px solid ${isRejection ? 'var(--danger)' : 'var(--accent-teal)'};">
              <div class="card-body" style="display:flex; justify-content:space-between; align-items:flex-start; gap:16px; flex-wrap:wrap;">
                <div style="flex:1; min-width:260px;">
                  <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
                    <span class="badge-tag ${isRejection ? 'badge-rejected' : 'badge-teal'}">${this.escape(n.type || 'NOTIFICATION')}</span>
                    ${reqId ? `<span class="ref-badge" style="font-size:11px;">${this.escape(reqId)}</span>` : ''}
                    <span style="font-size:11px; color:#64748b;">${dateStr}</span>
                  </div>
                  <div style="font-size:14px; color:#1e293b; margin-top:8px; font-weight:500;">${this.escape(n.message)}</div>
                  ${rejectionDetails}
                </div>
                <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
                  ${viewReqBtn}
                  ${readBtn}
                </div>
              </div>
            </div>
          `;
        }).join("");
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

// Bootstrap application on DOM ready
document.addEventListener("DOMContentLoaded", () => {
  App.init();
});
