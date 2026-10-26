export enum UserRole {
  REGULATORY_ADMIN = 'REGULATORY_ADMIN',
  REGULATORY_OFFICER = 'REGULATORY_OFFICER',
  INSTITUTION_COMPLIANCE_OFFICER = 'INSTITUTION_COMPLIANCE_OFFICER',
  INFRASTRUCTURE_REVIEWER = 'INFRASTRUCTURE_REVIEWER',
  PUBLIC_USER = 'PUBLIC_USER',
}

export type ApplicationStatus =
  | 'New'
  | 'Processing'
  | 'Findings Generated'
  | 'Awaiting Source Verification'
  | 'Awaiting Institution Response'
  | 'Awaiting Manual Review'
  | 'Review Completed'
  | 'Closed';

export type FindingSeverity =
  | 'Critical Review'
  | 'High Priority'
  | 'Medium Priority'
  | 'Low Priority'
  | 'Informational';

export type FindingCategory =
  | 'Completeness'
  | 'Expiry'
  | 'Internal consistency'
  | 'Cross-document consistency'
  | 'Institutional record consistency'
  | 'Source verification'
  | 'Regulatory requirements'
  | 'Potential document anomalies';

export type VerificationStatus =
  | 'Verified'
  | 'Demo Match — Not Officially Verified'
  | 'Mismatch Detected'
  | 'Mismatch Detected — Simulated Source'
  | 'Expired'
  | 'Verification Pending'
  | 'Source Unavailable'
  | 'Manual Review Required'
  | 'Inconclusive';

export type ComplianceOutcome =
  | 'Evidence Present'
  | 'Evidence Missing'
  | 'Evidence Incomplete'
  | 'Potential Mismatch'
  | 'Source Verification Pending'
  | 'Manual Review Required'
  | 'Not Applicable';

export type ChangeClassification =
  | 'No material difference detected'
  | 'New information'
  | 'Updated information'
  | 'Conflicting information'
  | 'Potentially significant regulatory change'
  | 'Insufficient evidence';

export type RuleLifecycleStatus =
  | 'Draft'
  | 'Under Review'
  | 'Approved for Use'
  | 'Active'
  | 'Superseded'
  | 'Retired';

export interface UserRecord {
  id: string;
  email: string;
  passwordHash?: string;
  fullName: string;
  role: UserRole;
  institutionId: string | null;
  institutionName: string | null;
  department: string;
  active: boolean;
  reviewScope: string[];
  lastLoginAt: string;
  createdAt: string;
}

export interface RoleRecord {
  id: string;
  code: UserRole;
  name: string;
  description: string;
  permissions: string[];
}

export interface UserRoleAssignment {
  id: string;
  userId: string;
  roleId: string;
  assignedBy: string;
  assignedAt: string;
}

export interface InstitutionRecord {
  id: string;
  institutionCode: string;
  name: string;
  type: string;
  state: string;
  district: string;
  establishedYear: number;
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
  publicApprovalStatus:
    | 'Confirmed by an authoritative source'
    | 'Retrieved from an official published record'
    | 'Not found in available records'
    | 'Information unavailable'
    | 'Data requires further confirmation';
  academicPeriod: string;
  approvedProgrammes: {
    name: string;
    level: string;
    approvedIntake: number;
  }[];
  sourceAuthority: string;
  sourceReference: string;
  lastCheckedTimestamp: string;
  syntheticLabel: string;
}

