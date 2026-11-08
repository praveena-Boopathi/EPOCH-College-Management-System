/**
 * EPOCH – Centralized System & Backend API Configuration
 * Gnanamani College of Technology (Autonomous)
 *
 * Directs frontend API calls to the deployed Render production backend
 * while preserving localhost compatibility for local development.
 */
(function (global) {
  'use strict';

  var PRODUCTION_BACKEND_URL = 'https://epoch-college-management-system-2.onrender.com';
  var LOCAL_BACKEND_URL = '';

  function resolveBackendBase() {
    // 1. Explicit window override (e.g. injected by test harnesses)
    if (typeof global.EPOCH_API_BASE === 'string' && global.EPOCH_API_BASE.trim()) {
      return global.EPOCH_API_BASE.trim().replace(/\/+$/, '');
    }

    // 2. Local storage override (for dynamic debugging/testing)
    try {
      if (typeof localStorage !== 'undefined') {
        var stored = localStorage.getItem('epoch_api_base');
        if (stored && typeof stored === 'string' && stored.trim()) {
          return stored.trim().replace(/\/+$/, '');
        }
      }
    } catch (e) {}

    // 3. Localhost / Local Development Detection
    var hostname = '';
    try {
      if (global.location && global.location.hostname) {
        hostname = global.location.hostname.toLowerCase();
      }
    } catch (e) {}

    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '') {
      return LOCAL_BACKEND_URL;
    }

    // 4. Default to deployed Render production backend URL
    return PRODUCTION_BACKEND_URL;
  }

  var resolvedUrl = resolveBackendBase();

  global.EPOCH_CONFIG = {
    APP_NAME: 'EPOCH',
    COLLEGE_NAME: 'Gnanamani College of Technology',
    PRODUCTION_BACKEND_URL: PRODUCTION_BACKEND_URL,
    LOCAL_BACKEND_URL: LOCAL_BACKEND_URL,
    BACKEND_URL: resolvedUrl,
    resolveBackendBase: resolveBackendBase
  };

  // Expose to window.EPOCH_API_BASE for Auth.getApiBase() and all modules
  global.EPOCH_API_BASE = resolvedUrl;

})(typeof window !== 'undefined' ? window : this);

