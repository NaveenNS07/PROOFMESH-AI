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
    <div className="min-h-screen flex bg-[#F4F7FA] dark:bg-[#0B1828] text-[#172B3A] dark:text-[#F0F5FA]">
      {/* Fixed / Collapsible Left Sidebar */}
      <aside
        aria-label="Primary Regulatory Navigation"
        className={`${
          collapsed ? 'w-16' : 'w-64'
        } shrink-0 bg-[#10243A] text-slate-200 border-r border-[#183B56] flex flex-col justify-between transition-all duration-150`}
      >
        <div>
          {/* Brand Header */}
          <div className="h-14 px-4 flex items-center justify-between border-b border-[#183B56]">
            <Link to="/" className="flex items-center gap-2 focus:outline-none">
              <ProofMeshLogo compact={collapsed} lightText />
            </Link>
            <button
              type="button"
              onClick={() => setCollapsed((c) => !c)}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className="p-1.5 rounded text-slate-300 hover:text-white hover:bg-[#183B56] transition-colors"
            >
              {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>

          {/* Quick Action: New Application Intake */}
          <div className="p-3 border-b border-[#183B56]">
            <Link
              to="/applications/new"
              title="New Application Intake"
              className="flex items-center justify-center gap-2 w-full py-2 px-3 rounded bg-[#087F8C] hover:bg-[#27A6A1] text-white text-xs font-medium transition-colors whitespace-nowrap"
            >
              <FileText className="w-4 h-4 shrink-0" />
              {!collapsed && <span>New Application Intake</span>}
            </Link>
          </div>

          {/* Navigation Groups */}
          <nav className="py-2 px-2 space-y-4 overflow-y-auto max-h-[calc(100vh-11rem)]">
            {SIDEBAR_GROUPS.map((group) => (
              <div key={group.groupTitle}>
                {!collapsed && (
                  <div className="px-2.5 pb-1 text-[11px] font-semibold tracking-wider text-slate-400">
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
                        className={`flex items-center justify-between gap-2.5 px-2.5 py-2 rounded text-xs font-medium transition-colors ${
                          isActive
                            ? 'bg-[#183B56] text-white'
                            : 'text-slate-300 hover:bg-[#183B56]/60 hover:text-white'
                        }`}
                      >
                        <span className="flex items-center gap-2.5 truncate">
                          <Icon className="w-4 h-4 shrink-0 text-[#27A6A1]" />
                          {!collapsed && <span className="truncate">{item.label}</span>}
                        </span>
                        {!collapsed && item.path === '/notifications' && unreadNotificationsCount > 0 && (
                          <span className="font-mono text-[11px] text-[#27A6A1] tabular-nums">
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
            <div className="pt-2 border-t border-[#183B56]">
              <Link
                to="/public/verify"
                title="Public Verification Portal"
                className="flex items-center gap-2.5 px-2.5 py-2 rounded text-xs font-medium text-slate-300 hover:bg-[#183B56]/60 hover:text-white transition-colors"
              >
                <Globe className="w-4 h-4 shrink-0 text-[#27A6A1]" />
                {!collapsed && <span className="truncate">Public Verification Portal</span>}
              </Link>
            </div>
          </nav>
        </div>

        {/* Bottom Profile & Logout */}
        <div className="p-3 border-t border-[#183B56] bg-[#0D1E31]">
          {!collapsed ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Link
                  to="/settings/profile"
                  className="text-xs font-semibold text-white hover:underline truncate"
                >
                  {currentUser.fullName}
                </Link>
                <Link
                  to="/settings/profile"
                  aria-label="Profile settings"
                  className="p-1 text-slate-400 hover:text-white"
                >
                  <Settings className="w-3.5 h-3.5" />
                </Link>
              </div>
              <div className="text-[11px] text-slate-400 truncate">
                {currentUser.role.replace(/_/g, ' ')}
                {currentUser.institutionId ? ` · ${currentUser.institutionId}` : ''}
              </div>
            </div>
          ) : (
            <Link
              to="/settings/profile"
              aria-label="Profile settings"
              className="flex justify-center p-1.5 text-slate-300 hover:text-white"
            >
              <Settings className="w-4 h-4" />
            </Link>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mandatory Synthetic Data Disclosure Banner */}
        <div className="bg-[#183B56] text-slate-100 px-6 py-1.5 text-xs flex flex-wrap items-center justify-between gap-2 border-b border-[#10243A]">
          <span className="font-mono tracking-tight">
            SYNTHETIC DEMONSTRATION DATA — NOT AN OFFICIAL AICTE RECORD · Problem Statement ID: 26261
          </span>
          <span className="text-slate-300">
            Human Oversight Retained: Automated outputs are advisory aids for regulatory scrutiny
          </span>
        </div>

        {/* Top Workspace Header */}
        <header className="h-14 bg-white dark:bg-[#10243A] border-b border-[#DCE5EC] dark:border-[#213D5B] px-6 flex items-center justify-between gap-6">
          {/* Left: Breadcrumb Navigation */}
          <div className="flex items-center gap-2 text-xs text-[#617384] dark:text-slate-300 truncate">
            <span>{currentMeta.group}</span>
            <span aria-hidden="true">/</span>
            <span className="font-semibold text-[#172B3A] dark:text-white truncate">
              {currentMeta.title}
            </span>
          </div>

          {/* Right: Global Search, Role Switcher, Theme Toggle, Notifications & Profile */}
          <div className="flex items-center gap-3 shrink-0">
            <form onSubmit={handleGlobalSearch} className="relative hidden lg:block">
              <Search className="w-3.5 h-3.5 text-[#617384] absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                placeholder="Search Application ID, Institution..."
                aria-label="Global application search"
                className="pl-8 pr-3 py-1.5 text-xs bg-[#F4F7FA] dark:bg-[#0B1828] border border-[#DCE5EC] dark:border-[#213D5B] rounded text-[#172B3A] dark:text-white w-60 focus:outline-none focus:border-[#087F8C]"
              />
            </form>

            {/* Demo Role Account Switcher for Instant RBAC Evaluation */}
            <div className="flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-[#087F8C] shrink-0" aria-hidden="true" />
              <label htmlFor="demo-role-switcher" className="sr-only">
                Active Role Account
              </label>
              <select
                id="demo-role-switcher"
                aria-label="Switch Active Demo Role"
                value={currentUser.email}
                onChange={(e) => switchUserByEmailOrRole(e.target.value)}
                className="text-xs bg-[#F4F7FA] dark:bg-[#0B1828] border border-[#DCE5EC] dark:border-[#213D5B] rounded px-2 py-1.5 text-[#172B3A] dark:text-white font-medium focus:outline-none focus:border-[#087F8C]"
              >
                {demoAccounts.map((acc) => (
                  <option key={acc.id} value={acc.email}>
                    {acc.role.replace(/_/g, ' ')} — {acc.fullName}
                  </option>
                ))}
              </select>
            </div>

            {/* Theme Toggle (Light / Deep Navy Dark) */}
            <button
              type="button"
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              aria-label={theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'}
              className="p-1.5 rounded border border-[#DCE5EC] dark:border-[#213D5B] text-[#172B3A] dark:text-slate-200 hover:bg-[#F4F7FA] dark:hover:bg-[#16304B] transition-colors"
            >
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>

            {/* Notifications Link */}
            <Link
              to="/notifications"
              aria-label={`Notifications (${unreadNotificationsCount} unread)`}
              className="relative inline-flex items-center gap-1 px-2.5 py-1.5 rounded border border-[#DCE5EC] dark:border-[#213D5B] text-[#172B3A] dark:text-slate-200 hover:bg-[#F4F7FA] dark:hover:bg-[#16304B] transition-colors whitespace-nowrap"
            >
              <Bell className="w-4 h-4 shrink-0" />
              {unreadNotificationsCount > 0 && (
                <span className="font-mono text-[11px] font-semibold text-[#B42318] dark:text-red-400 tabular-nums">
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
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded border border-[#DCE5EC] dark:border-[#213D5B] text-xs font-medium text-[#617384] dark:text-slate-300 hover:text-[#B42318] transition-colors whitespace-nowrap"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 overflow-x-hidden">{children}</main>
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
              className="pointer-events-auto bg-white dark:bg-[#10243A] border border-[#DCE5EC] dark:border-[#213D5B] shadow-md rounded-lg p-3.5 flex items-start justify-between gap-3"
            >
              <div className="space-y-0.5">
                <div className="text-xs font-semibold text-[#172B3A] dark:text-white">{t.title}</div>
                {t.description && (
                  <div className="text-xs text-[#617384] dark:text-slate-300">{t.description}</div>
                )}
              </div>
              <button
                type="button"
                onClick={() => dismissToast(t.id)}
                aria-label="Close notification"
                className="text-slate-400 hover:text-slate-600"
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

