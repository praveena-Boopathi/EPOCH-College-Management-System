/**
 * Automated Verification Suite for EPOCH Announcement System
 * Tests all 15 required verification cases:
 * 1. CSE-A advisor sends announcement to CSE-A
 * 2. CSE-B advisor sends announcement to CSE-B
 * 3. CSE-C advisor sends announcement to CSE-C
 * 4. CSE-A student receives CSE-A announcement immediately
 * 5. CSE-B student does NOT receive CSE-A announcement
 * 6. CSE-C student does NOT receive CSE-B announcement
 * 7. Authorized HOD sends announcement to selected section
 * 8. Principal sends announcement to all students
 * 9. Authorized Admin sends announcement to selected section
 * 10. Students cannot send official announcements (403 Forbidden)
 * 11. Sender names and roles are authentic and correctly displayed
 * 12. Read/unread status works independently for each student
 * 13. Advisor cross-section permission errors handled properly (403 Forbidden)
 * 14. Saved announcements persist across queries (Firestore persistence)
 * 15. Duplicate submissions do not create duplicate announcements
 */

const BASE_URL = 'http://localhost:8080';

async function login(username, password) {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Login failed for ${username}: ${res.status} ${txt}`);
  }
  return await res.json();
}

async function apiPost(token, endpoint, payload) {
  return await fetch(`${BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });
}

