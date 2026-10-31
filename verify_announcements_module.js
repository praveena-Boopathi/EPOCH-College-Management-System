const { spawn } = require('child_process');
const fs = require('fs');

const BASE_URL = 'http://localhost:8080';
let passed = 0;
let total = 0;

function assert(condition, testName) {
  total++;
  if (condition) {
    console.log(`  ✅ [PASS] ${testName}`);
    passed++;
  } else {
    console.error(`  ❌ [FAIL] ${testName}`);
  }
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function login(username, password) {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  if (!res.ok) throw new Error(`Login failed for ${username}: ${res.status}`);
  return await res.json();
}

async function run() {
  console.log("================================================================================");
  console.log("   EPOCH ANNOUNCEMENTS MODULE - COMPREHENSIVE VERIFICATION SUITE               ");
  console.log("================================================================================");

  try {
    // 0. Authenticate Test Accounts
    console.log("\n--- 0. Authenticating Registered Institutional Accounts ---");
    const advA = await login('arularasi', 'advisor@123');
    assert(advA.role === 'ADVISOR' && advA.section === 'CSE-A', "Advisor A (arularasi) authenticated for Section CSE-A");

    const advB = await login('divyabharathi', 'advisor@123');
    assert(advB.role === 'ADVISOR' && advB.section === 'CSE-B', "Advisor B (divyabharathi) authenticated for Section CSE-B");

    const advC = await login('rajavathijayapriya', 'advisor@123');
    assert(advC.role === 'ADVISOR' && advC.section === 'CSE-C', "Advisor C (rajavathijayapriya) authenticated for Section CSE-C");

    const hod = await login('gopinath', 'hod@123');
    assert(hod.role === 'HOD', "HOD (gopinath) authenticated");

    const principal = await login('bsanjaygandhi', 'principal@123');
    assert(principal.role === 'PRINCIPAL', "Principal (bsanjaygandhi) authenticated");

    const studentA = await login('620823104002', 'student@12');
    assert(studentA.role === 'STUDENT' && studentA.section === 'CSE-A', "Student A (620823104002) authenticated for Section CSE-A");

    const studentB = await login('620823104066', 'student@12');
    assert(studentB.role === 'STUDENT' && studentB.section === 'CSE-B', "Student B (620823104066) authenticated for Section CSE-B");

    const studentC = await login('620823104133', 'student@12');
    assert(studentC.role === 'STUDENT' && studentC.section === 'CSE-C', "Student C (620823104133) authenticated for Section CSE-C");

    // 1. Advisor Scope Enforcement: Advisor A tries to publish to B or ALL -> Blocked with 403
    console.log("\n--- 1. Testing Advisor Scope Enforcement & Security Rules ---");
    const advFailRes = await fetch(`${BASE_URL}/api/announcements`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${advA.token}`
      },
      body: JSON.stringify({
        title: "Unauthorized Notice to CSE-B",
        message: "This should fail",
        priority: "NORMAL",
        targetSections: ["CSE-B"]
      })
    });
    assert(advFailRes.status === 403, "Advisor A blocked from publishing to CSE-B (HTTP 403 Forbidden)");

    const advFailAllRes = await fetch(`${BASE_URL}/api/announcements`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${advA.token}`
      },
      body: JSON.stringify({
        title: "Unauthorized College-Wide Notice",
        message: "This should fail",
        priority: "NORMAL",
        targetSections: ["ALL"]
      })
    });
    assert(advFailAllRes.status === 403, "Advisor A blocked from publishing to ALL Students (HTTP 403 Forbidden)");

    // 2. Student attempts to publish -> Access Denied (403)
    console.log("\n--- 2. Testing Student Read-Only Access Restrictions ---");
    const stFailRes = await fetch(`${BASE_URL}/api/announcements`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${studentA.token}`
      },
      body: JSON.stringify({
        title: "Student Attempting to Post Circular",
        message: "Students cannot publish announcements",
        priority: "NORMAL",
        targetSections: ["CSE-A"]
      })
    });
    assert(stFailRes.status === 403, "Student blocked from publishing announcement (HTTP 403 Forbidden)");

    // 3. Case 1: Advisor A publishes to CSE-A -> Only A students receive it
    console.log("\n--- 3. Case 1: Advisor A publishes to CSE-A ---");
    const ts1 = Date.now();
    const titleA = `Notice from Arularasi for Section A (${ts1})`;
    const pubARes = await fetch(`${BASE_URL}/api/announcements`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${advA.token}`
      },
      body: JSON.stringify({
        title: titleA,
        message: "Reminder regarding Section A assignment submission tomorrow.",
        priority: "NORMAL",
        targetSections: ["CSE-A"]
      })
    });
    const pubAData = await pubARes.json();
    assert(pubARes.status === 200 && pubAData.id, "Advisor A published announcement successfully (HTTP 200 OK)");

    // Verify delivery
    const listA_stA = await (await fetch(`${BASE_URL}/api/announcements`, { headers: { 'Authorization': `Bearer ${studentA.token}` } })).json();
    const listA_stB = await (await fetch(`${BASE_URL}/api/announcements`, { headers: { 'Authorization': `Bearer ${studentB.token}` } })).json();
    const listA_stC = await (await fetch(`${BASE_URL}/api/announcements`, { headers: { 'Authorization': `Bearer ${studentC.token}` } })).json();

    assert(listA_stA.some(a => a.id === pubAData.id), "Student A (CSE-A) received Advisor A's announcement");
    assert(!listA_stB.some(a => a.id === pubAData.id), "Student B (CSE-B) did NOT receive Advisor A's announcement");
    assert(!listA_stC.some(a => a.id === pubAData.id), "Student C (CSE-C) did NOT receive Advisor A's announcement");

    // 4. Case 2: Advisor B publishes to CSE-B -> Only B students receive it
    console.log("\n--- 4. Case 2: Advisor B publishes to CSE-B ---");
    const ts2 = Date.now();
    const titleB = `Notice from Dhivya Bharathi for Section B (${ts2})`;
    const pubBRes = await fetch(`${BASE_URL}/api/announcements`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${advB.token}`
      },
      body: JSON.stringify({
        title: titleB,
        message: "Section B lab practical verification at 2:00 PM.",
        priority: "IMPORTANT",
        targetSections: ["CSE-B"]
      })
    });
    const pubBData = await pubBRes.json();
    assert(pubBRes.status === 200 && pubBData.id, "Advisor B published announcement successfully (HTTP 200 OK)");

    const listB_stA = await (await fetch(`${BASE_URL}/api/announcements`, { headers: { 'Authorization': `Bearer ${studentA.token}` } })).json();
    const listB_stB = await (await fetch(`${BASE_URL}/api/announcements`, { headers: { 'Authorization': `Bearer ${studentB.token}` } })).json();
    const listB_stC = await (await fetch(`${BASE_URL}/api/announcements`, { headers: { 'Authorization': `Bearer ${studentC.token}` } })).json();

    assert(!listB_stA.some(a => a.id === pubBData.id), "Student A (CSE-A) did NOT receive Advisor B's announcement");
    assert(listB_stB.some(a => a.id === pubBData.id), "Student B (CSE-B) received Advisor B's announcement");
    assert(!listB_stC.some(a => a.id === pubBData.id), "Student C (CSE-C) did NOT receive Advisor B's announcement");

    // 5. Case 3: Advisor C publishes to CSE-C -> Only C students receive it
    console.log("\n--- 5. Case 3: Advisor C publishes to CSE-C ---");
    const ts3 = Date.now();
    const titleC = `Notice from Rajavathi Jaya Priya for Section C (${ts3})`;
    const pubCRes = await fetch(`${BASE_URL}/api/announcements`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${advC.token}`
      },
      body: JSON.stringify({
        title: titleC,
        message: "Section C mini-project synopsis submission deadline extension.",
        priority: "NORMAL",
        targetSections: ["CSE-C"]
      })
    });
    const pubCData = await pubCRes.json();
    assert(pubCRes.status === 200 && pubCData.id, "Advisor C published announcement successfully (HTTP 200 OK)");

    const listC_stA = await (await fetch(`${BASE_URL}/api/announcements`, { headers: { 'Authorization': `Bearer ${studentA.token}` } })).json();
    const listC_stB = await (await fetch(`${BASE_URL}/api/announcements`, { headers: { 'Authorization': `Bearer ${studentB.token}` } })).json();
    const listC_stC = await (await fetch(`${BASE_URL}/api/announcements`, { headers: { 'Authorization': `Bearer ${studentC.token}` } })).json();

    assert(!listC_stA.some(a => a.id === pubCData.id), "Student A (CSE-A) did NOT receive Advisor C's announcement");
    assert(!listC_stB.some(a => a.id === pubCData.id), "Student B (CSE-B) did NOT receive Advisor C's announcement");
    assert(listC_stC.some(a => a.id === pubCData.id), "Student C (CSE-C) received Advisor C's announcement");

    // 6. Case 4: HOD publishes to CSE-A and CSE-C -> Only A and C students receive it
    console.log("\n--- 6. Case 4: HOD publishes to Multiple Sections (CSE-A & CSE-C) ---");
    const ts4 = Date.now();
    const titleHOD = `Department Circular from Dr. Gopinath for Sections A and C (${ts4})`;
    const pubHODRes = await fetch(`${BASE_URL}/api/announcements`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${hod.token}`
      },
      body: JSON.stringify({
        title: titleHOD,
        message: "Special placement grooming session for Sections A and C scheduled in Seminar Hall 1.",
        priority: "IMPORTANT",
        targetSections: ["CSE-A", "CSE-C"]
      })
    });
    const pubHODData = await pubHODRes.json();
    assert(pubHODRes.status === 200 && pubHODData.id, "HOD published multiple-section announcement successfully (HTTP 200 OK)");
    assert(pubHODData.targetAudienceLabel === "CSE-A, CSE-C", "Target audience label correctly formatted as 'CSE-A, CSE-C'");

    const listHOD_stA = await (await fetch(`${BASE_URL}/api/announcements`, { headers: { 'Authorization': `Bearer ${studentA.token}` } })).json();
    const listHOD_stB = await (await fetch(`${BASE_URL}/api/announcements`, { headers: { 'Authorization': `Bearer ${studentB.token}` } })).json();
    const listHOD_stC = await (await fetch(`${BASE_URL}/api/announcements`, { headers: { 'Authorization': `Bearer ${studentC.token}` } })).json();

    assert(listHOD_stA.some(a => a.id === pubHODData.id), "Student A (CSE-A) received HOD's announcement");
    assert(!listHOD_stB.some(a => a.id === pubHODData.id), "Student B (CSE-B) did NOT receive HOD's announcement");
    assert(listHOD_stC.some(a => a.id === pubHODData.id), "Student C (CSE-C) received HOD's announcement");

    // 7. Case 5: Principal publishes to ALL -> A, B, and C students receive it
    console.log("\n--- 7. Case 5: Principal publishes College-Wide (All Students) ---");
    const ts5 = Date.now();
    const titlePrin = `Institutional Circular from Dr. B. Sanjay Gandhi to All Students (${ts5})`;
    const pubPrinRes = await fetch(`${BASE_URL}/api/announcements`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${principal.token}`
      },
      body: JSON.stringify({
        title: titlePrin,
        message: "Holiday declared on Monday on account of campus maintenance.",
        priority: "URGENT",
        targetSections: ["ALL"]
      })
    });
    const pubPrinData = await pubPrinRes.json();
    assert(pubPrinRes.status === 200 && pubPrinData.id, "Principal published All Students announcement successfully (HTTP 200 OK)");
    assert(pubPrinData.targetAudienceLabel === "All Students", "Target audience label correctly formatted as 'All Students'");

    const listPrin_stA = await (await fetch(`${BASE_URL}/api/announcements`, { headers: { 'Authorization': `Bearer ${studentA.token}` } })).json();
    const listPrin_stB = await (await fetch(`${BASE_URL}/api/announcements`, { headers: { 'Authorization': `Bearer ${studentB.token}` } })).json();
    const listPrin_stC = await (await fetch(`${BASE_URL}/api/announcements`, { headers: { 'Authorization': `Bearer ${studentC.token}` } })).json();

    assert(listPrin_stA.some(a => a.id === pubPrinData.id), "Student A (CSE-A) received Principal's college-wide notice");
    assert(listPrin_stB.some(a => a.id === pubPrinData.id), "Student B (CSE-B) received Principal's college-wide notice");
    assert(listPrin_stC.some(a => a.id === pubPrinData.id), "Student C (CSE-C) received Principal's college-wide notice");

    // 8. Case 7: Persistence Across Refresh / Log out / Re-login
    console.log("\n--- 8. Testing Persistence Across Re-Login & Refresh ---");
    const reloginStudentA = await login('620823104002', 'student@12');
    const reloginListA = await (await fetch(`${BASE_URL}/api/announcements`, { headers: { 'Authorization': `Bearer ${reloginStudentA.token}` } })).json();
    assert(reloginListA.some(a => a.id === pubAData.id), "Advisor A notice remains accessible after fresh re-login");
    assert(reloginListA.some(a => a.id === pubHODData.id), "HOD notice remains accessible after fresh re-login");
    assert(reloginListA.some(a => a.id === pubPrinData.id), "Principal notice remains accessible after fresh re-login");

    // Senders can view their sent announcement history
    const sentAdvA = await (await fetch(`${BASE_URL}/api/announcements/my-sent`, { headers: { 'Authorization': `Bearer ${advA.token}` } })).json();
    assert(sentAdvA.some(a => a.id === pubAData.id), "Advisor A sent history contains their published announcement");

    const sentHOD = await (await fetch(`${BASE_URL}/api/announcements/my-sent`, { headers: { 'Authorization': `Bearer ${hod.token}` } })).json();
    assert(sentHOD.some(a => a.id === pubHODData.id), "HOD sent history contains their published announcement");

    // 9. Case 8: In-App Notifications & Unread Counts
    console.log("\n--- 9. Testing In-App Notifications & Unread Notification Counts ---");
    const notifsStA = await (await fetch(`${BASE_URL}/api/notifications`, { headers: { 'Authorization': `Bearer ${studentA.token}` } })).json();
    const notifsStB = await (await fetch(`${BASE_URL}/api/notifications`, { headers: { 'Authorization': `Bearer ${studentB.token}` } })).json();

    const notifForPubA_in_stA = notifsStA.some(n => n.referenceId === pubAData.id);
    const notifForPubA_in_stB = notifsStB.some(n => n.referenceId === pubAData.id);
    assert(notifForPubA_in_stA, "Student A received in-app notification for Advisor A's announcement");
    assert(!notifForPubA_in_stB, "Student B did NOT receive notification for Advisor A's announcement");

    const notifForHOD_in_stA = notifsStA.some(n => n.referenceId === pubHODData.id);
    const notifForHOD_in_stB = notifsStB.some(n => n.referenceId === pubHODData.id);
    assert(notifForHOD_in_stA, "Student A received in-app notification for HOD's announcement");
    assert(!notifForHOD_in_stB, "Student B did NOT receive notification for HOD's announcement (not in audience)");

    const unreadStA = await (await fetch(`${BASE_URL}/api/notifications/unread-count`, { headers: { 'Authorization': `Bearer ${studentA.token}` } })).json();
    assert(unreadStA.unreadCount > 0, `Student A has active unread notification count (${unreadStA.unreadCount})`);

    // 10. Headless Edge Browser UI Test
    console.log("\n--- 10. Headless Edge Browser UI Verification ---");
    await runBrowserUiTest(advA.token, studentA.token);

    console.log("\n================================================================================");
    console.log(`   SUITE COMPLETE: ${passed} / ${total} TESTS PASSED (${Math.round((passed/total)*100)}%)   `);
    console.log("================================================================================");

  } catch (err) {
    console.error("Test Suite Fatal Error:", err);
  }
}

