import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Activity,
  Bell,
  BookOpen,
  Building2,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Database,
  FileSearch,
  FileSpreadsheet,
  FileText,
  FolderKanban,
  GitCompare,
  Globe,
  LayoutDashboard,
  LogOut,
  Moon,
  Network,
  Scale,
  Search,
  Settings,
  ShieldCheck,
  Sliders,
  Sun,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ProofMeshLogo } from './ProofMeshLogo';
import { UserRole } from '../types/domain';

interface NavItem {
  label: string;
  path: string;
  icon: React.FC<{ className?: string }>;
}

interface NavGroup {
  groupTitle: string;
  items: NavItem[];
}

const SIDEBAR_GROUPS: NavGroup[] = [
  {
    groupTitle: 'Overview',
    items: [
      { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
      { label: 'My Work Queue', path: '/work-queue', icon: CheckSquare },
      { label: 'Application Registry', path: '/applications', icon: FolderKanban },
    ],
  },
  {
    groupTitle: 'Intelligence',
    items: [
      { label: 'Document Intelligence', path: '/document-intelligence', icon: FileSearch },
      { label: 'Validation Center', path: '/validation-center', icon: ClipboardCheck },
      { label: 'Evidence Graph', path: '/evidence-graph', icon: Network },
      { label: 'Regulatory Change Impact', path: '/change-impact', icon: GitCompare },
      { label: 'Compliance Assessment', path: '/compliance', icon: Scale },
    ],
  },
  {
    groupTitle: 'Verification',
    items: [
      { label: 'Source Verification', path: '/verification', icon: ShieldCheck },
      { label: 'Infrastructure Review', path: '/infrastructure-review', icon: Building2 },
    ],
  },
  {
    groupTitle: 'Reporting',
    items: [
      { label: 'Reports and Analytics', path: '/reports', icon: FileSpreadsheet },
      { label: 'Audit Trail', path: '/audit', icon: Activity },
      { label: 'Notifications', path: '/notifications', icon: Bell },
    ],
  },
  {
    groupTitle: 'Administration',
    items: [
      { label: 'Regulatory Rules', path: '/admin/rules', icon: BookOpen },
      { label: 'Data Sources', path: '/admin/data-sources', icon: Database },
      { label: 'User and Role Management', path: '/admin/users', icon: Users },
      { label: 'System Settings', path: '/admin/settings', icon: Sliders },
    ],
  },
];

const ROUTE_TITLES: Record<string, { group: string; title: string }> = {
  '/dashboard': { group: 'Overview', title: 'Regulatory Workspace Dashboard' },
  '/work-queue': { group: 'Overview', title: 'My Work Queue' },
  '/applications': { group: 'Overview', title: 'Application Registry' },
  '/applications/new': { group: 'Overview', title: 'Application Intake Wizard' },
  '/document-intelligence': { group: 'Intelligence', title: 'Document Intelligence & OCR Extraction' },
  '/validation-center': { group: 'Intelligence', title: 'Validation Center' },
  '/evidence-graph': { group: 'Intelligence', title: 'Claim-to-Evidence Intelligence Graph' },
  '/change-impact': { group: 'Intelligence', title: 'Regulatory Change Impact Engine' },
  '/compliance': { group: 'Intelligence', title: 'Compliance Assessment' },
  '/verification': { group: 'Verification', title: 'Source Verification Center' },
  '/infrastructure-review': { group: 'Verification', title: 'Infrastructure Review Workspace' },
  '/reports': { group: 'Reporting', title: 'Reports and Analytics' },
  '/audit': { group: 'Reporting', title: 'Tamper-Evident Audit Trail' },
  '/notifications': { group: 'Reporting', title: 'Notifications Center' },
  '/admin/rules': { group: 'Administration', title: 'Regulatory Rule Management' },
  '/admin/data-sources': { group: 'Administration', title: 'Data Source Management' },
  '/admin/users': { group: 'Administration', title: 'User and Role Management' },
  '/admin/settings': { group: 'Administration', title: 'System Settings' },
  '/settings/profile': { group: 'Personal', title: 'Profile and Personal Settings' },
};

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    currentUser,
    demoAccounts,
    switchUserByEmailOrRole,
    theme,
    setTheme,
    logout,
    toasts,
    dismissToast,
    unreadNotificationsCount,
  } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');

  const currentMeta =
    ROUTE_TITLES[location.pathname] ||
    (location.pathname.startsWith('/applications/')
      ? { group: 'Application Registry', title: `Application Detail (${location.pathname.split('/').pop()})` }
      : { group: 'Workspace', title: 'PROOFMESH AI' });

  const handleGlobalSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!globalSearch.trim()) return;
    navigate(`/applications?q=${encodeURIComponent(globalSearch.trim())}`);
  };

  return (
    <div className="min-h-screen flex bg-[#F8FAFC] text-[#0F172A]">
      {/* Fixed / Collapsible Left Sidebar — Crisp Executive Light Theme */}
      <aside
        aria-label="Primary Regulatory Navigation"
        className={`${
          collapsed ? 'w-16' : 'w-64'
        } shrink-0 bg-white text-[#1E293B] border-r border-[#E2E8F0] shadow-[2px_0_12px_rgba(15,23,42,0.03)] flex flex-col justify-between transition-all duration-200 z-20`}
      >
        <div>
          {/* Brand Header */}
          <div className="h-15 px-4 flex items-center justify-between border-b border-[#E2E8F0] bg-white">
            <Link to="/" className="flex items-center gap-2 focus:outline-none">
              <ProofMeshLogo compact={collapsed} />
            </Link>
            <button
              type="button"
              onClick={() => setCollapsed((c) => !c)}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className="p-1.5 rounded-lg text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] transition-colors cursor-pointer"
            >
              {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>

          {/* Quick Action: New Application Intake */}
          <div className="p-3 border-b border-[#E2E8F0] bg-gradient-to-b from-[#F8FAFC] to-white">
            <Link
              to="/applications/new"
              title="New Application Intake"
              className="flex items-center justify-center gap-2 w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#1E3A8A] via-[#0F4C81] to-[#0D9488] hover:from-[#1E40AF] hover:to-[#0F766E] text-white text-xs font-semibold shadow-sm hover:shadow transition-all duration-200 whitespace-nowrap"
            >
              <FileText className="w-4 h-4 shrink-0" />
              {!collapsed && <span>New Application Intake</span>}
            </Link>
          </div>

          {/* Navigation Groups */}
          <nav className="py-3 px-2.5 space-y-4 overflow-y-auto max-h-[calc(100vh-11.5rem)]">
            {SIDEBAR_GROUPS.map((group) => (
              <div key={group.groupTitle}>
                {!collapsed && (
                  <div className="px-2.5 pb-1.5 text-[10px] font-bold uppercase tracking-widest text-[#64748B]">
                    {group.groupTitle}
                  </div>
                )}
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive =
                      location.pathname === item.path ||
                      (item.path === '/applications' && location.pathname.startsWith('/applications/'));
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        title={item.label}
                        className={`flex items-center justify-between gap-2.5 px-2.5 py-2 rounded-lg text-xs transition-all duration-150 ${
                          isActive
                            ? 'bg-gradient-to-r from-[#EFF6FF] to-[#F0FDFA] text-[#0F4C81] font-semibold border border-[#BFDBFE] shadow-2xs'
                            : 'text-[#475569] font-medium hover:bg-[#F1F5F9] hover:text-[#0F172A] hover:translate-x-0.5'
                        }`}
                      >
                        <span className="flex items-center gap-2.5 truncate">
                          <Icon
                            className={`w-4 h-4 shrink-0 ${
                              isActive ? 'text-[#0D9488]' : 'text-[#64748B]'
                            }`}
                          />
                          {!collapsed && <span className="truncate">{item.label}</span>}
                        </span>
                        {!collapsed && item.path === '/notifications' && unreadNotificationsCount > 0 && (
                          <span className="font-mono text-[11px] font-bold px-1.5 py-0.5 rounded-full bg-[#DBEAFE] text-[#1D4ED8] tabular-nums">
                            {unreadNotificationsCount}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Public Verification Portal Link */}
            <div className="pt-2 border-t border-[#E2E8F0]">
              <Link
                to="/public/verify"
                title="Public Verification Portal"
                className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0F172A] transition-colors"
              >
                <Globe className="w-4 h-4 shrink-0 text-[#0D9488]" />
                {!collapsed && <span className="truncate">Public Verification Portal</span>}
              </Link>
            </div>
          </nav>
        </div>

        {/* Bottom Profile & Settings */}
        <div className="p-3 border-t border-[#E2E8F0] bg-[#F8FAFC]">
          {!collapsed ? (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Link
                  to="/settings/profile"
                  className="text-xs font-bold text-[#0F172A] hover:text-[#0D9488] truncate"
                >
                  {currentUser.fullName}
                </Link>
                <Link
                  to="/settings/profile"
                  aria-label="Profile settings"
                  className="p-1 text-[#64748B] hover:text-[#0F172A] rounded hover:bg-[#E2E8F0]/50"
                >
                  <Settings className="w-3.5 h-3.5" />
                </Link>
              </div>
              <div className="text-[11px] text-[#0D9488] font-semibold truncate">
                {currentUser.role.replace(/_/g, ' ')}
                {currentUser.institutionId ? ` · ${currentUser.institutionId}` : ''}
              </div>
            </div>
          ) : (
            <Link
              to="/settings/profile"
              aria-label="Profile settings"
              className="flex justify-center p-1.5 text-[#64748B] hover:text-[#0F172A]"
            >
              <Settings className="w-4 h-4" />
            </Link>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mandatory Synthetic Data Disclosure Banner — Crisp Institutional Light Ribbon */}
        <div className="bg-gradient-to-r from-[#EFF6FF] via-[#F0F9FF] to-[#F0FDFA] text-[#0F172A] px-6 py-1.5 text-xs flex flex-wrap items-center justify-between gap-2 border-b border-[#BFDBFE]">
          <span className="inline-flex items-center gap-2 font-mono font-semibold tracking-tight text-[#1E40AF]">
            <span className="w-2 h-2 rounded-full bg-[#0D9488] animate-pulse shrink-0" />
            SYNTHETIC DEMONSTRATION DATA — NOT AN OFFICIAL AICTE RECORD · Problem Statement ID: 26261
          </span>
          <span className="text-[#475569] font-medium">
            Human Oversight Retained: Automated outputs are advisory aids for regulatory scrutiny
          </span>
        </div>

        {/* Top Workspace Header */}
        <header className="min-h-14 py-2 bg-white/95 backdrop-blur-md border-b border-[#E2E8F0] px-6 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-10">
          {/* Left: Breadcrumb Navigation */}
          <div className="flex items-center gap-2 text-xs text-[#64748B] min-w-0">
            <span className="font-semibold text-[#0D9488] uppercase tracking-wider text-[11px] shrink-0">
              {currentMeta.group}
            </span>
            <span aria-hidden="true" className="text-slate-300">/</span>
            <span className="font-display font-bold text-sm text-[#0F172A] truncate">
              {currentMeta.title}
            </span>
          </div>

          {/* Right: Global Search, Role Switcher, Notifications & Profile */}
          <div className="flex items-center gap-2.5 shrink-0">
            <form onSubmit={handleGlobalSearch} className="relative hidden xl:block">
              <Search className="w-3.5 h-3.5 text-[#64748B] absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                placeholder="Search Application ID, Institution..."
                aria-label="Global application search"
                className="pl-8 pr-3 py-1.5 text-xs bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg text-[#0F172A] w-56 focus:outline-none focus:border-[#0D9488] focus:bg-white transition-colors"
              />
            </form>

            {/* Demo Role Account Switcher for Instant RBAC Evaluation */}
            <div className="flex items-center gap-1.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg px-2.5 py-1">
              <UserCheck className="w-3.5 h-3.5 text-[#0D9488] shrink-0" aria-hidden="true" />
              <label htmlFor="demo-role-switcher" className="sr-only">
                Active Role Account
              </label>
              <select
                id="demo-role-switcher"
                aria-label="Switch Active Demo Role"
                value={currentUser.email}
                onChange={(e) => switchUserByEmailOrRole(e.target.value)}
                className="text-xs bg-transparent text-[#0F172A] font-semibold focus:outline-none cursor-pointer max-w-[240px] truncate"
              >
                {demoAccounts.map((acc) => (
                  <option key={acc.id} value={acc.email}>
                    {acc.role.replace(/_/g, ' ')} — {acc.fullName}
                  </option>
                ))}
              </select>
            </div>

            {/* Notifications Link */}
            <Link
              to="/notifications"
              aria-label={`Notifications (${unreadNotificationsCount} unread)`}
              className="relative inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[#CBD5E1] bg-white text-[#0F172A] hover:bg-[#F8FAFC] hover:border-[#94A3B8] transition-all whitespace-nowrap"
            >
              <Bell className="w-4 h-4 shrink-0 text-[#475569]" />
              {unreadNotificationsCount > 0 && (
                <span className="font-mono text-[11px] font-bold px-1.5 py-0.2 rounded-full bg-rose-50 text-rose-700 border border-rose-200 tabular-nums">
                  {unreadNotificationsCount}
                </span>
              )}
            </Link>

            {/* Logout Button */}
            <button
              type="button"
              onClick={async () => {
                await logout();
                navigate('/login');
              }}
              aria-label="Sign out"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#CBD5E1] bg-white text-xs font-semibold text-[#475569] hover:text-rose-700 hover:bg-rose-50 hover:border-rose-200 transition-all whitespace-nowrap cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </header>

        {/* Page Content with Smooth Entrance Animation */}
        <main key={location.pathname} className="flex-1 p-6 overflow-x-hidden pm-page-enter">
          {children}
        </main>
      </div>

      {/* Toast Notifications Container */}
      {toasts.length > 0 && (
        <div
          aria-live="polite"
          className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none"
        >
          {toasts.map((t) => (
            <div
              key={t.id}
              className="pointer-events-auto bg-white border border-[#CBD5E1] shadow-lg rounded-xl p-3.5 flex items-start justify-between gap-3 pm-page-enter"
            >
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-[#0F172A]">{t.title}</div>
                {t.description && (
                  <div className="text-xs text-[#475569]">{t.description}</div>
                )}
              </div>
              <button
                type="button"
                onClick={() => dismissToast(t.id)}
                aria-label="Close notification"
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const MainLayout = AppShell;
export default AppShell;
export { UserRole };

