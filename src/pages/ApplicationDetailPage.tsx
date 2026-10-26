import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import {
  FileText,
  AlertTriangle,
  Share2,
  Scale,
  ShieldCheck,
  GitCompare,
  Gavel,
  History,
  Play,
  Sparkles,
  Upload,
  ExternalLink,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { StatusIndicator } from '../components/ProofMeshLogo';
import {
  ApplicationRecord,
  ApplicationDocument,
  ValidationFinding,
  ComplianceAssessment,
  SourceVerificationResult,
  ChangeImpactFinding,
  ReviewActionRecord,
  AdditionalEvidenceRequest,
  AuditEventRecord,
  EvidenceNode,
  EvidenceRelationship,
} from '../types/domain';

interface ApplicationFullBundle {
  application: ApplicationRecord;
  documents: ApplicationDocument[];
  findings: ValidationFinding[];
  compliance: ComplianceAssessment[];
  verifications: SourceVerificationResult[];
  changeImpacts: ChangeImpactFinding[];
  reviewActions: ReviewActionRecord[];
  evidenceRequests: AdditionalEvidenceRequest[];
  auditEvents: AuditEventRecord[];
}

const TABS = [
  { id: 'overview', label: 'Overview', icon: FileText },
  { id: 'documents', label: 'Documents', icon: Upload },
  { id: 'findings', label: 'Validation Findings', icon: AlertTriangle },
  { id: 'graph', label: 'Evidence Graph', icon: Share2 },
  { id: 'compliance', label: 'Compliance', icon: Scale },
  { id: 'verification', label: 'Source Verification', icon: ShieldCheck },
  { id: 'changes', label: 'Historical Changes', icon: GitCompare },
  { id: 'reviews', label: 'Review Actions', icon: Gavel },
  { id: 'audit', label: 'Audit History', icon: History },
] as const;

type TabId = (typeof TABS)[number]['id'];

export const ApplicationDetailPage: React.FC = () => {
  const { applicationId } = useParams<{ applicationId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { apiFetch, addToast } = useApp();

  const initialTab = (searchParams.get('tab') as TabId) || 'overview';
  const [activeTab, setActiveTab] = useState<TabId>(initialTab);
  const [bundle, setBundle] = useState<ApplicationFullBundle | null>(null);
  const [graphData, setGraphData] = useState<{ nodes: EvidenceNode[]; relationships: EvidenceRelationship[] }>({
    nodes: [],
    relationships: [],
  });
  const [loading, setLoading] = useState(true);
  const [runningValidation, setRunningValidation] = useState(false);

  // Interactive states for finding justification & review actions
  const [selectedFinding, setSelectedFinding] = useState<ValidationFinding | null>(null);
  const [findingComment, setFindingComment] = useState('');
  const [aiBriefing, setAiBriefing] = useState<{ text: string; source: string } | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  // Request additional evidence form
  const [reqDocType, setReqDocType] = useState('Fee payment evidence');
  const [reqDescription, setReqDescription] = useState('');
  const [submittingReq, setSubmittingReq] = useState(false);

  const loadBundle = useCallback(async () => {
    if (!applicationId) return;
    setLoading(true);
    try {
      const data = await apiFetch<ApplicationFullBundle>(`/api/v1/applications/${applicationId}`);
      setBundle(data);
      const g = await apiFetch<{ nodes: EvidenceNode[]; relationships: EvidenceRelationship[] }>(
        `/api/v1/applications/${applicationId}/evidence-graph`
      ).catch(() => ({ nodes: [], relationships: [] }));
      setGraphData(g);
    } catch (e: any) {
      addToast({
        title: 'Access or Load Error',
        description: e.message || 'Unable to load application bundle.',
        variant: 'critical',
      });
    } finally {
      setLoading(false);
    }
  }, [applicationId, apiFetch, addToast]);

  useEffect(() => {
    loadBundle();
  }, [loadBundle]);

  const handleTabChange = (tab: TabId) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const handleRunValidation = async () => {
    if (!applicationId) return;
    setRunningValidation(true);
    try {
      const res = await apiFetch<{ validationRun: { summaryText: string } }>(
        `/api/v1/applications/${applicationId}/validate`,
        { method: 'POST' }
      );
      addToast({
        title: 'Validation Engine Executed',
        description: res.validationRun.summaryText,
        variant: 'success',
      });
      await loadBundle();
    } catch (e: any) {
      addToast({
        title: 'Validation Error',
        description: e.message,
        variant: 'critical',
      });
    } finally {
      setRunningValidation(false);
    }
  };

  const handleRequestAiSummary = async (finding?: ValidationFinding) => {
    const targetFinding = finding || bundle?.findings[0];
    if (!targetFinding) {
      setAiBriefing({
        text: 'No discrepancy detected by the checks performed. All tested deterministic rules passed without conflict.',
        source: 'Deterministic Rule Engine',
      });
      return;
    }
    setLoadingAi(true);
    try {
      const res = await apiFetch<{ explanation: string; source: string }>('/api/v1/ai/explain', {
        method: 'POST',
        body: JSON.stringify({ findingId: targetFinding.id }),
      });
      setAiBriefing({ text: res.explanation, source: res.source });
    } catch (e: any) {
      addToast({
        title: 'AI Explanation Failed',
        description: e.message,
        variant: 'warning',
      });
    } finally {
      setLoadingAi(false);
    }
  };

  const handleFindingDecision = async (
    findingId: string,
    actionType: 'Accept Finding' | 'Dismiss Finding' | 'Request Additional Evidence' | 'Escalate Case'
  ) => {
    if (!findingComment.trim()) {
      addToast({
        title: 'Justification Required',
        description: 'Every validation finding review action requires an explicit officer justification comment.',
        variant: 'warning',
      });
      return;
    }
    try {
      await apiFetch(`/api/v1/findings/${findingId}/actions`, {
        method: 'POST',
        body: JSON.stringify({ actionType, justification: findingComment }),
      });
      addToast({
        title: `Action Recorded: ${actionType}`,
        description: 'Recorded in immutable audit trail with justification.',
        variant: 'success',
      });
      setSelectedFinding(null);
      setFindingComment('');
      await loadBundle();
    } catch (e: any) {
      addToast({ title: 'Review Action Failed', description: e.message, variant: 'critical' });
    }
  };

  const handleRequestEvidenceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!applicationId || !reqDescription.trim()) {
      addToast({
        title: 'Description Required',
        description: 'Please enter the specific deficiency and required document details.',
        variant: 'warning',
      });
      return;
    }
    setSubmittingReq(true);
    try {
      await apiFetch(`/api/v1/applications/${applicationId}/request-evidence`, {
        method: 'POST',
        body: JSON.stringify({
          requestedDocumentType: reqDocType,
          description: reqDescription,
          dueDate: '2026-11-12',
        }),
      });
      addToast({
        title: 'Additional Evidence Requested',
        description: `Deficiency notice sent to institution for ${reqDocType}.`,
        variant: 'success',
      });
      setReqDescription('');
      await loadBundle();
    } catch (err: any) {
      addToast({ title: 'Request Error', description: err.message, variant: 'critical' });
    } finally {
      setSubmittingReq(false);
    }
  };

  if (loading || !bundle) {
    return (
      <div className="pm-card p-8 text-center bg-white">
        <div className="text-sm font-semibold text-[#10243A]">Loading Regulatory Application Dossier...</div>
        <div className="text-xs text-[#617384] mt-1 font-mono">{applicationId}</div>
      </div>
    );
  }

  const {
    application,
    documents,
    findings,
    compliance,
    verifications,
    changeImpacts,
    reviewActions,
    evidenceRequests,
    auditEvents,
  } = bundle;

  const criticalCount = findings.filter((f) => f.severity === 'Critical Review').length;
  const highCount = findings.filter((f) => f.severity === 'High Priority').length;

  return (
    <div className="space-y-5">
      {/* Header Dossier Bar */}
      <div className="pm-card p-5 bg-white">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="font-mono text-xs font-semibold px-2.5 py-1 rounded bg-[#10243A] text-white">
                {application.applicationCode}
              </span>
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-[#E6F4F5] text-[#087F8C] font-semibold">
                {application.institutionId}
              </span>
              <StatusIndicator status={application.status} />
              <span className="text-xs text-[#617384] font-mono">
                Academic Year: {application.academicYear} ({application.category})
              </span>
            </div>
            <h1 className="text-xl font-bold text-[#10243A] mt-2">{application.institutionName}</h1>
            <p className="text-xs text-[#617384] mt-0.5">
              Programmes: {application.programmesRequested.join(' • ')} | Prior Intake:{' '}
              <span className="font-mono font-semibold text-[#10243A]">{application.previousApprovedIntake}</span> →
              Requested Intake:{' '}
              <span className="font-mono font-semibold text-[#087F8C]">{application.requestedIntake}</span> | Assigned
              Reviewer: <span className="font-medium text-[#10243A]">{application.assignedReviewerName}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleRunValidation}
              disabled={runningValidation}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded text-xs font-semibold bg-[#087F8C] text-white hover:bg-[#10243A] transition-colors cursor-pointer disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5" />
              {runningValidation ? 'Running Checks...' : 'Run Validation Engine'}
            </button>
            <button
              onClick={() => handleRequestAiSummary()}
              disabled={loadingAi}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded text-xs font-semibold border border-[#087F8C] text-[#087F8C] hover:bg-[#E6F4F5] transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {loadingAi ? 'Synthesizing...' : 'AI Regulatory Briefing'}
            </button>
            <Link
              to={`/evidence-graph?appId=${application.id}`}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded text-xs font-semibold border border-[#DCE5EC] text-[#10243A] hover:bg-[#F4F7FA]"
            >
              <Share2 className="w-3.5 h-3.5 text-[#087F8C]" />
              Full Evidence Graph
            </Link>
          </div>
        </div>

        {/* KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 mt-4 pt-4 border-t border-[#DCE5EC]">
          <div className="p-2.5 rounded bg-[#F4F7FA]">
            <div className="text-[11px] font-semibold uppercase text-[#617384]">Checklist Docs</div>
            <div className="text-lg font-bold font-mono text-[#10243A] mt-0.5">
              {application.documentsReceivedCount} / {application.requiredDocumentsChecklist.length}
            </div>
          </div>
          <div className="p-2.5 rounded bg-[#F4F7FA]">
            <div className="text-[11px] font-semibold uppercase text-[#617384]">Priority</div>
            <div className="mt-1">
              <StatusIndicator status={`${application.priority} Priority`} />
            </div>
          </div>
          <div className="p-2.5 rounded bg-[#F4F7FA]">
            <div className="text-[11px] font-semibold uppercase text-[#617384]">Critical Findings</div>
            <div className="text-lg font-bold font-mono text-[#B42318] mt-0.5">{criticalCount}</div>
          </div>
          <div className="p-2.5 rounded bg-[#F4F7FA]">
            <div className="text-[11px] font-semibold uppercase text-[#617384]">High Priority</div>
            <div className="text-lg font-bold font-mono text-[#B7791F] mt-0.5">{highCount}</div>
          </div>
          <div className="p-2.5 rounded bg-[#F4F7FA]">
            <div className="text-[11px] font-semibold uppercase text-[#617384]">Open Findings</div>
            <div className="text-lg font-bold font-mono text-[#10243A] mt-0.5">
              {application.unresolvedFindingsCount}
            </div>
          </div>
          <div className="p-2.5 rounded bg-[#F4F7FA]">
            <div className="text-[11px] font-semibold uppercase text-[#617384]">Historical Deltas</div>
            <div className="text-lg font-bold font-mono text-[#087F8C] mt-0.5">{changeImpacts.length} Tracked</div>
          </div>
        </div>

        {/* Optional AI Briefing Box */}
        {aiBriefing && (
          <div className="mt-4 p-4 rounded border border-[#087F8C]/40 bg-[#E6F4F5]/60">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#087F8C] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Regulatory Intelligence Briefing ({aiBriefing.source})
              </span>
              <button
                onClick={() => setAiBriefing(null)}
                className="text-xs text-[#617384] hover:text-[#10243A] cursor-pointer"
              >
                Close
              </button>
            </div>
            <p className="text-xs text-[#10243A] leading-relaxed mt-2">{aiBriefing.text}</p>
          </div>
        )}
      </div>

      {/* 9-Tab Navigation Bar */}
      <div className="flex items-center gap-1 overflow-x-auto border-b border-[#DCE5EC] bg-white px-3 pt-2 rounded-t-md">
        {TABS.map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => handleTabChange(t.id)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'border-[#087F8C] text-[#087F8C] bg-[#E6F4F5]/30'
                  : 'border-transparent text-[#617384] hover:text-[#10243A]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {t.label}
              {t.id === 'findings' && (
                <span className="ml-1 px-1.5 py-0.2 rounded bg-red-50 text-[#B42318] font-mono text-[10px]">
                  {findings.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-4">
            <div className="pm-card p-5 bg-white">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold text-[#10243A] uppercase tracking-wider">
                  Priority Validation & Compliance Summary
                </h2>
                <span className="text-xs text-[#617384] font-mono">{application.complianceStatus}</span>
              </div>
              {findings.length === 0 ? (
                <div className="p-4 rounded bg-emerald-50 text-[#18794E] text-xs font-medium">
                  No discrepancy detected by the checks performed.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {findings.map((f) => (
                    <div
                      key={f.id}
                      className="p-3.5 rounded border border-[#DCE5EC] hover:border-[#087F8C] transition-colors bg-[#F4F7FA]/50 flex items-start justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <StatusIndicator status={f.severity} />
                          <span className="font-mono text-[11px] font-semibold text-[#087F8C]">{f.ruleId}</span>
                          <span className="text-xs font-bold text-[#10243A]">{f.title}</span>
                        </div>
                        <p className="text-xs text-[#617384] leading-relaxed">{f.description}</p>
                        <div className="flex items-center gap-4 text-[11px] font-mono text-[#617384] pt-1">
                          <span>Expected: {f.expectedValue}</span>
                          <span>Observed: {f.observedValue}</span>
                          <span>Status: {f.reviewStatus}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedFinding(f);
                          handleTabChange('findings');
                        }}
                        className="px-2.5 py-1.5 rounded border border-[#DCE5EC] bg-white text-xs font-semibold text-[#10243A] hover:border-[#087F8C] shrink-0 cursor-pointer"
                      >
                        Inspect
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pm-card p-5 bg-white">
              <h2 className="text-sm font-bold text-[#10243A] uppercase tracking-wider mb-3">
                Submitted Evidence Inventory ({documents.length} Files)
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#DCE5EC] text-[11px] font-semibold uppercase text-[#617384]">
                      <th className="py-2 pr-3">Document</th>
                      <th className="py-2 px-3">Category</th>
                      <th className="py-2 px-3">Confidence</th>
                      <th className="py-2 px-3">Verification</th>
                      <th className="py-2 pl-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#DCE5EC] text-xs">
                    {documents.map((doc) => (
                      <tr key={doc.id} className="hover:bg-[#F4F7FA]/60">
                        <td className="py-2.5 pr-3 font-medium text-[#10243A] font-mono">{doc.filename}</td>
                        <td className="py-2.5 px-3 text-[11px] text-[#087F8C] font-semibold">{doc.documentType}</td>
                        <td className="py-2.5 px-3 font-mono">{Math.round(doc.classificationConfidence * 100)}%</td>
                        <td className="py-2.5 px-3">
                          <StatusIndicator status={doc.verificationStatus} />
                        </td>
                        <td className="py-2.5 pl-3 text-right">
                          <Link
                            to={`/document-intelligence?docId=${doc.id}`}
                            className="text-xs font-semibold text-[#087F8C] hover:underline"
                          >
                            Open Split View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="pm-card p-5 bg-white">
              <h2 className="text-sm font-bold text-[#10243A] uppercase tracking-wider mb-3">
                Regulatory Decision Posture
              </h2>
              <p className="text-xs text-[#617384] leading-relaxed mb-3">
                PROOFMESH AI operates under Human-in-the-Loop governance. All validation flags are decision-support
                indicators requiring officer sign-off.
              </p>
              <div className="p-3 rounded bg-[#F4F7FA] border border-[#DCE5EC] space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#617384]">Positive Check Output:</span>
                  <span className="font-mono font-semibold text-[#18794E]">No discrepancy detected</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#617384]">Simulated Adapter Mode:</span>
                  <span className="font-mono font-semibold text-[#087F8C]">Explicitly Tagged</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#617384]">Next Action:</span>
                  <span className="font-mono text-[#10243A] text-right">{application.nextAction}</span>
                </div>
              </div>
              <button
                onClick={() => handleTabChange('reviews')}
                className="w-full mt-4 py-2 px-3 rounded bg-[#10243A] text-white text-xs font-semibold hover:bg-[#183B56] transition-colors cursor-pointer"
              >
                Request Additional Evidence / Log Action
              </button>
            </div>

            <div className="pm-card p-5 bg-white">
              <h2 className="text-sm font-bold text-[#10243A] uppercase tracking-wider mb-3">
                Year-on-Year Delta Snapshot
              </h2>
              <div className="space-y-2.5">
                {changeImpacts.map((c) => (
                  <div key={c.id} className="p-3 rounded border border-[#DCE5EC] text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[#10243A]">{c.fieldLabel}</span>
                      <StatusIndicator status={c.changeClassification} />
                    </div>
                    <div className="text-[11px] font-mono text-[#617384] mt-1">
                      Prior: {c.previousValue} → Current: {c.currentValue}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DOCUMENTS */}
      {activeTab === 'documents' && (
        <div className="pm-card p-5 bg-white space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#10243A] uppercase tracking-wider">
              Application Documents & Cryptographic Hashes ({documents.length})
            </h2>
            <Link
              to="/document-intelligence"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#087F8C] text-white text-xs font-semibold hover:bg-[#10243A]"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Open Split-Screen OCR Workspace
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {documents.map((doc) => (
              <div key={doc.id} className="p-4 rounded border border-[#DCE5EC] bg-[#F4F7FA]/40 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-[#087F8C]">{doc.documentType}</span>
                  <StatusIndicator status={doc.processingStatus} />
                </div>
                <div className="font-bold text-[#10243A] font-mono">{doc.filename}</div>
                <div className="text-[11px] font-mono text-[#617384] space-y-0.5">
                  <div>Ref: {doc.certificateReference} | Authority: {doc.issuingAuthority}</div>
                  <div>Issued: {doc.issueDate || 'N/A'} | Expiry: {doc.expiryDate || 'Perpetual'}</div>
                  <div>SHA-256: {doc.sha256Hash.slice(0, 24)}...</div>
                </div>
                {doc.metadataFlags.length > 0 && (
                  <div className="p-2 rounded bg-amber-50 border border-amber-200 text-[#B7791F] text-[11px]">
                    Preliminary Anomaly: {doc.metadataFlags.join(' • ')}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: VALIDATION FINDINGS */}
      {activeTab === 'findings' && (
        <div className="space-y-4">
          {findings.length === 0 ? (
            <div className="pm-card p-6 bg-white text-xs font-medium text-[#18794E]">
              No discrepancy detected by the checks performed.
            </div>
          ) : (
            findings.map((f) => (
              <div key={f.id} className="pm-card p-5 bg-white">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-1.5 max-w-3xl">
                    <div className="flex items-center gap-2 flex-wrap">
                      <StatusIndicator status={f.severity} />
                      <span className="font-mono text-xs font-bold text-[#087F8C]">{f.ruleId}</span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-[#F4F7FA] text-[#617384]">
                        {f.category}
                      </span>
                      <span className="font-mono text-xs text-[#617384]">State: {f.reviewStatus}</span>
                    </div>
                    <h3 className="text-base font-bold text-[#10243A]">{f.title}</h3>
                    <p className="text-xs text-[#617384] leading-relaxed">{f.description}</p>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                      <div className="p-2.5 rounded bg-[#F4F7FA] border border-[#DCE5EC]">
                        <div className="text-[10px] font-semibold uppercase text-[#617384]">Expected / Claimed</div>
                        <div className="text-xs font-mono font-bold text-[#10243A] mt-0.5">{f.expectedValue}</div>
                      </div>
                      <div className="p-2.5 rounded bg-[#F4F7FA] border border-[#DCE5EC]">
                        <div className="text-[10px] font-semibold uppercase text-[#617384]">Observed Evidence</div>
                        <div className="text-xs font-mono font-bold text-[#B42318] mt-0.5">{f.observedValue}</div>
                      </div>
                      <div className="p-2.5 rounded bg-[#F4F7FA] border border-[#DCE5EC]">
                        <div className="text-[10px] font-semibold uppercase text-[#617384]">Evidence Anchors</div>
                        <div className="text-xs font-mono text-[#087F8C] mt-0.5">{f.evidenceReference}</div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 shrink-0">
                    <button
                      onClick={() => setSelectedFinding(selectedFinding?.id === f.id ? null : f)}
                      className="px-3 py-1.5 rounded bg-[#10243A] text-white text-xs font-semibold hover:bg-[#183B56] cursor-pointer"
                    >
                      {selectedFinding?.id === f.id ? 'Close Review Drawer' : 'Review & Justify'}
                    </button>
                    <button
                      onClick={() => handleRequestAiSummary(f)}
                      className="px-3 py-1.5 rounded border border-[#087F8C] text-[#087F8C] text-xs font-semibold hover:bg-[#E6F4F5] cursor-pointer"
                    >
                      Explain Clause Impact
                    </button>
                  </div>
                </div>

                {selectedFinding?.id === f.id && (
                  <div className="mt-4 pt-4 border-t border-[#DCE5EC] bg-[#F4F7FA] p-4 rounded space-y-3">
                    <div className="text-xs font-bold text-[#10243A]">
                      Record Officer Decision for Finding {f.findingCode} ({f.ruleId})
                    </div>
                    <textarea
                      value={findingComment}
                      onChange={(e) => setFindingComment(e.target.value)}
                      rows={2}
                      placeholder="Enter mandatory justification comment (minimum 3 characters)..."
                      className="w-full p-2.5 rounded border border-[#DCE5EC] bg-white text-xs text-[#10243A]"
                    />
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => handleFindingDecision(f.id, 'Accept Finding')}
                        className="px-3 py-1.5 rounded bg-[#18794E] text-white text-xs font-semibold cursor-pointer"
                      >
                        Accept Finding
                      </button>
                      <button
                        onClick={() => handleFindingDecision(f.id, 'Request Additional Evidence')}
                        className="px-3 py-1.5 rounded bg-[#B7791F] text-white text-xs font-semibold cursor-pointer"
                      >
                        Request Additional Evidence
                      </button>
                      <button
                        onClick={() => handleFindingDecision(f.id, 'Dismiss Finding')}
                        className="px-3 py-1.5 rounded bg-[#B42318] text-white text-xs font-semibold cursor-pointer"
                      >
                        Dismiss Finding (With Justification)
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 4: EVIDENCE GRAPH PREVIEW */}
      {activeTab === 'graph' && (
        <div className="pm-card p-5 bg-white space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-[#10243A] uppercase tracking-wider">
                Application Claim-to-Evidence Graph ({graphData.nodes.length} Nodes •{' '}
                {graphData.relationships.length} Relationships)
              </h2>
              <p className="text-xs text-[#617384] mt-0.5">
                Interactive multi-hop traceability from institutional claims to document snippets, regulatory clauses,
                and verification logs.
              </p>
            </div>
            <Link
              to={`/evidence-graph?appId=${application.id}`}
              className="px-3.5 py-2 rounded bg-[#087F8C] text-white text-xs font-semibold hover:bg-[#10243A]"
            >
              Launch Full Interactive Graph Canvas
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {graphData.nodes.slice(0, 9).map((node) => (
              <div key={node.id} className="p-3 rounded border border-[#DCE5EC] bg-[#F4F7FA]/50 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] font-bold uppercase text-[#087F8C]">{node.nodeType}</span>
                  <StatusIndicator status={node.status} />
                </div>
                <div className="font-bold text-[#10243A] mt-1">{node.label}</div>
                <div className="text-[11px] text-[#617384] mt-0.5">{node.subtitle}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: COMPLIANCE */}
      {activeTab === 'compliance' && (
        <div className="pm-card p-5 bg-white">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-[#10243A] uppercase tracking-wider">
                Clause-by-Clause Regulatory Compliance Matrix
              </h2>
              <p className="text-xs text-[#617384]">
                Positive evaluations state &ldquo;No discrepancy detected by the checks performed&rdquo; rather than
                claiming absolute legal certainty.
              </p>
            </div>
            <Link to="/compliance" className="text-xs font-semibold text-[#087F8C] hover:underline">
              Open Compliance Center →
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#DCE5EC] text-[11px] font-semibold uppercase text-[#617384]">
                  <th className="py-2.5 pr-3">Rule Code</th>
                  <th className="py-2.5 px-3">Requirement</th>
                  <th className="py-2.5 px-3">Evidence Required</th>
                  <th className="py-2.5 px-3">Evidence Supplied</th>
                  <th className="py-2.5 px-3">Validation Outcome</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DCE5EC]">
                {compliance.map((c) => (
                  <tr key={c.id} className="hover:bg-[#F4F7FA]/60">
                    <td className="py-3 pr-3 font-mono font-bold text-[#087F8C]">{c.ruleCode}</td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-[#10243A]">{c.requirementText}</div>
                      <div className="text-[11px] text-[#617384] mt-0.5">{c.nextAction}</div>
                    </td>
                    <td className="py-3 px-3">{c.evidenceRequired}</td>
                    <td className="py-3 px-3 font-mono">{c.evidenceSupplied}</td>
                    <td className="py-3 px-3">
                      <StatusIndicator status={c.validationResult} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 6: SOURCE VERIFICATION */}
      {activeTab === 'verification' && (
        <div className="pm-card p-5 bg-white space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-[#10243A] uppercase tracking-wider">
                Trusted Source & Registry Verification Records
              </h2>
              <p className="text-xs text-[#617384]">
                All simulated registry adapter responses are explicitly labeled as simulated source checks.
              </p>
            </div>
            <Link
              to="/verification"
              className="px-3 py-1.5 rounded bg-[#087F8C] text-white text-xs font-semibold hover:bg-[#10243A]"
            >
              Run Live Registry Query
            </Link>
          </div>
          <div className="space-y-3">
            {verifications.map((v) => (
              <div key={v.id} className="p-4 rounded border border-[#DCE5EC] bg-[#F4F7FA]/40 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-[#087F8C]">{v.certificateReference}</span>
                    <span className="font-bold text-[#10243A]">{v.sourceAuthority}</span>
                    {v.isSimulatedMode && (
                      <span className="px-2 py-0.5 rounded bg-blue-50 text-[#2563EB] font-mono text-[10px]">
                        SIMULATED ADAPTER
                      </span>
                    )}
                  </div>
                  <StatusIndicator status={v.verificationStatus} />
                </div>
                <p className="text-[#617384] mt-1.5">{v.returnedResult}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 7: HISTORICAL CHANGES */}
      {activeTab === 'changes' && (
        <div className="pm-card p-5 bg-white space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-[#10243A] uppercase tracking-wider">
                Historical Year-on-Year Change Impact Analysis (2025–2026 vs 2026–2027)
              </h2>
              <p className="text-xs text-[#617384]">
                Detects parameter shifts that trigger new regulatory obligations or capacity deficits.
              </p>
            </div>
            <Link to="/change-impact" className="text-xs font-semibold text-[#087F8C] hover:underline">
              Open Change Impact Engine →
            </Link>
          </div>
          <div className="space-y-3">
            {changeImpacts.map((c) => (
              <div key={c.id} className="p-4 rounded border border-[#DCE5EC] bg-white">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-bold text-[#10243A]">{c.fieldLabel}</span>
                  <StatusIndicator status={c.changeClassification} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2 text-xs font-mono">
                  <div className="p-2 rounded bg-[#F4F7FA]">Prior Baseline: {c.previousValue}</div>
                  <div className="p-2 rounded bg-[#F4F7FA]">Current Claim: {c.currentValue}</div>
                  <div className="p-2 rounded bg-red-50 text-[#B42318]">Rule: {c.applicableRuleCode}</div>
                </div>
                <p className="text-xs text-[#617384] mt-2">{c.potentialImpact}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 8: REVIEW ACTIONS */}
      {activeTab === 'reviews' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="pm-card p-5 bg-white">
            <h2 className="text-sm font-bold text-[#10243A] uppercase tracking-wider mb-3">
              Issue Formal Request for Additional Evidence
            </h2>
            <form onSubmit={handleRequestEvidenceSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-[#10243A] mb-1">Required Document Category</label>
                <select
                  value={reqDocType}
                  onChange={(e) => setReqDocType(e.target.value)}
                  className="w-full p-2.5 rounded border border-[#DCE5EC] bg-white text-[#10243A] font-medium"
                >
                  <option value="Fee payment evidence">Fee payment evidence</option>
                  <option value="NOC or permission">NOC or permission</option>
                  <option value="Faculty record">Faculty record</option>
                  <option value="Infrastructure evidence">Infrastructure evidence</option>
                  <option value="Affidavit or undertaking">Affidavit or undertaking</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold text-[#10243A] mb-1">
                  Deficiency Details & Cited Rule Clauses
                </label>
                <textarea
                  value={reqDescription}
                  onChange={(e) => setReqDescription(e.target.value)}
                  rows={4}
                  placeholder="Cite specific findings, document page numbers, and regulatory rules requiring institution response..."
                  className="w-full p-2.5 rounded border border-[#DCE5EC] bg-white text-[#10243A]"
                />
              </div>
              <button
                type="submit"
                disabled={submittingReq}
                className="px-4 py-2 rounded bg-[#087F8C] text-white font-semibold hover:bg-[#10243A] cursor-pointer"
              >
                {submittingReq ? 'Issuing Notice...' : 'Issue Additional Evidence Request'}
              </button>
            </form>
          </div>

          <div className="pm-card p-5 bg-white space-y-3">
            <h2 className="text-sm font-bold text-[#10243A] uppercase tracking-wider">
              Historical Review Action Log ({reviewActions.length + evidenceRequests.length})
            </h2>
            {evidenceRequests.map((er) => (
              <div key={er.id} className="p-3.5 rounded border border-[#087F8C]/40 bg-[#E6F4F5]/30 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-[#087F8C]">EVIDENCE REQUEST: {er.requestedDocumentType}</span>
                  <StatusIndicator status={er.status} />
                </div>
                <p className="text-[#10243A]">{er.description}</p>
              </div>
            ))}
            {reviewActions.map((r) => (
              <div key={r.id} className="p-3.5 rounded border border-[#DCE5EC] bg-[#F4F7FA]/50 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-[#087F8C]">{r.actionType}</span>
                  <span className="font-mono text-[11px] text-[#617384]">
                    {new Date(r.createdAt).toLocaleString()}
                  </span>
                </div>
                <div className="font-semibold text-[#10243A]">
                  {r.actorName} ({r.actorRole})
                </div>
                <p className="text-[#617384]">{r.justification}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 9: AUDIT HISTORY */}
      {activeTab === 'audit' && (
        <div className="pm-card p-5 bg-white space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#10243A] uppercase tracking-wider">
              Application Tamper-Evident Audit Trail ({auditEvents.length} Events)
            </h2>
            <Link to="/audit" className="text-xs font-semibold text-[#087F8C] hover:underline">
              Verify Full Cryptographic Chain →
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#DCE5EC] text-[11px] font-semibold uppercase text-[#617384]">
                  <th className="py-2 pr-3">Timestamp</th>
                  <th className="py-2 px-3">Actor</th>
                  <th className="py-2 px-3">Action</th>
                  <th className="py-2 px-3">Reason</th>
                  <th className="py-2 pl-3">Integrity SHA-256</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DCE5EC]">
                {auditEvents.map((log) => (
                  <tr key={log.id}>
                    <td className="py-2.5 pr-3 font-mono text-[11px] text-[#617384]">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-[#10243A]">{log.actorName}</td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-[#087F8C]">{log.action}</td>
                    <td className="py-2.5 px-3 text-[#617384]">{log.reason}</td>
                    <td className="py-2.5 pl-3 font-mono text-[11px] text-[#18794E]">
                      {log.integrityHash.slice(0, 14)}...
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
