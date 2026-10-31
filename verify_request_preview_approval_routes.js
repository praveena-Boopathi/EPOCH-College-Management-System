/**
 * EPOCH - REQUEST PREVIEW APPROVAL ROUTE & WORKFLOW VERIFICATION SUITE
 * Tests:
 * 1. Bonafide -> Advisor -> HOD -> Principal (3-Stage Workflow A)
 * 2. Single-day OD -> Advisor -> HOD (2-Stage Workflow B)
 * 3. Multi-day OD -> Advisor -> HOD (2-Stage Workflow B)
 * 4. Symposium OD -> Advisor -> HOD (2-Stage Workflow B)
 * 5. Hackathon OD -> Advisor -> HOD (2-Stage Workflow B)
 * 6. Leave -> Advisor -> HOD (2-Stage Workflow B)
 * 7. Verification: No Principal task or notification generated for non-Bonafide requests
 * 8. Real Browser Headless UI Verification: Preview forms display strictly required approval routes and signature blocks
 */

const { spawn } = require('child_process');
const http = require('http');
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

function findEdgePath() {
  const possiblePaths = [
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    (process.env.LOCALAPPDATA || '') + '\\Microsoft\\Edge\\Application\\msedge.exe'
  ];
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) return p;
  }
  return 'msedge.exe';
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

async function waitForServer() {
  console.log("Waiting for Spring Boot to be ready on port 8080...");
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'gopinath', password: 'bad_password' })
      });
      if (res.status === 401 || res.status === 200 || res.status === 400 || res.status === 403) {
        console.log("Spring Boot backend is UP and accepting requests.");
        return true;
      }
    } catch (e) {
      // wait
    }
    await sleep(2000);
  }
  throw new Error("Spring Boot failed to start within timeout.");
}

