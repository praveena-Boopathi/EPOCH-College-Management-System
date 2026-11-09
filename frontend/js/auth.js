/**
 * EPOCH Authentication & Session Management
 */
const Auth = {
  TOKEN_KEY: "epoch_auth_token",
  USER_KEY: "epoch_user_profile",
  API_BASE_KEY: "epoch_api_base",

  /**
   * Resolve the configured backend base URL.
   * Priority:
   *  1. window.EPOCH_API_BASE (injected by runtime config or index.html)
   *  2. localStorage "epoch_api_base" (dynamic user / admin setting)
   *  3. "" (relative URL, fallback for same-origin / reverse-proxied hosting)
   */
  getApiBase() {
    if (typeof window !== "undefined" && window.EPOCH_API_BASE) {
      return String(window.EPOCH_API_BASE).replace(/\/+$/, "");
    }
    if (typeof window !== "undefined" && window.EPOCH_CONFIG && window.EPOCH_CONFIG.BACKEND_URL) {
      return String(window.EPOCH_CONFIG.BACKEND_URL).replace(/\/+$/, "");
    }
    try {
      const stored = localStorage.getItem(this.API_BASE_KEY);
      if (stored && stored.trim()) return stored.trim().replace(/\/+$/, "");
    } catch (e) {}

    // Production domain fallback (e.g. Vercel deployment)
    if (typeof window !== "undefined" && window.location && window.location.hostname) {
      const host = window.location.hostname.toLowerCase();
      if (host !== "localhost" && host !== "127.0.0.1") {
        return "https://epoch-college-management-system-2.onrender.com";
      }
    }
    return "";
  },

  setApiBase(url) {
    try {
      if (url && typeof url === "string" && url.trim()) {
        localStorage.setItem(this.API_BASE_KEY, url.trim().replace(/\/+$/, ""));
      } else {
        localStorage.removeItem(this.API_BASE_KEY);
      }
    } catch (e) {}
  },

  /**
   * Prepend the backend API base URL to a given endpoint path.
   * If the path is already an absolute HTTP/HTTPS URL, returns it unmodified.
   */
  apiUrl(path) {
    if (!path) return "";
    if (path.startsWith("http://") || path.startsWith("https://")) {
      return path;
    }
    const base = this.getApiBase();
    const cleanPath = path.startsWith("/") ? path : "/" + path;
    return base ? base + cleanPath : cleanPath;
  },

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
    let res = null;
    try {
      const loginUrl = this.apiUrl("/api/auth/login");
      res = await fetch(loginUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: cleanId,
          password: cleanPass
        })
      });
    } catch (netErr) {
      console.warn("Network error during login connection:", netErr);
    }

    if (res) {
      if (res.ok) {
        data = await res.json();
      } else {
        const errData = await res.json().catch(() => ({}));
        // If authentication genuinely failed, surface the exact error without fake demo fallback
        throw new Error(errData.error || "Authentication failed. Check your registration number and password.");
      }
    } else {
      throw new Error("Unable to connect to authentication server. Please check your network connection.");
    }

    // Role verification: ensure authenticated role matches the selected portal
    const roleMap = {
      student: "STUDENT",
      advisor: "ADVISOR",
      staff: "STAFF",
      hod: "HOD",
      principal: "PRINCIPAL",
      admin: "ADMIN"
    };
    const expectedRole = roleMap[(role || "").toLowerCase()] || (role || "").toUpperCase();
    const roleMatches = (data.role === expectedRole) ||
      (expectedRole === "STAFF" && (data.role === "ADVISOR" || data.role === "STAFF")) ||
      (expectedRole === "ADVISOR" && (data.role === "ADVISOR" || data.role === "STAFF"));

    if (!roleMatches) {
      throw new Error(`Access denied: This account has role ${data.role}, which is not authorized for the ${role} portal.`);
    }

    // Establish authorized session (never storing passwords)
    this.setSession(data.token, {
      identifier: data.identifier,
      id: data.identifier,
      regNo: data.identifier,
      name: data.name,
      role: data.role,
      section: data.section,
      email: data.email,
      department: data.department,
      academicYear: data.role === "STUDENT" ? (data.academicYear || "IV Year B.E.") : "",
      title: data.title || "",
      contact: data.contact || "",
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
    const fullUrl = this.apiUrl(url);
    const token = this.getToken();
    const headers = Object.assign({}, options.headers || {});
    if (token) {
      headers["Authorization"] = "Bearer " + token;
    }
    const requestOptions = Object.assign({}, options, { headers });

    const res = await fetch(fullUrl, requestOptions);
    if (res.status === 401) {
      console.warn(`[Auth] 401 Unauthorized for ${url}`);
      this.clearSession();
      if (typeof App !== "undefined" && App.checkSession) {
        App.checkSession();
      } else {
        window.location.reload();
      }
      throw new Error("Session expired. Please sign in again.");
    }
    return res;
  },

  /**
   * Safely parse a fetch Response object without crashing on empty bodies,
   * non-JSON payloads, or HTML error pages.
   */
  async parseResponse(res) {
    if (!res) {
      return { ok: false, status: 0, data: null, error: "No response received from server." };
    }

    let rawText = "";
    try {
      rawText = await res.text();
    } catch (readErr) {
      console.error("[Auth.parseResponse] Failed to read response stream:", readErr);
      return {
        ok: false,
        status: res.status || 0,
        data: null,
        error: "Network stream interrupted: " + (readErr.message || "Failed to read server response")
      };
    }

    if (!rawText || !rawText.trim()) {
      if (res.ok) {
        return { ok: true, status: res.status, data: {}, error: null };
      }
      return {
        ok: false,
        status: res.status,
        data: null,
        error: `Server returned HTTP ${res.status} with an empty response.`
      };
    }

    try {
      const data = JSON.parse(rawText);
      if (res.ok) {
        return { ok: true, status: res.status, data: data, error: null };
      }
      const errMsg = (data && (data.error || data.message || data.details)) || `Server returned error (${res.status})`;
      return { ok: false, status: res.status, data: data, error: String(errMsg) };
    } catch (jsonErr) {
      console.warn("[Auth.parseResponse] Non-JSON response received:", rawText.slice(0, 250));
      if (res.ok) {
        return { ok: true, status: res.status, data: rawText, error: null };
      }
      let cleanText = rawText.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
      if (cleanText.length > 250) cleanText = cleanText.substring(0, 250) + "...";
      return {
        ok: false,
        status: res.status,
        data: null,
        error: cleanText || `Server error (${res.status} ${res.statusText || ""})`.trim()
      };
    }
  },

  logout() {
    if (window.RealtimeSync) RealtimeSync.stop();
    if (window.ChatApp && ChatApp.stopPolling) ChatApp.stopPolling();
    this.clearSession();
    window.location.reload();
  }
};

window.Auth = Auth;