export interface ApplicationRecord {
  id: string;
  applicationCode: string;
  institutionId: string;
  institutionName: string;
  institutionType: string;
  state: string;
  district: string;
  category: string;
  academicYear: string;
  contactDetails: {
    name: string;
    email: string;
    phone: string;
    designation: string;
  };
  requestedIntake: number;
  previousApprovedIntake: number;
  facultyCountClaimed: number;
  builtUpAreaSqmClaimed: number;
  programmesRequested: string[];
  submissionDate: string;
  status: ApplicationStatus;
  verificationStatus: VerificationStatus;
  complianceStatus: string;
  assignedReviewerId: string | null;
  assignedReviewerName: string | null;
  priority: 'High' | 'Medium' | 'Low';
  dueDate: string;
  unresolvedFindingsCount: number;
  documentsReceivedCount: number;
  requiredDocumentsChecklist: string[];
  nextAction: string;
  syntheticLabel: string;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApplicationDocument {
  id: string;
  applicationId: string;
  filename: string;
  mimeType: 'application/pdf' | 'image/png' | 'image/jpeg';
  fileSizeBytes: number;
  sha256Hash: string;
  documentType:
    | 'Approval letter'
    | 'Affidavit or undertaking'
    | 'Accreditation certificate'
    | 'NOC or permission'
    | 'Faculty record'
    | 'Infrastructure evidence'
    | 'Fee payment evidence'
    | 'Compliance report'
    | 'Other supporting document';
  classificationConfidence: number;
  processingStatus: 'Queued' | 'Processing' | 'Completed' | 'Failed' | 'Requires Review';
  verificationStatus: VerificationStatus;
  certificateReference: string;
  issuingAuthority: string;
  issueDate: string | null;
  expiryDate: string | null;
  pageCount: number;
  uploadedBy: string;
  uploadedAt: string;
  isDuplicateOf: string | null;
  metadataFlags: string[];
  syntheticTestCase?: string;
}

export interface DocumentExtraction {
  id: string;
  documentId: string;
  applicationId: string;
  rawText: string;
  ocrEngine: string;
  overallConfidence: number;
  completedAt: string;
}

export interface ExtractedField {
  id: string;
  extractionId: string;
  documentId: string;
  applicationId: string;
  fieldName: string;
  fieldLabel: string;
  fieldValue: string | null;
  confidence: number;
  pageNumber: number;
  regionCoordinates: string;
  requiresConfirmation: boolean;
}

export interface ValidationRun {
  id: string;
  applicationId: string;
  triggeredBy: string;
  evaluationDate: string;
  ruleVersionsApplied: { ruleId: string; version: string }[];
  totalChecksRun: number;
  findingsGeneratedCount: number;
  summaryText: string;
  completedAt: string;
}

export interface ValidationFinding {
  id: string;
  findingCode: string;
  validationRunId: string;
  applicationId: string;
  category: FindingCategory;
  severity: FindingSeverity;
  isDeterministic: boolean;
  confidence: number;
  title: string;
  description: string;
  aiExplanation: string;
  evidenceReference: string;
  sourceDocumentIds: string[];
  pageReferences: string[];
  ruleId: string;
  ruleVersion: string;
  expectedValue: string;
  observedValue: string;
  recommendedAction: string;
  reviewStatus: 'Pending Review' | 'Accepted' | 'Dismissed' | 'Correction Requested' | 'Escalated';
  assignedReviewerId: string | null;
  assignedReviewerName: string | null;
  testCaseRef?: string;
  createdAt: string;
}

export interface RegulatoryRule {
  id: string;
  ruleCode: string;
  name: string;
  description: string;
  requirementCategory:
    | 'Institutional records'
    | 'Programme or course information'
    | 'Faculty documentation'
    | 'Accreditation and certification'
    | 'Permissions and NOCs'
    | 'Infrastructure documentation'
    | 'Fee and payment evidence'
    | 'Other category-specific requirements';
  applicableCategories: string[];
  applicablePeriod: string;
  requiredDocumentType: string;
  validationLogic: string;
  severity: FindingSeverity;
  recommendedAction: string;
  authoritativeSourceRef: string;
  currentVersion: string;
  effectiveDate: string;
  expiryDate: string | null;
  status: RuleLifecycleStatus;
  isSyntheticRule: boolean;
  lastUpdated: string;
}

export interface RegulatoryRuleVersion {
  id: string;
  ruleId: string;
  ruleCode: string;
  version: string;
  validationLogic: string;
  effectiveDate: string;
  approvedBy: string;
  changeNotes: string;
  createdAt: string;
}

export interface ApplicationRuleResult {
  id: string;
  validationRunId: string;
  applicationId: string;
  ruleId: string;
  ruleCode: string;
  ruleVersion: string;
  outcome: ComplianceOutcome;
  details: string;
  evaluatedAt: string;
}

export type EvidenceNodeType =
  | 'CLAIM'
  | 'DOCUMENT'
  | 'EXTRACTED_VALUE'
  | 'INSTITUTIONAL_RECORD'
  | 'REGULATORY_RULE'
  | 'VERIFICATION_SOURCE'
  | 'FINDING'
  | 'REVIEW_DECISION';

export type EvidenceEdgeType =
  | 'Supported by'
  | 'Extracted from'
  | 'Conflicts with'
  | 'Verified against'
  | 'Required by'
  | 'Supersedes'
  | 'Reviewed by';

export interface EvidenceNode {
  id: string;
  applicationId: string;
  nodeType: EvidenceNodeType;
  label: string;
  subtitle: string;
  status: string;
  severity?: FindingSeverity;
  position: { x: number; y: number };
  details: {
    claimText?: string;
    documentName?: string;
    pageReference?: string;
    institutionalRecordRef?: string;
    ruleCode?: string;
    ruleDescription?: string;
    findingDescription?: string;
    expectedValue?: string;
    observedValue?: string;
    recommendedAction?: string;
    verificationMode?: string;
  };
}

export interface EvidenceRelationship {
  id: string;
  applicationId: string;
  sourceNodeId: string;
  targetNodeId: string;
  relationshipType: EvidenceEdgeType;
  isConflict: boolean;
}

export interface SourceVerificationRequest {
  id: string;
  documentId: string;
  applicationId: string;
  certificateReference: string;
  sourceAuthority: string;
  verificationMethod:
    | 'Official issuing-authority API'
    | 'Official verification portal'
    | 'Digital signature validation'
    | 'QR code verification'
    | 'Digital repository reference'
    | 'Unique certificate or document identifier'
    | 'Manual authority confirmation';
  isSimulatedMode: boolean;
  requestedBy: string;
  requestTimestamp: string;
}

export interface SourceVerificationResult {
  id: string;
  requestId: string;
  documentId: string;
  applicationId: string;
  certificateReference: string;
  sourceAuthority: string;
  verificationMethod: string;
  isSimulatedMode: boolean;
  requestTimestamp: string;
  responseTimestamp: string;
  returnedResult: string;
  matchedFields: { field: string; submitted: string; authorityValue: string; match: boolean }[];
  sourceResponseReference: string;
  verificationStatus: VerificationStatus;
  reviewerAction: string;
}

export interface ComplianceAssessment {
  id: string;
  requirementCode: string;
  applicationId: string;
  requirementCategory: string;
  requirementText: string;
  applicableCategory: string;
  evidenceRequired: string;
  evidenceSupplied: string;
  validationResult: ComplianceOutcome;
  evidenceReference: string;
  ruleId: string;
  ruleCode: string;
  ruleVersion: string;
  reviewStatus: 'Pending' | 'Reviewed' | 'Requires Action';
  nextAction: string;
}

export interface InfrastructureReviewRecord {
  id: string;
  applicationId: string;
  evidenceTitle: string;
  evidenceType:
    | 'Classroom photographs'
    | 'Laboratory photographs'
    | 'Library photographs'
    | 'Floor plans'
    | 'Building plans'
    | 'Infrastructure certificates';
  documentId: string;
  captureDate: string;
  dimensionsOrArea: string;
  sha256Hash: string;
  perceptualHash: string;
  duplicateDetectedWithId: string | null;
  similarityScore: number;
  cvAdvisoryNotes: string;
  checklistItems: {
    id: string;
    item: string;
    status: 'Confirmed in Image' | 'Unconfirmed — Physical Inspection Needed' | 'Discrepancy Flagged';
  }[];
  reviewerAnnotations: {
    id: string;
    author: string;
    timestamp: string;
    note: string;
    regionLabel: string;
  }[];
  inspectionReferralStatus: 'None' | 'Additional Evidence Requested' | 'Referred for Physical Inspection';
  reviewedBy: string | null;
  updatedAt: string;
}

export interface HistoricalRecordSnapshot {
  id: string;
  institutionId: string;
  applicationId: string;
  academicYear: string;
  recordDate: string;
  sourceDocument: string;
  fields: Record<string, string | number>;
}

export interface ChangeImpactFinding {
  id: string;
  applicationId: string;
  institutionId: string;
  fieldName: string;
  fieldLabel: string;
  previousValue: string;
  currentValue: string;
  differenceSummary: string;
  previousSourceDocument: string;
  previousRecordDate: string;
  currentSourceDocument: string;
  currentRecordDate: string;
  applicableRuleCode: string;
  verificationStatus: string;
  changeClassification: ChangeClassification;
  potentialImpact: string;
  recommendedAction: string;
  resolutionStatus: 'Unresolved' | 'Reviewed & Acknowledged' | 'Escalated for Verification';
  resolvedBy: string | null;
  resolutionNote: string | null;
}

export interface ReviewerAssignment {
  id: string;
  applicationId: string;
  reviewerId: string;
  reviewerName: string;
  role: UserRole;
  assignedBy: string;
  assignedAt: string;
  status: 'Active' | 'Completed' | 'Escalated';
}

export interface ReviewActionRecord {
  id: string;
  applicationId: string;
  findingId: string | null;
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  actionType:
    | 'Accept Finding'
    | 'Dismiss Finding'
    | 'Request Additional Evidence'
    | 'Escalate Case'
    | 'Internal Observation'
    | 'Review Recommendation';
  justification: string;
  previousStatus: string;
  newStatus: string;
  createdAt: string;
}

export interface AdditionalEvidenceRequest {
  id: string;
  applicationId: string;
  findingId: string | null;
  requestedBy: string;
  requestedDocumentType: string;
  description: string;
  dueDate: string;
  status: 'Open' | 'Submitted by Institution' | 'Verified';
  responseNotes: string | null;
  createdAt: string;
}

export interface NotificationRecord {
  id: string;
  recipientRole: UserRole | 'ALL';
  recipientInstitutionId: string | null;
  category:
    | 'Missing document'
    | 'Expired document'
    | 'Source mismatch'
    | 'Verification pending'
    | 'New finding'
    | 'Additional evidence requested'
    | 'Reviewer assignment'
    | 'Review completed'
    | 'Rule configuration updated';
  severity: FindingSeverity;
  title: string;
  message: string;
  relatedApplicationId: string | null;
  relatedFindingId: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface AuditEventRecord {
  id: string;
  timestamp: string;
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  action: string;
  entityType: string;
  entityId: string;
  previousState: string | null;
  newState: string | null;
  reason: string;
  correlationId: string;
  integrityHash: string;
}

export interface ReportRecord {
  id: string;
  reportCode: string;
  reportType:
    | 'Application Validation Report'
    | 'Document Completeness Report'
    | 'Cross-Document Discrepancy Report'
    | 'Source Verification Report'
    | 'Compliance Assessment Report'
    | 'Regulatory Change Impact Report'
    | 'Pending Review Report'
    | 'Processing Time Report'
    | 'Audit Activity Report';
  applicationId: string;
  institutionName: string;
  generatedBy: string;
  generatedAt: string;
  scope: string;
  rulesAppliedCount: number;
  findingsSummary: {
    total: number;
    critical: number;
    high: number;
    medium: number;
    unresolved: number;
  };
  containsSimulatedData: boolean;
  limitations: string;
  disclaimer: string;
}

export interface DataSourceAdapterRecord {
  id: string;
  name: string;
  sourceAuthority: string;
  sourceType: 'Issuing Authority API' | 'Digital Repository' | 'Portal Adapter' | 'Signature Verifier';
  supportedMethod: string;
  integrationStatus: 'Simulated Demo Adapter' | 'Source Unavailable' | 'Standby — Manual Fallback';
  lastSuccessfulConnection: string | null;
  lastAttemptedConnection: string;
  authConfigStatus: 'Env Var Configured (Simulated)' | 'Credentials Not Provisioned';
  permittedDocumentTypes: string[];
  errorLogs: string[];
  manualFallbackEnabled: boolean;
}

export interface SystemConfigurationRecord {
  id: string;
  evaluationDate: string;
  maxUploadSizeMb: number;
  allowedFileFormats: string[];
  sessionTimeoutMinutes: number;
  dataRetentionDays: number;
  inAppNotificationsEnabled: boolean;
  emailDeliveryConfigured: boolean;
  auditTamperEvidentChain: boolean;
  defaultTheme: 'light' | 'dark';
  demoModeActive: boolean;
  syntheticDataBannerText: string;
}
