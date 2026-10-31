const BASE_URL = 'http://localhost:8080';

async function login(username, password) {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  return await res.json();
}

function escape(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function isApproved(r) {
  if (!r) return false;
  const isBonafide = (r.odType && r.odType.toLowerCase().includes("bonafide")) || (r.id && r.id.startsWith("EPOCH-BNF"));
  if (r.hodApproved === true) return true;
  if (r.hodDecision && r.hodDecision.status === "APPROVED") return true;
  if (r.status === "PENDING_PRINCIPAL") return true;
  if (r.status === "APPROVED" && (!isBonafide || (r.principalDecision && r.principalDecision.status === "APPROVED"))) return true;
  return false;
}

function isPending(r) {
  if (!r) return false;
  return r.status === "PENDING_HOD" || r.currentStage === "HOD" || (r.assignedReviewerRole === "HOD" && r.status !== "APPROVED" && r.status !== "REJECTED");
}

function isRejected(r) {
  if (!r) return false;
  return r.status === "REJECTED" || (r.hodDecision && r.hodDecision.status === "REJECTED");
}

async function run() {
  const hod = await login('gopinath', 'hod@123');
  const res = await fetch(`${BASE_URL}/api/od/hod`, {
    headers: { 'Authorization': `Bearer ${hod.token}` }
  });
  const requests = await res.json();
  
  let pending = 0, approved = 0, rejected = 0;
  requests.forEach(r => {
    if (isPending(r)) pending++;
    else if (isApproved(r)) approved++;
    else if (isRejected(r)) rejected++;
  });
  console.log(`Counts -> Pending: ${pending}, Approved: ${approved}, Rejected: ${rejected}, Total: ${requests.length}`);

  let filtered = requests.slice().filter(r => isPending(r));
  console.log(`Filtered for PENDING_HOD count: ${filtered.length}`);

  filtered.forEach((r, idx) => {
    try {
      const isBonafide = (r.odType && r.odType.toLowerCase().includes("bonafide")) || (r.id && r.id.startsWith("EPOCH-BNF"));
      const isLeave = (r.odType && r.odType.toLowerCase().includes("leave")) || (r.id && r.id.startsWith("EPOCH-LV"));
      const pendingReview = isPending(r);
      const approvedReq = isApproved(r);
      const rejectedReq = isRejected(r);

      // Current Approval Stage Badge
      let stageBadge = '<span class="badge-tag badge-warning">⏳ Awaiting HOD</span>';
      if (pendingReview) {
        stageBadge = '<span class="badge-tag badge-warning">⏳ Awaiting HOD Review</span>';
      } else if (rejectedReq) {
        stageBadge = '<span class="badge-tag badge-rejected">❌ Rejected</span>';
      } else if (r.status === "PENDING_PRINCIPAL") {
        stageBadge = '<span class="badge-tag badge-info">🏛️ Forwarded to Principal</span>';
      } else if (approvedReq) {
        stageBadge = isBonafide ? '<span class="badge-tag badge-approved">✅ Principal Sanctioned</span>' : '<span class="badge-tag badge-approved">✅ HOD Approved</span>';
      }

      // Class Advisor Decision Summary
      const adv = r.advisorDecision || {};
      let advDecisionHtml = '';
      if (adv.status === "APPROVED" || r.advisorApproved || r.status === "PENDING_HOD" || r.status === "PENDING_PRINCIPAL" || approvedReq) {
        const advName = adv.by || adv.approver || (r.section === 'CSE-B' ? 'Dr. Divyabharathi' : (r.section === 'CSE-C' ? 'Mrs. Rajavathi Jayapriya' : 'Mrs. P. Arularasi'));
        const advTime = adv.timestamp || (r.advisorApprovalDate ? new Date(r.advisorApprovalDate).toLocaleString() : 'Verified');
        advDecisionHtml = `Advisor Approved: ${advName} at ${advTime}`;
      }

      const reqTypeLabel = isBonafide ? "Bonafide Certificate" : (isLeave ? (r.odType || "Leave Application") : (r.odType || "On-Duty Requisition"));
      const submittedDateStr = r.submittedAt || (r.createdAt ? new Date(r.createdAt).toLocaleDateString() : "Recent");

      console.log(`Rendered Row ${idx+1}: ID=${r.id}, Student=${r.studentName}, RegNo=${r.regNo}, Type=${reqTypeLabel}, StageBadge=${stageBadge}`);
    } catch (err) {
      console.error(`ERROR rendering row ${idx+1} (${r.id}):`, err);
    }
  });
}

run().catch(console.error);
