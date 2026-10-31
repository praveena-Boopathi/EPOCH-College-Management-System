/**
 * EPOCH Authentication & Session Management
 */
const Auth = {
  TOKEN_KEY: "epoch_auth_token",
  USER_KEY: "epoch_user_profile",

  getToken() {
    return localStorage.getItem(this.TOKEN_KEY) || sessionStorage.getItem(this.TOKEN_KEY);
  },

  getUser() {
    const raw = localStorage.getItem(this.USER_KEY) || sessionStorage.getItem(this.USER_KEY);
    try {
      const user = raw ? JSON.parse(raw) : null;
      if (!user) return null;
      return user;
    } catch (e) {
      return null;
    }
  },

  setSession(token, user) {
    if (token) localStorage.setItem(this.TOKEN_KEY, token);
    const safeUser = { ...user };
    delete safeUser.password;
    delete safeUser.passwordHash;
    localStorage.setItem(this.USER_KEY, JSON.stringify(safeUser));
  },

  clearSession() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    sessionStorage.removeItem(this.TOKEN_KEY);
    sessionStorage.removeItem(this.USER_KEY);
  },

  isAuthenticated() {
    return !!this.getToken();
  },

  async login(role, identifier, password) {
    const cleanId = (identifier || "").trim();
    const cleanPass = password || "";

    if (!cleanId) {
      throw new Error("Please enter your " + (role === "student" ? "registration number" : "account identifier") + ".");
    }
    if (!cleanPass) {
      throw new Error("Please enter your password.");
    }

    // Connect to Spring Boot REST API (/api/auth/login) backed by Firebase Firestore
    let data = null;
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: cleanId,
          password: cleanPass
        })
      });

      if (res.ok) {
        data = await res.json();
      } else {
        const errData = await res.json().catch(() => ({}));
        if (window.DemoStore && (res.status >= 500 || (errData.error && errData.error.includes("Quota exceeded")))) {
          console.warn("Backend login issue, falling back to DemoStore:", errData.error);
        } else {
          throw new Error(errData.error || "Authentication failed. Check your registration number and password.");
        }
      }
    } catch (netErr) {
      if (!window.DemoStore) throw netErr;
      console.warn("Network error during login, falling back to DemoStore:", netErr);
    }

    if (!data && window.DemoStore) {
      const u = DemoStore.getUserProfile(cleanId);
      if (u) {
        data = {
          token: "demo-jwt-token-" + u.identifier + "-" + Date.now(),
          identifier: u.identifier,
          name: u.name,
          role: u.role,
          section: u.section,
          email: u.email,
          department: u.dept || u.department || "Computer Science & Engineering",
          academicYear: u.academicYear || (u.role === "STUDENT" ? "IV Year B.E." : ""),
          bio: u.bio || ""
        };
      } else {
        throw new Error("Authentication failed. Account not found in institutional directory.");
      }
    }

    // Role verification: ensure authenticated role matches the selected portal
    const roleMap = {
      student: "STUDENT",
      advisor: "ADVISOR",
      hod: "HOD",
      principal: "PRINCIPAL",
      admin: "ADMIN"
    };
    const expectedRole = roleMap[(role || "").toLowerCase()] || (role || "").toUpperCase();
    if (data.role !== expectedRole) {
      throw new Error(`Access denied: This account has role ${data.role}, which is not authorized for the ${role} portal.`);
    }

    // Establish authorized session (never storing passwords)
    this.setSession(data.token, {
      identifier: data.identifier,
      name: data.name,
      role: data.role,
      section: data.section,
      email: data.email,
      department: data.department,
      academicYear: data.academicYear || (data.role === "STUDENT" ? "IV Year B.E." : ""),
      bio: data.bio || "",
      profilePhoto: data.profilePhoto || data.photoUrl || ""
    });

    return data;
  },

  updateProfilePhoto(photoUrl) {
    const user = this.getUser();
    if (user) {
      user.profilePhoto = photoUrl || "";
      user.photoUrl = photoUrl || "";
      const token = this.getToken();
      this.setSession(token, user);
    }
  },

  async fetchWithAuth(url, options = {}) {
    const token = this.getToken();
    const headers = options.headers || {};
    if (token) {
      headers["Authorization"] = "Bearer " + token;
    }
    options.headers = headers;

    const res = await fetch(url, options);
    if (res.status === 401) {
      this.clearSession();
      window.location.reload();
      throw new Error("Session expired. Please sign in again.");
    }
    return res;
  },

  logout() {
    if (window.RealtimeSync) RealtimeSync.stop();
    if (window.ChatApp && ChatApp.stopPolling) ChatApp.stopPolling();
    this.clearSession();
    window.location.reload();
  }
};

window.Auth = Auth;
