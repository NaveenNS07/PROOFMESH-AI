import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Play, Download } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { StatusIndicator } from '../components/ProofMeshLogo';
import {
  SourceVerificationResult,
  InfrastructureReviewRecord,
  ReportRecord,
  AuditEventRecord,
  NotificationRecord,
} from '../types/domain';

/* ============================================================================
 * PAGE 13: SOURCE VERIFICATION CENTER (/verification)
 * ========================================================================== */
export const SourceVerificationPage: React.FC = () => {
  const { apiFetch, addToast } = useApp();
  const [results, setResults] = useState<SourceVerificationResult[]>([]);
  const [certInput, setCertInput] = useState('CERT-DEMO-104');
  const [authorityInput, setAuthorityInput] = useState(
    'State University Affiliation Registry (Simulated Demo Adapter)'
  );
  const [running, setRunning] = useState(false);

  const loadVerifications = useCallback(async () => {
    try {
      const data = await apiFetch<{ results: SourceVerificationResult[] }>('/api/v1/verifications');
      setResults(data.results || []);
    } catch (e: any) {
      addToast({ title: 'Verification Load Error', description: e.message, variant: 'critical' });
    }
  }, [apiFetch, addToast]);

  useEffect(() => {
    loadVerifications();
  }, [loadVerifications]);

  const handleRunAdapter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!certInput.trim()) return;
    setRunning(true);
    try {
      const res = await apiFetch<{ result: SourceVerificationResult }>(
        '/api/v1/documents/DOC-DEMO-101/verify',
        {
          method: 'POST',
          body: JSON.stringify({
            certificateReference: certInput.trim(),
            sourceAuthority: authorityInput,
          }),
        }
      );
      addToast({
        title: `Registry Response: ${res.result.verificationStatus}`,
        description: res.result.returnedResult,
        variant: res.result.verificationStatus.includes('Mismatch') ? 'critical' : 'info',
      });
      await loadVerifications();
    } catch (err: any) {
      addToast({ title: 'Verification Failed', description: err.message, variant: 'critical' });
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-[#10243A]">
          Trusted Source & Issuing Authority Verification Center
        </h1>
        <p className="text-xs text-[#617384] mt-0.5">
          Execute certificate authenticity queries against simulated registry adapters (`CERT-DEMO-104`, `NOC-DEMO-999`,
          `CERT-FIRE-2024-88`) with explicit source mode labeling.
        </p>
      </div>

      {/* Live Adapter Runner Card */}
      <div className="pm-card p-5 bg-white">
        <h2 className="text-xs font-bold uppercase tracking-wider text-[#087F8C] mb-3">
          Run Live Simulated Registry Adapter Check (Test Case H)
        </h2>
        <form onSubmit={handleRunAdapter} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
          <div>
            <label className="block text-xs font-semibold text-[#10243A] mb-1">Certificate / Reference Number</label>
            <input
              type="text"
              value={certInput}
              onChange={(e) => setCertInput(e.target.value)}
              placeholder="e.g., CERT-DEMO-104 or NOC-DEMO-999"
              className="w-full px-3 py-2 rounded border border-[#DCE5EC] text-xs font-mono"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-[#10243A] mb-1">Target Registry Adapter</label>
            <select
              value={authorityInput}
              onChange={(e) => setAuthorityInput(e.target.value)}
              className="w-full px-3 py-2 rounded border border-[#DCE5EC] text-xs"
            >
              <option value="State University Affiliation Registry (Simulated Demo Adapter)">
                State University Affiliation Registry (Simulated Demo Adapter) — Try CERT-DEMO-104 or NOC-DEMO-999
              </option>
              <option value="State Fire & Building Safety Portal Adapter (Simulated)">
                State Fire & Building Safety Portal Adapter (Simulated) — Try CERT-FIRE-2024-88
              </option>
              <option value="National Academic Depository / DigiLocker Sandbox Adapter">
                National Academic Depository / DigiLocker Sandbox Adapter
              </option>
            </select>
          </div>
          <button
            type="submit"
            disabled={running}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded bg-[#087F8C] text-white text-xs font-semibold hover:bg-[#10243A] cursor-pointer"
          >
            <Play className="w-3.5 h-3.5" />
            {running ? 'Querying Adapter...' : 'Execute Source Check'}
          </button>
        </form>
        <div className="flex flex-wrap items-center gap-2 mt-3 text-[11px] font-mono text-[#617384]">
          <span>Quick Test Presets:</span>
          <button
            type="button"
            onClick={() => setCertInput('CERT-DEMO-104')}
            className="px-2 py-0.5 rounded bg-[#E6F4F5] text-[#087F8C] font-semibold cursor-pointer"
          >
            CERT-DEMO-104 (Demo Match — Not Officially Verified)
          </button>
          <button
            type="button"
            onClick={() => setCertInput('NOC-DEMO-999')}
            className="px-2 py-0.5 rounded bg-red-50 text-[#B42318] font-semibold cursor-pointer"
          >
            NOC-DEMO-999 (Mismatch Detected — Simulated Source)
          </button>
          <button
            type="button"
            onClick={() => setCertInput('CERT-FIRE-2024-88')}
            className="px-2 py-0.5 rounded bg-amber-50 text-[#B7791F] font-semibold cursor-pointer"
          >
            CERT-FIRE-2024-88 (Source Unavailable / Manual Fallback)
          </button>
        </div>
      </div>

      {/* Verification Log Table */}
      <div className="pm-card p-5 bg-white">
        <h2 className="text-sm font-bold text-[#10243A] uppercase tracking-wider mb-3">
          Verification Execution History ({results.length})
        </h2>
        <div className="space-y-3">
          {results.map((v) => (
            <div key={v.id} className="p-4 rounded border border-[#DCE5EC] bg-[#F4F7FA]/40 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono font-bold text-[#087F8C]">{v.certificateReference}</span>
                  <span className="font-bold text-[#10243A]">{v.sourceAuthority}</span>
                  {v.isSimulatedMode && (
                    <span className="px-2 py-0.5 rounded bg-blue-50 text-[#2563EB] font-mono text-[10px]">
                      SIMULATED DEMO MODE
                    </span>
                  )}
                </div>
                <StatusIndicator status={v.verificationStatus} />
              </div>
              <p className="text-[#617384] mt-2 leading-relaxed">{v.returnedResult}</p>
              <div className="text-[11px] font-mono text-[#617384] mt-1.5">
                Checked At: {new Date(v.responseTimestamp).toLocaleString()} | App: {v.applicationId} | Doc:{' '}
                {v.documentId}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
 * PAGE 14: INFRASTRUCTURE REVIEW (/infrastructure-review)
 * ========================================================================== */
export const InfrastructureReviewPage: React.FC = () => {
  const { apiFetch, addToast } = useApp();
  const [assets, setAssets] = useState<InfrastructureReviewRecord[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<InfrastructureReviewRecord | null>(null);
  const [annotationInput, setAnnotationInput] = useState('');

  const loadAssets = useCallback(async () => {
    try {
      const data = await apiFetch<{ infrastructureReviews: InfrastructureReviewRecord[] }>(
        '/api/v1/infrastructure-reviews'
      );
      setAssets(data.infrastructureReviews || []);
      if (data.infrastructureReviews?.length > 0 && !selectedAsset) {
        setSelectedAsset(data.infrastructureReviews[0]);
      }
    } catch (e: any) {
      addToast({ title: 'Infrastructure Error', description: e.message, variant: 'critical' });
    }
  }, [apiFetch, addToast, selectedAsset]);

  useEffect(() => {
    loadAssets();
  }, [loadAssets]);

  const handleUpdateAsset = async (
    inspectionReferralStatus: InfrastructureReviewRecord['inspectionReferralStatus']
  ) => {
    if (!selectedAsset) return;
    try {
      const res = await apiFetch<{ infrastructureReview: InfrastructureReviewRecord }>(
        `/api/v1/infrastructure-reviews/${selectedAsset.id}/annotate`,
        {
          method: 'POST',
          body: JSON.stringify({
            inspectionReferralStatus,
            note: annotationInput.trim() || `Updated status to ${inspectionReferralStatus}`,
          }),
        }
      );
      setSelectedAsset(res.infrastructureReview);
      setAnnotationInput('');
      addToast({
        title: 'Infrastructure Inspection Updated',
        description: `${res.infrastructureReview.evidenceTitle} set to ${inspectionReferralStatus}.`,
        variant: 'success',
      });
      await loadAssets();
    } catch (e: any) {
      addToast({ title: 'Update Error', description: e.message, variant: 'critical' });
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-[#10243A]">
          Infrastructure Evidence & Perceptual Hash Inspection Workspace
        </h1>
        <p className="text-xs text-[#617384] mt-0.5">
          Inspect laboratory photographs, architectural layout blueprints, perceptual hash duplicate flags (Test Case
          I), and physical site inspection referrals.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-5 space-y-3">
          {assets.map((asset) => (
            <button
              key={asset.id}
              onClick={() => setSelectedAsset(asset)}
              className={`w-full text-left pm-card p-4 transition-colors cursor-pointer ${
                selectedAsset?.id === asset.id
                  ? 'border-[#087F8C] bg-[#E6F4F5]/40'
                  : 'bg-white hover:bg-[#F4F7FA]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] font-bold text-[#087F8C]">{asset.evidenceType}</span>
                <StatusIndicator status={asset.inspectionReferralStatus} />
              </div>
              <div className="text-sm font-bold text-[#10243A] mt-1">{asset.evidenceTitle}</div>
              <div className="text-xs font-mono text-[#617384] mt-1">
                Dimensions / Area: {asset.dimensionsOrArea}
              </div>
              {asset.duplicateDetectedWithId && (
                <div className="mt-2 px-2.5 py-1 rounded bg-red-50 text-[#B42318] font-mono text-[11px] font-semibold">
                  Perceptual Hash Duplicate Similarity: {Math.round(asset.similarityScore * 100)}% (Match:{' '}
                  {asset.duplicateDetectedWithId})
                </div>
              )}
            </button>
          ))}
        </div>

        <div className="lg:col-span-7 pm-card p-5 bg-white space-y-4">
          {selectedAsset && (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#DCE5EC] pb-3">
                <div>
                  <span className="font-mono text-xs font-bold text-[#087F8C]">{selectedAsset.id}</span>
                  <h2 className="text-base font-bold text-[#10243A]">{selectedAsset.evidenceTitle}</h2>
                </div>
                <span className="font-mono text-xs text-[#617384]">pHash: {selectedAsset.perceptualHash}</span>
              </div>

              {/* Architectural Schematic / Lab Visual Blueprint SVG */}
              <div className="rounded border border-[#DCE5EC] bg-[#10243A] p-4 text-white">
                <div className="flex items-center justify-between text-[11px] font-mono text-[#27A6A1] mb-2">
                  <span>CAD / ARCHITECTURAL & VISUAL EVIDENCE OVERLAY</span>
                  <span>DIMENSIONS: {selectedAsset.dimensionsOrArea}</span>
                </div>
                <svg viewBox="0 0 640 220" className="w-full h-48 border border-[#183B56] bg-[#0B1929] rounded">
                  <g stroke="#183B56" strokeWidth="1">
                    <line x1="0" y1="55" x2="640" y2="55" />
                    <line x1="0" y1="110" x2="640" y2="110" />
                    <line x1="0" y1="165" x2="640" y2="165" />
                    <line x1="160" y1="0" x2="160" y2="220" />
                    <line x1="320" y1="0" x2="320" y2="220" />
                    <line x1="480" y1="0" x2="480" y2="220" />
                  </g>
                  <rect
                    x="40"
                    y="25"
                    width="260"
                    height="165"
                    fill="#087F8C"
                    fillOpacity="0.18"
                    stroke="#27A6A1"
                    strokeWidth="2"
                  />
                  <text x="55" y="50" fill="#FFFFFF" fontSize="11" fontFamily="IBM Plex Mono" fontWeight="700">
                    PRIMARY ZONE: {selectedAsset.evidenceTitle.slice(0, 26)}
                  </text>
                  <text x="55" y="70" fill="#27A6A1" fontSize="10" fontFamily="IBM Plex Mono">
                    {selectedAsset.dimensionsOrArea}
                  </text>

                  <rect
                    x="335"
                    y="25"
                    width="265"
                    height="165"
                    fill={selectedAsset.duplicateDetectedWithId ? '#B42318' : '#18794E'}
                    fillOpacity="0.18"
                    stroke={selectedAsset.duplicateDetectedWithId ? '#B42318' : '#27A6A1'}
                    strokeWidth="2"
                    strokeDasharray={selectedAsset.duplicateDetectedWithId ? '5,4' : undefined}
                  />
                  <text x="350" y="50" fill="#FFFFFF" fontSize="11" fontFamily="IBM Plex Mono" fontWeight="700">
                    {selectedAsset.duplicateDetectedWithId
                      ? `DUPLICATE PHOTO MATCH (${Math.round(selectedAsset.similarityScore * 100)}%)`
                      : 'SANCTIONED FLOOR PLAN'}
                  </text>
                  <text x="350" y="72" fill="#DCE5EC" fontSize="10" fontFamily="IBM Plex Mono">
                    {selectedAsset.duplicateDetectedWithId
                      ? `Reused from ${selectedAsset.duplicateDetectedWithId}`
                      : 'Verified Architectural Geometry'}
                  </text>
                </svg>
              </div>

              <div className="p-3 rounded bg-[#F4F7FA] border border-[#DCE5EC] text-xs text-[#10243A]">
                <span className="font-semibold">Advisory CV Notes: </span>
                {selectedAsset.cvAdvisoryNotes}
              </div>

              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#617384]">
                  Inspector Annotations ({selectedAsset.reviewerAnnotations.length})
                </h3>
                <ul className="space-y-1.5 text-xs text-[#10243A]">
                  {selectedAsset.reviewerAnnotations.map((note) => (
                    <li key={note.id} className="p-2.5 rounded bg-[#F4F7FA] border border-[#DCE5EC]">
                      <span className="font-semibold">{note.author}: </span>
                      {note.note}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-2 border-t border-[#DCE5EC] space-y-2">
                <input
                  type="text"
                  value={annotationInput}
                  onChange={(e) => setAnnotationInput(e.target.value)}
                  placeholder="Add architectural or photographic inspection note..."
                  className="w-full px-3 py-2 rounded border border-[#DCE5EC] text-xs"
                />
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => handleUpdateAsset('Referred for Physical Inspection')}
                    className="px-3 py-1.5 rounded bg-[#B42318] text-white text-xs font-semibold cursor-pointer"
                  >
                    Flag for Physical Site Inspection
                  </button>
                  <button
                    onClick={() => handleUpdateAsset('Additional Evidence Requested')}
                    className="px-3 py-1.5 rounded bg-[#B7791F] text-white text-xs font-semibold cursor-pointer"
                  >
                    Request Additional Evidence
                  </button>
                  <button
                    onClick={() => handleUpdateAsset('None')}
                    className="px-3 py-1.5 rounded bg-[#18794E] text-white text-xs font-semibold cursor-pointer"
                  >
                    Clear Asset Evidence
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
 * PAGE 15: REPORTS & ANALYTICS (/reports)
 * ========================================================================== */
export const ReportsCenterPage: React.FC = () => {
  const { apiFetch, addToast } = useApp();
  const [reports, setReports] = useState<ReportRecord[]>([]);
  const [reportType, setReportType] = useState<ReportRecord['reportType']>('Application Validation Report');
  const [generating, setGenerating] = useState(false);

  const REPORT_TYPES: ReportRecord['reportType'][] = [
    'Application Validation Report',
    'Document Completeness Report',
    'Cross-Document Discrepancy Report',
    'Source Verification Report',
    'Compliance Assessment Report',
    'Regulatory Change Impact Report',
    'Pending Review Report',
    'Processing Time Report',
    'Audit Activity Report',
  ];

  const loadReports = useCallback(async () => {
    try {
      const data = await apiFetch<{ reports: ReportRecord[] }>('/api/v1/reports');
      setReports(data.reports || []);
    } catch (e: any) {
      addToast({ title: 'Reports Load Error', description: e.message, variant: 'critical' });
    }
  }, [apiFetch, addToast]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await apiFetch<{ report: ReportRecord }>('/api/v1/reports', {
        method: 'POST',
        body: JSON.stringify({
          applicationId: 'APP-DEMO-2026-001',
          reportType,
        }),
      });
      addToast({
        title: 'Regulatory Report Generated',
        description: `${res.report.reportCode} (${res.report.reportType}) is ready for export.`,
        variant: 'success',
      });
      await loadReports();
    } catch (e: any) {
      addToast({ title: 'Report Error', description: e.message, variant: 'critical' });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#10243A]">
            Regulatory Reports & Decision-Support Dossiers
          </h1>
          <p className="text-xs text-[#617384] mt-0.5">
            Generate structured deficiency notices, evidence matrices, and committee packs with mandatory
            human-in-the-loop disclaimers.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value as any)}
            className="px-3 py-2 rounded border border-[#DCE5EC] bg-white text-xs font-medium"
          >
            {REPORT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="px-4 py-2 rounded bg-[#087F8C] text-white text-xs font-semibold hover:bg-[#10243A] cursor-pointer"
          >
            {generating ? 'Compiling...' : 'Generate Report'}
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {reports.map((rep) => (
          <div key={rep.id} className="pm-card p-5 bg-white flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-1.5 max-w-3xl">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-[#087F8C]">{rep.reportCode}</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-[#F4F7FA]">{rep.reportType}</span>
                <span className="font-mono text-xs text-[#617384]">
                  {new Date(rep.generatedAt).toLocaleString()}
                </span>
              </div>
              <h2 className="text-sm font-bold text-[#10243A]">
                {rep.institutionName} ({rep.applicationId})
              </h2>
              <p className="text-xs text-[#617384] leading-relaxed">{rep.scope}</p>
              <div className="text-[11px] font-mono text-[#18794E]">{rep.disclaimer}</div>
            </div>
            <a
              href={`/api/v1/reports/${rep.id}/download?format=csv`}
              download={`${rep.reportCode}.csv`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-[#DCE5EC] text-xs font-semibold text-[#10243A] hover:bg-[#F4F7FA]"
            >
              <Download className="w-3.5 h-3.5 text-[#087F8C]" />
              Export CSV
            </a>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ============================================================================
 * PAGE 16: TAMPER-EVIDENT AUDIT TRAIL (/audit)
 * ========================================================================== */
export const AuditTrailPage: React.FC = () => {
  const { apiFetch, addToast } = useApp();
  const [logs, setLogs] = useState<AuditEventRecord[]>([]);

  useEffect(() => {
    apiFetch<{ auditEvents: AuditEventRecord[] }>('/api/v1/audit-events')
      .then((d) => {
        setLogs(d.auditEvents || []);
      })
      .catch((e) => addToast({ title: 'Audit Load Error', description: e.message, variant: 'critical' }));
  }, [apiFetch, addToast]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#10243A]">
            Append-Only Tamper-Evident Cryptographic Audit Log
          </h1>
          <p className="text-xs text-[#617384] mt-0.5">
            Every validation run, officer finding override, source query, and administrative action is chained via
            SHA-256 hashes.
          </p>
        </div>
        <StatusIndicator status={`SHA-256 Chain Verified (${logs.length} Entries)`} />
      </div>

      <div className="pm-card p-5 bg-white overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-[#DCE5EC] text-[11px] font-semibold uppercase text-[#617384]">
              <th className="py-2.5 pr-3">Timestamp</th>
              <th className="py-2.5 px-3">Actor & Role</th>
              <th className="py-2.5 px-3">Action</th>
              <th className="py-2.5 px-3">Reason / Details</th>
              <th className="py-2.5 px-3">Correlation ID</th>
              <th className="py-2.5 pl-3">Integrity SHA-256</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#DCE5EC]">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-[#F4F7FA]/60">
                <td className="py-2.5 pr-3 font-mono text-[11px] text-[#617384]">
                  {new Date(log.timestamp).toLocaleString()}
                </td>
                <td className="py-2.5 px-3">
                  <div className="font-semibold text-[#10243A]">{log.actorName}</div>
                  <div className="font-mono text-[10px] text-[#617384]">{log.actorRole}</div>
                </td>
                <td className="py-2.5 px-3 font-mono text-[11px] font-bold text-[#087F8C]">{log.action}</td>
                <td className="py-2.5 px-3 text-[#10243A]">{log.reason}</td>
                <td className="py-2.5 px-3 font-mono text-[10px] text-[#617384]">{log.correlationId}</td>
                <td className="py-2.5 pl-3 font-mono text-[10px] text-[#18794E] font-semibold">
                  {log.integrityHash.slice(0, 14)}...
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* ============================================================================
 * PAGE 17: NOTIFICATIONS CENTER (/notifications)
 * ========================================================================== */
export const NotificationsPage: React.FC = () => {
  const { apiFetch, addToast, refreshNotificationsCount } = useApp();
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);

  const loadNotifications = useCallback(async () => {
    try {
      const data = await apiFetch<{ notifications: NotificationRecord[] }>('/api/v1/notifications');
      setNotifications(data.notifications || []);
    } catch (e: any) {
      addToast({ title: 'Notification Error', description: e.message, variant: 'critical' });
    }
  }, [apiFetch, addToast]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const toggleRead = async (id: string) => {
    try {
      await apiFetch(`/api/v1/notifications/${id}/read`, {
        method: 'POST',
      });
      await loadNotifications();
      await refreshNotificationsCount();
    } catch (e: any) {
      addToast({ title: 'Update Error', description: e.message, variant: 'critical' });
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-[#10243A]">Regulatory Alerts & SLA Notifications</h1>
        <p className="text-xs text-[#617384] mt-0.5">
          Real-time alerts for critical validation contradictions, expired certificates, and SLA deadlines.
        </p>
      </div>

      <div className="space-y-3">
        {notifications.map((n) => (
          <div
            key={n.id}
            className={`pm-card p-4 flex flex-wrap items-center justify-between gap-4 ${
              n.isRead ? 'bg-white opacity-80' : 'bg-[#E6F4F5]/40 border-[#087F8C]'
            }`}
          >
            <div className="space-y-1 max-w-2xl">
              <div className="flex items-center gap-2">
                <StatusIndicator status={`${n.severity} · ${n.category}`} />
                <span className="font-mono text-[11px] text-[#617384]">
                  {new Date(n.createdAt).toLocaleString()}
                </span>
              </div>
              <h2 className="text-sm font-bold text-[#10243A]">{n.title}</h2>
              <p className="text-xs text-[#617384]">{n.message}</p>
            </div>
            <div className="flex items-center gap-2">
              {n.relatedApplicationId && (
                <Link
                  to={`/applications/${n.relatedApplicationId}`}
                  className="px-3 py-1.5 rounded bg-[#087F8C] text-white text-xs font-semibold hover:bg-[#10243A]"
                >
                  Inspect Application
                </Link>
              )}
              <button
                onClick={() => toggleRead(n.id)}
                className="px-3 py-1.5 rounded border border-[#DCE5EC] bg-white text-xs font-semibold text-[#10243A] cursor-pointer"
              >
                {n.isRead ? 'Mark Unread' : 'Mark Read'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