async function run() {
  console.log("================================================================================");
  console.log("   EPOCH - STUDENT REQUEST PREVIEW & APPROVAL ROUTE VERIFICATION SUITE           ");
  console.log("================================================================================");

  try {
    await waitForServer();

    // Logins
    const studentUser = await login("620823104002", "student@12");   // Abinaya (CSE-A)
    const advisorUser = await login("arularasi", "advisor@123");       // Mrs. P. Arularasi (CSE-A Advisor)
    const hodUser = await login("gopinath", "hod@123");                // Dr. K. Gopinath (HOD)
    const principalUser = await login("bsanjaygandhi", "principal@123"); // Dr. B. Sanjay Gandhi (Principal)

    // Unique dates per test run to prevent accidental duplicate submission collision
    const runSeed = Math.floor(Math.random() * 5000) + 1000;
    function getDates(offsetDays, countDays) {
      const start = new Date(Date.now() + (runSeed * 86400000) + (offsetDays * 86400000));
      const end = new Date(start.getTime() + ((countDays - 1) * 86400000));
      return {
        start: start.toISOString().split('T')[0],
        end: end.toISOString().split('T')[0],
        days: countDays
      };
    }

    console.log("\n[SECTION 1: TEST BONAFIDE CERTIFICATE (WORKFLOW A: ADVISOR -> HOD -> PRINCIPAL)]");
    const bnfDates = getDates(1, 1);
    const bnfPayload = {
      odType: "Bonafide Certificate",
      eventTitle: "Bonafide Certificate - Passport Application",
      organizer: "Gnanamani College of Technology",
      venue: "Autonomous Campus",
      startDate: bnfDates.start,
      endDate: bnfDates.end,
      numberOfDays: bnfDates.days,
      reason: "Passport Application - Official Bonafide Certificate Requisition",
      supportingDetails: "Academic Year 2025-2026"
    };

    const bnfRes = await fetch(`${BASE_URL}/api/od/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${studentUser.token}`
      },
      body: JSON.stringify(bnfPayload)
    });
    assert(bnfRes.ok, "Student submitted Bonafide Certificate request successfully");
    const bnfReq = await bnfRes.json();
    const bnfId = bnfReq.id;
    console.log(`  Submitted Bonafide ID: ${bnfId}`);

    assert(bnfReq.requiresPrincipalApproval === true, "Bonafide request requiresPrincipalApproval flag is TRUE");
    assert(bnfReq.status === "PENDING_ADVISOR", "Bonafide initial status is PENDING_ADVISOR");
    assert(bnfReq.assignedReviewerId === "arularasi", "Bonafide assigned to section Class Advisor (arularasi)");

    // Advisor Approves
    const advBnfRes = await fetch(`${BASE_URL}/api/od/${bnfId}/advisor-action`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${advisorUser.token}`
      },
      body: JSON.stringify({ approved: true, reason: "Bonafide academic record verified. Recommended." })
    });
    assert(advBnfRes.ok, "Class Advisor approved Bonafide Certificate");
    const advBnfData = await advBnfRes.json();
    assert(advBnfData.status === "PENDING_HOD", "Bonafide transitioned to PENDING_HOD");
    assert(advBnfData.assignedReviewerId === "gopinath", "Bonafide assigned to HOD (gopinath)");

    // HOD Approves -> Must forward to Principal (Workflow A)
    const hodBnfRes = await fetch(`${BASE_URL}/api/od/${bnfId}/hod-action`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${hodUser.token}`
      },
      body: JSON.stringify({ approved: true, reason: "Department sanction granted. Forwarded to Principal." })
    });
    assert(hodBnfRes.ok, "HOD approved Bonafide Certificate");
    const hodBnfData = await hodBnfRes.json();
    assert(hodBnfData.status === "PENDING_PRINCIPAL", "Bonafide forwarded to PENDING_PRINCIPAL stage");
    assert(hodBnfData.assignedReviewerId === "bsanjaygandhi", "Bonafide assigned to Principal (bsanjaygandhi)");

    // Principal Reviews & Approves
    const prinBnfRes = await fetch(`${BASE_URL}/api/od/${bnfId}/principal-action`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${principalUser.token}`
      },
      body: JSON.stringify({ approved: true, reason: "Institutional sanction sealed. Certificate issued." })
    });
    assert(prinBnfRes.ok, "Principal granted final sanction for Bonafide Certificate");
    const prinBnfData = await prinBnfRes.json();
    assert(prinBnfData.status === "APPROVED", "Bonafide final status is APPROVED");
    assert(prinBnfData.advisorDecision && prinBnfData.advisorDecision.status === "APPROVED", "Class Advisor signature recorded");
    assert(prinBnfData.hodDecision && prinBnfData.hodDecision.status === "APPROVED", "HOD signature recorded");
    assert(prinBnfData.principalDecision && prinBnfData.principalDecision.status === "APPROVED", "Principal signature recorded");


    console.log("\n[SECTION 2: TEST SINGLE-DAY OD (WORKFLOW B: ADVISOR -> HOD)]");
    const sOdDates = getDates(5, 1);
    const singleOdPayload = {
      odType: "Workshop",
      eventTitle: "Cloud Computing Hands-On Workshop",
      organizer: "Anna University Regional Campus",
      venue: "Coimbatore",
      startDate: sOdDates.start,
      endDate: sOdDates.end,
      numberOfDays: sOdDates.days,
      reason: "Technical workshop participation"
    };

    const sOdRes = await fetch(`${BASE_URL}/api/od/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${studentUser.token}`
      },
      body: JSON.stringify(singleOdPayload)
    });
    assert(sOdRes.ok, "Student submitted Single-day OD successfully");
    const sOdReq = await sOdRes.json();
    const sOdId = sOdReq.id;

    assert(sOdReq.requiresPrincipalApproval === false, "Single-day OD requiresPrincipalApproval is FALSE");
    assert(sOdReq.status === "PENDING_ADVISOR", "Single-day OD initial status is PENDING_ADVISOR");

    // Advisor Approves
    const advSOdRes = await fetch(`${BASE_URL}/api/od/${sOdId}/advisor-action`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${advisorUser.token}`
      },
      body: JSON.stringify({ approved: true, reason: "Recommended for department review." })
    });
    assert(advSOdRes.ok, "Class Advisor approved Single-day OD");
    const advSOdData = await advSOdRes.json();
    assert(advSOdData.status === "PENDING_HOD", "Single-day OD transitioned to PENDING_HOD");

    // HOD Approves -> Must FINALIZE at HOD stage!
    const hodSOdRes = await fetch(`${BASE_URL}/api/od/${sOdId}/hod-action`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${hodUser.token}`
      },
      body: JSON.stringify({ approved: true, reason: "Approved by HOD. Final sanction granted." })
    });
    assert(hodSOdRes.ok, "HOD approved Single-day OD");
    const hodSOdData = await hodSOdRes.json();
    assert(hodSOdData.status === "APPROVED", "Single-day OD finalized as APPROVED at HOD stage (Workflow B)");
    assert(hodSOdData.currentStage === "COMPLETED", "Single-day OD currentStage is COMPLETED");
    assert(hodSOdData.principalDecision == null, "Single-day OD has NO Principal decision or signature block");


    console.log("\n[SECTION 3: TEST MULTI-DAY OD (WORKFLOW B: ADVISOR -> HOD)]");
    const mOdDates = getDates(10, 3);
    const multiOdPayload = {
      odType: "Industrial Visit",
      eventTitle: "3-Day Industrial Tech Tour",
      organizer: "L&T Infotech",
      venue: "Bangalore",
      startDate: mOdDates.start,
      endDate: mOdDates.end,
      numberOfDays: mOdDates.days,
      reason: "Industrial plant and software center exposure"
    };

    const mOdRes = await fetch(`${BASE_URL}/api/od/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${studentUser.token}`
      },
      body: JSON.stringify(multiOdPayload)
    });
    assert(mOdRes.ok, "Student submitted Multi-day OD successfully");
    const mOdReq = await mOdRes.json();
    const mOdId = mOdReq.id;

    assert(mOdReq.requiresPrincipalApproval === false, "Multi-day OD requiresPrincipalApproval is FALSE (not Bonafide)");
    assert(mOdReq.status === "PENDING_ADVISOR", "Multi-day OD initial status is PENDING_ADVISOR");

    // Advisor Approves
    const advMOdRes = await fetch(`${BASE_URL}/api/od/${mOdId}/advisor-action`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${advisorUser.token}`
      },
      body: JSON.stringify({ approved: true, reason: "Attendance verified. Recommended." })
    });
    assert(advMOdRes.ok, "Class Advisor approved Multi-day OD");
    const advMOdData = await advMOdRes.json();
    assert(advMOdData.status === "PENDING_HOD", "Multi-day OD transitioned to PENDING_HOD");

    // HOD Approves -> Must FINALIZE at HOD stage!
    const hodMOdRes = await fetch(`${BASE_URL}/api/od/${mOdId}/hod-action`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${hodUser.token}`
      },
      body: JSON.stringify({ approved: true, reason: "Multi-day OD sanctioned at departmental level." })
    });
    assert(hodMOdRes.ok, "HOD approved Multi-day OD");
    const hodMOdData = await hodMOdRes.json();
    assert(hodMOdData.status === "APPROVED", "Multi-day OD finalized as APPROVED at HOD stage (Workflow B)");
    assert(hodMOdData.principalDecision == null, "Multi-day OD has NO Principal decision or signature block");


    console.log("\n[SECTION 4: TEST SYMPOSIUM OD (WORKFLOW B: ADVISOR -> HOD)]");
    const symDates = getDates(20, 2);
    const symOdPayload = {
      odType: "Symposium / Conference",
      eventTitle: "National Technical Symposium (TECHFEST 2026)",
      organizer: "PSG College of Technology",
      venue: "Coimbatore",
      startDate: symDates.start,
      endDate: symDates.end,
      numberOfDays: symDates.days,
      reason: "Paper presentation and coding contest participation"
    };

    const symRes = await fetch(`${BASE_URL}/api/od/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${studentUser.token}`
      },
      body: JSON.stringify(symOdPayload)
    });
    assert(symRes.ok, "Student submitted Symposium OD successfully");
    const symReq = await symRes.json();
    const symId = symReq.id;

    assert(symReq.requiresPrincipalApproval === false, "Symposium OD requiresPrincipalApproval is FALSE (not Bonafide)");

    // Advisor Approves
    const advSymRes = await fetch(`${BASE_URL}/api/od/${symId}/advisor-action`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${advisorUser.token}`
      },
      body: JSON.stringify({ approved: true, reason: "Symposium paper accepted. Recommended." })
    });
    assert(advSymRes.ok, "Class Advisor approved Symposium OD");

    // HOD Approves -> Must FINALIZE at HOD stage!
    const hodSymRes = await fetch(`${BASE_URL}/api/od/${symId}/hod-action`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${hodUser.token}`
      },
      body: JSON.stringify({ approved: true, reason: "Symposium participation granted. Form finalized." })
    });
    assert(hodSymRes.ok, "HOD approved Symposium OD");
    const hodSymData = await hodSymRes.json();
    assert(hodSymData.status === "APPROVED", "Symposium OD finalized as APPROVED at HOD stage (NO Principal routing)");
    assert(hodSymData.principalDecision == null, "Symposium OD has NO Principal decision or signature block");


    console.log("\n[SECTION 5: TEST HACKATHON OD (WORKFLOW B: ADVISOR -> HOD)]");
    const hackDates = getDates(30, 2);
    const hackPayload = {
      odType: "Hackathon",
      eventTitle: "36-Hour National Smart India Hackathon Regional Sprint",
      organizer: "IIT Madras Research Park",
      venue: "Chennai",
      startDate: hackDates.start,
      endDate: hackDates.end,
      numberOfDays: hackDates.days,
      reason: "Shortlisted team leader for 36-hr hackathon"
    };

    const hackRes = await fetch(`${BASE_URL}/api/od/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${studentUser.token}`
      },
      body: JSON.stringify(hackPayload)
    });
    assert(hackRes.ok, "Student submitted Hackathon OD successfully");
    const hackReq = await hackRes.json();
    const hackId = hackReq.id;

    assert(hackReq.requiresPrincipalApproval === false, "Hackathon OD requiresPrincipalApproval is FALSE (not Bonafide)");

    // Advisor Approves
    const advHackRes = await fetch(`${BASE_URL}/api/od/${hackId}/advisor-action`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${advisorUser.token}`
      },
      body: JSON.stringify({ approved: true, reason: "Hackathon shortlist confirmed. Recommended." })
    });
    assert(advHackRes.ok, "Class Advisor approved Hackathon OD");

    // HOD Approves -> Must FINALIZE at HOD stage!
    const hodHackRes = await fetch(`${BASE_URL}/api/od/${hackId}/hod-action`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${hodUser.token}`
      },
      body: JSON.stringify({ approved: true, reason: "Department sanction granted for Hackathon." })
    });
    assert(hodHackRes.ok, "HOD approved Hackathon OD");
    const hodHackData = await hodHackRes.json();
    assert(hodHackData.status === "APPROVED", "Hackathon OD finalized as APPROVED at HOD stage (Workflow B)");
    assert(hodHackData.principalDecision == null, "Hackathon OD has NO Principal decision or signature block");


    console.log("\n[SECTION 6: TEST LEAVE REQUEST (WORKFLOW B: ADVISOR -> HOD)]");
    const lvDates = getDates(40, 2);
    const leavePayload = {
      odType: "Day Scholar Leave Letter",
      studentType: "Day Scholar",
      eventTitle: "Day Scholar Leave Letter - Medical / Sick Leave",
      organizer: "College Attendance / Leave",
      venue: "Home / Personal",
      startDate: lvDates.start,
      endDate: lvDates.end,
      numberOfDays: lvDates.days,
      reason: "Medical consultation and recovery",
      supportingDetails: "Residence: Day Scholar | Parent Phone: +91 98765 43210"
    };

    const lvRes = await fetch(`${BASE_URL}/api/od/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${studentUser.token}`
      },
      body: JSON.stringify(leavePayload)
    });
    assert(lvRes.ok, "Student submitted Leave Letter successfully");
    const lvReq = await lvRes.json();
    const lvId = lvReq.id;

    assert(lvReq.requiresPrincipalApproval === false, "Leave request requiresPrincipalApproval is FALSE (not Bonafide)");

    // Advisor Approves
    const advLvRes = await fetch(`${BASE_URL}/api/od/${lvId}/advisor-action`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${advisorUser.token}`
      },
      body: JSON.stringify({ approved: true, reason: "Medical leave approved by Advisor." })
    });
    assert(advLvRes.ok, "Class Advisor approved Leave Letter");

    // HOD Approves -> Must FINALIZE at HOD stage!
    const hodLvRes = await fetch(`${BASE_URL}/api/od/${lvId}/hod-action`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${hodUser.token}`
      },
      body: JSON.stringify({ approved: true, reason: "Leave sanctioned at department level." })
    });
    assert(hodLvRes.ok, "HOD approved Leave Letter");
    const hodLvData = await hodLvRes.json();
    assert(hodLvData.status === "APPROVED", "Leave Letter finalized as APPROVED at HOD stage (Workflow B)");
    assert(hodLvData.principalDecision == null, "Leave Letter has NO Principal decision or signature block");


    console.log("\n[SECTION 7: VERIFY NO PRINCIPAL TASK OR NOTIFICATION FOR NON-BONAFIDE REQUESTS]");
    // Check Principal's queue
    const prinQueueRes = await fetch(`${BASE_URL}/api/od/principal`, {
      headers: { 'Authorization': `Bearer ${principalUser.token}` }
    });
    assert(prinQueueRes.ok, "Principal queue endpoint responded successfully");
    const prinQueue = await prinQueueRes.json();

    const containsNonBonafide = prinQueue.some(r =>
      r.id === sOdId || r.id === mOdId || r.id === symId || r.id === hackId || r.id === lvId
    );
    assert(!containsNonBonafide, "None of the non-Bonafide requests (Single-day, Multi-day, Symposium, Hackathon, Leave) are present in Principal queue");

    // Verify calling Principal action on non-Bonafide request is strictly rejected
    const illegalPrinActionRes = await fetch(`${BASE_URL}/api/od/${symId}/principal-action`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${principalUser.token}`
      },
      body: JSON.stringify({ approved: true, reason: "Attempting illegal Principal approval on Symposium" })
    });
    assert(!illegalPrinActionRes.ok, "Backend strictly blocks Principal action on non-Bonafide requests (400/500 rejected)");

    // Check Principal notifications
    const prinNotifsRes = await fetch(`${BASE_URL}/api/notifications`, {
      headers: { 'Authorization': `Bearer ${principalUser.token}` }
    });
    assert(prinNotifsRes.ok, "Principal notifications endpoint responded successfully");
    const prinNotifs = await prinNotifsRes.json();

    const nonBonafideNotifs = prinNotifs.filter(n =>
      (n.targetId === sOdId || n.targetId === mOdId || n.targetId === symId || n.targetId === hackId || n.targetId === lvId)
    );
    assert(nonBonafideNotifs.length === 0, "No notifications generated for Principal for non-Bonafide requests");


    console.log("\n[SECTION 8: HEADLESS BROWSER UI PREVIEW & ROUTE DISPLAY VERIFICATION]");
    const port = 9335;
    const edgePath = findEdgePath();
    const browserProc = spawn(edgePath, [
      `--remote-debugging-port=${port}`,
      '--headless=new',
      '--disable-gpu',
      '--no-first-run',
      '--no-default-browser-check',
      '--window-size=1280,800',
      'about:blank'
    ]);

    try {
      await sleep(2500);
      const targetsRes = await fetch(`http://localhost:${port}/json/list`);
      const targets = await targetsRes.json();
      const pageTarget = targets.find(t => t.type === 'page');
      if (!pageTarget) throw new Error("No page target found");

      const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
      let msgId = 1;
      const pendingCallbacks = new Map();

      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.id && pendingCallbacks.has(msg.id)) {
          const cb = pendingCallbacks.get(msg.id);
          pendingCallbacks.delete(msg.id);
          cb(msg);
        }
      };

      await new Promise(r => ws.onopen = r);

      function cdp(method, params = {}) {
        return new Promise((resolve) => {
          const id = msgId++;
          pendingCallbacks.set(id, (res) => resolve(res.result));
          ws.send(JSON.stringify({ id, method, params }));
        });
      }

      await cdp('Page.enable');
      await cdp('Runtime.enable');

      async function evalScript(expression) {
        const res = await cdp('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
        if (res.exceptionDetails) {
          throw new Error('CDP Eval Exception: ' + JSON.stringify(res.exceptionDetails));
        }
        return res.result ? res.result.value : undefined;
      }

      // Navigate to EPOCH
      await cdp('Page.navigate', { url: `${BASE_URL}/index.html` });
      await sleep(2000);

      // Login as Student Abinaya (CSE-A)
      await evalScript(`
        (async () => {
          App.selectRole('student');
          document.getElementById('loginIdentifier').value = '620823104002';
          document.getElementById('loginPassword').value = 'student@12';
          await Auth.login('student', '620823104002', 'student@12');
          App.checkSession();
        })()
      `);
      await sleep(1500);

      const loggedInRole = await evalScript(`App.currentUser ? App.currentUser.role.toLowerCase() : (Auth.getUser() ? Auth.getUser().role.toLowerCase() : null)`);
      assert(loggedInRole === 'student', "Browser successfully logged into EPOCH Student Portal");

      // TEST 8A: Preview Single-day Symposium OD
      console.log("  Testing Preview: Single-day Symposium OD...");
      const previewSym1 = await evalScript(`
        (() => {
          StudentPortal.openOdModal();
          StudentPortal.selectCategory('Symposium / Conference');
          document.getElementById('odEventTitleInput').value = 'TECHFEST 2026 - Coding & Web';
          document.getElementById('odOrganizerInput').value = 'PSG Tech';
          document.getElementById('odVenueInput').value = 'Coimbatore';
          document.getElementById('odStartDateInput').value = '2026-04-10';
          document.getElementById('odEndDateInput').value = '2026-04-10';
          document.getElementById('odDaysInput').value = 1;
          document.getElementById('odReasonInput').value = 'Technical presentation';
          StudentPortal.previewOdApplication();

          const routeContainer = document.getElementById('prevRouteContainer');
          const principalArrow = document.getElementById('prevRoutePrincipalArrow');
          const principalRoute = document.getElementById('prevRoutePrincipal');
          const pBlock = document.getElementById('prevPrincipalBlock');
          const vBlocks = document.getElementById('prevVerificationBlocks');

          return {
            fullText: routeContainer ? routeContainer.innerText.trim().replace(/\\s+/g, ' ') : '',
            rawHtml: routeContainer ? routeContainer.innerHTML : '',
            principalArrowDisplay: principalArrow ? window.getComputedStyle(principalArrow).display : '',
            principalRouteDisplay: principalRoute ? window.getComputedStyle(principalRoute).display : '',
            principalBlockDisplay: pBlock ? window.getComputedStyle(pBlock).display : '',
            gridColumns: vBlocks ? window.getComputedStyle(vBlocks).gridTemplateColumns : ''
          };
        })()
      `);

      assert(previewSym1.fullText === "1. Class Advisor (Student's Section) → 2. Head of Department (CSE)",
        "Single-day Symposium Preview displays exact route: '1. Class Advisor (Student's Section) → 2. Head of Department (CSE)'");
      assert(!previewSym1.rawHtml.includes("Multi-day / Symposium Sanction"),
        "Single-day Symposium Preview does NOT contain old text 'Multi-day / Symposium Sanction'");
      assert(previewSym1.principalArrowDisplay === 'none', "Principal arrow is HIDDEN (display: none)");
      assert(previewSym1.principalRouteDisplay === 'none', "Principal route span is HIDDEN (display: none)");
      assert(previewSym1.principalBlockDisplay === 'none', "Principal verification block is HIDDEN (display: none)");


      // TEST 8B: Preview Multi-day Symposium OD (2 Days)
      console.log("  Testing Preview: Multi-day Symposium OD (2 Days)...");
      const previewSymMulti = await evalScript(`
        (() => {
          document.getElementById('odStartDateInput').value = '2026-04-10';
          document.getElementById('odEndDateInput').value = '2026-04-11';
          document.getElementById('odDaysInput').value = 2;
          StudentPortal.previewOdApplication();

          const routeContainer = document.getElementById('prevRouteContainer');
          const principalArrow = document.getElementById('prevRoutePrincipalArrow');
          const principalRoute = document.getElementById('prevRoutePrincipal');
          const pBlock = document.getElementById('prevPrincipalBlock');

          return {
            fullText: routeContainer ? routeContainer.innerText.trim().replace(/\\s+/g, ' ') : '',
            principalArrowDisplay: principalArrow ? window.getComputedStyle(principalArrow).display : '',
            principalRouteDisplay: principalRoute ? window.getComputedStyle(principalRoute).display : '',
            principalBlockDisplay: pBlock ? window.getComputedStyle(pBlock).display : ''
          };
        })()
      `);

      assert(previewSymMulti.fullText === "1. Class Advisor (Student's Section) → 2. Head of Department (CSE)",
        "Multi-day Symposium Preview strictly maintains: '1. Class Advisor (Student's Section) → 2. Head of Department (CSE)' (NO Principal)");
      assert(previewSymMulti.principalArrowDisplay === 'none', "Multi-day Symposium Principal arrow remains HIDDEN");
      assert(previewSymMulti.principalRouteDisplay === 'none', "Multi-day Symposium Principal route span remains HIDDEN");
      assert(previewSymMulti.principalBlockDisplay === 'none', "Multi-day Symposium Principal block remains HIDDEN");


      // TEST 8C: Preview Hackathon OD (3 Days)
      console.log("  Testing Preview: Multi-day Hackathon OD (3 Days)...");
      const previewHack = await evalScript(`
        (() => {
          StudentPortal.selectCategory('Hackathon');
          document.getElementById('odEventTitleInput').value = 'Smart India Hackathon 2026';
          document.getElementById('odOrganizerInput').value = 'MoE Innovation Cell';
          document.getElementById('odVenueInput').value = 'IIT Madras';
          document.getElementById('odStartDateInput').value = '2026-04-15';
          document.getElementById('odEndDateInput').value = '2026-04-17';
          document.getElementById('odDaysInput').value = 3;
          StudentPortal.previewOdApplication();

          const routeContainer = document.getElementById('prevRouteContainer');
          const principalArrow = document.getElementById('prevRoutePrincipalArrow');
          const principalRoute = document.getElementById('prevRoutePrincipal');
          const pBlock = document.getElementById('prevPrincipalBlock');

          return {
            fullText: routeContainer ? routeContainer.innerText.trim().replace(/\\s+/g, ' ') : '',
            principalArrowDisplay: principalArrow ? window.getComputedStyle(principalArrow).display : '',
            principalRouteDisplay: principalRoute ? window.getComputedStyle(principalRoute).display : '',
            principalBlockDisplay: pBlock ? window.getComputedStyle(pBlock).display : ''
          };
        })()
      `);

      assert(previewHack.fullText === "1. Class Advisor (Student's Section) → 2. Head of Department (CSE)",
        "Hackathon Preview displays exact route: '1. Class Advisor (Student's Section) → 2. Head of Department (CSE)'");
      assert(previewHack.principalArrowDisplay === 'none', "Hackathon Principal arrow is HIDDEN");
      assert(previewHack.principalRouteDisplay === 'none', "Hackathon Principal route span is HIDDEN");
      assert(previewHack.principalBlockDisplay === 'none', "Hackathon Principal block is HIDDEN");


      // TEST 8D: Preview Leave Application
      console.log("  Testing Preview: Leave Application...");
      const previewLeave = await evalScript(`
        (() => {
          StudentPortal.closeOdModal();
          StudentPortal.openLeaveModal();
          document.getElementById('leaveTypeInput').value = 'Casual Leave';
          document.getElementById('leaveStartInput').value = '2026-04-20';
          document.getElementById('leaveEndInput').value = '2026-04-21';
          document.getElementById('leaveDaysInput').value = 2;
          document.getElementById('leaveReasonInput').value = 'Family function attendance';
          StudentPortal.previewLeaveApplication();

          const routeContainer = document.getElementById('prevRouteContainer');
          const principalArrow = document.getElementById('prevRoutePrincipalArrow');
          const principalRoute = document.getElementById('prevRoutePrincipal');
          const pBlock = document.getElementById('prevPrincipalBlock');

          return {
            fullText: routeContainer ? routeContainer.innerText.trim().replace(/\\s+/g, ' ') : '',
            principalArrowDisplay: principalArrow ? window.getComputedStyle(principalArrow).display : '',
            principalRouteDisplay: principalRoute ? window.getComputedStyle(principalRoute).display : '',
            principalBlockDisplay: pBlock ? window.getComputedStyle(pBlock).display : ''
          };
        })()
      `);

      assert(previewLeave.fullText === "1. Class Advisor (Student's Section) → 2. Head of Department (CSE)",
        "Leave Application Preview displays exact route: '1. Class Advisor (Student's Section) → 2. Head of Department (CSE)'");
      assert(previewLeave.principalArrowDisplay === 'none', "Leave Preview Principal arrow is HIDDEN");
      assert(previewLeave.principalRouteDisplay === 'none', "Leave Preview Principal route span is HIDDEN");
      assert(previewLeave.principalBlockDisplay === 'none', "Leave Preview Principal verification block is HIDDEN");


      // TEST 8E: Preview Bonafide Certificate (Workflow A)
      console.log("  Testing Preview: Bonafide Certificate Application...");
      const previewBonafide = await evalScript(`
        (() => {
          StudentPortal.closeOdModal();
          StudentPortal.openBonafideModal();
          document.getElementById('bonafidePurposeInput').value = 'Passport Application';
          document.getElementById('bonafideDetailsInput').value = 'Required for Regional Passport Office verification';
          StudentPortal.previewBonafideApplication();

          const routeContainer = document.getElementById('prevRouteContainer');
          const principalArrow = document.getElementById('prevRoutePrincipalArrow');
          const principalRoute = document.getElementById('prevRoutePrincipal');
          const pBlock = document.getElementById('prevPrincipalBlock');

          return {
            fullText: routeContainer ? routeContainer.innerText.trim().replace(/\\s+/g, ' ') : '',
            principalArrowVisible: principalArrow ? (window.getComputedStyle(principalArrow).display !== 'none') : false,
            principalRouteVisible: principalRoute ? (window.getComputedStyle(principalRoute).display !== 'none') : false,
            principalRouteText: principalRoute ? principalRoute.textContent.trim() : '',
            principalBlockDisplay: pBlock ? window.getComputedStyle(pBlock).display : ''
          };
        })()
      `);

      assert(previewBonafide.fullText === "1. Class Advisor (Student's Section) → 2. Head of Department (CSE) → 3. Principal",
        "Bonafide Certificate Preview displays exact route: '1. Class Advisor (Student's Section) → 2. Head of Department (CSE) → 3. Principal'");
      assert(previewBonafide.principalArrowVisible === true, "Bonafide Preview Principal arrow is VISIBLE");
      assert(previewBonafide.principalRouteVisible === true, "Bonafide Preview Principal route span is VISIBLE");
      assert(previewBonafide.principalRouteText === '3. Principal', "Bonafide Preview Principal text is strictly '3. Principal'");
      assert(previewBonafide.principalBlockDisplay === 'block', "Bonafide Preview Principal verification block is VISIBLE (display: block)");

      // TEST 8F: Check Modal Banners in leaveModal and bonafideModal
      console.log("  Testing Modal route banners in leaveModal and bonafideModal...");
      const modalBanners = await evalScript(`
        (() => {
          const leaveBanner = document.getElementById('leaveApprovalRouteBanner');
          const bonafideBanner = document.getElementById('bonafideApprovalRouteBanner');
          return {
            leaveBanner: leaveBanner ? leaveBanner.innerText.trim().replace(/\\s+/g, ' ') : '',
            bonafideBanner: bonafideBanner ? bonafideBanner.innerText.trim().replace(/\\s+/g, ' ') : ''
          };
        })()
      `);

      assert(modalBanners.leaveBanner.includes("1. Class Advisor (Student's Section) → 2. Head of Department (CSE)"),
        "Leave Modal banner displays: '1. Class Advisor (Student's Section) → 2. Head of Department (CSE)'");
      assert(modalBanners.bonafideBanner.includes("1. Class Advisor (Student's Section) → 2. Head of Department (CSE) → 3. Principal"),
        "Bonafide Modal banner displays: '1. Class Advisor (Student's Section) → 2. Head of Department (CSE) → 3. Principal'");

      ws.close();
    } finally {
      browserProc.kill();
    }

    console.log("\n================================================================================");
    console.log(`   FINAL SUMMARY: ${passed} / ${total} TESTS PASSED`);
    console.log("================================================================================");

    if (passed === total) {
      console.log("🎉 ALL TESTS PASSED! Student Request Approval Routes and Preview Forms are 100% verified.");
      process.exit(0);
    } else {
      console.error(`❌ ${total - passed} TESTS FAILED.`);
      process.exit(1);
    }

  } catch (err) {
    console.error("Test execution failed with exception:", err);
    process.exit(1);
  }
}

run();
