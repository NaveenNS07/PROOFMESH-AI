import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildEvidenceGraphForApplication,
  checkCrossDocumentConsistency,
  checkRolePermission,
  classifyDocument,
  compareHistoricalRecords,
  computeSha256,
  computeTamperEvidentAuditHash,
  detectDuplicateDocuments,
  evaluateCompleteness,
  evaluateDocumentExpiry,
  evaluateSimulatedSourceVerification,
  extractStructuredFieldsFromText,
  summarizeComplianceChecks,
  validateFileUpload,
} from './validationEngine';
import { ApplicationDocument, ApplicationRecord, HistoricalRecordSnapshot, UserRole } from '../types/domain';

const sampleApp: ApplicationRecord = {
  id: 'APP-DEMO-2026-001',
  applicationCode: 'APP-DEMO-2026-001',
  institutionId: 'INST-DEMO-001',
  institutionName: 'Meridian Institute of Technology',
  institutionType: 'Private Self-Financed Technical Institution',
  state: 'Karnataka',
  district: 'Bengaluru Urban',
  category: 'Demonstration EoA Application',
  academicYear: '2026–2027',
  contactDetails: {
    name: 'Prof. S. Venkataraman',
    email: 'compliance@meridian-demo.edu.in',
    phone: '+91-80-23456789',
    designation: 'Registrar & Compliance Officer',
  },
  requestedIntake: 120,
  previousApprovedIntake: 60,
  facultyCountClaimed: 48,
  builtUpAreaSqmClaimed: 14500,
  programmesRequested: ['B.Tech Computer Science & Engineering'],
  submissionDate: '2026-10-15',
  status: 'Findings Generated',
  verificationStatus: 'Verification Pending',
  complianceStatus: 'Requires Review',
  assignedReviewerId: 'USR-OFF-01',
  assignedReviewerName: 'Dr. Arvind Raghavan',
  priority: 'High',
  dueDate: '2026-11-05',
  unresolvedFindingsCount: 6,
  documentsReceivedCount: 5,
  requiredDocumentsChecklist: [
    'Approval letter',
    'Affidavit or undertaking',
    'Accreditation certificate',
    'NOC or permission',
    'Faculty record',
    'Infrastructure evidence',
    'Fee payment evidence',
  ],
  nextAction: 'Examine cross-document mismatches and request missing Fee payment evidence',
  syntheticLabel: 'SYNTHETIC DEMONSTRATION DATA — NOT AN OFFICIAL AICTE RECORD',
  createdByUserId: 'USR-INST-01',
  createdAt: '2026-10-15T09:00:00Z',
  updatedAt: '2026-10-25T14:30:00Z',
};

test('1. File validation enforces allowed formats and size limits', () => {
  const okPdf = validateFileUpload('affidavit_2026.pdf', 'application/pdf', 1024 * 500, 25);
  assert.equal(okPdf.valid, true);

  const badExe = validateFileUpload('malware.exe', 'application/x-msdownload', 2048, 25);
  assert.equal(badExe.valid, false);
  assert.match(badExe.error || '', /Unsupported file format/);

  const oversized = validateFileUpload('scan.pdf', 'application/pdf', 30 * 1024 * 1024, 25);
  assert.equal(oversized.valid, false);
  assert.match(oversized.error || '', /exceeds configured limit/);
});

test('2. Document classification and OCR structured extraction (Test Case H)', () => {
  const cls = classifyDocument('faculty_cadre_statement.pdf', 'Regular Faculty Count: 45 Cadre statement');
  assert.equal(cls.documentType, 'Faculty record');
  assert.ok(cls.confidence >= 0.9);

  const rawText = `
    Institution ID: INST-DEMO-999
    Institution Name: Meridian Technical Institute
    Certificate No: CERT-DEMO-104
    Expiry Date: 2026-??-15
    Faculty Count: 45
  `;
  const extracted = extractStructuredFieldsFromText('DOC-01', 'APP-DEMO-2026-001', 'EXT-01', rawText);
  const expField = extracted.find((f) => f.fieldName === 'expiry_date');
  assert.ok(expField);
  assert.equal(expField.requiresConfirmation, true);
  assert.ok(expField.confidence < 0.78);
});

