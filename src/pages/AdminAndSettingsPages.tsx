import React, { useEffect, useState, useCallback } from 'react';
import { RefreshCw, Plus } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { StatusIndicator } from '../components/ProofMeshLogo';
import {
  UserRecord,
  RegulatoryRule,
  DataSourceAdapterRecord,
  SystemConfigurationRecord,
} from '../types/domain';

/* ============================================================================
 * PAGE 18: USER AND ROLE MANAGEMENT (/admin/users)
 * ========================================================================== */
export const AdminUsersPage: React.FC = () => {
  const { apiFetch, addToast } = useApp();
  const [users, setUsers] = useState<UserRecord[]>([]);

  const loadUsers = useCallback(async () => {
    try {
      const data = await apiFetch<{ users: UserRecord[] }>('/api/v1/users');
      setUsers(data.users || []);
    } catch (e: any) {
      addToast({ title: 'RBAC Access Restricted', description: e.message, variant: 'warning' });
    }
  }, [apiFetch, addToast]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleToggleActive = async (u: UserRecord) => {
    try {
      await apiFetch(`/api/v1/users/${u.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ active: !u.active }),
      });
      addToast({
        title: 'User Status Updated',
        description: `${u.fullName} active status set to ${!u.active}.`,
        variant: 'success',
      });
      await loadUsers();
    } catch (e: any) {
      addToast({ title: 'Update Error', description: e.message, variant: 'critical' });
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-[#10243A]">
          User & Role-Based Access Control (RBAC) Management
        </h1>
        <p className="text-xs text-[#617384] mt-0.5">
          Manage the 5 distinct regulatory roles and institution-scoped data isolation boundaries.
        </p>
      </div>

      <div className="pm-card p-5 bg-white overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-[#DCE5EC] text-[11px] font-semibold uppercase text-[#617384]">
              <th className="py-2.5 pr-3">User ID & Name</th>
              <th className="py-2.5 px-3">Email</th>
              <th className="py-2.5 px-3">Assigned Role</th>
              <th className="py-2.5 px-3">Institution / Scope</th>
              <th className="py-2.5 px-3">Status</th>
              <th className="py-2.5 pl-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#DCE5EC]">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-[#F4F7FA]/60">
                <td className="py-3 pr-3">
                  <div className="font-bold text-[#10243A]">{u.fullName}</div>
                  <div className="font-mono text-[10px] text-[#617384]">{u.id}</div>
                </td>
                <td className="py-3 px-3 font-mono text-[#087F8C]">{u.email}</td>
                <td className="py-3 px-3 font-mono font-semibold text-[#10243A]">{u.role}</td>
                <td className="py-3 px-3 text-[#617384]">
                  {u.institutionName || u.reviewScope.join(', ')}
                </td>
                <td className="py-3 px-3">
                  <StatusIndicator status={u.active ? 'Active' : 'Suspended'} />
                </td>
                <td className="py-3 pl-3 text-right">
                  <button
                    onClick={() => handleToggleActive(u)}
                    className="px-2.5 py-1 rounded border border-[#DCE5EC] text-xs font-semibold hover:bg-[#F4F7FA] cursor-pointer"
                  >
                    {u.active ? 'Suspend' : 'Activate'}
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

/* ============================================================================
 * PAGE 19: REGULATORY RULE MANAGEMENT (/admin/rules)
 * ========================================================================== */
export const AdminRulesPage: React.FC = () => {
  const { apiFetch, addToast } = useApp();
  const [rules, setRules] = useState<RegulatoryRule[]>([]);
  const [ruleCode, setRuleCode] = useState('');
  const [name, setName] = useState('');
  const [validationLogic, setValidationLogic] = useState('');

  const loadRules = useCallback(async () => {
    try {
      const data = await apiFetch<{ rules: RegulatoryRule[] }>('/api/v1/rules');
      setRules(data.rules || []);
    } catch (e: any) {
      addToast({ title: 'Rule Load Error', description: e.message, variant: 'critical' });
    }
  }, [apiFetch, addToast]);

  useEffect(() => {
    loadRules();
  }, [loadRules]);

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleCode.trim() || !name.trim()) return;
    try {
      await apiFetch('/api/v1/rules', {
        method: 'POST',
        body: JSON.stringify({
          ruleCode,
          name,
          validationLogic: validationLogic || 'value >= threshold',
          severity: 'High Priority',
        }),
      });
      addToast({
        title: 'Regulatory Rule Published',
        description: `${ruleCode} added to active rule pack.`,
        variant: 'success',
      });
      setRuleCode('');
      setName('');
      setValidationLogic('');
      await loadRules();
    } catch (err: any) {
      addToast({ title: 'Rule Creation Error', description: err.message, variant: 'critical' });
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-[#10243A]">
          Regulatory Rule Pack & Version Lifecycle Management
        </h1>
        <p className="text-xs text-[#617384] mt-0.5">
          Configure deterministic validation clauses, threshold formulas, and handbook versions.
        </p>
      </div>

      {/* Add Rule Form */}
      <form onSubmit={handleCreateRule} className="pm-card p-5 bg-white grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
        <div>
          <label className="block text-xs font-semibold text-[#10243A] mb-1">Rule Code</label>
          <input
            type="text"
            value={ruleCode}
            onChange={(e) => setRuleCode(e.target.value)}
            placeholder="RULE-DEMO-09"
            className="w-full px-3 py-1.5 rounded border border-[#DCE5EC] text-xs font-mono"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-xs font-semibold text-[#10243A] mb-1">Rule Name & Norm</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Barrier-Free Accessibility & Ramp Compliance"
            className="w-full px-3 py-1.5 rounded border border-[#DCE5EC] text-xs"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-[#10243A] mb-1">Validation Expression</label>
          <input
            type="text"
            value={validationLogic}
            onChange={(e) => setValidationLogic(e.target.value)}
            placeholder="rampCount >= 2"
            className="w-full px-3 py-1.5 rounded border border-[#DCE5EC] text-xs font-mono"
          />
        </div>
        <button
          type="submit"
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded bg-[#087F8C] text-white text-xs font-semibold hover:bg-[#10243A] cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          Publish Rule
        </button>
      </form>

      <div className="space-y-3">
        {rules.map((r) => (
          <div key={r.id} className="pm-card p-4 bg-white flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1 max-w-3xl">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-[#087F8C]">{r.ruleCode}</span>
                <span className="text-xs font-semibold text-[#617384]">{r.requirementCategory}</span>
                <StatusIndicator status={r.severity} />
                <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-emerald-50 text-[#18794E]">
                  {r.currentVersion} ({r.status})
                </span>
              </div>
              <h2 className="text-sm font-bold text-[#10243A]">{r.name}</h2>
              <p className="text-xs text-[#617384]">{r.description}</p>
              <div className="font-mono text-[11px] text-[#10243A]">
                Formula: <span className="text-[#087F8C]">{r.validationLogic}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ============================================================================
 * PAGE 20: DATA SOURCE MANAGEMENT (/admin/data-sources)
 * ========================================================================== */
export const AdminDataSourcesPage: React.FC = () => {
  const { apiFetch, addToast } = useApp();
  const [sources, setSources] = useState<DataSourceAdapterRecord[]>([]);

  const loadSources = useCallback(async () => {
    try {
      const data = await apiFetch<{ dataSources: DataSourceAdapterRecord[] }>('/api/v1/data-sources');
      setSources(data.dataSources || []);
    } catch (e: any) {
      addToast({ title: 'Data Sources Error', description: e.message, variant: 'critical' });
    }
  }, [apiFetch, addToast]);

  useEffect(() => {
    loadSources();
  }, [loadSources]);

  const handleTestConnection = async (id: string) => {
    try {
      const res = await apiFetch<{ dataSource: DataSourceAdapterRecord }>(`/api/v1/data-sources/${id}/retry`, {
        method: 'POST',
        body: JSON.stringify({ forceRecover: true }),
      });
      addToast({
        title: `Adapter Connectivity Checked`,
        description: `${res.dataSource.name}: ${res.dataSource.integrationStatus}`,
        variant: 'success',
      });
      await loadSources();
    } catch (e: any) {
      addToast({ title: 'Connection Error', description: e.message, variant: 'critical' });
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-[#10243A]">
          External Registry Adapters & Trusted Data Sources
        </h1>
        <p className="text-xs text-[#617384] mt-0.5">
          Monitor simulated and external registry connectors, connection status, and manual fallback policies.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sources.map((s) => (
          <div key={s.id} className="pm-card p-5 bg-white space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-[#087F8C]">{s.id}</span>
              <StatusIndicator status={s.integrationStatus} />
            </div>
            <h2 className="text-base font-bold text-[#10243A]">{s.name}</h2>
            <div className="text-xs font-mono text-[#617384] space-y-1">
              <div>Authority: {s.sourceAuthority}</div>
              <div>Type: {s.sourceType} ({s.supportedMethod})</div>
              <div>Fallback: {s.manualFallbackEnabled ? 'Manual Authority Confirmation Active' : 'Disabled'}</div>
            </div>
            <button
              onClick={() => handleTestConnection(s.id)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-[#DCE5EC] text-xs font-semibold text-[#10243A] hover:bg-[#F4F7FA] cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[#087F8C]" />
              Test / Retry Adapter Handshake
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ============================================================================
 * PAGE 22: PROFILE & PERSONAL SETTINGS (/settings/profile)
 * ========================================================================== */
export const ProfileSettingsPage: React.FC = () => {
  const { currentUser, demoAccounts, switchUserByEmailOrRole, theme, setTheme } = useApp();

  return (
    <div className="space-y-5 max-w-4xl">
      <div>
        <h1 className="text-xl font-bold text-[#10243A]">Officer Profile & Workspace Preferences</h1>
        <p className="text-xs text-[#617384] mt-0.5">
          Inspect active RBAC credentials, switch demonstration accounts, and toggle display theme.
        </p>
      </div>

      <div className="pm-card p-5 bg-white space-y-4">
        <div className="flex items-center justify-between border-b border-[#DCE5EC] pb-3">
          <div>
            <h2 className="text-base font-bold text-[#10243A]">{currentUser.fullName}</h2>
            <p className="text-xs font-mono text-[#087F8C]">{currentUser.email}</p>
          </div>
          <StatusIndicator status={currentUser.role} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3 rounded bg-[#F4F7FA]">
            <div className="text-[#617384] uppercase font-semibold text-[10px]">Department</div>
            <div className="font-bold text-[#10243A] mt-0.5">{currentUser.department}</div>
          </div>
          <div className="p-3 rounded bg-[#F4F7FA]">
            <div className="text-[#617384] uppercase font-semibold text-[10px]">Assigned Scope / Institution</div>
            <div className="font-bold text-[#10243A] mt-0.5">
              {currentUser.institutionName || currentUser.reviewScope.join(' • ')}
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-[#DCE5EC] flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs font-semibold text-[#10243A]">Workspace Color Theme</div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTheme('light')}
              className={`px-3 py-1.5 rounded text-xs font-semibold cursor-pointer ${
                theme === 'light' ? 'bg-[#10243A] text-white' : 'border border-[#DCE5EC]'
              }`}
            >
              Regulatory Light Theme (Default)
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={`px-3 py-1.5 rounded text-xs font-semibold cursor-pointer ${
                theme === 'dark' ? 'bg-[#087F8C] text-white' : 'border border-[#DCE5EC]'
              }`}
            >
              Deep Navy Dark Theme
            </button>
          </div>
        </div>
      </div>

      <div className="pm-card p-5 bg-white space-y-3">
        <h2 className="text-sm font-bold text-[#10243A] uppercase tracking-wider">
          Quick Role Switcher (Test All 5 RBAC Perspectives)
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {demoAccounts.map((acc) => (
            <button
              key={acc.id}
              onClick={() => switchUserByEmailOrRole(acc.email)}
              className={`p-3 rounded border text-left transition-colors cursor-pointer ${
                acc.id === currentUser.id
                  ? 'border-[#087F8C] bg-[#E6F4F5]/50'
                  : 'border-[#DCE5EC] hover:bg-[#F4F7FA]'
              }`}
            >
              <div className="text-xs font-bold text-[#10243A]">{acc.fullName}</div>
              <div className="font-mono text-[11px] text-[#087F8C]">{acc.role}</div>
              <div className="font-mono text-[10px] text-[#617384]">{acc.email}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
 * PAGE 23: SYSTEM SETTINGS (/admin/settings)
 * ========================================================================== */
export const SystemSettingsPage: React.FC = () => {
  const { apiFetch, addToast } = useApp();
  const [settings, setSettings] = useState<SystemConfigurationRecord | null>(null);

  const loadSettings = useCallback(async () => {
    try {
      const data = await apiFetch<{ settings: SystemConfigurationRecord }>('/api/v1/settings');
      setSettings(data.settings);
    } catch (e: any) {
      addToast({ title: 'Settings Load Error', description: e.message, variant: 'critical' });
    }
  }, [apiFetch, addToast]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleUpdateSetting = async (patch: Partial<SystemConfigurationRecord>) => {
    try {
      await apiFetch('/api/v1/settings', {
        method: 'PATCH',
        body: JSON.stringify(patch),
      });
      addToast({
        title: 'System Parameter Updated',
        description: 'Global regulatory configuration updated and audited.',
        variant: 'success',
      });
      await loadSettings();
    } catch (e: any) {
      addToast({ title: 'Update Error', description: e.message, variant: 'critical' });
    }
  };

  return (
    <div className="space-y-5 max-w-4xl">
      <div>
        <h1 className="text-xl font-bold text-[#10243A]">
          Platform Governance & Engine Configuration Settings
        </h1>
        <p className="text-xs text-[#617384] mt-0.5">
          Configure deterministic evaluation date, upload limits, session timeout, and audit retention policies.
        </p>
      </div>

      {settings && (
        <div className="space-y-3">
          <div className="pm-card p-4 bg-white flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-0.5 max-w-xl">
              <div className="font-mono text-[11px] font-bold text-[#087F8C]">EVALUATION_BASELINE_DATE</div>
              <div className="text-sm font-bold text-[#10243A]">Deterministic Expiry Evaluation Date</div>
              <p className="text-xs text-[#617384]">
                Reference date used by the expiry evaluator to flag expired NOCs and safety certificates.
              </p>
            </div>
            <input
              type="date"
              defaultValue={settings.evaluationDate}
              onBlur={(e) => {
                if (e.target.value !== settings.evaluationDate) {
                  handleUpdateSetting({ evaluationDate: e.target.value });
                }
              }}
              className="px-3 py-1.5 rounded border border-[#DCE5EC] text-xs font-mono"
            />
          </div>

          <div className="pm-card p-4 bg-white flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-0.5 max-w-xl">
              <div className="font-mono text-[11px] font-bold text-[#087F8C]">MAX_UPLOAD_SIZE_MB</div>
              <div className="text-sm font-bold text-[#10243A]">Maximum Document Upload Size (MB)</div>
              <p className="text-xs text-[#617384]">
                Maximum file size permitted for PDF, PNG, JPG, and JPEG regulatory evidence uploads.
              </p>
            </div>
            <input
              type="number"
              defaultValue={settings.maxUploadSizeMb}
              onBlur={(e) => {
                const v = Number(e.target.value);
                if (v !== settings.maxUploadSizeMb) {
                  handleUpdateSetting({ maxUploadSizeMb: v });
                }
              }}
              className="px-3 py-1.5 rounded border border-[#DCE5EC] text-xs font-mono w-28 text-right"
            />
          </div>

          <div className="pm-card p-4 bg-white flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-0.5 max-w-xl">
              <div className="font-mono text-[11px] font-bold text-[#087F8C]">DATA_RETENTION_DAYS</div>
              <div className="text-sm font-bold text-[#10243A]">Statutory Audit Log Retention Window (Days)</div>
              <p className="text-xs text-[#617384]">
                Minimum retention period for append-only cryptographic SHA-256 audit records.
              </p>
            </div>
            <input
              type="number"
              defaultValue={settings.dataRetentionDays}
              onBlur={(e) => {
                const v = Number(e.target.value);
                if (v !== settings.dataRetentionDays) {
                  handleUpdateSetting({ dataRetentionDays: v });
                }
              }}
              className="px-3 py-1.5 rounded border border-[#DCE5EC] text-xs font-mono w-28 text-right"
            />
          </div>
        </div>
      )}
    </div>
  );
};
