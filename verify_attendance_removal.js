/**
 * Verification Script: EPOCH Student Dashboard - Attendance Section Removal
 * Validates:
 * 1. Attendance & End-Sem Exam Eligibility card is completely absent.
 * 2. Circular progress gauge, hours, threshold, safe leaves headroom, and personal attendance text are absent.
 * 3. Student profile banner (name, reg no, department, section) is intact.
 * 4. All primary action buttons are intact:
 *    - Apply for OD
 *    - Apply for Leave
 *    - Bonafide Certificate
 *    - Track My Requests
 *    - Confidential Complaint to Principal
 * 5. Student metrics grid (Pending Approvals, Approved ODs, Rejected ODs, Direct Complaints) is intact.
 * 6. Sidebar, navigation, Messages, Announcements, and Notifications are intact.
 */

const { spawn } = require('child_process');
const http = require('http');

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function findEdgePath() {
  const possiblePaths = [
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    process.env.LOCALAPPDATA + '\\Microsoft\\Edge\\Application\\msedge.exe'
  ];
  const fs = require('fs');
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) return p;
  }
  return 'msedge.exe';
}

function getJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

let passedTests = 0;
let totalTests = 0;

function assert(condition, testName) {
  totalTests++;
  if (condition) {
    console.log(`  ✅ [PASS] ${testName}`);
    passedTests++;
  } else {
    console.error(`  ❌ [FAIL] ${testName}`);
  }
}

