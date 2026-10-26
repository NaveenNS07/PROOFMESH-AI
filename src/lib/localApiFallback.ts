import { createInitialSeedDatabase, DatabaseSchema, SYNTHETIC_BANNER } from '../server/seedData';
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
  validateFileUpload,
} from '../engine/validationEngine';
import {
  ApplicationDocument,
  ApplicationRecord,
  AuditEventRecord,
  RegulatoryRule,
  ReportRecord,
  UserRecord,
  UserRole,
} from '../types/domain';

const STORAGE_KEY = 'pm_local_db_v1';

function getDb(): DatabaseSchema {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw) as DatabaseSchema;
    }
  } catch {
    // ignore
  }
  const seed = createInitialSeedDatabase();
  saveDb(seed);
  return seed;
}

function saveDb(db: DatabaseSchema) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch {
    // ignore quota errors
  }
}

function appendAudit(
  db: DatabaseSchema,
  params: {
    actorId: string;
    actorName: string;
    actorRole: UserRole;
    action: string;
    entityType: string;
    entityId: string;
    previousState: string | null;
    newState: string | null;
    reason: string;
  }
) {
  const prevHash =
    db.audit_events.length > 0
      ? db.audit_events[db.audit_events.length - 1].integrityHash
      : 'GENESIS_HASH_PROOFMESH_2026';
  const timestamp = new Date().toISOString();
  const id = `AUD-2026-${String(db.audit_events.length + 1).padStart(4, '0')}`;
  const correlationId = `CORR-${Date.now().toString(36).toUpperCase()}`;
  const integrityHash = computeTamperEvidentAuditHash(prevHash, {
    timestamp,
    actorId: params.actorId,
    action: params.action,
    entityType: params.entityType,
    entityId: params.entityId,
    reason: params.reason,
  });
  const ev: AuditEventRecord = {
    id,
    timestamp,
    actorId: params.actorId,
    actorName: params.actorName,
    actorRole: params.actorRole,
    action: params.action,
    entityType: params.entityType,
    entityId: params.entityId,
    previousState: params.previousState,
    newState: params.newState,
    reason: params.reason,
    correlationId,
    integrityHash,
  };
  db.audit_events.push(ev);
  return ev;
}