test('3. Missing-document detection (Test Case A)', () => {
  const docs: ApplicationDocument[] = [
    {
      id: 'DOC-1',
      applicationId: sampleApp.id,
      filename: 'eoa_letter.pdf',
      mimeType: 'application/pdf',
      fileSizeBytes: 120000,
      sha256Hash: computeSha256('doc1'),
      documentType: 'Approval letter',
      classificationConfidence: 0.95,
      processingStatus: 'Completed',
      verificationStatus: 'Demo Match — Not Officially Verified',
      certificateReference: 'CERT-DEMO-101',
      issuingAuthority: 'Synthetic Regulatory Authority',
      issueDate: '2025-05-01',
      expiryDate: '2027-04-30',
      pageCount: 2,
      uploadedBy: 'USR-INST-01',
      uploadedAt: '2026-10-15T10:00:00Z',
      isDuplicateOf: null,
      metadataFlags: [],
    },
  ];
  const findings = evaluateCompleteness(sampleApp, docs, 'RUN-1');
  assert.ok(findings.length >= 1);
  assert.ok(findings.some((f) => f.title.includes('Fee payment evidence')));
});

test('4. Expiry validation relative to configured evaluation date (Test Case B)', () => {
  const expiredDoc: ApplicationDocument = {
    id: 'DOC-EXP',
    applicationId: sampleApp.id,
    filename: 'fire_safety_certificate.pdf',
    mimeType: 'application/pdf',
    fileSizeBytes: 240000,
    sha256Hash: computeSha256('expired-cert'),
    documentType: 'Accreditation certificate',
    classificationConfidence: 0.92,
    processingStatus: 'Completed',
    verificationStatus: 'Expired',
    certificateReference: 'CERT-FIRE-2024-88',
    issuingAuthority: 'Municipal Fire Services (Synthetic)',
    issueDate: '2024-03-10',
    expiryDate: '2026-03-09',
    pageCount: 1,
    uploadedBy: 'USR-INST-01',
    uploadedAt: '2026-10-15T10:05:00Z',
    isDuplicateOf: null,
    metadataFlags: [],
  };
  const findings = evaluateDocumentExpiry([expiredDoc], '2026-10-26', 'RUN-1');
  assert.equal(findings.length, 1);
  assert.equal(findings[0].category, 'Expiry');
  assert.equal(findings[0].testCaseRef, 'Test Case B');
});

test('5. Exact SHA-256 duplicate detection (Test Case D)', () => {
  const sharedHash = computeSha256('identical-bytes');
  const docA: ApplicationDocument = {
    id: 'DOC-A',
    applicationId: sampleApp.id,
    filename: 'affidavit_v1.pdf',
    mimeType: 'application/pdf',
    fileSizeBytes: 150000,
    sha256Hash: sharedHash,
    documentType: 'Affidavit or undertaking',
    classificationConfidence: 0.94,
    processingStatus: 'Completed',
    verificationStatus: 'Verification Pending',
    certificateReference: 'AFF-2026-01',
    issuingAuthority: 'Notary Public (Synthetic)',
    issueDate: '2026-09-01',
    expiryDate: '2027-08-31',
    pageCount: 2,
    uploadedBy: 'USR-INST-01',
    uploadedAt: '2026-10-15T10:10:00Z',
    isDuplicateOf: null,
    metadataFlags: [],
  };
  const docB: ApplicationDocument = {
    ...docA,
    id: 'DOC-B',
    filename: 'affidavit_copy_upload2.pdf',
    isDuplicateOf: 'DOC-A',
  };
  const findings = detectDuplicateDocuments([docA, docB], 'RUN-1');
  assert.equal(findings.length, 1);
  assert.equal(findings[0].testCaseRef, 'Test Case D');
  assert.match(findings[0].description, /byte-level identity/i);
});

test('6. Cross-document inconsistency detection (Test Case C)', () => {
  const docC: ApplicationDocument = {
    id: 'DOC-C',
    applicationId: sampleApp.id,
    filename: 'affiliation_noc.pdf',
    mimeType: 'application/pdf',
    fileSizeBytes: 180000,
    sha256Hash: computeSha256('noc-bytes'),
    documentType: 'NOC or permission',
    classificationConfidence: 0.93,
    processingStatus: 'Completed',
    verificationStatus: 'Mismatch Detected — Simulated Source',
    certificateReference: 'NOC-DEMO-999',
    issuingAuthority: 'State Technical University (Synthetic)',
    issueDate: '2026-08-01',
    expiryDate: '2027-07-31',
    pageCount: 2,
    uploadedBy: 'USR-INST-01',
    uploadedAt: '2026-10-15T10:15:00Z',
    isDuplicateOf: null,
    metadataFlags: [],
  };
  const fields = extractStructuredFieldsFromText(
    docC.id,
    sampleApp.id,
    'EXT-C',
    'Institution ID: INST-ALT-902\nInstitution Name: Meridian Technical College\nFaculty Count: 45'
  );
  const findings = checkCrossDocumentConsistency(sampleApp, [docC], fields, 'RUN-1');
  assert.ok(findings.some((f) => f.title.includes('Institution Identifier Discrepancy')));
  assert.ok(findings.some((f) => f.title.includes('Institution Name Mismatch')));
  assert.ok(findings.some((f) => f.title.includes('Claimed Faculty Count Differs')));
});

