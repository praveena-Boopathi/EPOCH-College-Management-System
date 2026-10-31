/**
 * EPOCH Staff Selectable Target Audience Verification Suite
 * Tests all requirements from:
 * "PROJECT: EPOCH — MAKE ANNOUNCEMENT TARGET AUDIENCE SELECTABLE BY STAFF"
 *
 * 1. Staff sends to CSE-A only
 * 2. Staff sends to CSE-A + CSE-B
 * 3. Staff sends to CSE-B + CSE-C
 * 4. Staff sends to All Three Sections (CSE-A + CSE-B + CSE-C)
 * 5. Staff cannot broadcast college-wide ("All Students") -> HTTP 403
 * 6. HOD permissions (authorized sections & college-wide)
 * 7. Principal permissions (any section combination & college-wide)
 * 8. Admin cannot send official announcements -> HTTP 403
 * 9. Students cannot send official announcements -> HTTP 403
 * 10. Notifications delivered without duplicates and per-student read/unread tracking
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
  console.log('======================================================================');
  console.log('EPOCH STAFF SELECTABLE TARGET AUDIENCE AUTOMATED VERIFICATION');
  console.log('======================================================================\n');

  let passed = 0;
  let failed = 0;

  function report(condition, testId, description, details) {
    if (condition) {
      console.log(`[PASS] Case ${testId}: ${description}`);
      if (details) console.log(`       -> ${details}`);
      passed++;
    } else {
      console.error(`[FAIL] Case ${testId}: ${description}`);
      if (details) console.error(`       -> ${details}`);
      failed++;
    }
  }

  try {
    console.log('Authenticating all required test actors...');
    const staffA = await login('arularasi', 'advisor@123'); // Staff / Advisor CSE-A
    const staffB = await login('divyabharathi', 'advisor@123'); // Staff / Advisor CSE-B
    const hod = await login('gopinath', 'hod@123'); // HOD
    const principal = await login('bsanjaygandhi', 'principal@123'); // Principal
    const admin = await login('admin', 'admin@123'); // Admin
    const studentA = await login('620823104002', 'student@12'); // Student CSE-A
    const studentB = await login('620823104066', 'student@12'); // Student CSE-B
    const studentC = await login('620823104133', 'student@12'); // Student CSE-C

    console.log(`- Staff A: ${staffA.name} (${staffA.role}, ${staffA.section})`);
    console.log(`- Staff B: ${staffB.name} (${staffB.role}, ${staffB.section})`);
    console.log(`- HOD: ${hod.name} (${hod.role})`);
    console.log(`- Principal: ${principal.name} (${principal.role})`);
    console.log(`- Admin: ${admin.name} (${admin.role})`);
    console.log(`- Student A: ${studentA.name} (${studentA.section})`);
    console.log(`- Student B: ${studentB.name} (${studentB.section})`);
    console.log(`- Student C: ${studentC.name} (${studentC.section})`);
    console.log('');

    const runId = Date.now();

    // -------------------------------------------------------------------------
    // 1. Staff sends to CSE-A only
    // -------------------------------------------------------------------------
    console.log('--- Case 1: Staff sends to CSE-A only ---');
    const title1 = `Staff Circular: CSE-A Internal Review [${runId}]`;
    const res1 = await apiPost(staffA.token, '/api/announcements', {
      title: title1,
      message: 'Classroom review session for Section CSE-A students in Hall 101.',
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
      res1.ok && ann1.id && inA_1 && !inB_1 && !inC_1 && ann1.targetAudienceLabel === 'CSE-A' && ann1.senderName.includes('Arularasi'),
      '1',
      'Staff successfully targets CSE-A only; delivered solely to CSE-A students',
      `Delivered: CSE-A=${inA_1}, CSE-B=${inB_1}, CSE-C=${inC_1}, Sender: "${ann1.senderDisplay}"`
    );

    // -------------------------------------------------------------------------
    // 2. Staff sends to CSE-A + CSE-B
    // -------------------------------------------------------------------------
    console.log('\n--- Case 2: Staff sends to CSE-A + CSE-B ---');
    const title2 = `Staff Circular: Combined Lab Batch CSE-A + CSE-B [${runId}]`;
    const res2 = await apiPost(staffA.token, '/api/announcements', {
      title: title2,
      message: 'Sections CSE-A and CSE-B will attend Network Systems Lab together.',
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
      'Staff successfully targets CSE-A and CSE-B; CSE-C is strictly excluded',
      `Delivered: CSE-A=${inA_2}, CSE-B=${inB_2}, CSE-C=${inC_2}, AudienceLabel: "${ann2.targetAudienceLabel}"`
    );

    // -------------------------------------------------------------------------
    // 3. Staff sends to CSE-B + CSE-C
    // -------------------------------------------------------------------------
    console.log('\n--- Case 3: Staff sends to CSE-B + CSE-C ---');
    const title3 = `Staff Circular: Placement Training CSE-B + CSE-C [${runId}]`;
    const res3 = await apiPost(staffB.token, '/api/announcements', {
      title: title3,
      message: 'Aptitude and soft skills session for Sections CSE-B and CSE-C in Seminar Hall.',
      priority: 'IMPORTANT',
      targetSections: ['CSE-B', 'CSE-C'],
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
      res3.ok && ann3.id && !inA_3 && inB_3 && inC_3 && ann3.targetAudienceLabel === 'CSE-B, CSE-C',
      '3',
      'Staff successfully targets CSE-B and CSE-C; CSE-A is strictly excluded',
      `Delivered: CSE-A=${inA_3}, CSE-B=${inB_3}, CSE-C=${inC_3}, AudienceLabel: "${ann3.targetAudienceLabel}"`
    );

    // -------------------------------------------------------------------------
    // 4. Staff sends to All Three Sections (CSE-A + CSE-B + CSE-C)
    // -------------------------------------------------------------------------
    console.log('\n--- Case 4: Staff sends to all three sections (CSE-A + CSE-B + CSE-C) ---');
    const title4 = `Staff Circular: Tri-Section Project Expo [${runId}]`;
    const res4 = await apiPost(staffA.token, '/api/announcements', {
      title: title4,
      message: 'All three CSE sections (A, B, C) are required to display team posters tomorrow.',
      priority: 'URGENT',
      targetSections: ['CSE-A', 'CSE-B', 'CSE-C'],
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
      res4.ok && ann4.id && inA_4 && inB_4 && inC_4 && ann4.targetAudienceLabel === 'CSE-A, CSE-B, CSE-C',
      '4',
      'Staff successfully targets all three sections; delivered to CSE-A, CSE-B, and CSE-C',
      `Delivered: CSE-A=${inA_4}, CSE-B=${inB_4}, CSE-C=${inC_4}, AudienceLabel: "${ann4.targetAudienceLabel}"`
    );

    // -------------------------------------------------------------------------
    // 5. Staff cannot broadcast college-wide ("All Students")
    // -------------------------------------------------------------------------
    console.log('\n--- Case 5: Staff cannot broadcast college-wide ("All Students") ---');
    const resStaffAll = await apiPost(staffA.token, '/api/announcements', {
      title: `Staff Broadcast Attempt [${runId}]`,
      message: 'Attempting college-wide broadcast as staff.',
      priority: 'NORMAL',
      targetSections: ['ALL']
    });

    report(
      resStaffAll.status === 403,
      '5',
      'Staff attempting to select All Students is strictly rejected with HTTP 403 Forbidden',
      `Server response status: HTTP ${resStaffAll.status}`
    );

    // -------------------------------------------------------------------------
    // 6. HOD Permissions (Department Scope & Multi-Section)
    // -------------------------------------------------------------------------
    console.log('\n--- Case 6: HOD Permissions ---');
    const titleHod = `HOD Department Notice: Final Semester Electives [${runId}]`;
    const resHod = await apiPost(hod.token, '/api/announcements', {
      title: titleHod,
      message: 'HOD notification regarding elective options for Section A and Section C.',
      priority: 'IMPORTANT',
      targetSections: ['CSE-A', 'CSE-C'],
      targetAudience: 'STUDENT'
    });
    const annHod = await resHod.json();

    const listA_Hod = await (await apiGet(studentA.token, '/api/announcements')).json();
    const listB_Hod = await (await apiGet(studentB.token, '/api/announcements')).json();
    const listC_Hod = await (await apiGet(studentC.token, '/api/announcements')).json();

    const inA_Hod = listA_Hod.some(a => a.id === annHod.id);
    const inB_Hod = listB_Hod.some(a => a.id === annHod.id);
    const inC_Hod = listC_Hod.some(a => a.id === annHod.id);

    report(
      resHod.ok && annHod.id && inA_Hod && !inB_Hod && inC_Hod && annHod.senderRole === 'HOD',
      '6',
      'HOD targets authorized scope (CSE-A + CSE-C); delivered only to intended students',
      `CSE-A=${inA_Hod}, CSE-B=${inB_Hod}, CSE-C=${inC_Hod}, Role=${annHod.senderRole}`
    );

    // -------------------------------------------------------------------------
    // 7. Principal Permissions (All Students & College-Wide)
    // -------------------------------------------------------------------------
    console.log('\n--- Case 7: Principal Permissions ---');
    const titlePrincipal = `Principal Circular: College Convocation Day [${runId}]`;
    const resPrincipal = await apiPost(principal.token, '/api/announcements', {
      title: titlePrincipal,
      message: 'College Convocation Day announcement for all enrolled students.',
      priority: 'URGENT',
      targetSections: ['ALL'],
      targetAudience: 'STUDENT'
    });
    const annPrincipal = await resPrincipal.json();

    const listA_Princ = await (await apiGet(studentA.token, '/api/announcements')).json();
    const listB_Princ = await (await apiGet(studentB.token, '/api/announcements')).json();
    const listC_Princ = await (await apiGet(studentC.token, '/api/announcements')).json();

    const inA_Princ = listA_Princ.some(a => a.id === annPrincipal.id);
    const inB_Princ = listB_Princ.some(a => a.id === annPrincipal.id);
    const inC_Princ = listC_Princ.some(a => a.id === annPrincipal.id);

    report(
      resPrincipal.ok && annPrincipal.id && inA_Princ && inB_Princ && inC_Princ && annPrincipal.senderRole === 'PRINCIPAL',
      '7',
      'Principal targets All Students; delivered college-wide to all eligible students',
      `CSE-A=${inA_Princ}, CSE-B=${inB_Princ}, CSE-C=${inC_Princ}, Role=${annPrincipal.senderRole}`
    );

    // -------------------------------------------------------------------------
    // 8. Admin cannot publish official announcements
    // -------------------------------------------------------------------------
    console.log('\n--- Case 8: Admin Creation Restriction ---');
    const resAdmin = await apiPost(admin.token, '/api/announcements', {
      title: 'Unauthorized Admin Attempt',
      message: 'Admin attempting to publish announcement.',
      priority: 'NORMAL',
      targetSections: ['CSE-A']
    });

    report(
      resAdmin.status === 403,
      '8',
      'Admin cannot publish official announcements (HTTP 403 Forbidden strictly enforced)',
      `Server response status: HTTP ${resAdmin.status}`
    );

    // -------------------------------------------------------------------------
    // 9. Students cannot publish official announcements
    // -------------------------------------------------------------------------
    console.log('\n--- Case 9: Student Creation Restriction ---');
    const resStudent = await apiPost(studentA.token, '/api/announcements', {
      title: 'Unauthorized Student Attempt',
      message: 'Student attempting to publish announcement.',
      priority: 'NORMAL',
      targetSections: ['CSE-A']
    });

    report(
      resStudent.status === 403,
      '9',
      'Students cannot publish official announcements (HTTP 403 Forbidden strictly enforced)',
      `Server response status: HTTP ${resStudent.status}`
    );

    // -------------------------------------------------------------------------
    // 10. Deduplication & Independent Read/Unread Tracking
    // -------------------------------------------------------------------------
    console.log('\n--- Case 10: Deduplication & Read/Unread Tracking ---');
    // Using announcement 2 (targeted to CSE-A and CSE-B by staff)
    const notifsA = await (await apiGet(studentA.token, '/api/notifications')).json();
    const notifsB = await (await apiGet(studentB.token, '/api/notifications')).json();
    const notifsC = await (await apiGet(studentC.token, '/api/notifications')).json();

    const countA = (Array.isArray(notifsA) ? notifsA : []).filter(n => n.referenceId === ann2.id).length;
    const countB = (Array.isArray(notifsB) ? notifsB : []).filter(n => n.referenceId === ann2.id).length;
    const countC = (Array.isArray(notifsC) ? notifsC : []).filter(n => n.referenceId === ann2.id).length;

    // Student A marks announcement 2 as read
    await apiPost(studentA.token, `/api/announcements/${ann2.id}/read`, {});

    const updatedA = await (await apiGet(studentA.token, '/api/announcements')).json();
    const updatedB = await (await apiGet(studentB.token, '/api/announcements')).json();

    const aNotice = updatedA.find(a => a.id === ann2.id);
    const bNotice = updatedB.find(a => a.id === ann2.id);

    const aRead = Boolean(aNotice && aNotice.readBy && aNotice.readBy.includes(studentA.identifier));
    const bRead = Boolean(bNotice && bNotice.readBy && bNotice.readBy.includes(studentB.identifier));

    report(
      countA === 1 && countB === 1 && countC === 0 && aRead && !bRead,
      '10',
      'Zero duplicate notifications generated, read status tracked independently per student',
      `Notifs: Student A=${countA}, Student B=${countB}, Student C=${countC}. Read status: Student A=${aRead}, Student B=${bRead}`
    );

    // Summary
    console.log('\n======================================================================');
    console.log(`VERIFICATION RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('======================================================================\n');

  } catch (err) {
    console.error('Fatal test error:', err);
  }
}

runTests();