export async function executeLocalApiFallback<T = any>(
  rawUrl: string,
  options: RequestInit = {},
  activeUserId = 'USR-OFF-01'
): Promise<T> {
  const db = getDb();
  const urlObj = new URL(rawUrl, window.location.origin);
  const pathname = urlObj.pathname;
  const searchParams = urlObj.searchParams;
  const method = (options.method || 'GET').toUpperCase();
  const body = options.body ? JSON.parse(String(options.body)) : {};

  const currentUser: UserRecord =
    db.users.find((u) => u.id === activeUserId) ||
    db.users.find((u) => u.id === 'USR-OFF-01') ||
    db.users[0];

  // 1. Auth endpoints
  if (pathname === '/api/v1/auth/me') {
    return {
      user: currentUser,
      demoAccounts: db.users,
    } as unknown as T;
  }

  if (pathname === '/api/v1/auth/login' && method === 'POST') {
    const { email, roleOverride } = body;
    let user = db.users.find((u) => u.email.toLowerCase() === String(email || '').toLowerCase());
    if (!user && roleOverride) {
      user = db.users.find((u) => u.role === roleOverride);
    }
    if (!user) {
      throw new Error('Invalid credentials or unrecognized demo account.');
    }
    user.lastLoginAt = new Date().toISOString();
    saveDb(db);
    return {
      user,
      sessionToken: `PM-SESS-${user.id}-${Date.now()}`,
      syntheticBanner: SYNTHETIC_BANNER,
    } as unknown as T;
  }

  if (pathname === '/api/v1/auth/register' && method === 'POST') {
    const safeRole: UserRole =
      body.role === UserRole.INSTITUTION_COMPLIANCE_OFFICER
        ? UserRole.INSTITUTION_COMPLIANCE_OFFICER
        : UserRole.PUBLIC_USER;
    const newUser: UserRecord = {
      id: `USR-${Date.now().toString(36).toUpperCase()}`,
      email: String(body.email || '').trim(),
      fullName: String(body.fullName || 'New Officer').trim(),
      role: safeRole,
      institutionId: safeRole === UserRole.INSTITUTION_COMPLIANCE_OFFICER ? 'INST-DEMO-001' : null,
      institutionName:
        safeRole === UserRole.INSTITUTION_COMPLIANCE_OFFICER
          ? body.institutionName || 'Meridian Institute of Technology'
          : null,
      department: body.department || 'External Applicant',
      active: true,
      reviewScope: safeRole === UserRole.INSTITUTION_COMPLIANCE_OFFICER ? ['INST-DEMO-001'] : ['Public Directory Only'],
      lastLoginAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    db.users.push(newUser);
    saveDb(db);
    return { user: newUser } as unknown as T;
  }

  if (pathname === '/api/v1/auth/logout') {
    return { status: 'logged_out' } as unknown as T;
  }

  // 2. Dashboard summary
  if (pathname === '/api/v1/dashboard/summary') {
    const visibleApps =
      currentUser.role === UserRole.INSTITUTION_COMPLIANCE_OFFICER && currentUser.institutionId
        ? db.applications.filter((a) => a.institutionId === currentUser.institutionId)
        : db.applications;

    return {
      indicators: {
        totalApplications: visibleApps.length,
        awaitingReview: visibleApps.filter(
          (a) => a.status === 'Awaiting Manual Review' || a.status === 'Findings Generated'
        ).length,
        unresolvedDiscrepancies: visibleApps.filter((a) => a.unresolvedFindingsCount > 0).length,
        sourceVerificationPending: visibleApps.filter(
          (a) =>
            a.verificationStatus === 'Verification Pending' ||
            a.verificationStatus === 'Source Unavailable' ||
            a.verificationStatus === 'Mismatch Detected — Simulated Source'
        ).length,
        requiringAdditionalEvidence: visibleApps.filter(
          (a) =>
            a.status === 'Awaiting Institution Response' ||
            db.additional_evidence_requests.some((r) => r.applicationId === a.id && r.status === 'Open')
        ).length,
        reviewsCompleted: visibleApps.filter((a) => a.status === 'Review Completed' || a.status === 'Closed').length,
      },
      processingOverview: {
        intakeTimeline: [
          { period: 'Week 1 (Oct 1–7)', received: 2, validated: 2 },
          { period: 'Week 2 (Oct 8–14)', received: 4, validated: 4 },
          { period: 'Week 3 (Oct 15–21)', received: 6, validated: 5 },
          { period: 'Week 4 (Oct 22–26)', received: 4, validated: 4 },
        ],
        validationOutcomeDistribution: [
          { name: 'Discrepancies Flagged', count: 8 },
          { name: 'Awaiting Additional Evidence', count: 4 },
          { name: 'No Discrepancy in Tested Fields', count: 4 },
        ],
        verificationStatusDistribution: [
          { status: 'Demo Match (Simulated)', count: 6 },
          { status: 'Simulated Mismatch', count: 3 },
          { status: 'Source Unavailable (Fallback)', count: 2 },
          { status: 'Verification Pending', count: 5 },
        ],
        averageProcessingHours: 1.8,
        queueByPriority: [
          { priority: 'High Priority', count: visibleApps.filter((a) => a.priority === 'High').length },
          { priority: 'Medium Priority', count: visibleApps.filter((a) => a.priority === 'Medium').length },
          { priority: 'Low Priority', count: visibleApps.filter((a) => a.priority === 'Low').length },
        ],
      },
      priorityQueue: visibleApps,
      recentActivity: db.audit_events.slice(-8).reverse(),
      operationalAlerts: [
        {
          id: 'ALT-1',
          type: 'Expiring / Expired Document',
          severity: 'Critical Review',
          title: 'Fire & Life Safety Certificate Expired (CERT-FIRE-2024-88)',
          detail: 'Meridian Institute of Technology (APP-DEMO-2026-001) — Expired 2026-03-09',
          link: '/applications/APP-DEMO-2026-001',
        },
        {
          id: 'ALT-2',
          type: 'Unresolved Source Mismatch',
          severity: 'High Priority',
          title: 'Simulated University NOC Mismatch (NOC-DEMO-999)',
          detail: 'Conflicting Institution ID (INST-ALT-902) & Intake (60 vs 120)',
          link: '/verification',
        },
        {
          id: 'ALT-3',
          type: 'Missing Required Document',
          severity: 'Critical Review',
          title: 'Missing Fee Payment Evidence (Slot #7)',
          detail: 'APP-DEMO-2026-001 requires regulatory processing fee receipt',
          link: '/validation-center',
        },
        {
          id: 'ALT-4',
          type: 'Verification Service Unavailable',
          severity: 'Medium Priority',
          title: 'State Fire & Building Safety Portal Adapter Offline (HTTP 503)',
          detail: 'Automatic fallback to Manual Authority Confirmation enabled',
          link: '/admin/data-sources',
        },
      ],
    } as unknown as T;
  }

  // 3. Applications list & creation
  if (pathname === '/api/v1/applications' && method === 'GET') {
    let list = [...db.applications];
    if (currentUser.role === UserRole.INSTITUTION_COMPLIANCE_OFFICER && currentUser.institutionId) {
      list = list.filter((a) => a.institutionId === currentUser.institutionId);
    }
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    const academicYear = searchParams.get('academicYear');
    const search = searchParams.get('search');
    if (category && category !== 'ALL') list = list.filter((a) => a.category === category);
    if (status && status !== 'ALL') list = list.filter((a) => a.status === status);
    if (academicYear && academicYear !== 'ALL') list = list.filter((a) => a.academicYear === academicYear);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (a) =>
          a.applicationCode.toLowerCase().includes(q) ||
          a.institutionName.toLowerCase().includes(q) ||
          a.institutionId.toLowerCase().includes(q)
      );
    }
    return { applications: list, total: list.length } as unknown as T;
  }

  if (pathname === '/api/v1/applications' && method === 'POST') {
    const nextNum = db.applications.length + 1;
    const appId = `APP-DEMO-2026-00${nextNum}`;
    const newApp: ApplicationRecord = {
      id: appId,
      applicationCode: appId,
      institutionId: String(body.institutionId || 'INST-DEMO-001').trim(),
      institutionName: String(body.institutionName || 'Meridian Institute of Technology').trim(),
      institutionType: String(body.institutionType || 'Private Self-Financed Technical Institution'),
      state: String(body.state || 'Karnataka'),
      district: String(body.district || 'Bengaluru Urban'),
      category: String(body.category || 'Demonstration EoA Application'),
      academicYear: String(body.academicYear || '2026–2027'),
      contactDetails: {
        name: String(body.contactName || currentUser.fullName),
        email: String(body.contactEmail || currentUser.email),
        phone: String(body.contactPhone || '+91-80-23456789'),
        designation: 'Compliance Officer',
      },
      requestedIntake: Number(body.requestedIntake || 120),
      previousApprovedIntake: Number(body.previousApprovedIntake || 60),
      facultyCountClaimed: Number(body.facultyCountClaimed || 48),
      builtUpAreaSqmClaimed: Number(body.builtUpAreaSqmClaimed || 14500),
      programmesRequested: Array.isArray(body.programmesRequested)
        ? body.programmesRequested
        : ['B.Tech Computer Science & Engineering'],
      submissionDate: new Date().toISOString().slice(0, 10),
      status: 'New',
      verificationStatus: 'Verification Pending',
      complianceStatus: 'Awaiting Initial Validation',
      assignedReviewerId: 'USR-OFF-01',
      assignedReviewerName: 'Dr. Arvind Raghavan',
      priority: 'High',
      dueDate: '2026-11-15',
      unresolvedFindingsCount: 0,
      documentsReceivedCount: Array.isArray(body.uploadedFiles) ? body.uploadedFiles.length : 2,
      requiredDocumentsChecklist: body.requiredDocumentsChecklist || [
        'Approval letter',
        'Affidavit or undertaking',
        'Accreditation certificate',
        'NOC or permission',
        'Faculty record',
        'Infrastructure evidence',
        'Fee payment evidence',
      ],
      nextAction: 'Upload supporting documents and execute automated validation run',
      syntheticLabel: SYNTHETIC_BANNER,
      createdByUserId: currentUser.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    db.applications.unshift(newApp);
    saveDb(db);
    return { application: newApp } as unknown as T;
  }

  // Application sub-routes
  const appMatch = pathname.match(/^\/api\/v1\/applications\/([^/]+)$/);
  if (appMatch && method === 'GET') {
    const id = appMatch[1];
    const appRecord = db.applications.find((a) => a.id === id || a.applicationCode === id) || db.applications[0];
    return {
      application: appRecord,
      documents: db.application_documents.filter((d) => d.applicationId === appRecord.id),
      findings: db.validation_findings.filter((f) => f.applicationId === appRecord.id),
      compliance: db.compliance_assessments.filter((c) => c.applicationId === appRecord.id),
      verifications: db.source_verification_results.filter((v) => v.applicationId === appRecord.id),
      changeImpacts: db.change_impact_findings.filter((c) => c.applicationId === appRecord.id),
      reviewActions: db.review_actions.filter((r) => r.applicationId === appRecord.id),
      evidenceRequests: db.additional_evidence_requests.filter((r) => r.applicationId === appRecord.id),
      auditEvents: db.audit_events.filter((e) => e.entityId.includes(appRecord.id)),
    } as unknown as T;
  }

  if (appMatch && method === 'PATCH') {
    const id = appMatch[1];
    const appRecord = db.applications.find((a) => a.id === id) || db.applications[0];
    if (body.status) appRecord.status = body.status;
    if (body.priority) appRecord.priority = body.priority;
    saveDb(db);
    return { application: appRecord } as unknown as T;
  }

  const graphMatch = pathname.match(/^\/api\/v1\/applications\/([^/]+)\/evidence-graph$/);
  if (graphMatch) {
    const appId = graphMatch[1];
    const appRecord = db.applications.find((a) => a.id === appId) || db.applications[0];
    let nodes = db.evidence_nodes.filter((n) => n.applicationId === appRecord.id);
    let relationships = db.evidence_relationships.filter((r) => r.applicationId === appRecord.id);
    if (nodes.length === 0) {
      const built = buildEvidenceGraphForApplication(
        appRecord,
        db.application_documents.filter((d) => d.applicationId === appRecord.id),
        db.regulatory_rules,
        db.validation_findings.filter((f) => f.applicationId === appRecord.id),
        db.review_actions.filter((r) => r.applicationId === appRecord.id)
      );
      nodes = built.nodes;
      relationships = built.relationships;
    }
    return { application: appRecord, nodes, relationships } as unknown as T;
  }

  const validateMatch = pathname.match(/^\/api\/v1\/applications\/([^/]+)\/validate$/);
  if (validateMatch && method === 'POST') {
    const appId = validateMatch[1];
    const appRecord = db.applications.find((a) => a.id === appId) || db.applications[0];
    const runId = `VRUN-${Date.now().toString(36).toUpperCase()}`;
    const docs = db.application_documents.filter((d) => d.applicationId === appRecord.id);
    const fields = db.extracted_fields.filter((f) => f.applicationId === appRecord.id);
    const evalDate = db.system_configuration.evaluationDate;
    const combined = [
      ...evaluateCompleteness(appRecord, docs, runId),
      ...evaluateDocumentExpiry(docs, evalDate, runId),
      ...detectDuplicateDocuments(docs, runId),
      ...checkCrossDocumentConsistency(appRecord, docs, fields, runId),
    ];
    db.validation_findings = [
      ...db.validation_findings.filter((f) => f.applicationId !== appRecord.id),
      ...combined,
    ];
    saveDb(db);
    return {
      validationRun: {
        id: runId,
        summaryText:
          combined.length > 0
            ? `${combined.length} findings generated across Completeness, Expiry, Duplicate Detection, and Cross-Document Consistency.`
            : 'No discrepancy detected by the checks performed.',
      },
      findings: combined,
      application: appRecord,
    } as unknown as T;
  }

  const docUploadMatch = pathname.match(/^\/api\/v1\/applications\/([^/]+)\/documents$/);
  if (docUploadMatch && method === 'POST') {
    const appId = docUploadMatch[1];
    const appRecord = db.applications.find((a) => a.id === appId) || db.applications[0];
    const filename = body.filename || 'Uploaded_Document.pdf';
    const textBody = `[SYNTHETIC DEMONSTRATION UPLOAD — NOT AN OFFICIAL RECORD]\nFilename: ${filename}\nInstitution ID: ${appRecord.institutionId}`;
    const cls = classifyDocument(filename, textBody);
    const docId = `DOC-${Date.now().toString(36).toUpperCase()}`;
    const newDoc: ApplicationDocument = {
      id: docId,
      applicationId: appRecord.id,
      filename,
      mimeType: 'application/pdf',
      fileSizeBytes: Number(body.fileSizeBytes || 245000),
      sha256Hash: computeSha256(textBody),
      documentType: cls.documentType,
      classificationConfidence: cls.confidence,
      processingStatus: 'Completed',
      verificationStatus: 'Verification Pending',
      certificateReference: `CERT-DEMO-${Math.floor(Math.random() * 899 + 100)}`,
      issuingAuthority: 'Synthetic Issuing Authority (Demo)',
      issueDate: new Date().toISOString().slice(0, 10),
      expiryDate: '2027-06-30',
      pageCount: 2,
      uploadedBy: currentUser.fullName,
      uploadedAt: new Date().toISOString(),
      isDuplicateOf: null,
      metadataFlags: [],
    };
    db.application_documents.unshift(newDoc);
    const extId = `EXT-${docId}`;
    db.document_extractions.push({
      id: extId,
      documentId: docId,
      applicationId: appRecord.id,
      rawText: textBody,
      ocrEngine: 'PROOFMESH Structured OCR v2.4',
      overallConfidence: cls.confidence,
      completedAt: new Date().toISOString(),
    });
    const newFields = extractStructuredFieldsFromText(docId, appRecord.id, extId, textBody);
    db.extracted_fields.push(...newFields);
    saveDb(db);
    return { document: newDoc, extractedFields: newFields } as unknown as T;
  }

  const reqEvidenceMatch = pathname.match(/^\/api\/v1\/applications\/([^/]+)\/request-evidence$/);
  if (reqEvidenceMatch && method === 'POST') {
    const appId = reqEvidenceMatch[1];
    const appRecord = db.applications.find((a) => a.id === appId) || db.applications[0];
    const reqRecord = {
      id: `AER-${Date.now().toString(36).toUpperCase()}`,
      applicationId: appRecord.id,
      findingId: body.findingId || null,
      requestedBy: `${currentUser.fullName} (${currentUser.role})`,
      requestedDocumentType: body.requestedDocumentType || 'Fee payment evidence',
      description: body.description || 'Deficiency notice issued',
      dueDate: body.dueDate || '2026-11-12',
      status: 'Open' as const,
      responseNotes: null,
      createdAt: new Date().toISOString(),
    };
    db.additional_evidence_requests.unshift(reqRecord);
    saveDb(db);
    return { evidenceRequest: reqRecord, application: appRecord } as unknown as T;
  }

  const assignMatch = pathname.match(/^\/api\/v1\/applications\/([^/]+)\/assign-reviewer$/);
  if (assignMatch && method === 'POST') {
    const appId = assignMatch[1];
    const appRecord = db.applications.find((a) => a.id === appId) || db.applications[0];
    const rev = db.users.find((u) => u.id === body.reviewerId);
    if (rev) {
      appRecord.assignedReviewerId = rev.id;
      appRecord.assignedReviewerName = rev.fullName;
      saveDb(db);
    }
    return { application: appRecord } as unknown as T;
  }

  const changeImpactAppMatch = pathname.match(/^\/api\/v1\/applications\/([^/]+)\/change-impact$/);
  if (changeImpactAppMatch) {
    const appId = changeImpactAppMatch[1];
    return {
      changeImpacts: db.change_impact_findings.filter((c) => c.applicationId === appId),
      historicalSnapshot: db.historical_record_snapshots[0] || null,
    } as unknown as T;
  }

  const complianceAppMatch = pathname.match(/^\/api\/v1\/applications\/([^/]+)\/compliance$/);
  if (complianceAppMatch) {
    return {
      complianceAssessments: db.compliance_assessments,
      rules: db.regulatory_rules,
    } as unknown as T;
  }

  // 4. Documents, Findings, Verification, Infrastructure, Reports, Audit, Notifications, Admin
  if (pathname === '/api/v1/documents') {
    return {
      documents: db.application_documents,
      extractions: db.document_extractions,
      extractedFields: db.extracted_fields,
    } as unknown as T;
  }

  if (pathname === '/api/v1/findings') {
    return { findings: db.validation_findings } as unknown as T;
  }

  const findingActionMatch = pathname.match(/^\/api\/v1\/findings\/([^/]+)\/actions$/);
  if (findingActionMatch && method === 'POST') {
    const finding = db.validation_findings.find((f) => f.id === findingActionMatch[1]);
    if (finding) {
      const prevStatus = finding.reviewStatus;
      if (body.actionType === 'Accept Finding') finding.reviewStatus = 'Accepted';
      else if (body.actionType === 'Dismiss Finding') finding.reviewStatus = 'Dismissed';
      else if (body.actionType === 'Request Additional Evidence') finding.reviewStatus = 'Correction Requested';
      const actionRecord = {
        id: `RACT-${Date.now().toString(36).toUpperCase()}`,
        applicationId: finding.applicationId,
        findingId: finding.id,
        actorId: currentUser.id,
        actorName: currentUser.fullName,
        actorRole: currentUser.role,
        actionType: body.actionType || 'Accept Finding',
        justification: String(body.justification || 'Officer review recorded'),
        previousStatus: prevStatus,
        newStatus: finding.reviewStatus,
        createdAt: new Date().toISOString(),
      };
      db.review_actions.unshift(actionRecord);
      appendAudit(db, {
        actorId: currentUser.id,
        actorName: currentUser.fullName,
        actorRole: currentUser.role,
        action: 'FINDING_REVIEWED',
        entityType: 'ValidationFinding',
        entityId: finding.id,
        previousState: prevStatus,
        newState: finding.reviewStatus,
        reason: actionRecord.justification,
      });
      saveDb(db);
      return { finding, reviewAction: actionRecord } as unknown as T;
    }
  }

  const resolveChangeMatch = pathname.match(/^\/api\/v1\/change-impact\/([^/]+)\/resolve$/);
  if (resolveChangeMatch && method === 'POST') {
    const item = db.change_impact_findings.find((c) => c.id === resolveChangeMatch[1]);
    if (item) {
      item.resolutionStatus = body.resolutionStatus || 'Reviewed & Acknowledged';
      item.resolvedBy = currentUser.fullName;
      saveDb(db);
      return { changeImpact: item } as unknown as T;
    }
  }

  if (pathname === '/api/v1/verifications') {
    return {
      requests: db.source_verification_requests,
      results: db.source_verification_results,
      adapters: db.data_sources,
    } as unknown as T;
  }

  const verifyDocMatch = pathname.match(/^\/api\/v1\/documents\/([^/]+)\/verify$/);
  if (verifyDocMatch && method === 'POST') {
    const certRef = body.certificateReference || 'CERT-DEMO-104';
    const adapterMode: 'DEMO_MATCH' | 'DEMO_MISMATCH' | 'SOURCE_UNAVAILABLE' = certRef.includes('999')
      ? 'DEMO_MISMATCH'
      : certRef.includes('FIRE')
      ? 'SOURCE_UNAVAILABLE'
      : 'DEMO_MATCH';
    const evalRes = evaluateSimulatedSourceVerification(certRef, adapterMode);
    const reqTimestamp = new Date().toISOString();
    const resId = `SVR-${Date.now().toString(36).toUpperCase()}`;
    const newRes = {
      id: resId,
      requestId: `SVREQ-${Date.now().toString(36).toUpperCase()}`,
      documentId: verifyDocMatch[1],
      applicationId: 'APP-DEMO-2026-001',
      certificateReference: certRef,
      sourceAuthority: body.sourceAuthority || 'Synthetic Regulatory Verification Gateway (Demo Mode)',
      verificationMethod: 'Unique certificate or document identifier',
      isSimulatedMode: true,
      requestTimestamp: reqTimestamp,
      responseTimestamp: reqTimestamp,
      returnedResult: evalRes.returnedResult,
      matchedFields: evalRes.matchedFields,
      sourceResponseReference: `SIM-REF-${Date.now().toString(36).toUpperCase()}`,
      verificationStatus: evalRes.verificationStatus,
      reviewerAction: evalRes.recommendedAction,
    };
    db.source_verification_results.unshift(newRes);
    saveDb(db);
    return { result: newRes } as unknown as T;
  }

  if (pathname === '/api/v1/infrastructure-reviews') {
    return { infrastructureReviews: db.infrastructure_reviews } as unknown as T;
  }

  const infraAnnotateMatch = pathname.match(/^\/api\/v1\/infrastructure-reviews\/([^/]+)\/annotate$/);
  if (infraAnnotateMatch && method === 'POST') {
    const record = db.infrastructure_reviews.find((r) => r.id === infraAnnotateMatch[1]) || db.infrastructure_reviews[0];
    if (body.note) {
      record.reviewerAnnotations.push({
        id: `ANN-${Date.now().toString(36).toUpperCase()}`,
        author: `${currentUser.fullName} (${currentUser.role})`,
        timestamp: new Date().toISOString(),
        note: body.note,
        regionLabel: 'General Facility Observation',
      });
    }
    if (body.inspectionReferralStatus) {
      record.inspectionReferralStatus = body.inspectionReferralStatus;
    }
    saveDb(db);
    return { infrastructureReview: record } as unknown as T;
  }

  if (pathname === '/api/v1/reports' && method === 'GET') {
    return { reports: db.report_records } as unknown as T;
  }

  if (pathname === '/api/v1/reports' && method === 'POST') {
    const appRecord = db.applications[0];
    const findings = db.validation_findings.filter((f) => f.applicationId === appRecord.id);
    const newReport: ReportRecord = {
      id: `REP-${Date.now().toString(36).toUpperCase()}`,
      reportCode: `REP-${String(db.report_records.length + 1).padStart(3, '0')}`,
      reportType: body.reportType || 'Application Validation Report',
      applicationId: appRecord.id,
      institutionName: appRecord.institutionName,
      generatedBy: `${currentUser.fullName} (${currentUser.role})`,
      generatedAt: new Date().toISOString(),
      scope: `Comprehensive ${body.reportType || 'Application Validation Report'} for ${appRecord.applicationCode}`,
      rulesAppliedCount: db.regulatory_rules.length,
      findingsSummary: {
        total: findings.length,
        critical: findings.filter((f) => f.severity === 'Critical Review').length,
        high: findings.filter((f) => f.severity === 'High Priority').length,
        medium: findings.filter((f) => f.severity === 'Medium Priority').length,
        unresolved: findings.filter((f) => f.reviewStatus === 'Pending Review').length,
      },
      containsSimulatedData: true,
      limitations:
        'Automated validation, OCR extraction, and simulated source adapter outputs are advisory only.',
      disclaimer:
        'SYNTHETIC DEMONSTRATION REPORT — NOT AN OFFICIAL AICTE APPROVAL OR REJECTION ORDER.',
    };
    db.report_records.unshift(newReport);
    saveDb(db);
    return { report: newReport } as unknown as T;
  }

  if (pathname === '/api/v1/audit-events') {
    return { auditEvents: [...db.audit_events].reverse() } as unknown as T;
  }

  if (pathname === '/api/v1/notifications' && method === 'GET') {
    return { notifications: db.notifications } as unknown as T;
  }

  const notifReadMatch = pathname.match(/^\/api\/v1\/notifications\/([^/]+)\/read$/);
  if (notifReadMatch && method === 'POST') {
    const n = db.notifications.find((x) => x.id === notifReadMatch[1]);
    if (n) {
      n.isRead = !n.isRead;
      saveDb(db);
    }
    return { notification: n } as unknown as T;
  }

  if (pathname === '/api/v1/users' && method === 'GET') {
    return { users: db.users, roles: db.roles } as unknown as T;
  }

  const userPatchMatch = pathname.match(/^\/api\/v1\/users\/([^/]+)$/);
  if (userPatchMatch && method === 'PATCH') {
    const u = db.users.find((x) => x.id === userPatchMatch[1]);
    if (u && typeof body.active === 'boolean') {
      u.active = body.active;
      saveDb(db);
    }
    return { user: u } as unknown as T;
  }

  if (pathname === '/api/v1/rules' && method === 'GET') {
    return { rules: db.regulatory_rules, versions: db.regulatory_rule_versions } as unknown as T;
  }

  if (pathname === '/api/v1/rules' && method === 'POST') {
    const newRule: RegulatoryRule = {
      id: body.ruleCode,
      ruleCode: String(body.ruleCode).trim(),
      name: String(body.name).trim(),
      description: 'Configurable synthetic validation rule',
      requirementCategory: 'Institutional records',
      applicableCategories: ['Demonstration EoA Application'],
      applicablePeriod: 'Academic Year 2026–2027',
      requiredDocumentType: 'Approval letter',
      validationLogic: String(body.validationLogic).trim(),
      severity: body.severity || 'High Priority',
      recommendedAction: 'Examine supporting evidence and record officer determination.',
      authoritativeSourceRef: 'SYNTHETIC DEMO RULE',
      currentVersion: 'v1.0',
      effectiveDate: new Date().toISOString().slice(0, 10),
      expiryDate: null,
      status: 'Draft',
      isSyntheticRule: true,
      lastUpdated: new Date().toISOString(),
    };
    db.regulatory_rules.unshift(newRule);
    saveDb(db);
    return { rule: newRule } as unknown as T;
  }

  if (pathname === '/api/v1/data-sources') {
    return { dataSources: db.data_sources } as unknown as T;
  }

  const dsRetryMatch = pathname.match(/^\/api\/v1\/data-sources\/([^/]+)\/retry$/);
  if (dsRetryMatch && method === 'POST') {
    const src = db.data_sources.find((s) => s.id === dsRetryMatch[1]) || db.data_sources[0];
    src.integrationStatus = 'Simulated Demo Adapter';
    src.lastAttemptedConnection = new Date().toISOString();
    src.lastSuccessfulConnection = src.lastAttemptedConnection;
    saveDb(db);
    return { dataSource: src } as unknown as T;
  }

  if (pathname === '/api/v1/settings' && method === 'GET') {
    return { settings: db.system_configuration } as unknown as T;
  }

  if (pathname === '/api/v1/settings' && method === 'PATCH') {
    Object.assign(db.system_configuration, body);
    saveDb(db);
    return { settings: db.system_configuration } as unknown as T;
  }

  if (pathname === '/api/v1/public/institutions') {
    let list = [...db.institutions];
    const query = searchParams.get('query');
    const state = searchParams.get('state');
    const programme = searchParams.get('programme');
    if (query) {
      const q = query.toLowerCase();
      list = list.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          i.institutionCode.toLowerCase().includes(q) ||
          i.district.toLowerCase().includes(q)
      );
    }
    if (state && state !== 'ALL') {
      list = list.filter((i) => i.state.toLowerCase() === state.toLowerCase());
    }
    if (programme) {
      const p = programme.toLowerCase();
      list = list.filter((i) => i.approvedProgrammes.some((pr) => pr.name.toLowerCase().includes(p)));
    }
    return {
      institutions: list,
      disclaimer:
        'A missing search result or pending status does not prove that an institution is unapproved or fraudulent. Always verify against official published gazettes and issuing authority notifications.',
    } as unknown as T;
  }

  if (pathname === '/api/v1/ai/explain') {
    const finding = db.validation_findings.find((f) => f.id === body.findingId) || db.validation_findings[0];
    return {
      explanation:
        finding?.aiExplanation ||
        'Deterministic rule check identified a discrepancy between the submitted institutional claim and extracted document evidence. Officer verification is recommended.',
      source: 'Deterministic Rule Explanation Engine',
    } as unknown as T;
  }

  return {} as T;
}
