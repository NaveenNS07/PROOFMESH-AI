import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowRight,
  Download,
  FilePlus2,
  FolderOpen,
  Plus,
  RefreshCw,
  Search,
  Upload,
  UserPlus,
  CheckCircle2,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { useApp } from '../context/AppContext';
import { StatusIndicator } from '../components/ProofMeshLogo';
import { ApplicationRecord, AuditEventRecord, UserRecord } from '../types/domain';
import { mirrorApplicationToFirestore } from '../lib/firebase';

function exportApplicationsCsv(apps: ApplicationRecord[]) {
  const headers = [
    'ApplicationID',
    'InstitutionID',
    'InstitutionName',
    'Category',
    'AcademicYear',
    'SubmissionDate',
    'Status',
    'VerificationStatus',
    'UnresolvedFindings',
    'AssignedReviewer',
    'SyntheticDisclaimer',
  ];
  const rows = apps.map((a) =>
    [
      a.applicationCode,
      a.institutionId,
      `"${a.institutionName}"`,
      `"${a.category}"`,
      a.academicYear,
      a.submissionDate,
      `"${a.status}"`,
      `"${a.verificationStatus}"`,
      a.unresolvedFindingsCount,
      `"${a.assignedReviewerName || 'Unassigned'}"`,
      `"${a.syntheticLabel}"`,
    ].join(',')
  );
  const blob = new Blob([[headers.join(','), ...rows].join('\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `proofmesh_applications_${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

// ============================================================================
// PAGE 3: MAIN DASHBOARD (/dashboard)
// ============================================================================
export const DashboardPage: React.FC = () => {
  const { apiFetch, currentUser, addToast } = useApp();
  const navigate = useNavigate();
  const [data, setData] = useState<{
    indicators: {
      totalApplications: number;
      awaitingReview: number;
      unresolvedDiscrepancies: number;
      sourceVerificationPending: number;
      requiringAdditionalEvidence: number;
      reviewsCompleted: number;
    };
    processingOverview: {
      intakeTimeline: { period: string; received: number; validated: number }[];
      validationOutcomeDistribution: { name: string; count: number }[];
      verificationStatusDistribution: { status: string; count: number }[];
      averageProcessingHours: number;
      queueByPriority: { priority: string; count: number }[];
    };
    priorityQueue: ApplicationRecord[];
    recentActivity: AuditEventRecord[];
    operationalAlerts: {
      id: string;
      type: string;
      severity: string;
      title: string;
      detail: string;
      link: string;
    }[];
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [queueSearch, setQueueSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const loadSummary = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/v1/dashboard/summary');
      setData(res);
    } catch (e: any) {
      addToast({ title: 'Dashboard Error', description: e.message, variant: 'critical' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSummary();
  }, [currentUser.id]);

  const filteredQueue = useMemo(() => {
    if (!data?.priorityQueue) return [];
    return data.priorityQueue.filter((a) => {
      const matchesStatus = statusFilter === 'ALL' || a.status === statusFilter;
      const matchesSearch =
        !queueSearch.trim() ||
        a.applicationCode.toLowerCase().includes(queueSearch.toLowerCase()) ||
        a.institutionName.toLowerCase().includes(queueSearch.toLowerCase()) ||
        a.category.toLowerCase().includes(queueSearch.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [data, queueSearch, statusFilter]);

  const handleResetSampleData = async () => {
    try {
      const res = await apiFetch<{ applicationsCount: number; institutionsCount: number }>('/api/v1/demo/reset', {
        method: 'POST',
      });
      await loadSummary();
      addToast({
        title: 'Sample Dataset Loaded',
        description: `Populated ${res.applicationsCount || 6} sample applications and ${res.institutionsCount || 6} institutions.`,
        variant: 'success',
      });
    } catch (e: any) {
      addToast({ title: 'Sample Reset Failed', description: e.message, variant: 'critical' });
    }
  };

  if (loading || !data) {
    return (
      <div className="space-y-4">
        <div className="h-20 bg-white border border-[#DCE5EC] rounded-xl p-6 animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-24 bg-white border border-[#DCE5EC] rounded-xl p-4 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Workspace Welcome & Header — Executive Light Command Card */}
      <div className="relative overflow-hidden bg-gradient-to-r from-white via-[#F0F9FF]/90 to-[#F0FDFA]/90 border border-[#BFDBFE] rounded-2xl p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#2563EB] via-[#0D9488] to-[#10B981]" />
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#1E40AF] bg-[#EFF6FF] border border-[#BFDBFE] px-2.5 py-0.5 rounded-full">
            <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
            <span>Regulatory Scrutiny Workspace · Evaluation Date Benchmark: 2026-10-26 · {currentUser.department}</span>
          </div>
          <h1 className="font-display text-2xl font-extrabold text-[#0F172A] tracking-tight">
            Welcome, {currentUser.fullName}
          </h1>
          <p className="text-xs text-[#475569]">
            6-Layer Deterministic Compliance Engine &amp; Claim-to-Evidence Graph Intelligence Active · 6 Sample Applications Pre-Loaded
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleResetSampleData}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold text-[#1E40AF] bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl shadow-2xs hover:bg-[#DBEAFE] transition-all cursor-pointer"
          >
            <FilePlus2 className="w-3.5 h-3.5 text-[#2563EB]" />
            <span>Reload Sample Dataset</span>
          </button>
          <button
            type="button"
            onClick={loadSummary}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold text-[#0F172A] bg-white border border-[#CBD5E1] rounded-xl shadow-2xs hover:bg-[#F8FAFC] hover:border-[#94A3B8] transition-all cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#0D9488]" />
            <span>Refresh Live Metrics</span>
          </button>
          <Link
            to="/evidence-graph"
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-gradient-to-r from-[#1E3A8A] via-[#0F4C81] to-[#0D9488] hover:from-[#1D4ED8] hover:to-[#0F766E] rounded-xl shadow-sm hover:shadow transition-all"
          >
            <span>Open Claim-to-Evidence Graph</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* 6 Summary Indicators (All live from backend with semantic accent borders & hover elevation) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        {[
          {
            label: 'Total Applications',
            value: data.indicators.totalApplications,
            sub: 'In current scope',
            topBorder: 'border-t-4 border-t-blue-600',
            badgeBg: 'bg-blue-50 text-blue-700 border-blue-200',
            tag: 'PORTFOLIO',
          },
          {
            label: 'Awaiting Review',
            value: data.indicators.awaitingReview,
            sub: 'Officer scrutiny queue',
            topBorder: 'border-t-4 border-t-amber-500',
            badgeBg: 'bg-amber-50 text-amber-800 border-amber-200',
            tag: 'ACTIVE QUEUE',
          },
          {
            label: 'Unresolved Discrepancies',
            value: data.indicators.unresolvedDiscrepancies,
            sub: 'Cases with open findings',
            topBorder: 'border-t-4 border-t-rose-600',
            badgeBg: 'bg-rose-50 text-rose-700 border-rose-200',
            tag: 'HIGH PRIORITY',
          },
          {
            label: 'Source Verification Pending',
            value: data.indicators.sourceVerificationPending,
            sub: 'Adapter or manual check',
            topBorder: 'border-t-4 border-t-indigo-600',
            badgeBg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
            tag: 'GATEWAY',
          },
          {
            label: 'Additional Evidence Req.',
            value: data.indicators.requiringAdditionalEvidence,
            sub: 'Awaiting institution',
            topBorder: 'border-t-4 border-t-orange-500',
            badgeBg: 'bg-orange-50 text-orange-800 border-orange-200',
            tag: 'CLARIFICATION',
          },
          {
            label: 'Reviews Completed',
            value: data.indicators.reviewsCompleted,
            sub: 'Ready for committee',
            topBorder: 'border-t-4 border-t-emerald-600',
            badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
            tag: 'CLEARED',
          },
        ].map((kpi) => (
          <div
            key={kpi.label}
            className={`pm-card-interactive p-4 space-y-2 ${kpi.topBorder}`}
          >
            <div className="flex items-center justify-between gap-1">
              <span className={`font-mono text-[9px] font-bold px-1.5 py-0.5 rounded border ${kpi.badgeBg}`}>
                {kpi.tag}
              </span>
            </div>
            <div className="text-xs font-semibold text-[#334155] leading-snug">{kpi.label}</div>
            <div className="font-mono text-3xl font-extrabold text-[#0F172A] tabular-nums tracking-tight">
              {kpi.value}
            </div>
            <div className="text-[11px] font-medium text-[#64748B]">{kpi.sub}</div>
          </div>
        ))}
      </div>

      {/* Application Processing Overview Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 pm-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-sm font-bold text-[#0F172A]">
                Applications Received &amp; Validated Over Time
              </h2>
              <p className="text-xs text-[#64748B]">
                Average Automated Processing Time: {data.processingOverview.averageProcessingHours} mins/package
              </p>
            </div>
          </div>
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.processingOverview.intakeTimeline}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="period" tick={{ fontSize: 11, fill: '#475569' }} />
                <YAxis tick={{ fontSize: 11, fill: '#475569' }} />
                <Tooltip />
                <Bar dataKey="received" name="Applications Received" fill="#2563EB" radius={[4, 4, 0, 0]} />
                <Bar dataKey="validated" name="Validation Completed" fill="#0D9488" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-6 pm-card p-5 space-y-4">
          <div>
            <h2 className="font-display text-sm font-bold text-[#0F172A]">
              Source Verification &amp; Review Queue Distribution
            </h2>
            <p className="text-xs text-[#64748B]">
              Breakdown of verification states across submitted institutional certificates
            </p>
          </div>
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.processingOverview.verificationStatusDistribution} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#475569' }} />
                <YAxis dataKey="status" type="category" width={170} tick={{ fontSize: 11, fill: '#475569' }} />
                <Tooltip />
                <Bar dataKey="count" name="Documents" fill="#0D9488" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Priority Work Queue Table */}
      <div className="bg-white border border-[#DCE5EC] rounded-xl p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-base font-bold text-[#10243A]">
              Priority Work Queue
            </h2>
            <p className="text-xs text-[#617384]">
              What needs attention, unresolved findings count, current owner, and recommended next action
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#617384] absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                value={queueSearch}
                onChange={(e) => setQueueSearch(e.target.value)}
                placeholder="Filter queue..."
                aria-label="Filter priority work queue"
                className="pl-8 pr-3 py-1.5 text-xs border border-[#DCE5EC] rounded bg-[#F4F7FA]"
              />
            </div>

            <select
              aria-label="Filter by validation status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs border border-[#DCE5EC] rounded bg-[#F4F7FA]"
            >
              <option value="ALL">All Statuses</option>
              <option value="Awaiting Manual Review">Awaiting Manual Review</option>
              <option value="Awaiting Source Verification">Awaiting Source Verification</option>
              <option value="Awaiting Institution Response">Awaiting Institution Response</option>
              <option value="Review Completed">Review Completed</option>
            </select>

            <button
              type="button"
              onClick={() => exportApplicationsCsv(filteredQueue)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-[#DCE5EC] rounded hover:bg-[#F4F7FA]"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#DCE5EC] text-[#617384]">
                <th className="py-2.5 pr-3">
                  <input
                    type="checkbox"
                    aria-label="Select all rows"
                    checked={selectedIds.length === filteredQueue.length && filteredQueue.length > 0}
                    onChange={(e) =>
                      setSelectedIds(e.target.checked ? filteredQueue.map((a) => a.id) : [])
                    }
                  />
                </th>
                <th className="py-2.5 px-3 font-semibold">Application ID</th>
                <th className="py-2.5 px-3 font-semibold">Institution</th>
                <th className="py-2.5 px-3 font-semibold">Category</th>
                <th className="py-2.5 px-3 font-semibold">Submitted</th>
                <th className="py-2.5 px-3 font-semibold">Validation Status</th>
                <th className="py-2.5 px-3 font-semibold text-right">Unresolved Findings</th>
                <th className="py-2.5 px-3 font-semibold">Current Owner</th>
                <th className="py-2.5 px-3 font-semibold">Next Action</th>
                <th className="py-2.5 pl-3 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DCE5EC]">
              {filteredQueue.map((app) => (
                <tr key={app.id} className="hover:bg-[#F4F7FA]/70">
                  <td className="py-3 pr-3">
                    <input
                      type="checkbox"
                      aria-label={`Select ${app.applicationCode}`}
                      checked={selectedIds.includes(app.id)}
                      onChange={(e) =>
                        setSelectedIds((prev) =>
                          e.target.checked ? [...prev, app.id] : prev.filter((id) => id !== app.id)
                        )
                      }
                    />
                  </td>
                  <td className="py-3 px-3 font-mono font-semibold text-[#087F8C]">
                    <Link to={`/applications/${app.id}`} className="hover:underline">
                      {app.applicationCode}
                    </Link>
                  </td>
                  <td className="py-3 px-3 font-medium text-[#172B3A]">
                    {app.institutionName}
                    <div className="text-[11px] text-[#617384] font-mono">{app.institutionId}</div>
                  </td>
                  <td className="py-3 px-3 text-[#617384]">{app.category}</td>
                  <td className="py-3 px-3 font-mono tabular-nums text-[#617384]">{app.submissionDate}</td>
                  <td className="py-3 px-3">
                    <StatusIndicator status={app.status} />
                  </td>
                  <td className="py-3 px-3 text-right font-mono tabular-nums font-semibold">
                    {app.unresolvedFindingsCount}
                  </td>
                  <td className="py-3 px-3 text-[#172B3A]">
                    {app.assignedReviewerName || 'Unassigned'}
                  </td>
                  <td className="py-3 px-3 text-[#617384] max-w-xs truncate">
                    {app.nextAction}
                  </td>
                  <td className="py-3 pl-3 text-right">
                    <button
                      type="button"
                      onClick={() => navigate(`/applications/${app.id}`)}
                      className="px-2.5 py-1 rounded bg-[#10243A] hover:bg-[#087F8C] text-white text-xs font-medium transition-colors whitespace-nowrap"
                    >
                      Open Case
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom Split: Operational Alerts + Recent Audit Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 bg-white border border-[#DCE5EC] rounded-xl p-5 space-y-3">
          <h2 className="font-display text-sm font-bold text-[#10243A]">
            Operational Alerts & Exceptions
          </h2>
          <div className="divide-y divide-[#DCE5EC]">
            {data.operationalAlerts.map((alt) => (
              <div key={alt.id} className="py-3 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <StatusIndicator status={alt.severity} />
                    <span className="text-xs font-semibold text-[#172B3A]">
                      {alt.title}
                    </span>
                  </div>
                  <p className="text-xs text-[#617384]">{alt.detail}</p>
                </div>
                <Link
                  to={alt.link}
                  className="text-xs font-semibold text-[#087F8C] hover:underline shrink-0"
                >
                  Inspect →
                </Link>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-6 bg-white border border-[#DCE5EC] rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-sm font-bold text-[#10243A]">
              Recent Traceable Activity
            </h2>
            <Link to="/audit" className="text-xs font-medium text-[#087F8C] hover:underline">
              Full Audit Trail →
            </Link>
          </div>
          <div className="divide-y divide-[#DCE5EC]">
            {data.recentActivity.map((ev) => (
              <div key={ev.id} className="py-2.5 flex items-start justify-between gap-4 text-xs">
                <div className="space-y-0.5">
                  <div className="font-medium text-[#172B3A]">
                    <span className="font-mono text-[#087F8C]">{ev.action}</span> · {ev.actorName}
                  </div>
                  <div className="text-[#617384]">{ev.reason}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-mono text-[11px] text-[#617384]">
                    {new Date(ev.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  {ev.entityId.startsWith('APP-') && (
                    <Link
                      to={`/applications/${ev.entityId.split(' ')[0]}`}
                      className="text-[11px] text-[#087F8C] hover:underline"
                    >
                      {ev.entityId.split(' ')[0]}
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// PAGE 4: MY WORK QUEUE (/work-queue)
// ============================================================================
export const WorkQueuePage: React.FC = () => {
  const { apiFetch, currentUser, addToast } = useApp();
  const navigate = useNavigate();
  const [applications, setApplications] = useState<ApplicationRecord[]>([]);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [tab, setTab] = useState<'assigned' | 'unassigned' | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  const loadQueue = async () => {
    try {
      const appRes = await apiFetch<{ applications: ApplicationRecord[] }>('/api/v1/applications');
      setApplications(appRes.applications);
      const usrRes = await apiFetch<{ users: UserRecord[] }>('/api/v1/users').catch(() => ({ users: [] }));
      setUsers(usrRes.users || []);
    } catch (e: any) {
      addToast({ title: 'Queue Load Failed', description: e.message, variant: 'critical' });
    }
  };

  useEffect(() => {
    loadQueue();
  }, [currentUser.id]);

  const filtered = applications.filter((a) => {
    if (tab === 'assigned' && a.assignedReviewerId !== currentUser.id) return false;
    if (tab === 'unassigned' && a.assignedReviewerId !== null) return false;
    if (priorityFilter !== 'ALL' && a.priority !== priorityFilter) return false;
    if (statusFilter !== 'ALL' && a.status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        a.applicationCode.toLowerCase().includes(q) ||
        a.institutionName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleAssign = async (appId: string, reviewerId: string) => {
    try {
      await apiFetch(`/api/v1/applications/${appId}/assign-reviewer`, {
        method: 'POST',
        body: JSON.stringify({ reviewerId }),
      });
      addToast({
        title: 'Reviewer Assigned',
        description: `Updated assignment for ${appId}.`,
        variant: 'success',
      });
      loadQueue();
    } catch (e: any) {
      addToast({ title: 'Assignment Error', description: e.message, variant: 'critical' });
    }
  };

  const handleStatusChange = async (appId: string, status: string) => {
    try {
      await apiFetch(`/api/v1/applications/${appId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status, reason: `Officer updated queue status to ${status}` }),
      });
      addToast({
        title: 'Workflow Status Updated',
        description: `${appId} moved to "${status}". Note: Automated validation does not constitute a final statutory decision.`,
        variant: 'info',
      });
      loadQueue();
    } catch (e: any) {
      addToast({ title: 'Update Failed', description: e.message, variant: 'critical' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-[#DCE5EC] rounded-xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-xl font-bold text-[#10243A]">
            My Work Queue & Case Assignments
          </h1>
          <p className="text-xs text-[#617384]">
            Organize assigned scrutiny workload, escalate priority cases, and manage officer assignments. Automated validation outcomes never equate to a final regulatory decision.
          </p>
        </div>

        {/* Segmented Queue Mode Control */}
        <div className="flex items-center gap-1 p-1 bg-[#F4F7FA] rounded-lg border border-[#DCE5EC]">
          {[
            { id: 'all', label: `All Permitted (${applications.length})` },
            {
              id: 'assigned',
              label: `Assigned to Me (${applications.filter((a) => a.assignedReviewerId === currentUser.id).length})`,
            },
            {
              id: 'unassigned',
              label: `Unassigned (${applications.filter((a) => !a.assignedReviewerId).length})`,
            },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id as any)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                tab === t.id
                  ? 'bg-white text-[#10243A] shadow-sm'
                  : 'text-[#617384]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-[#DCE5EC] rounded-xl p-4 flex flex-wrap items-center gap-3">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search Application ID or Institution..."
          aria-label="Search work queue"
          className="px-3 py-1.5 text-xs border border-[#DCE5EC] rounded bg-[#F4F7FA] w-64"
        />
        <select
          aria-label="Filter by priority"
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="px-3 py-1.5 text-xs border border-[#DCE5EC] rounded bg-[#F4F7FA]"
        >
          <option value="ALL">All Priorities</option>
          <option value="High">High Priority</option>
          <option value="Medium">Medium Priority</option>
          <option value="Low">Low Priority</option>
        </select>
        <select
          aria-label="Filter by workflow status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-1.5 text-xs border border-[#DCE5EC] rounded bg-[#F4F7FA]"
        >
          <option value="ALL">All Workflow Statuses</option>
          <option value="New">New</option>
          <option value="Processing">Processing</option>
          <option value="Findings Generated">Findings Generated</option>
          <option value="Awaiting Source Verification">Awaiting Source Verification</option>
          <option value="Awaiting Institution Response">Awaiting Institution Response</option>
          <option value="Awaiting Manual Review">Awaiting Manual Review</option>
          <option value="Review Completed">Review Completed</option>
          <option value="Closed">Closed</option>
        </select>
      </div>

      {/* Queue Table */}
      <div className="bg-white border border-[#DCE5EC] rounded-xl p-5 overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-[#DCE5EC] text-[#617384]">
              <th className="py-2.5 pr-3 font-semibold">Application ID</th>
              <th className="py-2.5 px-3 font-semibold">Institution</th>
              <th className="py-2.5 px-3 font-semibold">Priority & Due Date</th>
              <th className="py-2.5 px-3 font-semibold">Workflow Status</th>
              <th className="py-2.5 px-3 font-semibold text-right">Open Findings</th>
              <th className="py-2.5 px-3 font-semibold">Assigned Reviewer</th>
              <th className="py-2.5 pl-3 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#DCE5EC]">
            {filtered.map((app) => (
              <tr key={app.id} className="hover:bg-[#F4F7FA]/70">
                <td className="py-3 pr-3 font-mono font-semibold text-[#087F8C]">
                  <Link to={`/applications/${app.id}`} className="hover:underline">
                    {app.applicationCode}
                  </Link>
                </td>
                <td className="py-3 px-3 font-medium">
                  {app.institutionName}
                  <div className="text-[11px] text-[#617384]">{app.category}</div>
                </td>
                <td className="py-3 px-3 font-mono tabular-nums">
                  <StatusIndicator status={`${app.priority} Priority`} />
                  <div className="text-[11px] text-[#617384]">Due: {app.dueDate}</div>
                </td>
                <td className="py-3 px-3">
                  <select
                    aria-label={`Change status for ${app.applicationCode}`}
                    value={app.status}
                    onChange={(e) => handleStatusChange(app.id, e.target.value)}
                    className="px-2 py-1 text-xs border border-[#DCE5EC] rounded bg-[#F4F7FA]"
                  >
                    <option value="New">New</option>
                    <option value="Processing">Processing</option>
                    <option value="Findings Generated">Findings Generated</option>
                    <option value="Awaiting Source Verification">Awaiting Source Verification</option>
                    <option value="Awaiting Institution Response">Awaiting Institution Response</option>
                    <option value="Awaiting Manual Review">Awaiting Manual Review</option>
                    <option value="Review Completed">Review Completed</option>
                    <option value="Closed">Closed</option>
                  </select>
                </td>
                <td className="py-3 px-3 text-right font-mono tabular-nums font-bold">
                  {app.unresolvedFindingsCount}
                </td>
                <td className="py-3 px-3">
                  <select
                    aria-label={`Assign reviewer for ${app.applicationCode}`}
                    value={app.assignedReviewerId || ''}
                    onChange={(e) => e.target.value && handleAssign(app.id, e.target.value)}
                    className="px-2 py-1 text-xs border border-[#DCE5EC] rounded bg-[#F4F7FA]"
                  >
                    <option value="">Unassigned</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.fullName}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="py-3 pl-3 text-right">
                  <button
                    type="button"
                    onClick={() => navigate(`/applications/${app.id}`)}
                    className="px-3 py-1.5 rounded bg-[#10243A] hover:bg-[#087F8C] text-white text-xs font-medium transition-colors"
                  >
                    Review Evidence
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ============================================================================
// PAGE 5: APPLICATION REGISTRY (/applications)
// ============================================================================
export const ApplicationRegistryPage: React.FC = () => {
  const { apiFetch, addToast } = useApp();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [applications, setApplications] = useState<ApplicationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [yearFilter, setYearFilter] = useState('ALL');

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (categoryFilter !== 'ALL') params.set('category', categoryFilter);
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      if (yearFilter !== 'ALL') params.set('academicYear', yearFilter);
      if (search.trim()) params.set('search', search.trim());
      const res = await apiFetch<{ applications: ApplicationRecord[] }>(
        `/api/v1/applications?${params.toString()}`
      );
      setApplications(res.applications);
    } catch (e: any) {
      addToast({ title: 'Registry Error', description: e.message, variant: 'critical' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [categoryFilter, statusFilter, yearFilter]);

  return (
    <div className="space-y-6">
      <div className="bg-white border border-[#DCE5EC] rounded-xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-xl font-bold text-[#10243A]">
            Institutional Application Registry
          </h1>
          <p className="text-xs text-[#617384]">
            Search, filter, and inspect submitted technical institution applications and their verification states.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => exportApplicationsCsv(applications)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium border border-[#DCE5EC] rounded hover:bg-[#F4F7FA]"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Permitted Records</span>
          </button>
          <Link
            to="/applications/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#087F8C] hover:bg-[#10243A] rounded transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Application</span>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          fetchApplications();
        }}
        className="bg-white border border-[#DCE5EC] rounded-xl p-4 grid grid-cols-1 md:grid-cols-12 gap-3 items-end"
      >
        <div className="md:col-span-4">
          <label htmlFor="reg-search" className="block text-xs font-medium mb-1">
            Institution Name, ID, or Application Code
          </label>
          <input
            id="reg-search"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="e.g., APP-DEMO-2026-001, Meridian..."
            className="w-full px-3 py-1.5 text-xs border border-[#DCE5EC] rounded bg-[#F4F7FA]"
          />
        </div>
        <div className="md:col-span-3">
          <label htmlFor="reg-cat" className="block text-xs font-medium mb-1">
            Application Category
          </label>
          <select
            id="reg-cat"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full px-3 py-1.5 text-xs border border-[#DCE5EC] rounded bg-[#F4F7FA]"
          >
            <option value="ALL">All Categories</option>
            <option value="Demonstration EoA Application">Demonstration EoA Application</option>
            <option value="Intake Expansion & New Programme">Intake Expansion & New Programme</option>
            <option value="Annual Extension of Approval (EoA)">Annual Extension of Approval (EoA)</option>
          </select>
        </div>
        <div className="md:col-span-3">
          <label htmlFor="reg-status" className="block text-xs font-medium mb-1">
            Application Status
          </label>
          <select
            id="reg-status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-1.5 text-xs border border-[#DCE5EC] rounded bg-[#F4F7FA]"
          >
            <option value="ALL">All Statuses</option>
            <option value="New">New</option>
            <option value="Awaiting Manual Review">Awaiting Manual Review</option>
            <option value="Awaiting Source Verification">Awaiting Source Verification</option>
            <option value="Awaiting Institution Response">Awaiting Institution Response</option>
            <option value="Review Completed">Review Completed</option>
          </select>
        </div>
        <div className="md:col-span-2">
          <button
            type="submit"
            className="w-full py-1.5 px-4 bg-[#10243A] hover:bg-[#087F8C] text-white text-xs font-semibold rounded transition-colors"
          >
            Apply Filters
          </button>
        </div>
      </form>

      {/* Registry Table */}
      <div className="bg-white border border-[#DCE5EC] rounded-xl p-5 overflow-x-auto">
        {loading ? (
          <div className="py-8 text-center text-xs text-[#617384]">Loading application registry...</div>
        ) : applications.length === 0 ? (
          <div className="py-8 text-center space-y-2">
            <div className="text-sm font-semibold">No matching applications found</div>
            <p className="text-xs text-[#617384]">
              Clear your filters or create a new institutional application.
            </p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#DCE5EC] text-[#617384]">
                <th className="py-2.5 pr-3 font-semibold">Application ID</th>
                <th className="py-2.5 px-3 font-semibold">Institution Name</th>
                <th className="py-2.5 px-3 font-semibold">Application Type</th>
                <th className="py-2.5 px-3 font-semibold">Academic Year</th>
                <th className="py-2.5 px-3 font-semibold">Submitted</th>
                <th className="py-2.5 px-3 font-semibold text-right">Docs Received</th>
                <th className="py-2.5 px-3 font-semibold">Validation Status</th>
                <th className="py-2.5 px-3 font-semibold text-right">Open Findings</th>
                <th className="py-2.5 px-3 font-semibold">Assigned Reviewer</th>
                <th className="py-2.5 pl-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DCE5EC]">
              {applications.map((app) => (
                <tr key={app.id} className="hover:bg-[#F4F7FA]/70">
                  <td className="py-3 pr-3 font-mono font-semibold text-[#087F8C]">
                    <Link to={`/applications/${app.id}`} className="hover:underline">
                      {app.applicationCode}
                    </Link>
                  </td>
                  <td className="py-3 px-3 font-medium">
                    {app.institutionName}
                    <div className="text-[11px] text-[#617384] font-mono">
                      {app.institutionId} · {app.state}
                    </div>
                  </td>
                  <td className="py-3 px-3 text-[#617384]">{app.category}</td>
                  <td className="py-3 px-3 font-mono">{app.academicYear}</td>
                  <td className="py-3 px-3 font-mono tabular-nums">{app.submissionDate}</td>
                  <td className="py-3 px-3 text-right font-mono tabular-nums">
                    {app.documentsReceivedCount} / {app.requiredDocumentsChecklist.length}
                  </td>
                  <td className="py-3 px-3">
                    <StatusIndicator status={app.status} />
                  </td>
                  <td className="py-3 px-3 text-right font-mono tabular-nums font-semibold">
                    {app.unresolvedFindingsCount}
                  </td>
                  <td className="py-3 px-3">{app.assignedReviewerName || 'Unassigned'}</td>
                  <td className="py-3 pl-3 text-right">
                    <div className="inline-flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => navigate(`/applications/${app.id}`)}
                        className="px-2.5 py-1 bg-[#10243A] hover:bg-[#087F8C] text-white rounded text-xs font-medium transition-colors"
                      >
                        Open Workspace
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// PAGE 6: APPLICATION INTAKE WIZARD (/applications/new)
// ============================================================================
const CATEGORY_CHECKLISTS: Record<string, string[]> = {
  'Demonstration EoA Application': [
    'Approval letter',
    'Affidavit or undertaking',
    'Accreditation certificate',
    'NOC or permission',
    'Faculty record',
    'Infrastructure evidence',
    'Fee payment evidence',
  ],
  'Intake Expansion & New Programme': [
    'Approval letter',
    'Affidavit or undertaking',
    'NOC or permission',
    'Faculty record',
    'Infrastructure evidence',
    'Fee payment evidence',
  ],
  'Annual Extension of Approval (EoA)': [
    'Approval letter',
    'Affidavit or undertaking',
    'Faculty record',
    'Infrastructure evidence',
    'Fee payment evidence',
  ],
};

export const ApplicationIntakePage: React.FC = () => {
  const { apiFetch, addToast } = useApp();
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Step 1 fields
  const [institutionId, setInstitutionId] = useState('INST-DEMO-001');
  const [institutionName, setInstitutionName] = useState('Meridian Institute of Technology');
  const [institutionType, setInstitutionType] = useState('Private Self-Financed Technical Institution');
  const [state, setState] = useState('Karnataka');
  const [district, setDistrict] = useState('Bengaluru Urban');
  const [category, setCategory] = useState('Demonstration EoA Application');
  const [academicYear, setAcademicYear] = useState('2026–2027');
  const [contactName, setContactName] = useState('Prof. S. Venkataraman');
  const [contactEmail, setContactEmail] = useState('compliance@meridian-demo.edu.in');
  const [contactPhone, setContactPhone] = useState('+91-80-23456789');

  // Step 2 fields
  const [requestedIntake, setRequestedIntake] = useState(120);
  const [previousApprovedIntake, setPreviousApprovedIntake] = useState(60);
  const [facultyCountClaimed, setFacultyCountClaimed] = useState(48);
  const [builtUpAreaSqmClaimed, setBuiltUpAreaSqmClaimed] = useState(14500);
  const [programmeName, setProgrammeName] = useState('B.Tech Computer Science & Engineering');

  // Step 3 Uploaded files
  const [uploadedFiles, setUploadedFiles] = useState<
    {
      filename: string;
      fileSizeBytes: number;
      mimeType: string;
      documentType: string;
      status: 'Validated & Ready';
    }[]
  >([
    {
      filename: 'eoa_prior_approval_2025.pdf',
      fileSizeBytes: 382400,
      mimeType: 'application/pdf',
      documentType: 'Approval letter',
      status: 'Validated & Ready',
    },
    {
      filename: 'faculty_cadre_statement_2026.pdf',
      fileSizeBytes: 512000,
      mimeType: 'application/pdf',
      documentType: 'Faculty record',
      status: 'Validated & Ready',
    },
  ]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const checklist = CATEGORY_CHECKLISTS[category] || CATEGORY_CHECKLISTS['Demonstration EoA Application'];

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    const files = Array.from(e.target.files || []);
    for (const file of files) {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      if (!['pdf', 'png', 'jpg', 'jpeg'].includes(ext)) {
        setUploadError(`Rejected "${file.name}": Unsupported format. Only PDF, PNG, JPG, JPEG are allowed.`);
        continue;
      }
      if (file.size > 25 * 1024 * 1024) {
        setUploadError(`Rejected "${file.name}": File exceeds 25 MB limit.`);
        continue;
      }
      setUploadedFiles((prev) => [
        ...prev,
        {
          filename: file.name,
          fileSizeBytes: file.size || 245000,
          mimeType: file.type || 'application/pdf',
          documentType: file.name.toLowerCase().includes('fee')
            ? 'Fee payment evidence'
            : file.name.toLowerCase().includes('noc')
            ? 'NOC or permission'
            : 'Affidavit or undertaking',
          status: 'Validated & Ready',
        },
      ]);
    }
  };

  const handleAddSyntheticDoc = (docType: string) => {
    const slug = docType.toLowerCase().replace(/\s+/g, '_');
    setUploadedFiles((prev) => [
      ...prev,
      {
        filename: `${slug}_2026_synthetic.pdf`,
        fileSizeBytes: 318400,
        mimeType: 'application/pdf',
        documentType: docType,
        status: 'Validated & Ready',
      },
    ]);
  };

  const handleFinalSubmit = async () => {
    if (!institutionId.trim() || !institutionName.trim()) {
      addToast({
        title: 'Validation Error',
        description: 'Institution Identifier and Institution Name are required.',
        variant: 'critical',
      });
      setStep(1);
      return;
    }
    setSubmitting(true);
    try {
      const res = await apiFetch<{ application: ApplicationRecord }>('/api/v1/applications', {
        method: 'POST',
        body: JSON.stringify({
          institutionId,
          institutionName,
          institutionType,
          state,
          district,
          category,
          academicYear,
          contactName,
          contactEmail,
          contactPhone,
          requestedIntake,
          previousApprovedIntake,
          facultyCountClaimed,
          builtUpAreaSqmClaimed,
          programmesRequested: [programmeName],
          requiredDocumentsChecklist: checklist,
          uploadedFiles,
        }),
      });
      await mirrorApplicationToFirestore({
        applicationId: res.application.id,
        institutionId: res.application.institutionId,
        institutionName: res.application.institutionName,
        category: res.application.category,
        academicYear: res.application.academicYear,
        status: res.application.status,
      });
      addToast({
        title: `Application ${res.application.applicationCode} Created`,
        description: 'Persisted to sample database and tamper-evident audit trail.',
        variant: 'success',
      });
      navigate(`/applications/${res.application.id}`);
    } catch (e: any) {
      addToast({ title: 'Submission Failed', description: e.message, variant: 'critical' });
    } finally {
      setSubmitting(false);
    }
  };

  const applySamplePreset = (presetKey: 'APEX_AI' | 'KAVERI_RENEWAL' | 'HIMALAYA_ROBOTICS') => {
    if (presetKey === 'APEX_AI') {
      setInstitutionId('INST-SAMPLE-101');
      setInstitutionName('Apex Institute of Artificial Intelligence & Engineering');
      setInstitutionType('Autonomous Technical Institution');
      setState('Karnataka');
      setDistrict('Mysuru');
      setCategory('Intake Expansion & New Programme');
      setAcademicYear('2026–2027');
      setContactName('Dr. Prakash Narayanan');
      setContactEmail('registrar@apexai-demo.edu.in');
      setContactPhone('+91-821-2445566');
      setProgrammeName('B.Tech Artificial Intelligence & Data Engineering');
      setPreviousApprovedIntake(60);
      setRequestedIntake(120);
      setFacultyCountClaimed(56);
      setBuiltUpAreaSqmClaimed(16800);
      setUploadedFiles([
        { filename: 'apex_eoa_approval_2025.pdf', fileSizeBytes: 412000, mimeType: 'application/pdf', documentType: 'Approval letter', status: 'Validated & Ready' },
        { filename: 'apex_notarized_affidavit_2026.pdf', fileSizeBytes: 289000, mimeType: 'application/pdf', documentType: 'Affidavit or undertaking', status: 'Validated & Ready' },
        { filename: 'vtu_university_noc_2026.pdf', fileSizeBytes: 354000, mimeType: 'application/pdf', documentType: 'NOC or permission', status: 'Validated & Ready' },
        { filename: 'apex_faculty_roster_2026.pdf', fileSizeBytes: 518000, mimeType: 'application/pdf', documentType: 'Faculty record', status: 'Validated & Ready' },
        { filename: 'apex_campus_floorplan_2026.pdf', fileSizeBytes: 742000, mimeType: 'application/pdf', documentType: 'Infrastructure evidence', status: 'Validated & Ready' },
        { filename: 'apex_regulatory_fee_receipt.pdf', fileSizeBytes: 194000, mimeType: 'application/pdf', documentType: 'Fee payment evidence', status: 'Validated & Ready' },
      ]);
    } else if (presetKey === 'KAVERI_RENEWAL') {
      setInstitutionId('INST-SAMPLE-202');
      setInstitutionName('Kaveri College of Technology & Sciences');
      setInstitutionType('Private Self-Financed Technical Institution');
      setState('Tamil Nadu');
      setDistrict('Coimbatore');
      setCategory('Annual Extension of Approval (EoA)');
      setAcademicYear('2026–2027');
      setContactName('Prof. Lakshmi Balasubramanian');
      setContactEmail('compliance@kaveritech-demo.edu.in');
      setContactPhone('+91-422-2567890');
      setProgrammeName('B.E. Electronics & VLSI Design');
      setPreviousApprovedIntake(120);
      setRequestedIntake(120);
      setFacultyCountClaimed(42);
      setBuiltUpAreaSqmClaimed(13200);
      setUploadedFiles([
        { filename: 'kaveri_prior_approval_2025.pdf', fileSizeBytes: 390000, mimeType: 'application/pdf', documentType: 'Approval letter', status: 'Validated & Ready' },
        { filename: 'kaveri_statutory_undertaking.pdf', fileSizeBytes: 265000, mimeType: 'application/pdf', documentType: 'Affidavit or undertaking', status: 'Validated & Ready' },
        { filename: 'kaveri_faculty_cadre_2026.pdf', fileSizeBytes: 480000, mimeType: 'application/pdf', documentType: 'Faculty record', status: 'Validated & Ready' },
        { filename: 'kaveri_lab_infrastructure.pdf', fileSizeBytes: 615000, mimeType: 'application/pdf', documentType: 'Infrastructure evidence', status: 'Validated & Ready' },
        { filename: 'kaveri_eoa_fee_challan.pdf', fileSizeBytes: 185000, mimeType: 'application/pdf', documentType: 'Fee payment evidence', status: 'Validated & Ready' },
      ]);
    } else {
      setInstitutionId('INST-SAMPLE-303');
      setInstitutionName('Western Ghats Institute of Robotics & Automation');
      setInstitutionType('Private Technical Campus');
      setState('Maharashtra');
      setDistrict('Nagpur');
      setCategory('Demonstration EoA Application');
      setAcademicYear('2026–2027');
      setContactName('Dr. Vikramaditya Kulkarni');
      setContactEmail('director@wgi-robotics-demo.edu.in');
      setContactPhone('+91-712-2789012');
      setProgrammeName('B.Tech Robotics & Autonomous Systems');
      setPreviousApprovedIntake(60);
      setRequestedIntake(180);
      setFacultyCountClaimed(34);
      setBuiltUpAreaSqmClaimed(10800);
      setUploadedFiles([
        { filename: 'wgi_eoa_letter_2025.pdf', fileSizeBytes: 365000, mimeType: 'application/pdf', documentType: 'Approval letter', status: 'Validated & Ready' },
        { filename: 'wgi_affidavit_2026.pdf', fileSizeBytes: 240000, mimeType: 'application/pdf', documentType: 'Affidavit or undertaking', status: 'Validated & Ready' },
        { filename: 'wgi_naac_accreditation.pdf', fileSizeBytes: 420000, mimeType: 'application/pdf', documentType: 'Accreditation certificate', status: 'Validated & Ready' },
        { filename: 'wgi_university_noc.pdf', fileSizeBytes: 310000, mimeType: 'application/pdf', documentType: 'NOC or permission', status: 'Validated & Ready' },
        { filename: 'wgi_faculty_statement.pdf', fileSizeBytes: 495000, mimeType: 'application/pdf', documentType: 'Faculty record', status: 'Validated & Ready' },
        { filename: 'wgi_building_safety_plan.pdf', fileSizeBytes: 680000, mimeType: 'application/pdf', documentType: 'Infrastructure evidence', status: 'Validated & Ready' },
      ]);
    }
    addToast({
      title: 'Sample Application Preset Loaded',
      description: 'Pre-filled all 5 intake steps with realistic sample institutional data and documents.',
      variant: 'info',
    });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="bg-white border border-[#DCE5EC] rounded-xl p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-xl font-bold text-[#10243A]">
              Guided Regulatory Application Intake
            </h1>
            <p className="text-xs text-[#617384]">
              Configurable category-specific checklist workflow with one-click sample data presets
            </p>
          </div>
          <span className="font-mono text-xs font-semibold text-[#2563EB] bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-full">
            Step {step} of 5
          </span>
        </div>

        {/* One-Click Sample Data Presets Bar */}
        <div className="p-3.5 rounded-xl bg-gradient-to-r from-[#EFF6FF] via-[#F0FDFA] to-[#F8FAFC] border border-[#BFDBFE] flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs font-semibold text-[#1E3A8A]">
            Quick-Fill Sample Application Data:
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => applySamplePreset('APEX_AI')}
              className="px-3 py-1.5 rounded-lg bg-white hover:bg-blue-50 text-[#1E40AF] border border-blue-200 text-xs font-semibold shadow-2xs transition-all cursor-pointer"
            >
              Sample 1: Apex AI Institute (Complete Package)
            </button>
            <button
              type="button"
              onClick={() => applySamplePreset('KAVERI_RENEWAL')}
              className="px-3 py-1.5 rounded-lg bg-white hover:bg-teal-50 text-[#0F766E] border border-teal-200 text-xs font-semibold shadow-2xs transition-all cursor-pointer"
            >
              Sample 2: Kaveri Tech (Annual EoA Renewal)
            </button>
            <button
              type="button"
              onClick={() => applySamplePreset('HIMALAYA_ROBOTICS')}
              className="px-3 py-1.5 rounded-lg bg-white hover:bg-amber-50 text-[#B45309] border border-amber-200 text-xs font-semibold shadow-2xs transition-all cursor-pointer"
            >
              Sample 3: Western Ghats Robotics (3x Intake Jump)
            </button>
          </div>
        </div>

        {/* Stepper Bar */}
        <div className="grid grid-cols-5 gap-2">
          {[
            { num: 1, label: '1. Institution Details' },
            { num: 2, label: '2. Application Details' },
            { num: 3, label: '3. Supporting Documents' },
            { num: 4, label: '4. Review Package' },
            { num: 5, label: '5. Auditable Submit' },
          ].map((s) => (
            <button
              key={s.num}
              type="button"
              onClick={() => setStep(s.num as any)}
              className={`py-2 px-3 rounded text-xs font-medium text-left border transition-colors ${
                step === s.num
                  ? 'bg-[#10243A] text-white border-[#10243A]'
                  : step > s.num
                  ? 'bg-[#F4F7FA] text-[#087F8C] border-[#087F8C]/40'
                  : 'bg-[#F4F7FA] text-[#617384] border-[#DCE5EC]'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-white border border-[#DCE5EC] rounded-xl p-6 space-y-6">
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="font-display text-base font-bold text-[#10243A]">
              Step 1: Institution Identity & Contact Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label htmlFor="in-inst-id" className="block font-medium mb-1">
                  Institution Identifier *
                </label>
                <input
                  id="in-inst-id"
                  type="text"
                  value={institutionId}
                  onChange={(e) => setInstitutionId(e.target.value)}
                  className="w-full px-3 py-2 border border-[#DCE5EC] rounded font-mono"
                />
              </div>
              <div>
                <label htmlFor="in-inst-name" className="block font-medium mb-1">
                  Institution Name *
                </label>
                <input
                  id="in-inst-name"
                  type="text"
                  value={institutionName}
                  onChange={(e) => setInstitutionName(e.target.value)}
                  className="w-full px-3 py-2 border border-[#DCE5EC] rounded"
                />
              </div>
              <div>
                <label htmlFor="in-inst-type" className="block font-medium mb-1">
                  Institution Type
                </label>
                <input
                  id="in-inst-type"
                  type="text"
                  value={institutionType}
                  onChange={(e) => setInstitutionType(e.target.value)}
                  className="w-full px-3 py-2 border border-[#DCE5EC] rounded"
                />
              </div>
              <div>
                <label htmlFor="in-cat" className="block font-medium mb-1">
                  Application Category *
                </label>
                <select
                  id="in-cat"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-[#DCE5EC] rounded"
                >
                  <option value="Demonstration EoA Application">Demonstration EoA Application</option>
                  <option value="Intake Expansion & New Programme">Intake Expansion & New Programme</option>
                  <option value="Annual Extension of Approval (EoA)">Annual Extension of Approval (EoA)</option>
                </select>
              </div>
              <div>
                <label htmlFor="in-state" className="block font-medium mb-1">
                  State
                </label>
                <input
                  id="in-state"
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full px-3 py-2 border border-[#DCE5EC] rounded"
                />
              </div>
              <div>
                <label htmlFor="in-dist" className="block font-medium mb-1">
                  District
                </label>
                <input
                  id="in-dist"
                  type="text"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full px-3 py-2 border border-[#DCE5EC] rounded"
                />
              </div>
              <div>
                <label htmlFor="in-year" className="block font-medium mb-1">
                  Academic Year
                </label>
                <input
                  id="in-year"
                  type="text"
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  className="w-full px-3 py-2 border border-[#DCE5EC] rounded font-mono"
                />
              </div>
              <div>
                <label htmlFor="in-contact" className="block font-medium mb-1">
                  Authorized Contact Person & Email
                </label>
                <input
                  id="in-contact"
                  type="text"
                  value={`${contactName} (${contactEmail})`}
                  onChange={(e) => setContactName(e.target.value)}
                  className="w-full px-3 py-2 border border-[#DCE5EC] rounded"
                />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="font-display text-base font-bold text-[#10243A]">
              Step 2: Category-Specific Quantitative Claims ({category})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label htmlFor="in-prog" className="block font-medium mb-1">
                  Primary Programme / Course
                </label>
                <input
                  id="in-prog"
                  type="text"
                  value={programmeName}
                  onChange={(e) => setProgrammeName(e.target.value)}
                  className="w-full px-3 py-2 border border-[#DCE5EC] rounded"
                />
              </div>
              <div>
                <label htmlFor="in-prev-intake" className="block font-medium mb-1">
                  Previous Approved Intake (Historical Baseline)
                </label>
                <input
                  id="in-prev-intake"
                  type="number"
                  value={previousApprovedIntake}
                  onChange={(e) => setPreviousApprovedIntake(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-[#DCE5EC] rounded font-mono"
                />
              </div>
              <div>
                <label htmlFor="in-req-intake" className="block font-medium mb-1">
                  Requested Programme Intake (Current Application)
                </label>
                <input
                  id="in-req-intake"
                  type="number"
                  value={requestedIntake}
                  onChange={(e) => setRequestedIntake(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-[#DCE5EC] rounded font-mono"
                />
              </div>
              <div>
                <label htmlFor="in-fac" className="block font-medium mb-1">
                  Total Regular Faculty Count Claimed
                </label>
                <input
                  id="in-fac"
                  type="number"
                  value={facultyCountClaimed}
                  onChange={(e) => setFacultyCountClaimed(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-[#DCE5EC] rounded font-mono"
                />
              </div>
              <div>
                <label htmlFor="in-area" className="block font-medium mb-1">
                  Total Built-Up Instructional Area Claimed (sq.m)
                </label>
                <input
                  id="in-area"
                  type="number"
                  value={builtUpAreaSqmClaimed}
                  onChange={(e) => setBuiltUpAreaSqmClaimed(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-[#DCE5EC] rounded font-mono"
                />
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h2 className="font-display text-base font-bold text-[#10243A]">
              Step 3: Supporting Documents & Configurable Category Checklist
            </h2>
            <p className="text-xs text-[#617384]">
              Supported formats: PDF, PNG, JPG, JPEG (Max 25 MB per file).
            </p>

            {uploadError && (
              <div role="alert" className="p-3 rounded bg-red-50 border border-red-200 text-xs text-[#B42318]">
                {uploadError}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Checklist Status */}
              <div className="bg-[#F4F7FA] border border-[#DCE5EC] rounded-lg p-4 space-y-2.5">
                <div className="text-xs font-semibold">
                  Configured Checklist for &ldquo;{category}&rdquo;
                </div>
                {checklist.map((reqType) => {
                  const supplied = uploadedFiles.some((f) => f.documentType === reqType);
                  return (
                    <div key={reqType} className="flex items-center justify-between text-xs py-1">
                      <StatusIndicator status={supplied ? `Present: ${reqType}` : `Missing: ${reqType}`} />
                      {!supplied && (
                        <button
                          type="button"
                          onClick={() => handleAddSyntheticDoc(reqType)}
                          className="text-[11px] font-medium text-[#087F8C] hover:underline"
                        >
                          + Attach Sample PDF
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* File Picker */}
              <div className="border-2 border-dashed border-[#DCE5EC] rounded-lg p-6 flex flex-col items-center justify-center text-center space-y-3">
                <Upload className="w-6 h-6 text-[#087F8C]" />
                <div className="text-xs font-medium">
                  Select PDF, PNG, JPG, or JPEG files to attach
                </div>
                <label className="px-4 py-2 bg-[#10243A] hover:bg-[#087F8C] text-white text-xs font-semibold rounded cursor-pointer transition-colors">
                  <span>Browse Supporting Files</span>
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={handleFileInput}
                    className="sr-only"
                  />
                </label>
              </div>
            </div>

            {/* Uploaded Files Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#DCE5EC] text-[#617384]">
                    <th className="py-2 pr-3">Filename</th>
                    <th className="py-2 px-3">Classified Category</th>
                    <th className="py-2 px-3 text-right">Size</th>
                    <th className="py-2 pl-3">Upload Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DCE5EC]">
                  {uploadedFiles.map((f, i) => (
                    <tr key={i}>
                      <td className="py-2 pr-3 font-mono">{f.filename}</td>
                      <td className="py-2 px-3">{f.documentType}</td>
                      <td className="py-2 px-3 text-right font-mono tabular-nums">
                        {(f.fileSizeBytes / 1024).toFixed(1)} KB
                      </td>
                      <td className="py-2 pl-3">
                        <StatusIndicator status={f.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {(step === 4 || step === 5) && (
          <div className="space-y-4 text-xs">
            <h2 className="font-display text-base font-bold text-[#10243A]">
              {step === 4 ? 'Step 4: Review Entered Details & Evidence Package' : 'Step 5: Confirm & Persist Auditable Submission'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#F4F7FA] border border-[#DCE5EC] rounded-lg p-4">
              <div>
                <div className="text-[#617384]">Institution</div>
                <div className="font-semibold">
                  {institutionName} ({institutionId})
                </div>
              </div>
              <div>
                <div className="text-[#617384]">Application Category & Period</div>
                <div className="font-semibold">
                  {category} · {academicYear}
                </div>
              </div>
              <div>
                <div className="text-[#617384]">Intake Claim</div>
                <div className="font-mono">
                  Previous: {previousApprovedIntake} seats → Requested: {requestedIntake} seats
                </div>
              </div>
              <div>
                <div className="text-[#617384]">Faculty & Built-Up Area Claim</div>
                <div className="font-mono">
                  {facultyCountClaimed} Faculty · {builtUpAreaSqmClaimed} sq.m
                </div>
              </div>
              <div className="md:col-span-2">
                <div className="text-[#617384]">Supporting Documents Attached ({uploadedFiles.length})</div>
                <div className="font-mono">
                  {uploadedFiles.map((f) => f.filename).join(' · ')}
                </div>
              </div>
            </div>

            {step === 5 && (
              <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 space-y-2">
                <div className="font-semibold text-[#18794E] flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Ready for Auditable Submission</span>
                </div>
                <p className="text-[#617384]">
                  Submitting this application persists the record in the local &amp; server sample database and records a tamper-evident SHA-256 audit trail event.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Wizard Footer Navigation */}
        <div className="pt-4 border-t border-[#DCE5EC] flex items-center justify-between">
          <button
            type="button"
            disabled={step === 1}
            onClick={() => setStep((s) => Math.max(1, s - 1) as any)}
            className="px-4 py-2 text-xs font-medium border border-[#DCE5EC] rounded disabled:opacity-40"
          >
            ← Previous Step
          </button>

          {step < 5 ? (
            <button
              type="button"
              onClick={() => setStep((s) => Math.min(5, s + 1) as any)}
              className="px-5 py-2 text-xs font-semibold text-white bg-[#10243A] hover:bg-[#087F8C] rounded transition-colors"
            >
              Continue to Step {step + 1} →
            </button>
          ) : (
            <button
              type="button"
              disabled={submitting}
              onClick={handleFinalSubmit}
              className="px-6 py-2.5 text-xs font-semibold text-white bg-[#087F8C] hover:bg-[#10243A] rounded transition-colors"
            >
              {submitting ? 'Persisting Application...' : 'Submit Application & Create Audit Event'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