async function runBrowserUiTest(advisorToken, studentToken) {
  const CDP_PORT = 9340;
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
    await sleep(2000);
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
    await cdp('Page.navigate', { url: `${BASE_URL}/` });
    await sleep(2500);

    // Test 1: Advisor A UI - open post modal and verify section CSE-A locked and B, C locked
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

    // Switch to announcements tab and open post modal
    await evalScript(`App.switchTab('announcements')`);
    await sleep(500);
    const postBtnVisible = await evalScript(`document.getElementById('postAnnouncementBtn') && document.getElementById('postAnnouncementBtn').style.display !== 'none'`);
    assert(postBtnVisible, "Advisor UI: '+ Post Announcement' button is visible on Announcements Board");

    await evalScript(`AnnouncementApp.openPostAnnouncementModal()`);
    await sleep(500);

    const isModalOpen = await evalScript(`document.getElementById('postAnnouncementModal').style.display === 'flex'`);
    assert(isModalOpen, "Post Announcement Modal opened successfully");

    const chkA_checked_disabled = await evalScript(`
      (() => {
        const chk = document.getElementById('annAudience_CSEA');
        return chk && chk.checked && chk.disabled;
      })()
    `);
    assert(chkA_checked_disabled, "Advisor A UI: CSE-A checkbox is checked AND locked (disabled)");

    const chkB_locked = await evalScript(`
      (() => {
        const chk = document.getElementById('annAudience_CSEB');
        return chk && !chk.checked && chk.disabled;
      })()
    `);
    assert(chkB_locked, "Advisor A UI: CSE-B checkbox is disabled (locked)");

    const chkAll_hidden = await evalScript(`
      (() => {
        const lbl = document.getElementById('lblAudience_ALL');
        return lbl && lbl.style.display === 'none';
      })()
    `);
    assert(chkAll_hidden, "Advisor A UI: 'All Students' checkbox is hidden");

    await evalScript(`AnnouncementApp.closePostAnnouncementModal()`);
    await sleep(300);

    // Test 2: Student A UI - verify student dashboard has announcements card and post button is hidden
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

    const stDashCardPresent = await evalScript(`!!document.getElementById('studentDashboardAnnouncementsList')`);
    assert(stDashCardPresent, "Student UI: 'Official Announcements & Section Circulars' card present on Student Dashboard");

    const stPostBtnHidden = await evalScript(`document.getElementById('postAnnouncementBtn') && document.getElementById('postAnnouncementBtn').style.display === 'none'`);
    assert(stPostBtnHidden, "Student UI: '+ Post Announcement' button is completely hidden (Read-Only access)");

    ws.close();
  } finally {
    browserProc.kill();
  }
}

run();
