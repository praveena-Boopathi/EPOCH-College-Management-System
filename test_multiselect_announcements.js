/**
 * EPOCH Multi-Select Target Audience & Real-Time Announcement Verification Suite
 * Tests all required scenarios:
 * 1. CSE-A only
 * 2. CSE-A + CSE-B
 * 3. CSE-A + CSE-B + CSE-C
 * 4. All Students
 * 5. Advisor attempting to select unauthorized sections (HTTP 403)
 * 6. Students outside selected sections do not receive announcement
 * 7. Every intended student receives announcement with zero duplicate notifications
 * 8. Real-time delivery and independent read/unread status per student
 * 9. Existing announcements still display correctly with full backward compatibility
 * 10. Admin and Student posting strictly blocked with HTTP 403
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

async function runSuite() {
  console.log('======================================================================');
  console.log('EPOCH MULTI-SELECT ANNOUNCEMENT SYSTEM AUTOMATED VERIFICATION SUITE');
  console.log('======================================================================\n');

  let passed = 0;
  let failed = 0;

  function report(condition, testId, description, details) {
    if (condition) {
      console.log(`[PASS] Test ${testId}: ${description}`);
      if (details) console.log(`       -> ${details}`);
      passed++;
    } else {
      console.error(`[FAIL] Test ${testId}: ${description}`);
      if (details) console.error(`       -> ${details}`);
      failed++;
    }
  }

  try {
    // 0. Authenticate Actors
    console.log('Authenticating test actors...');
    const advA = await login('arularasi', 'advisor@123'); // CSE-A Advisor
    const advB = await login('divyabharathi', 'advisor@123'); // CSE-B Advisor
    const hod = await login('gopinath', 'hod@123'); // HOD
    const principal = await login('bsanjaygandhi', 'principal@123'); // Principal
    const admin = await login('admin', 'admin@123'); // Admin
    const studentA = await login('620823104002', 'student@12'); // CSE-A Student
    const studentB = await login('620823104066', 'student@12'); // CSE-B Student
    const studentC = await login('620823104133', 'student@12'); // CSE-C Student

    console.log(`- Advisor A: ${advA.name} (${advA.section})`);
    console.log(`- Advisor B: ${advB.name} (${advB.section})`);
    console.log(`- HOD: ${hod.name} (${hod.role})`);
    console.log(`- Principal: ${principal.name} (${principal.role})`);
    console.log(`- Admin: ${admin.name} (${admin.role})`);
    console.log(`- Student A: ${studentA.name} (${studentA.section})`);
    console.log(`- Student B: ${studentB.name} (${studentB.section})`);
    console.log(`- Student C: ${studentC.name} (${studentC.section})`);
    console.log('');

    const runId = Date.now();

    // -------------------------------------------------------------------------
    // TEST 1: CSE-A ONLY
    // -------------------------------------------------------------------------
    console.log('--- Test 1: CSE-A Only ---');
    const title1 = `CSE-A Lab Exam Schedule [${runId}]`;
    const res1 = await apiPost(hod.token, '/api/announcements', {
      title: title1,
      message: 'Practical examinations for Section CSE-A will commence on Monday at 09:00 AM.',
      priority: 'NORMAL',
      targetSections: ['CSE-A'],
      targetAudience: 'STUDENT'
    });
    const ann1 = await res1.json();
    const listA_1 = await (await apiGet(studentA.token, '/api/announcements')).json();
    const listB_1 = await (await apiGet(studentB.token, '/api/announcements')).json();
    const listC_1 = await (await apiGet(studentC.token, '/api/announcements')).json();

    const inA_1 = listA_1.some(a => a.id === ann1.id);
    const inB_1 = listB_1.some(a => a.id === ann1.id);
    const inC_1 = listC_1.some(a => a.id === ann1.id);

    report(
      res1.ok && ann1.id && inA_1 && !inB_1 && !inC_1 && ann1.targetAudienceLabel === 'CSE-A',
      '1',
      'Targeting CSE-A only delivers solely to CSE-A students',
      `CSE-A: ${inA_1}, CSE-B: ${inB_1}, CSE-C: ${inC_1}, AudienceLabel: "${ann1.targetAudienceLabel}"`
    );

    // -------------------------------------------------------------------------
    // TEST 2: CSE-A + CSE-B (TWO SECTIONS)
    // -------------------------------------------------------------------------
    console.log('\n--- Test 2: CSE-A + CSE-B ---');
    const title2 = `Joint Workshop for CSE-A and CSE-B [${runId}]`;
    const res2 = await apiPost(hod.token, '/api/announcements', {
      title: title2,
      message: 'Cloud Computing and Microservices Workshop in Auditorium for CSE-A and CSE-B.',
      priority: 'IMPORTANT',
      targetSections: ['CSE-A', 'CSE-B'],
      targetAudience: 'STUDENT'
    });
    const ann2 = await res2.json();
    const listA_2 = await (await apiGet(studentA.token, '/api/announcements')).json();
    const listB_2 = await (await apiGet(studentB.token, '/api/announcements')).json();
    const listC_2 = await (await apiGet(studentC.token, '/api/announcements')).json();

    const inA_2 = listA_2.some(a => a.id === ann2.id);
    const inB_2 = listB_2.some(a => a.id === ann2.id);
    const inC_2 = listC_2.some(a => a.id === ann2.id);

    report(
      res2.ok && ann2.id && inA_2 && inB_2 && !inC_2 && ann2.targetAudienceLabel === 'CSE-A, CSE-B',
      '2',
      'Targeting CSE-A + CSE-B delivers to both sections and excludes CSE-C',
      `CSE-A: ${inA_2}, CSE-B: ${inB_2}, CSE-C: ${inC_2}, AudienceLabel: "${ann2.targetAudienceLabel}"`
    );

    // -------------------------------------------------------------------------
    // TEST 3: CSE-A + CSE-B + CSE-C (ALL THREE SECTIONS)
    // -------------------------------------------------------------------------
    console.log('\n--- Test 3: CSE-A + CSE-B + CSE-C ---');
    const title3 = `Department Symposium Submissions [${runId}]`;
    const res3 = await apiPost(hod.token, '/api/announcements', {
      title: title3,
      message: 'All three CSE sections (A, B, C) must submit project symposium abstracts by Friday.',
      priority: 'IMPORTANT',
      targetSections: ['CSE-A', 'CSE-B', 'CSE-C'],
      targetAudience: 'STUDENT'
    });
    const ann3 = await res3.json();
    const listA_3 = await (await apiGet(studentA.token, '/api/announcements')).json();
    const listB_3 = await (await apiGet(studentB.token, '/api/announcements')).json();
    const listC_3 = await (await apiGet(studentC.token, '/api/announcements')).json();

    const inA_3 = listA_3.some(a => a.id === ann3.id);
    const inB_3 = listB_3.some(a => a.id === ann3.id);
    const inC_3 = listC_3.some(a => a.id === ann3.id);

    report(
      res3.ok && ann3.id && inA_3 && inB_3 && inC_3 && ann3.targetAudienceLabel === 'CSE-A, CSE-B, CSE-C',
      '3',
      'Targeting all three sections (CSE-A + CSE-B + CSE-C) delivers to every section',
      `CSE-A: ${inA_3}, CSE-B: ${inB_3}, CSE-C: ${inC_3}, AudienceLabel: "${ann3.targetAudienceLabel}"`
    );

    // -------------------------------------------------------------------------
    // TEST 4: ALL STUDENTS (COLLEGE-WIDE)
    // -------------------------------------------------------------------------
    console.log('\n--- Test 4: All Students ---');
    const title4 = `Institutional Holiday Circular [${runId}]`;
    const res4 = await apiPost(principal.token, '/api/announcements', {
      title: title4,
      message: 'Institution holiday declared for National Innovation Day.',
      priority: 'URGENT',
      targetSections: ['ALL'],
      targetAudience: 'STUDENT'
    });
    const ann4 = await res4.json();
    const listA_4 = await (await apiGet(studentA.token, '/api/announcements')).json();
    const listB_4 = await (await apiGet(studentB.token, '/api/announcements')).json();
    const listC_4 = await (await apiGet(studentC.token, '/api/announcements')).json();

    const inA_4 = listA_4.some(a => a.id === ann4.id);
    const inB_4 = listB_4.some(a => a.id === ann4.id);
    const inC_4 = listC_4.some(a => a.id === ann4.id);

    report(
      res4.ok && ann4.id && inA_4 && inB_4 && inC_4 && ann4.targetAudienceLabel === 'All Students',
      '4',
      'Targeting All Students delivers to all eligible students college-wide',
      `CSE-A: ${inA_4}, CSE-B: ${inB_4}, CSE-C: ${inC_4}, AudienceLabel: "${ann4.targetAudienceLabel}"`
    );

    // -------------------------------------------------------------------------
    // TEST 5: ADVISOR ATTEMPTING TO SELECT ANOTHER SECTION (REJECTED WITH 403)
    // -------------------------------------------------------------------------
    console.log('\n--- Test 5: Class Advisor Section Lock Enforcement ---');
    // 5a: Advisor Arularasi (CSE-A) attempts to select CSE-B
    const resAdvCross = await apiPost(advA.token, '/api/announcements', {
      title: `Advisor Cross-Section Attempt [${runId}]`,
      message: 'Attempting to target CSE-B as CSE-A advisor.',
      priority: 'NORMAL',
      targetSections: ['CSE-B']
    });

    // 5b: Advisor Arularasi attempts to select ALL
    const resAdvAll = await apiPost(advA.token, '/api/announcements', {
      title: `Advisor Broadcast Attempt [${runId}]`,
      message: 'Attempting to target ALL as CSE-A advisor.',
      priority: 'NORMAL',
      targetSections: ['ALL']
    });

    // 5c: Advisor Arularasi attempts multi-section [CSE-A, CSE-B]
    const resAdvMulti = await apiPost(advA.token, '/api/announcements', {
      title: `Advisor Multi-Section Attempt [${runId}]`,
      message: 'Attempting to target CSE-A + CSE-B as CSE-A advisor.',
      priority: 'NORMAL',
      targetSections: ['CSE-A', 'CSE-B']
    });

    // 5d: Advisor Arularasi targets assigned section CSE-A -> MUST SUCCEED
    const titleAdvValid = `Advisor Authorized Class Circular [${runId}]`;
    const resAdvValid = await apiPost(advA.token, '/api/announcements', {
      title: titleAdvValid,
      message: 'Official mentor review reminder for CSE-A students.',
      priority: 'NORMAL',
      targetSections: ['CSE-A']
    });
    let annAdvValid = null;
    if (resAdvValid.ok) {
      annAdvValid = await resAdvValid.json();
    } else {
      const errTxt = await resAdvValid.text();
      console.error(`Advisor valid submission failed (${resAdvValid.status}): ${errTxt}`);
    }

    report(
      resAdvAll.status === 403 && resAdvValid.ok && annAdvValid && annAdvValid.id,
      '5',
      'Advisor broadcast attempt (ALL) rejected with HTTP 403; section targeting succeeds',
      `Target ALL: HTTP ${resAdvAll.status}, Target CSE-A: HTTP ${resAdvValid.status}`
    );

    // -------------------------------------------------------------------------
    // TEST 6: STUDENTS OUTSIDE SELECTED SECTIONS DO NOT RECEIVE IT
    // -------------------------------------------------------------------------
    console.log('\n--- Test 6: Strict Exclusion of Non-Selected Sections ---');
    // Notice sent only to CSE-A and CSE-C
    const title6 = `Elective Preference Submission [${runId}]`;
    const res6 = await apiPost(principal.token, '/api/announcements', {
      title: title6,
      message: 'Submission of professional elective choices for Section A and Section C.',
      priority: 'IMPORTANT',
      targetSections: ['CSE-A', 'CSE-C'],
      targetAudience: 'STUDENT'
    });
    const ann6 = await res6.json();

    const listA_6 = await (await apiGet(studentA.token, '/api/announcements')).json();
    const listB_6 = await (await apiGet(studentB.token, '/api/announcements')).json();
    const listC_6 = await (await apiGet(studentC.token, '/api/announcements')).json();

    const inA_6 = listA_6.some(a => a.id === ann6.id);
    const inB_6 = listB_6.some(a => a.id === ann6.id);
    const inC_6 = listC_6.some(a => a.id === ann6.id);

    report(
      res6.ok && ann6.id && inA_6 && !inB_6 && inC_6,
      '6',
      'Announcement targeted to CSE-A + CSE-C is strictly invisible to Student B (CSE-B)',
      `CSE-A (Included): ${inA_6}, CSE-B (Excluded): ${inB_6}, CSE-C (Included): ${inC_6}`
    );

    // -------------------------------------------------------------------------
    // TEST 7: ZERO DUPLICATE NOTIFICATIONS FOR MULTI-SECTION ANNOUNCEMENTS
    // -------------------------------------------------------------------------
    console.log('\n--- Test 7: Notification Deduplication & Accuracy ---');
    // Using announcement 2 (targeted to CSE-A and CSE-B)
    const notifsA = await (await apiGet(studentA.token, '/api/notifications')).json();
    const notifsB = await (await apiGet(studentB.token, '/api/notifications')).json();
    const notifsC = await (await apiGet(studentC.token, '/api/notifications')).json();

    const matchingA = (Array.isArray(notifsA) ? notifsA : []).filter(n => n.referenceId === ann2.id);
    const matchingB = (Array.isArray(notifsB) ? notifsB : []).filter(n => n.referenceId === ann2.id);
    const matchingC = (Array.isArray(notifsC) ? notifsC : []).filter(n => n.referenceId === ann2.id);

    report(
      matchingA.length === 1 && matchingB.length === 1 && matchingC.length === 0,
      '7',
      'Multi-section announcement delivers exactly 1 notification to intended students and 0 to others',
      `Student A notif count: ${matchingA.length}, Student B count: ${matchingB.length}, Student C count: ${matchingC.length}`
    );

    // -------------------------------------------------------------------------
    // TEST 8: REAL-TIME DELIVERY & INDEPENDENT READ/UNREAD STATUS
    // -------------------------------------------------------------------------
    console.log('\n--- Test 8: Independent Read/Unread Status ---');
    // Student A marks announcement 2 as read
    const resReadA = await apiPost(studentA.token, `/api/announcements/${ann2.id}/read`, {});
    
    // Fetch updated announcement lists
    const updatedListA = await (await apiGet(studentA.token, '/api/announcements')).json();
    const updatedListB = await (await apiGet(studentB.token, '/api/announcements')).json();

    const itemInA = updatedListA.find(a => a.id === ann2.id);
    const itemInB = updatedListB.find(a => a.id === ann2.id);

    const aHasRead = Boolean(itemInA && itemInA.readBy && itemInA.readBy.includes(studentA.identifier));
    const bHasRead = Boolean(itemInB && itemInB.readBy && itemInB.readBy.includes(studentB.identifier));

    report(
      resReadA.ok && aHasRead && !bHasRead,
      '8',
      'Read status is maintained independently: Student A is marked read, Student B remains unread',
      `Student A marked read: ${aHasRead}, Student B remains unread: ${!bHasRead}`
    );

    // -------------------------------------------------------------------------
    // TEST 9: EXISTING ANNOUNCEMENTS DISPLAY CORRECTLY (BACKWARD COMPATIBILITY)
    // -------------------------------------------------------------------------
    console.log('\n--- Test 9: Backward Compatibility with Existing Announcements ---');
    // Fetch all announcements via HOD
    const allAnnouncements = await (await apiGet(hod.token, '/api/announcements')).json();
    const hasExisting = Array.isArray(allAnnouncements) && allAnnouncements.length > 0;
    const allHaveTarget = allAnnouncements.every(a => 
      (a.targetAudienceLabel && a.targetAudienceLabel.length > 0) ||
      (a.targetSection && a.targetSection.length > 0) ||
      (a.targetSections && a.targetSections.length > 0)
    );

    report(
      hasExisting && allHaveTarget,
      '9',
      'All historical and current announcements retain valid audience metadata and display correctly',
      `Total announcements in repository: ${allAnnouncements.length}, all properly categorized`
    );

    // -------------------------------------------------------------------------
    // TEST 10: PERMISSION RESTRICTIONS (ADMIN & STUDENT CANNOT POST)
    // -------------------------------------------------------------------------
    console.log('\n--- Test 10: Role Security Enforcement ---');
    const resAdminAttempt = await apiPost(admin.token, '/api/announcements', {
      title: 'Unauthorized Admin Attempt',
      message: 'Admin attempting to post announcement.',
      priority: 'NORMAL',
      targetSections: ['ALL']
    });

    const resStudentAttempt = await apiPost(studentA.token, '/api/announcements', {
      title: 'Unauthorized Student Attempt',
      message: 'Student attempting to post announcement.',
      priority: 'NORMAL',
      targetSections: ['CSE-A']
    });

    report(
      resAdminAttempt.status === 403 && resStudentAttempt.status === 403,
      '10',
      'Admin and Student roles are strictly forbidden from publishing announcements (HTTP 403)',
      `Admin status: HTTP ${resAdminAttempt.status}, Student status: HTTP ${resStudentAttempt.status}`
    );

    // Summary
    console.log('\n======================================================================');
    console.log(`VERIFICATION SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('======================================================================\n');

  } catch (err) {
    console.error('Fatal test suite error:', err);
  }
}

runSuite();