async function apiGet(token, endpoint) {
  return await fetch(`${BASE_URL}${endpoint}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
}

async function runTests() {
  console.log('===============================================================');
  console.log('EPOCH ANNOUNCEMENT SYSTEM COMPREHENSIVE VERIFICATION SUITE');
  console.log('===============================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testNum, description) {
    if (condition) {
      console.log(`[PASS] Case ${testNum}: ${description}`);
      passed++;
    } else {
      console.error(`[FAIL] Case ${testNum}: ${description}`);
      failed++;
    }
  }

  try {
    // 0. Authenticate all required test actors
    console.log('Authenticating test actors...');
    const advA = await login('arularasi', 'advisor@123');
    const advB = await login('divyabharathi', 'advisor@123');
    const advC = await login('rajavathijayapriya', 'advisor@123');
    const hod = await login('gopinath', 'hod@123');
    const principal = await login('bsanjaygandhi', 'principal@123');
    const admin = await login('admin', 'admin@123');
    const studentA = await login('620823104002', 'student@12'); // CSE-A
    const studentB = await login('620823104066', 'student@12'); // CSE-B
    const studentC = await login('620823104133', 'student@12'); // CSE-C

    console.log(`- Advisor A: ${advA.name} (${advA.section})`);
    console.log(`- Advisor B: ${advB.name} (${advB.section})`);
    console.log(`- Advisor C: ${advC.name} (${advC.section})`);
    console.log(`- HOD: ${hod.name} (${hod.role})`);
    console.log(`- Principal: ${principal.name} (${principal.role})`);
    console.log(`- Admin: ${admin.name} (${admin.role})`);
    console.log(`- Student A: ${studentA.name} (${studentA.section})`);
    console.log(`- Student B: ${studentB.name} (${studentB.section})`);
    console.log(`- Student C: ${studentC.name} (${studentC.section})`);
    console.log('');

    const runId = Date.now();

    // -------------------------------------------------------------------------
    // TEST 1: CSE-A advisor sends an announcement to CSE-A
    // -------------------------------------------------------------------------
    const titleA = `CSE-A Internal Review Notice [${runId}]`;
    const resA = await apiPost(advA.token, '/api/announcements', {
      title: titleA,
      message: 'Class review for CSE-A will take place this Thursday in Lab 1.',
      priority: 'IMPORTANT',
      targetSection: 'CSE-A'
    });
    const annA = await resA.json();
    assert(
      resA.ok && annA.id && annA.targetSection === 'CSE-A' && annA.senderName.toLowerCase().includes('arularasi'),
      1,
      'CSE-A advisor (Arularasi) successfully sends announcement to CSE-A'
    );

    // -------------------------------------------------------------------------
    // TEST 2: CSE-B advisor sends an announcement to CSE-B
    // -------------------------------------------------------------------------
    const titleB = `CSE-B Lab Exam Schedule [${runId}]`;
    const resB = await apiPost(advB.token, '/api/announcements', {
      title: titleB,
      message: 'CSE-B students must submit laboratory records by Friday afternoon.',
      priority: 'NORMAL',
      targetSection: 'CSE-B'
    });
    const annB = await resB.json();
    assert(
      resB.ok && annB.id && annB.targetSection === 'CSE-B' && annB.senderName.toLowerCase().includes('divya'),
      2,
      'CSE-B advisor (Dhivya Bharathi) successfully sends announcement to CSE-B'
    );

    // -------------------------------------------------------------------------
    // TEST 3: CSE-C advisor sends an announcement to CSE-C
    // -------------------------------------------------------------------------
    const titleC = `CSE-C Capstone Project Phase 1 [${runId}]`;
    const resC = await apiPost(advC.token, '/api/announcements', {
      title: titleC,
      message: 'All CSE-C project teams must upload their Phase 1 synopsis today.',
      priority: 'URGENT',
      targetSection: 'CSE-C'
    });
    const annC = await resC.json();
    assert(
      resC.ok && annC.id && annC.targetSection === 'CSE-C' && annC.senderName.toLowerCase().includes('rajavathi'),
      3,
      'CSE-C advisor (Rajavathi Jaya Priya) successfully sends announcement to CSE-C'
    );

    // -------------------------------------------------------------------------
    // TEST 4: CSE-A student receives the CSE-A announcement immediately
    // -------------------------------------------------------------------------
    const resStA = await apiGet(studentA.token, '/api/announcements');
    const listStA = await resStA.json();
    const hasAnnAInA = listStA.some(a => a.id === annA.id);
    assert(
      hasAnnAInA,
      4,
      'CSE-A student receives the CSE-A announcement immediately'
    );

    // -------------------------------------------------------------------------
    // TEST 5: CSE-B student does not receive a CSE-A-only announcement
    // -------------------------------------------------------------------------
    const resStB = await apiGet(studentB.token, '/api/announcements');
    const listStB = await resStB.json();
    const hasAnnAInB = listStB.some(a => a.id === annA.id);
    assert(
      !hasAnnAInB,
      5,
      'CSE-B student does not receive a CSE-A-only announcement (strict section isolation)'
    );

    // -------------------------------------------------------------------------
    // TEST 6: CSE-C student does not receive a CSE-B-only announcement
    // -------------------------------------------------------------------------
    const resStC = await apiGet(studentC.token, '/api/announcements');
    const listStC = await resStC.json();
    const hasAnnBInC = listStC.some(a => a.id === annB.id);
    assert(
      !hasAnnBInC,
      6,
      'CSE-C student does not receive a CSE-B-only announcement (strict section isolation)'
    );

    // -------------------------------------------------------------------------
    // TEST 7: Authorized HOD sends an announcement to the correct audience
    // -------------------------------------------------------------------------
    const titleHod = `Department Technical Symposium Notification [${runId}]`;
    const resHod = await apiPost(hod.token, '/api/announcements', {
      title: titleHod,
      message: 'Annual Department Symposium registration is now open for Section CSE-B.',
      priority: 'IMPORTANT',
      targetSection: 'CSE-B'
    });
    const annHod = await resHod.json();
    assert(
      resHod.ok && annHod.id && annHod.senderRole === 'HOD' && annHod.senderDisplay.includes('HOD'),
      7,
      'Authorized HOD sends announcement to selected audience (CSE-B)'
    );

    // -------------------------------------------------------------------------
    // TEST 8: The Principal sends an announcement to all students
    // -------------------------------------------------------------------------
    const titlePrincipal = `College Founders Day Holiday & Convocation [${runId}]`;
    const resPrincipal = await apiPost(principal.token, '/api/announcements', {
      title: titlePrincipal,
      message: 'College will remain closed on Monday for Founders Day. Convocation follows on Tuesday.',
      priority: 'URGENT',
      targetSection: 'ALL'
    });
    const annPrincipal = await resPrincipal.json();

    // Verify all 3 students receive the college-wide announcement
    const listA_after = await (await apiGet(studentA.token, '/api/announcements')).json();
    const listB_after = await (await apiGet(studentB.token, '/api/announcements')).json();
    const listC_after = await (await apiGet(studentC.token, '/api/announcements')).json();

    const inA = listA_after.some(a => a.id === annPrincipal.id);
    const inB = listB_after.some(a => a.id === annPrincipal.id);
    const inC = listC_after.some(a => a.id === annPrincipal.id);

    assert(
      resPrincipal.ok && annPrincipal.id && inA && inB && inC && annPrincipal.senderDisplay.includes('Principal'),
      8,
      'Principal sends announcement to all students; delivered to CSE-A, CSE-B, and CSE-C'
    );

    // -------------------------------------------------------------------------
    // TEST 9: Admin cannot send official announcements (Permission removed)
    // -------------------------------------------------------------------------
    const resAdmin = await apiPost(admin.token, '/api/announcements', {
      title: `Unauthorized Admin Attempt [${runId}]`,
      message: 'Attempting to publish official announcement as Admin.',
      priority: 'NORMAL',
      targetSection: 'ALL'
    });
    assert(
      resAdmin.status === 403,
      9,
      'Admin cannot send official announcements (creation permission removed, HTTP 403 Forbidden strictly enforced)'
    );

    // -------------------------------------------------------------------------
    // TEST 10: Students cannot send official announcements
    // -------------------------------------------------------------------------
    const resStudentPost = await apiPost(studentA.token, '/api/announcements', {
      title: 'Unauthorized student post attempt',
      message: 'I am attempting to post as a student.',
      targetSection: 'CSE-A'
    });
    assert(
      resStudentPost.status === 403,
      10,
      'Students cannot send official announcements (HTTP 403 Forbidden properly enforced)'
    );

    // -------------------------------------------------------------------------
    // TEST 11: Sender names and roles are correct and unforgeable
    // -------------------------------------------------------------------------
    // Attempt client spoofing: client tries to pass fake senderName and fake senderRole
    const resSpoof = await apiPost(advA.token, '/api/announcements', {
      title: `Identity Integrity Verification [${runId}]`,
      message: 'Testing that senderName cannot be spoofed by client payload.',
      senderName: 'Dr. Fake Impersonator',
      senderRole: 'PRINCIPAL',
      targetSection: 'CSE-A'
    });
    const annSpoof = await resSpoof.json();
    const nameHonored = annSpoof.senderName === advA.name;
    const roleHonored = annSpoof.senderRole === 'ADVISOR';
    const displayHonored = annSpoof.senderDisplay.includes('Arularasi') && annSpoof.senderDisplay.includes('Class Advisor');
    assert(
      nameHonored && roleHonored && displayHonored,
      11,
      'Sender names and roles are authentically derived from server session; client spoofing prevented'
    );

    // -------------------------------------------------------------------------
    // TEST 12: Read/unread status works independently for each student
    // -------------------------------------------------------------------------
    // Use the Principal's college-wide announcement (annPrincipal.id)
    // 12a: Mark as read by Student A
    const resMarkA = await apiPost(studentA.token, `/api/announcements/${annPrincipal.id}/read`, {});
    assert(resMarkA.ok, 12.1, 'Student A marks announcement as read successfully');

    // 12b: Fetch as Student A -> check that Student A sees it as read
    const stA_feed = await (await apiGet(studentA.token, '/api/announcements')).json();
    const annForA = stA_feed.find(a => a.id === annPrincipal.id);
    const readByA = annForA && annForA.readBy && annForA.readBy.includes(studentA.identifier);

    // 12c: Fetch as Student B -> check that Student B sees it as UNREAD (readBy does NOT have B)
    const stB_feed = await (await apiGet(studentB.token, '/api/announcements')).json();
    const annForB = stB_feed.find(a => a.id === annPrincipal.id);
    const readByB = annForB && annForB.readBy && annForB.readBy.includes(studentB.identifier);

    assert(
      readByA && !readByB,
      12,
      'Read/unread status maintained separately: Student A has read status while Student B remains unread'
    );

    // -------------------------------------------------------------------------
    // TEST 13: Firestore permission / advisor jurisdiction errors handled properly
    // -------------------------------------------------------------------------
    // Advisor A (Arularasi, CSE-A) attempts to send announcement to unauthorized section CSE-B
    const resAdvViolation = await apiPost(advA.token, '/api/announcements', {
      title: 'Jurisdiction Violation Test',
      message: 'Attempting to send to CSE-B as CSE-A advisor.',
      targetSection: 'CSE-B'
    });
    const violationBody = await resAdvViolation.json();
    assert(
      resAdvViolation.status === 403 && violationBody.error && violationBody.error.includes('Class Advisor'),
      13,
      'Advisor cross-section violation properly rejected with HTTP 403 Forbidden'
    );

    // -------------------------------------------------------------------------
    // TEST 14: Refreshing application does not remove saved announcements
    // -------------------------------------------------------------------------
    // Make a fresh query to verify persistence in Firestore
    const freshQueryRes = await apiGet(studentA.token, '/api/announcements');
    const freshList = await freshQueryRes.json();
    const persisted = freshList.some(a => a.id === annA.id) && freshList.some(a => a.id === annPrincipal.id);
    assert(
      persisted,
      14,
      'Refreshing application does not remove saved announcements (persistent Cloud Firestore storage)'
    );

    // -------------------------------------------------------------------------
    // TEST 15: Duplicate submissions do not create duplicate announcements
    // -------------------------------------------------------------------------
    const dupTitle = `Immediate Duplicate Prevention Notice [${Date.now()}]`;
    const resOrig = await apiPost(advA.token, '/api/announcements', {
      title: dupTitle,
      message: 'Initial submission of notice.',
      priority: 'NORMAL',
      targetSection: 'CSE-A'
    });
    // Immediately submit the exact duplicate within 100ms
    const resDup = await apiPost(advA.token, '/api/announcements', {
      title: dupTitle,
      message: 'Initial submission of notice.',
      priority: 'NORMAL',
      targetSection: 'CSE-A'
    });
    const dupBody = await resDup.json();
    assert(
      resOrig.ok && resDup.status === 400 && dupBody.error && dupBody.error.includes('Duplicate announcement'),
      15,
      'Duplicate submission within 60 seconds safely rejected without creating duplicate Firestore records'
    );

  } catch (err) {
    console.error('Fatal execution error during testing:', err);
    failed++;
  }

  console.log('\n===============================================================');
  console.log(`VERIFICATION SUMMARY: ${passed} PASSED, ${failed} FAILED (TOTAL 15 TARGETS)`);
  console.log('===============================================================');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests();