async function run() {
  console.log("================================================================================");
  console.log("   EPOCH VERIFICATION - ATTENDANCE & EXAM ELIGIBILITY SECTION REMOVAL           ");
  console.log("================================================================================");

  const port = 9334;
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
    await sleep(2000);
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
      } else if (msg.method === 'Runtime.consoleAPICalled') {
        console.log('[BROWSER CONSOLE]', msg.params.type, msg.params.args.map(a => a.value || a.description || JSON.stringify(a)).join(' '));
      } else if (msg.method === 'Runtime.exceptionThrown') {
        console.error('[BROWSER EXCEPTION]', msg.params.exceptionDetails);
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
      const res = await cdp('Runtime.evaluate', {
        expression,
        returnByValue: true,
        awaitPromise: true
      });
      if (res && res.exceptionDetails) {
        console.error('evalScript exception:', JSON.stringify(res.exceptionDetails));
      }
      if (res && res.result) return res.result.value;
      return null;
    }

    // 1. Navigate to EPOCH
    await cdp('Page.navigate', { url: 'http://localhost:8080/#login' });
    await sleep(1500);

    // 2. Authenticate as Student (620823104002)
    console.log("\n--- 1. Authenticating Student Session ---");
    await evalScript(`
      (async () => {
        App.selectRole('student');
        await Auth.login('student', '620823104002', 'student@12');
        App.checkSession();
      })()
    `);
    await sleep(1500);

    const user = await evalScript(`window.Auth ? Auth.getUser() : null`);
    assert(user && user.identifier === '620823104002', `Logged in as student ${user?.name} (${user?.identifier})`);

    // Ensure dashboard tab is active and student portal is initialized
    await evalScript(`
      (async () => {
        App.switchTab('dashboard');
        if (window.StudentPortal) await StudentPortal.init(Auth.getUser());
      })()
    `);
    await sleep(1000);

    // 3. Verify complete removal of Attendance & Exam Eligibility Card
    console.log("\n--- 2. Verifying Removal of Attendance Section ---");
    const attWidgetElement = await evalScript(`document.getElementById('studentAttendanceWidget') !== null`);
    assert(!attWidgetElement, "Element #studentAttendanceWidget is completely removed from DOM");

    const attIllustrationBox = await evalScript(`document.querySelector('.attendance-illustration-box') !== null`);
    assert(!attIllustrationBox, "Container .attendance-illustration-box is absent from student view");

    const gaugeSvgWrap = await evalScript(`document.querySelector('.gauge-svg-wrap') !== null`);
    assert(!gaugeSvgWrap, "Circular attendance gauge (.gauge-svg-wrap) is absent");

    const gaugeText = await evalScript(`document.querySelector('.gauge-percentage-text') !== null`);
    assert(!gaugeText, "Attendance percentage text (.gauge-percentage-text) is absent");

    const hasAttendanceHeader = await evalScript(`
      Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, div')).some(el =>
        el.textContent.includes('Attendance & End-Sem Exam Eligibility')
      )
    `);
    assert(!hasAttendanceHeader, "Heading 'Attendance & End-Sem Exam Eligibility' is nowhere on the page");

    const hasAnnaUnivThreshold = await evalScript(`
      Array.from(document.querySelectorAll('#studentDashboard p, #studentDashboard span, #studentDashboard div')).some(el =>
        el.textContent.includes('Anna University Minimum Threshold')
      )
    `);
    assert(!hasAnnaUnivThreshold, "Anna University Minimum Threshold (75.0%) is not rendered");

    const hasSafeLeaveHeadroom = await evalScript(`
      Array.from(document.querySelectorAll('#studentDashboard p, #studentDashboard span, #studentDashboard div')).some(el =>
        el.textContent.includes('Safe Leave Headroom')
      )
    `);
    assert(!hasSafeLeaveHeadroom, "Safe Leave Headroom information is not rendered");

    const hasPersonalRecord = await evalScript(`
      Array.from(document.querySelectorAll('#studentDashboard p, #studentDashboard span, #studentDashboard div')).some(el =>
        el.textContent.includes('Personal Record: 620823104002')
      )
    `);
    assert(!hasPersonalRecord, "Personal attendance record line is not rendered");

    // 4. Verify Student Profile Section is Intact
    console.log("\n--- 3. Verifying Student Profile Section Integrity ---");
    const profileName = await evalScript(`document.getElementById('studentNameBanner')?.textContent`);
    assert(profileName && profileName.includes('ABINAYA G'), `Student Name banner preserved: "${profileName}"`);

    const profileMeta = await evalScript(`document.getElementById('studentMetaBanner')?.textContent`);
    assert(profileMeta && profileMeta.includes('620823104002') && profileMeta.includes('CSE'),
      `Student Meta banner preserved: "${profileMeta}"`);

    // 5. Verify Student Action Buttons are Intact
    console.log("\n--- 4. Verifying Student Dashboard Action Buttons ---");
    const actionButtons = await evalScript(`
      Array.from(document.querySelectorAll('#studentView button')).map(b => b.textContent.trim())
    `);
    
    assert(actionButtons && actionButtons.some(t => t.includes('Apply for OD') || t.includes('Apply for On-Duty')), "Button 'Apply for OD' present");
    assert(actionButtons && actionButtons.some(t => t.includes('Apply for Leave')), "Button 'Apply for Leave' present");
    assert(actionButtons && actionButtons.some(t => t.includes('Bonafide Certificate')), "Button 'Bonafide Certificate' present");
    assert(actionButtons && actionButtons.some(t => t.includes('Track My Requests')), "Button 'Track My Requests' present");
    assert(actionButtons && actionButtons.some(t => t.includes('Confidential Complaint to Principal')), "Button 'Confidential Complaint to Principal' present");

    // 6. Verify Metrics Grid is Intact
    console.log("\n--- 5. Verifying Student Metrics Grid Integrity ---");
    const metricsExist = await evalScript(`
      Boolean(
        document.getElementById('stMetricPending') &&
        document.getElementById('stMetricApproved') &&
        document.getElementById('stMetricRejected') &&
        document.getElementById('stMetricComplaints')
      )
    `);
    assert(metricsExist, "All 4 student metric cards (Pending, Approved, Rejected, Complaints) present");

    // 7. Verify Sidebar and Navigation Integrity
    console.log("\n--- 6. Verifying Navigation & Sidebar Integrity ---");
    const sidebarItems = await evalScript(`
      Array.from(document.querySelectorAll('.sidebar-menu .sidebar-link')).map(el => el.textContent.trim())
    `);
    assert(sidebarItems.some(i => i.includes('Dashboard')), "Sidebar 'Dashboard' nav item present");
    assert(sidebarItems.some(i => i.includes('Institutional Messages') || i.includes('Messages')), "Sidebar 'Messages' nav item present");
    assert(sidebarItems.some(i => i.includes('Announcements')), "Sidebar 'Announcements' nav item present");
    assert(sidebarItems.some(i => i.includes('Direct Grievances')), "Sidebar 'Direct Grievances' nav item present");

    // 8. Verify Modals Open Correctly
    console.log("\n--- 7. Verifying Modal Functional Openers ---");
    const odModalOpens = await evalScript(`
      (() => {
        StudentPortal.openOdModal();
        const m = document.getElementById('odModal');
        const isOpen = m && (m.style.display === 'flex' || m.style.display === 'block');
        StudentPortal.closeOdModal();
        return isOpen;
      })()
    `);
    assert(odModalOpens, "Apply for OD modal opens and operates correctly");

    const complaintModalOpens = await evalScript(`
      (() => {
        StudentPortal.openComplaintModal();
        const m = document.getElementById('complaintModal');
        const isOpen = m && (m.style.display === 'flex' || m.style.display === 'block');
        StudentPortal.closeComplaintModal();
        return isOpen;
      })()
    `);
    assert(complaintModalOpens, "Confidential Complaint modal opens and operates correctly");

    console.log("\n================================================================================");
    console.log(`   SUITE COMPLETE: ${passedTests} / ${totalTests} TESTS PASSED (${Math.round((passedTests/totalTests)*100)}%)   `);
    console.log("================================================================================");

    ws.close();
  } catch (err) {
    console.error("Test execution failed:", err);
  } finally {
    browserProc.kill();
  }
}

run();
