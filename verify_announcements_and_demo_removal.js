const { spawn } = require('child_process');
const fs = require('fs');

const BASE_URL = 'http://localhost:8080';
let passed = 0;
let total = 0;

function assert(condition, message) {
  total++;
  if (condition) {
    passed++;
    console.log(`  ✅ [PASS] ${message}`);
  } else {
    console.error(`  ❌ [FAIL] ${message}`);
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function login(username, password) {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  if (!res.ok) {
    throw new Error(`Login failed for ${username}: ${res.status} ${await res.text()}`);
  }
  return await res.json();
}

async function run() {
  console.log("================================================================================");
  console.log("   EPOCH - ANNOUNCEMENTS PERMISSIONS & DEMO BANNER REMOVAL VERIFICATION        ");
  console.log("================================================================================");

  try {
    // 1. Static HTML & UI DOM Verification: DEMO MODE Banner Removal
    console.log("\n--- 1. Static DOM & HTML Verification: DEMO MODE Banner Removal ---");
    const indexHtml = fs.readFileSync('src/main/resources/static/index.html', 'utf8');
    assert(!indexHtml.includes('<div class="demo-banner">'), "index.html does NOT contain '<div class=\"demo-banner\">'");
    assert(!indexHtml.includes('Reset Demo Data'), "index.html does NOT contain 'Reset Demo Data' button");
    assert(!indexHtml.includes('Institutional academic workflow simulation active'), "index.html does NOT contain 'Institutional academic workflow simulation active'");
    assert(indexHtml.includes('id="announcementDetailsModal"'), "index.html contains 'announcementDetailsModal' for reading announcement details");

    // 2. Authenticating registered institutional accounts
    console.log("\n--- 2. Authenticating Registered Accounts ---");
    const advA = await login('arularasi', 'advisor@123');
    assert(advA && advA.token && advA.role === 'ADVISOR', "Advisor A (arularasi) authenticated for Section CSE-A");

    const advB = await login('divyabharathi', 'advisor@123');
    assert(advB && advB.token && advB.role === 'ADVISOR', "Advisor B (divyabharathi) authenticated for Section CSE-B");

    const advC = await login('rajavathijayapriya', 'advisor@123');
    assert(advC && advC.token && advC.role === 'ADVISOR', "Advisor C (rajavathijayapriya) authenticated for Section CSE-C");

    const hod = await login('gopinath', 'hod@123');
    assert(hod && hod.token && hod.role === 'HOD', "HOD (gopinath) authenticated");

    const principal = await login('bsanjaygandhi', 'principal@123');
    assert(principal && principal.token && principal.role === 'PRINCIPAL', "Principal (bsanjaygandhi) authenticated");

    const studentA = await login('620823104002', 'student@12');
    assert(studentA && studentA.token && studentA.role === 'STUDENT', "Student A (620823104002) authenticated for Section CSE-A");

    const studentB = await login('620823104066', 'student@12');
    assert(studentB && studentB.token && studentB.role === 'STUDENT', "Student B (620823104066) authenticated for Section CSE-B");

    // 3. Testing Student Permissions (View-only, cannot create, cannot delete)
    console.log("\n--- 3. Testing Student Permissions (Strict View-Only) ---");
    // Direct attempt by student to create announcement
    const studentCreateRes = await fetch(`${BASE_URL}/api/announcements`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${studentA.token}`
      },
      body: JSON.stringify({
        title: "Malicious Student Notice",
        message: "Students trying to create announcement",
        targetSections: ["CSE-A"]
      })
    });
    assert(studentCreateRes.status === 403, "Direct student attempt to publish announcement is rejected (HTTP 403 Forbidden)");

    // Direct attempt by student to delete announcement
    const studentDeleteRes = await fetch(`${BASE_URL}/api/announcements/ann-sample-id`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${studentA.token}` }
    });
    assert(studentDeleteRes.status === 403 || studentDeleteRes.status === 400, "Direct student attempt to delete announcement is rejected (HTTP 403/400)");

    // 4. Authorized Publishers: Class Advisors scoped to assigned section
    console.log("\n--- 4. Authorized Publishers: Advisor Scoping ---");
    // Advisor A publishing to CSE-B (unauthorized)
    const advAWrongSec = await fetch(`${BASE_URL}/api/announcements`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${advA.token}`
      },
      body: JSON.stringify({
        title: "Unauthorized Notice",
        message: "Attempting to post outside assigned section",
        targetSections: ["CSE-B"]
      })
    });
    assert(advAWrongSec.status === 403, "Advisor A blocked from publishing to CSE-B (HTTP 403 Forbidden)");

    // Advisor A publishing to CSE-A (authorized)
    const titleAdvA = `CSE-A Official Circular ${Date.now()}`;
    const advAPubRes = await fetch(`${BASE_URL}/api/announcements`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${advA.token}`
      },
      body: JSON.stringify({
        title: titleAdvA,
        message: "Mandatory lab record submission on Friday.",
        priority: "IMPORTANT",
        targetSections: ["CSE-A"]
      })
    });
    const advAPubData = await advAPubRes.json();
    assert(advAPubRes.status === 200 && advAPubData.id, "Advisor A successfully posted to assigned section CSE-A (HTTP 200 OK)");

    // 5. Authorized Publishers: HOD & Principal
    console.log("\n--- 5. Authorized Publishers: HOD & Principal ---");
    const titleHOD = `HOD Department Circular ${Date.now()}`;
    const hodPubRes = await fetch(`${BASE_URL}/api/announcements`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${hod.token}`
      },
      body: JSON.stringify({
        title: titleHOD,
        message: "Department symposium review meeting at 3:00 PM.",
        priority: "NORMAL",
        targetSections: ["CSE-A", "CSE-B"]
      })
    });
    const hodPubData = await hodPubRes.json();
    assert(hodPubRes.status === 200 && hodPubData.id, "HOD successfully published to multiple sections (CSE-A & CSE-B) (HTTP 200 OK)");

    const titlePrin = `Principal Notice ${Date.now()}`;
    const prinPubRes = await fetch(`${BASE_URL}/api/announcements`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${principal.token}`
      },
      body: JSON.stringify({
        title: titlePrin,
        message: "Institution-wide holiday notice for maintenance.",
        priority: "URGENT",
        targetSections: ["ALL"]
      })
    });
    const prinPubData = await prinPubRes.json();
    assert(prinPubRes.status === 200 && prinPubData.id, "Principal successfully published college-wide notice (ALL) (HTTP 200 OK)");

    // 6. Student View Announcements & Mark as Read
    console.log("\n--- 6. Student View Announcements & Mark as Read ---");
    const studentAListRes = await fetch(`${BASE_URL}/api/announcements`, {
      headers: { 'Authorization': `Bearer ${studentA.token}` }
    });
    const studentAList = await studentAListRes.json();
    const hasAdvNotice = studentAList.some(a => a.id === advAPubData.id);
    const hasHODNotice = studentAList.some(a => a.id === hodPubData.id);
    const hasPrinNotice = studentAList.some(a => a.id === prinPubData.id);
    assert(hasAdvNotice, "Student A can view announcement targeted to CSE-A");
    assert(hasHODNotice, "Student A can view announcement targeted to CSE-A & CSE-B");
    assert(hasPrinNotice, "Student A can view college-wide announcement");

    // Student A marks Advisor notice as read
    const markReadRes = await fetch(`${BASE_URL}/api/announcements/${advAPubData.id}/read`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${studentA.token}` }
    });
    assert(markReadRes.status === 200, "Student A successfully marked announcement as read (HTTP 200 OK)");

    // 7. Headless Browser Verification (CDP Edge)
    console.log("\n--- 7. Headless Browser UI Verification (CDP Edge) ---");
    await runBrowserUiTest(advA.token, studentA.token, advAPubData.id);

    console.log("\n================================================================================");
    console.log(`   SUITE COMPLETE: ${passed} / ${total} TESTS PASSED (${Math.round((passed / total) * 100)}%)   `);
    console.log("================================================================================");

  } catch (err) {
    console.error("Test Suite Fatal Error:", err);
  }
}

async function runBrowserUiTest(advisorToken, studentToken, sampleAnnId) {
  const CDP_PORT = 9345;
  const possiblePaths = [
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    process.env.LOCALAPPDATA + '\\Microsoft\\Edge\\Application\\msedge.exe'
  ];
  let edgePath = 'msedge.exe';
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) { edgePath = p; break; }
  }

  const browserProc = spawn(edgePath, [
    `--remote-debugging-port=${CDP_PORT}`,
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--window-size=1280,800',
    'about:blank'
  ]);

  try {
    await sleep(2500);
    const targetsRes = await fetch(`http://localhost:${CDP_PORT}/json/list`);
    const targets = await targetsRes.json();
    const pageTarget = targets.find(t => t.type === 'page');
    if (!pageTarget) throw new Error("No page target found");

    const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
    let msgId = 1;
    const pendingCallbacks = new Map();

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && pendingCallbacks.has(msg.id)) {
        pendingCallbacks.get(msg.id)(msg);
        pendingCallbacks.delete(msg.id);
      }
    };

    await new Promise(r => ws.onopen = r);

    function cdp(method, params = {}) {
      const id = msgId++;
      return new Promise((resolve) => {
        pendingCallbacks.set(id, resolve);
        ws.send(JSON.stringify({ id, method, params }));
      });
    }

    async function evalScript(expression) {
      const res = await cdp('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
      if (res.result && res.result.result) return res.result.result.value;
      return null;
    }

    await cdp('Page.enable');

    // UI Check 1: DEMO MODE Banner does not appear on login page
    await cdp('Page.navigate', { url: `${BASE_URL}/` });
    await sleep(2500);

    const demoBannerExistsLogin = await evalScript(`!!document.querySelector('.demo-banner')`);
    assert(!demoBannerExistsLogin, "Login Page: '.demo-banner' element does NOT exist in DOM");

    const resetDemoBtnExistsLogin = await evalScript(`
      Array.from(document.querySelectorAll('button')).some(b => (b.textContent || '').includes('Reset Demo Data'))
    `);
    assert(!resetDemoBtnExistsLogin, "Login Page: 'Reset Demo Data' button does NOT exist anywhere in DOM");

    // UI Check 2: Student Login View Verification
    await evalScript(`
      (() => {
        localStorage.setItem('epoch_auth_token', '${studentToken}');
        localStorage.setItem('epoch_user_profile', JSON.stringify({
          identifier: '620823104002',
          name: 'ABINAYA G',
          role: 'STUDENT',
          section: 'CSE-A',
          department: 'CSE'
        }));
      })()
    `);
    await cdp('Page.navigate', { url: `${BASE_URL}/` });
    await sleep(2500);

    const demoBannerExistsStudent = await evalScript(`!!document.querySelector('.demo-banner')`);
    assert(!demoBannerExistsStudent, "Student Portal: '.demo-banner' does NOT exist in DOM");

    const resetDemoBtnStudent = await evalScript(`
      Array.from(document.querySelectorAll('button')).some(b => (b.textContent || '').includes('Reset Demo Data'))
    `);
    assert(!resetDemoBtnStudent, "Student Portal: 'Reset Demo Data' button does NOT exist in DOM");

    // Check Student Dashboard has Announcements card
    const studentDashAnnCard = await evalScript(`!!document.getElementById('studentDashboardAnnouncementsList')`);
    assert(studentDashAnnCard, "Student Dashboard has 'Official Announcements & Section Circulars' live card");

    // Navigate to announcements tab
    await evalScript(`App.switchTab('announcements')`);
    await sleep(600);

    // Verify post button is hidden for student
    const stPostBtnHidden = await evalScript(`
      (() => {
        const btn = document.getElementById('postAnnouncementBtn');
        if (!btn) return true;
        const style = window.getComputedStyle(btn);
        return style.display === 'none' || btn.style.display === 'none';
      })()
    `);
    assert(stPostBtnHidden, "Announcements Board: '+ Post Announcement' button is strictly hidden for Student role");

    // Verify 'View Details' opens announcement details modal
    await evalScript(`
      (async () => {
        if (!AnnouncementApp.announcements || AnnouncementApp.announcements.length === 0) {
          await AnnouncementApp.loadAnnouncements();
        }
        const id = '${sampleAnnId}' || (AnnouncementApp.announcements[0] ? AnnouncementApp.announcements[0].id : null);
        await AnnouncementApp.openDetailsModal(id);
      })()
    `);
    await sleep(500);

    const detailsModalOpen = await evalScript(`
      (() => {
        const m = document.getElementById('announcementDetailsModal');
        return m && m.style.display === 'flex';
      })()
    `);
    assert(detailsModalOpen, "Student can open Announcement Details Modal successfully");

    await evalScript(`AnnouncementApp.closeDetailsModal()`);
    await sleep(300);

    // UI Check 3: Advisor Login View Verification
    await evalScript(`
      (() => {
        localStorage.setItem('epoch_auth_token', '${advisorToken}');
        localStorage.setItem('epoch_user_profile', JSON.stringify({
          identifier: 'arularasi',
          name: 'Mrs. P. Arularasi',
          role: 'ADVISOR',
          section: 'CSE-A',
          department: 'CSE'
        }));
      })()
    `);
    await cdp('Page.navigate', { url: `${BASE_URL}/` });
    await sleep(2500);

    const demoBannerExistsAdvisor = await evalScript(`!!document.querySelector('.demo-banner')`);
    assert(!demoBannerExistsAdvisor, "Advisor Portal: '.demo-banner' does NOT exist in DOM");

    await evalScript(`App.switchTab('announcements')`);
    await sleep(500);

    const advPostBtnVisible = await evalScript(`
      (() => {
        const btn = document.getElementById('postAnnouncementBtn');
        if (!btn) return false;
        const style = window.getComputedStyle(btn);
        return style.display !== 'none';
      })()
    `);
    assert(advPostBtnVisible, "Advisor Portal: '+ Post Announcement' button is visible");

    ws.close();
  } finally {
    browserProc.kill();
  }
}

run();