test('7. Simulated Source Verification modes & explicit labels (Test Cases F & G)', () => {
  const matchRes = evaluateSimulatedSourceVerification('CERT-DEMO-104', 'DEMO_MATCH');
  assert.equal(matchRes.verificationStatus, 'Demo Match — Not Officially Verified');
  assert.equal(matchRes.isSimulatedMode, true);

  const mismatchRes = evaluateSimulatedSourceVerification('NOC-DEMO-999', 'DEMO_MISMATCH');
  assert.equal(mismatchRes.verificationStatus, 'Mismatch Detected — Simulated Source');

  const unavailRes = evaluateSimulatedSourceVerification('CERT-DEMO-500', 'SOURCE_UNAVAILABLE');
  assert.equal(unavailRes.verificationStatus, 'Source Unavailable');
});

test('8. Historical Change Impact comparison (Test Case E)', () => {
  const snapshot: HistoricalRecordSnapshot = {
    id: 'HSNAP-1',
    institutionId: 'INST-DEMO-001',
    applicationId: 'APP-DEMO-2025-001',
    academicYear: '2025–2026',
    recordDate: '2025-04-30',
    sourceDocument: 'Prior Academic Year EoA Record (2025–2026)',
    fields: { approvedIntake: 60, facultyCount: 45 },
  };
  const changes = compareHistoricalRecords(snapshot, sampleApp);
  const intakeChange = changes.find((c) => c.fieldName === 'requestedIntake');
  assert.ok(intakeChange);
  assert.equal(intakeChange.previousValue, '60 seats');
  assert.equal(intakeChange.currentValue, '120 seats');
  assert.equal(intakeChange.changeClassification, 'Potentially significant regulatory change');
  assert.match(intakeChange.potentialImpact, /Requested intake differs from the previous approved record/);
});

test('9. RBAC, institution-level isolation, and public restrictions', () => {
  // Institution user accessing own institution
  assert.equal(
    checkRolePermission(
      UserRole.INSTITUTION_COMPLIANCE_OFFICER,
      'VIEW_INSTITUTION_APPLICATION',
      'INST-DEMO-001',
      'INST-DEMO-001'
    ).allowed,
    true
  );
  // Institution user blocked from another institution's application
  assert.equal(
    checkRolePermission(
      UserRole.INSTITUTION_COMPLIANCE_OFFICER,
      'VIEW_INSTITUTION_APPLICATION',
      'INST-DEMO-001',
      'INST-DEMO-002'
    ).allowed,
    false
  );
  // Public user blocked from confidential application or audit trail
  assert.equal(
    checkRolePermission(UserRole.PUBLIC_USER, 'VIEW_INSTITUTION_APPLICATION', null, 'INST-DEMO-001').allowed,
    false
  );
  assert.equal(checkRolePermission(UserRole.PUBLIC_USER, 'VIEW_AUDIT_TRAIL').allowed, false);
  // Regulatory Officer cannot approve/manage rules
  assert.equal(checkRolePermission(UserRole.REGULATORY_OFFICER, 'MANAGE_RULES').allowed, false);
});

test('10. Compliance summary never claims 100% compliant (Test Case J) & Audit Hash Chain', () => {
  const msg = summarizeComplianceChecks(['Evidence Present', 'Evidence Present', 'Not Applicable']);
  assert.equal(msg, 'No discrepancy detected by the checks performed.');
  assert.ok(!msg.includes('100%'));

  const h1 = computeTamperEvidentAuditHash('GENESIS', {
    timestamp: '2026-10-26T00:00:00Z',
    actorId: 'USR-ADM-01',
    action: 'APPLICATION_CREATED',
    entityType: 'application',
    entityId: 'APP-DEMO-2026-001',
    reason: 'Initial submission',
  });
  assert.equal(h1.length, 64);

  const graph = buildEvidenceGraphForApplication(sampleApp, [], [], [], []);
  assert.ok(graph.nodes.length >= 4);
  assert.ok(graph.relationships.length >= 1);
});
