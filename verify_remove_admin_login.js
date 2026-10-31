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

async function run() {
  console.log("================================================================================");
  console.log("   EPOCH - REMOVE ADMINISTRATOR LOGIN OPTION VERIFICATION SUITE                 ");
  console.log("================================================================================");

  // 1. Backend Authentication Still Works for All 4 Roles
  console.log("\n--- 1. Verifying Authentication Unaffected for Student, Advisor, HOD, Principal ---");
  for (const [roleName, user, pass] of [
    ['Student', '620823104002', 'student@12'],
    ['Advisor', 'arularasi', 'advisor@123'],
    ['HOD', 'gopinath', 'hod@123'],
    ['Principal', 'bsanjaygandhi', 'principal@123']
  ]) {
    try {
      const res = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user, password: pass })
      });
      const data = await res.json();
      assert(res.status === 200 && data.token, `${roleName} login successful with valid token`);
    } catch (e) {
      assert(false, `${roleName} login failed: ${e.message}`);
    }
  }

  // 2. Headless Browser Verification of Role Selection Grid
  console.log("\n--- 2. Headless Browser UI Role Selection Grid Verification ---");
  const CDP_PORT = 9338;
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

    // Verify localStorage cleared so login view is visible
    await evalScript(`
      (() => {
        localStorage.clear();
        sessionStorage.clear();
        location.reload();
      })()
    `);
    await sleep(2500);

    // Check Role cards count
    const cardCount = await evalScript(`document.querySelectorAll('.role-selection-grid .role-select-card').length`);
    assert(cardCount === 4, `Role selection grid contains exactly 4 cards (found: ${cardCount})`);

    // Verify Admin card is absent
    const adminBtnExists = await evalScript(`!!document.getElementById('roleBtnAdmin')`);
    assert(!adminBtnExists, `Administrator role button (#roleBtnAdmin) does not exist in the DOM`);

    const adminInGrid = await evalScript(`
      (() => {
        const grid = document.querySelector('.role-selection-grid');
        return grid ? grid.textContent.includes('Administrator') : false;
      })()
    `);
    assert(!adminInGrid, `No 'Administrator' text found in the role selection grid`);

    // Verify the remaining 4 cards
    const rolesPresent = await evalScript(`
      (() => {
        const titles = Array.from(document.querySelectorAll('.role-selection-grid .role-card-title')).map(e => e.textContent.trim());
        return titles;
      })()
    `);
    assert(rolesPresent && rolesPresent.length === 4, `4 role titles found: [${rolesPresent.join(', ')}]`);
    assert(rolesPresent.includes('Student'), `Student role card is present`);
    assert(rolesPresent.includes('Class Advisor'), `Class Advisor role card is present`);
    assert(rolesPresent.includes('Head of Department (HOD)'), `Head of Department (HOD) role card is present`);
    assert(rolesPresent.includes('Principal'), `Principal role card is present`);
    assert(!rolesPresent.includes('Administrator'), `Administrator is NOT among role cards`);

    // 3. Test Navigation & Role Selection for Remaining Roles
    console.log("\n--- 3. Testing Navigation & Login Form Opening for Supported Roles ---");

    // Student
    await evalScript(`document.getElementById('roleBtnStudent').click()`);
    await sleep(300);
    const studentFormVisible = await evalScript(`document.getElementById('roleLoginFormStep').style.display === 'block' && document.getElementById('loginRoleFormTitle').textContent === 'Student Sign-In'`);
    assert(studentFormVisible, `Clicking Student card opens 'Student Sign-In' form`);
    await evalScript(`App.backToRoleSelect()`);
    await sleep(300);

    // Advisor
    await evalScript(`document.getElementById('roleBtnAdvisor').click()`);
    await sleep(300);
    const advisorFormVisible = await evalScript(`document.getElementById('roleLoginFormStep').style.display === 'block' && document.getElementById('loginRoleFormTitle').textContent === 'Class Advisor Sign-In'`);
    assert(advisorFormVisible, `Clicking Class Advisor card opens 'Class Advisor Sign-In' form`);
    await evalScript(`App.backToRoleSelect()`);
    await sleep(300);

    // HOD
    await evalScript(`document.getElementById('roleBtnHod').click()`);
    await sleep(300);
    const hodFormVisible = await evalScript(`document.getElementById('roleLoginFormStep').style.display === 'block' && document.getElementById('loginRoleFormTitle').textContent === 'HOD Sign-In'`);
    assert(hodFormVisible, `Clicking HOD card opens 'HOD Sign-In' form`);
    await evalScript(`App.backToRoleSelect()`);
    await sleep(300);

    // Principal
    await evalScript(`document.getElementById('roleBtnPrincipal').click()`);
    await sleep(300);
    const principalFormVisible = await evalScript(`document.getElementById('roleLoginFormStep').style.display === 'block' && document.getElementById('loginRoleFormTitle').textContent === 'Principal Sign-In'`);
    assert(principalFormVisible, `Clicking Principal card opens 'Principal Sign-In' form`);
    await evalScript(`App.backToRoleSelect()`);
    await sleep(300);

    // 4. Test programmatic rejection of 'admin' in selectRole
    console.log("\n--- 4. Testing Programmatic Guard against 'admin' Role Selection ---");
    await evalScript(`App.selectRole('admin')`);
    await sleep(300);
    const formStepHidden = await evalScript(`document.getElementById('roleLoginFormStep').style.display === 'none'`);
    const roleStepStillVisible = await evalScript(`document.getElementById('roleSelectStep').style.display !== 'none'`);
    assert(formStepHidden && roleStepStillVisible, `Calling App.selectRole('admin') is blocked; role selection step remains active`);

    ws.close();
  } finally {
    browserProc.kill();
  }

  console.log("\n================================================================================");
  console.log(`   SUITE COMPLETE: ${passed} / ${total} TESTS PASSED (${Math.round((passed/total)*100)}%)   `);
  console.log("================================================================================");
}

run();
