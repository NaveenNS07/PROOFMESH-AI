import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle2,
  FileSearch,
  Lock,
  Network,
  Scale,
  Search,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import { ProofMeshLogo, StatusIndicator } from '../components/ProofMeshLogo';
import { useApp } from '../context/AppContext';
import { InstitutionRecord, UserRole } from '../types/domain';
import { signInWithGooglePopup } from '../lib/firebase';

// ============================================================================
// PAGE 1: PROFESSIONAL LANDING PAGE (Route: /)
// ============================================================================
export const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-[#F4F7FA] text-[#172B3A]">
      {/* Strict 3-Zone Top Bar Contract */}
      <header className="flex items-center justify-between gap-8 px-6 lg:px-12 py-4 bg-white border-b border-[#DCE5EC]">
        {/* Zone 1: Single wordmark */}
        <Link to="/" className="font-display text-lg font-bold tracking-tight text-[#10243A] whitespace-nowrap shrink-0">
          PROOFMESH AI
        </Link>

        {/* Zone 2: 4 concise single-line text links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-[#617384]">
          <a href="#capabilities" className="hover:text-[#10243A] transition-colors whitespace-nowrap shrink-0">
            Capabilities
          </a>
          <a href="#workflow" className="hover:text-[#10243A] transition-colors whitespace-nowrap shrink-0">
            Workflow
          </a>
          <a href="#accountability" className="hover:text-[#10243A] transition-colors whitespace-nowrap shrink-0">
            Security
          </a>
          <Link to="/public/verify" className="hover:text-[#10243A] transition-colors whitespace-nowrap shrink-0">
            Public Verification
          </Link>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 text-xs font-medium text-white bg-[#10243A] rounded-lg hover:bg-[#183B56] transition-colors whitespace-nowrap shrink-0"
          >
            Open Regulatory Workspace
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-white border-b border-[#DCE5EC] py-16 lg:py-20 px-6 lg:px-12">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-stretch">
          <div className="lg:col-span-7 flex flex-col justify-center space-y-6">
            <div className="text-xs font-medium text-[#087F8C] tracking-normal">
              Independent Prototype · Problem Statement ID: 26261 · Every Claim. Connected to Evidence.
            </div>
            <h1
              className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-[#10243A] leading-tight"
              style={{ textWrap: 'balance' }}
            >
              Regulatory Intelligence. Grounded in Evidence.
            </h1>
            <p className="text-base text-[#617384] leading-relaxed max-w-2xl">
              An AI-assisted regulatory case-management, document authentication, and compliance verification platform designed to connect institutional claims, extracted document fields, historical snapshots, and versioned regulatory rules—while preserving human authority over every decision.
            </p>
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-[#087F8C] hover:bg-[#10243A] rounded-lg transition-colors whitespace-nowrap"
              >
                <span>Open Regulatory Workspace</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <a
                href="#workflow"
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-[#10243A] bg-[#F4F7FA] hover:bg-[#DCE5EC]/60 border border-[#DCE5EC] rounded-lg transition-colors whitespace-nowrap"
              >
                Explore How It Works
              </a>
              <Link
                to="/login"
                className="text-sm font-medium text-[#617384] hover:text-[#10243A] underline underline-offset-4 px-2 whitespace-nowrap"
              >
                Switch Role / Demo Login
              </Link>
            </div>
          </div>

          {/* Right Panel: Live Claim-to-Evidence Preview Card */}
          <div className="lg:col-span-5 bg-[#F4F7FA] border border-[#DCE5EC] rounded-xl p-6 flex flex-col justify-between space-y-5">
            <div className="flex items-center justify-between border-b border-[#DCE5EC] pb-3">
              <div>
                <div className="text-xs font-semibold text-[#10243A]">
                  Claim-to-Evidence Traceability Sample
                </div>
                <div className="text-xs text-[#617384]">
                  Case APP-DEMO-2026-001 · Meridian Institute of Technology
                </div>
              </div>
              <span className="font-mono text-xs text-[#087F8C]">RUL-FAC-CADRE-05 (v1.2)</span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-white border border-[#DCE5EC] rounded-lg p-3 space-y-1">
                <div className="text-[#617384]">Institutional Claim (Section 2)</div>
                <div className="font-mono font-semibold text-[#172B3A]">
                  Regular Faculty Count Claimed = 48
                </div>
              </div>
              <div className="bg-white border border-[#DCE5EC] rounded-lg p-3 space-y-1">
                <div className="text-[#617384]">Extracted Evidence (faculty_cadre_statement_2026.pdf · Page 4)</div>
                <div className="font-mono font-semibold text-[#B42318]">
                  Certified Summary Table Total = 45 (Confidence: 95%)
                </div>
              </div>
              <div className="bg-white border border-[#DCE5EC] rounded-lg p-3 space-y-1">
                <div className="text-[#617384]">Recommended Reviewer Next Action</div>
                <div className="text-[#172B3A]">
                  Examine Page 4 discrepancy in Split-Screen Viewer and issue an Additional Evidence Request if required.
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-[#DCE5EC] flex items-center justify-between text-xs text-[#617384]">
              <span>Synthetic Demonstration Data</span>
              <Link to="/evidence-graph" className="font-semibold text-[#087F8C] hover:underline">
                Inspect Full Evidence Graph →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Four Capability Sections */}
      <section id="capabilities" className="py-16 px-6 lg:px-12 max-w-7xl mx-auto w-full space-y-10">
        <div className="space-y-2 max-w-2xl">
          <h2 className="font-display text-2xl font-bold text-[#10243A]">
            Core Regulatory Intelligence Capabilities
          </h2>
          <p className="text-sm text-[#617384]">
            Every automated check links directly to source pages, versioned rules, and human reviewer controls.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white border border-[#DCE5EC] rounded-xl p-6 space-y-3">
            <FileSearch className="w-6 h-6 text-[#087F8C]" />
            <h3 className="font-display text-base font-semibold text-[#10243A]">
              01. Intelligent Document Understanding
            </h3>
            <p className="text-xs text-[#617384] leading-relaxed">
              Classifies supporting uploads, extracts structured dates and identifiers with page and bounding-box coordinates, and routes low-confidence OCR scans for human confirmation without guessing missing values.
            </p>
          </div>

          <div className="bg-white border border-[#DCE5EC] rounded-xl p-6 space-y-3">
            <Network className="w-6 h-6 text-[#087F8C]" />
            <h3 className="font-display text-base font-semibold text-[#10243A]">
              02. Evidence-Linked Validation
            </h3>
            <p className="text-xs text-[#617384] leading-relaxed">
              Executes deterministic completeness, expiry, SHA-256 byte-duplicate, and cross-document consistency checks—connecting every finding in an interactive Claim-to-Evidence Graph.
            </p>
          </div>

          <div className="bg-white border border-[#DCE5EC] rounded-xl p-6 space-y-3">
            <ShieldCheck className="w-6 h-6 text-[#087F8C]" />
            <h3 className="font-display text-base font-semibold text-[#10243A]">
              03. Authorized Source Verification
            </h3>
            <p className="text-xs text-[#617384] leading-relaxed">
              Authenticates certificates against supported authority adapters with explicit separation between official verification and clearly labeled simulated demonstration responses.
            </p>
          </div>

          <div className="bg-white border border-[#DCE5EC] rounded-xl p-6 space-y-3">
            <Scale className="w-6 h-6 text-[#087F8C]" />
            <h3 className="font-display text-base font-semibold text-[#10243A]">
              04. Explainable Compliance Assistance
            </h3>
            <p className="text-xs text-[#617384] leading-relaxed">
              Evaluates configurable, version-controlled regulatory rules and compares multi-year historical snapshots while keeping statutory authority strictly in human hands.
            </p>
          </div>
        </div>
      </section>

      {/* Process Visualization */}
      <section id="workflow" className="bg-white border-y border-[#DCE5EC] py-16 px-6 lg:px-12">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="space-y-2">
            <h2 className="font-display text-2xl font-bold text-[#10243A]">
              End-to-End Traceable Scrutiny Pipeline
            </h2>
            <p className="text-sm text-[#617384]">
              Application → Evidence Extraction → Validation → Verification → Human Review
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {[
              {
                step: 'Stage 01',
                title: 'Application Intake',
                desc: 'Institution submits application and category-specific supporting documents.',
              },
              {
                step: 'Stage 02',
                title: 'Evidence Extraction',
                desc: 'OCR & classification extract structured fields, page references, and confidence scores.',
              },
              {
                step: 'Stage 03',
                title: 'Rule Validation',
                desc: 'Deterministic engine checks completeness, expiry, duplicates, and cross-document consistency.',
              },
              {
                step: 'Stage 04',
                title: 'Source Verification',
                desc: 'Queries configured authority adapters or routes unavailable sources to manual confirmation.',
              },
              {
                step: 'Stage 05',
                title: 'Human Review',
                desc: 'Authorized officer inspects evidence, requests clarifications, and records auditable actions.',
              },
            ].map((item) => (
              <div key={item.step} className="bg-[#F4F7FA] border border-[#DCE5EC] rounded-lg p-4 space-y-2">
                <div className="font-mono text-xs font-semibold text-[#087F8C]">{item.step}</div>
                <div className="font-display text-sm font-bold text-[#10243A]">{item.title}</div>
                <p className="text-xs text-[#617384] leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security & Accountability + Public Verification Overview */}
      <section id="accountability" className="py-16 px-6 lg:px-12 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white border border-[#DCE5EC] rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2.5">
            <Lock className="w-5 h-5 text-[#10243A]" />
            <h3 className="font-display text-lg font-bold text-[#10243A]">
              Security, Role Isolation & Tamper-Evident Accountability
            </h3>
          </div>
          <p className="text-xs text-[#617384] leading-relaxed">
            Enforces backend role-based access control across 5 distinct roles, isolates institutional records so applicants never view other institutions&apos; confidential submissions, treats document text as untrusted input against prompt injection, and records every state transition in an append-only SHA-256 hash-chained audit trail.
          </p>
          <div className="pt-2">
            <Link
              to="/audit"
              className="text-xs font-semibold text-[#087F8C] hover:underline"
            >
              View Append-Only Audit Trail Architecture →
            </Link>
          </div>
        </div>

        <div className="bg-white border border-[#DCE5EC] rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2.5">
            <Search className="w-5 h-5 text-[#087F8C]" />
            <h3 className="font-display text-lg font-bold text-[#10243A]">
              Public Institution Verification Directory
            </h3>
          </div>
          <p className="text-xs text-[#617384] leading-relaxed">
            Provides students, parents, and citizens with a transparent search interface for published institutional approval statuses, approved programmes, and intake records—without exposing confidential application files or internal scrutiny notes.
          </p>
          <div className="pt-2">
            <Link
              to="/public/verify"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#10243A] hover:bg-[#183B56] rounded-lg transition-colors"
            >
              <span>Open Public Institution Verification</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer with Disclaimer */}
      <footer className="mt-auto bg-[#10243A] text-slate-300 py-8 px-6 lg:px-12 border-t border-[#183B56]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-6 text-xs">
          <div className="space-y-1.5">
            <ProofMeshLogo lightText />
            <p className="text-slate-400 max-w-2xl">
              Independent Regulatory Intelligence Prototype developed for Problem Statement ID 26261. All institutional records, certificates, and verification responses in this demonstration environment are synthetic and labeled &ldquo;SYNTHETIC DEMONSTRATION DATA — NOT AN OFFICIAL AICTE RECORD&rdquo;.
            </p>
          </div>
          <div className="flex flex-wrap gap-5 text-slate-300 shrink-0">
            <Link to="/login" className="hover:text-white">
              Officer Login
            </Link>
            <Link to="/public/verify" className="hover:text-white">
              Public Search
            </Link>
            <Link to="/dashboard" className="hover:text-white">
              Workspace
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

// ============================================================================
// PAGE 2: LOGIN, REGISTRATION & PASSWORD RECOVERY (/login, /register, /forgot-password)
// ============================================================================
export const AuthPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { demoAccounts, switchUserByEmailOrRole, addToast, apiFetch } = useApp();

  const mode: 'login' | 'register' | 'forgot' = location.pathname.includes('register')
    ? 'register'
    : location.pathname.includes('forgot')
    ? 'forgot'
    : 'login';

  const [email, setEmail] = useState('officer@proofmesh-demo.gov.in');
  const [password, setPassword] = useState('DemoOfficer#2026');
  const [fullName, setFullName] = useState('');
  const [institutionName, setInstitutionName] = useState('Meridian Institute of Technology');
  const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.INSTITUTION_COMPLIANCE_OFFICER);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [recoverySent, setRecoverySent] = useState(false);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (mode === 'forgot') {
      if (!email.trim() || !email.includes('@')) {
        setErrorMsg('Please enter a valid institutional or official email address.');
        return;
      }
      setRecoverySent(true);
      addToast({
        title: 'Password Recovery Initiated',
        description: `Instructions logged for ${email} in demo workspace.`,
        variant: 'info',
      });
      return;
    }

    if (mode === 'register') {
      if (!fullName.trim() || !email.trim() || !password.trim()) {
        setErrorMsg('Full Name, Email, and Password are required.');
        return;
      }
      setLoading(true);
      try {
        await apiFetch('/api/v1/auth/register', {
          method: 'POST',
          body: JSON.stringify({
            fullName,
            email,
            password,
            role: selectedRole,
            institutionName,
          }),
        });
        await switchUserByEmailOrRole(email);
        navigate(selectedRole === UserRole.PUBLIC_USER ? '/public/verify' : '/dashboard');
      } catch (err: any) {
        setErrorMsg(err.message || 'Registration failed.');
      } finally {
        setLoading(false);
      }
      return;
    }

    // Login mode
    if (!email.trim() || !password.trim()) {
      setErrorMsg('Please enter both your email address and password.');
      return;
    }
    setLoading(true);
    const user = await switchUserByEmailOrRole(email.trim());
    setLoading(false);
    if (!user) {
      setErrorMsg('Unrecognized email address. Select one of the labeled Demo Role Accounts below.');
      return;
    }
    if (user.role === UserRole.PUBLIC_USER) {
      navigate('/public/verify');
    } else {
      navigate('/dashboard');
    }
  };

  const handleQuickDemoRole = async (demoEmail: string, role: UserRole) => {
    setEmail(demoEmail);
    setLoading(true);
    const user = await switchUserByEmailOrRole(demoEmail, role);
    setLoading(false);
    if (user) {
      navigate(user.role === UserRole.PUBLIC_USER ? '/public/verify' : '/dashboard');
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      const fbUser = await signInWithGooglePopup();
      if (fbUser) {
        await switchUserByEmailOrRole('admin@proofmesh-demo.gov.in', UserRole.REGULATORY_ADMIN);
        navigate('/dashboard');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Google Sign-In popup was closed or blocked.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F7FA] flex flex-col justify-between">
      <header className="px-6 lg:px-12 py-4 bg-white border-b border-[#DCE5EC] flex items-center justify-between">
        <Link to="/" className="font-display text-lg font-bold text-[#10243A]">
          PROOFMESH AI
        </Link>
        <Link to="/public/verify" className="text-xs font-medium text-[#087F8C] hover:underline">
          Public Institution Verification →
        </Link>
      </header>

      <div className="max-w-5xl mx-auto w-full py-10 px-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Form */}
        <div className="lg:col-span-6 bg-white border border-[#DCE5EC] rounded-xl p-6 space-y-5">
          <div className="space-y-1">
            <h1 className="font-display text-xl font-bold text-[#10243A]">
              {mode === 'login'
                ? 'Sign In to Regulatory Workspace'
                : mode === 'register'
                ? 'Register Permitted Account'
                : 'Reset Workspace Password'}
            </h1>
            <p className="text-xs text-[#617384]">
              Role-scoped access control enforced on backend APIs and Firestore security rules.
            </p>
          </div>

          {errorMsg && (
            <div role="alert" className="p-3 rounded bg-red-50 border border-red-200 text-xs text-[#B42318]">
              {errorMsg}
            </div>
          )}

          {recoverySent && mode === 'forgot' && (
            <div className="p-3 rounded bg-emerald-50 border border-emerald-200 text-xs text-[#18794E]">
              Recovery link recorded for <span className="font-mono">{email}</span>. In demonstration mode, you may sign in directly using any role card on the right.
            </div>
          )}

          <form onSubmit={handleFormSubmit} className="space-y-4">
            {mode === 'register' && (
              <>
                <div>
                  <label htmlFor="auth-fullname" className="block text-xs font-medium text-[#172B3A] mb-1">
                    Full Name
                  </label>
                  <input
                    id="auth-fullname"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g., Dr. Ananya Sharma"
                    className="w-full px-3 py-2 text-xs border border-[#DCE5EC] rounded focus:outline-none focus:border-[#087F8C]"
                  />
                </div>
                <div>
                  <label htmlFor="auth-role" className="block text-xs font-medium text-[#172B3A] mb-1">
                    Permitted Account Type
                  </label>
                  <select
                    id="auth-role"
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 text-xs border border-[#DCE5EC] rounded focus:outline-none focus:border-[#087F8C]"
                  >
                    <option value={UserRole.INSTITUTION_COMPLIANCE_OFFICER}>
                      Institution Compliance Officer (Applicant Scope)
                    </option>
                    <option value={UserRole.PUBLIC_USER}>Public User (Public Verification Only)</option>
                  </select>
                </div>
                {selectedRole === UserRole.INSTITUTION_COMPLIANCE_OFFICER && (
                  <div>
                    <label htmlFor="auth-inst" className="block text-xs font-medium text-[#172B3A] mb-1">
                      Institution Name
                    </label>
                    <input
                      id="auth-inst"
                      type="text"
                      value={institutionName}
                      onChange={(e) => setInstitutionName(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-[#DCE5EC] rounded focus:outline-none focus:border-[#087F8C]"
                    />
                  </div>
                )}
              </>
            )}

            <div>
              <label htmlFor="auth-email" className="block text-xs font-medium text-[#172B3A] mb-1">
                Official Email Address
              </label>
              <input
                id="auth-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-[#DCE5EC] rounded font-mono focus:outline-none focus:border-[#087F8C]"
              />
            </div>

            {mode !== 'forgot' && (
              <div>
                <label htmlFor="auth-password" className="block text-xs font-medium text-[#172B3A] mb-1">
                  Password
                </label>
                <input
                  id="auth-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-[#DCE5EC] rounded font-mono focus:outline-none focus:border-[#087F8C]"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-[#10243A] hover:bg-[#183B56] text-white text-xs font-semibold rounded transition-colors"
            >
              {loading
                ? 'Authenticating...'
                : mode === 'login'
                ? 'Sign In to Workspace'
                : mode === 'register'
                ? 'Create Account'
                : 'Send Password Reset Instructions'}
            </button>
          </form>

          {mode === 'login' && (
            <div className="pt-2 border-t border-[#DCE5EC] space-y-2">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                className="w-full py-2 px-4 bg-[#F4F7FA] hover:bg-[#DCE5EC]/60 border border-[#DCE5EC] text-[#172B3A] text-xs font-medium rounded transition-colors"
              >
                Sign In with Google (Firebase Auth)
              </button>
            </div>
          )}

          <div className="flex items-center justify-between text-xs text-[#617384] pt-2">
            {mode !== 'login' ? (
              <Link to="/login" className="text-[#087F8C] hover:underline">
                ← Back to Sign In
              </Link>
            ) : (
              <Link to="/forgot-password" className="hover:underline">
                Forgot password?
              </Link>
            )}
            {mode !== 'register' && (
              <Link to="/register" className="text-[#087F8C] hover:underline">
                Register Institution Account →
              </Link>
            )}
          </div>
        </div>

        {/* Right: Clearly Labeled Demo Accounts for All 5 Roles */}
        <div className="lg:col-span-6 bg-white border border-[#DCE5EC] rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-[#087F8C]" />
            <h2 className="font-display text-sm font-bold text-[#10243A]">
              Clearly Labeled Prototype Demo Accounts (5 Roles)
            </h2>
          </div>
          <p className="text-xs text-[#617384]">
            Click any role below to immediately enter the workspace with that role&apos;s permissions and institutional data scope.
          </p>

          <div className="space-y-2.5">
            {demoAccounts.map((acc) => (
              <div
                key={acc.id}
                className="p-3 rounded-lg border border-[#DCE5EC] bg-[#F4F7FA] flex items-center justify-between gap-3"
              >
                <div className="min-w-0 space-y-0.5">
                  <div className="text-xs font-semibold text-[#10243A] truncate">
                    {acc.fullName} · <span className="font-mono text-[#087F8C]">{acc.role}</span>
                  </div>
                  <div className="text-[11px] text-[#617384] truncate">
                    {acc.email} · {acc.department}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleQuickDemoRole(acc.email, acc.role)}
                  className="px-3 py-1.5 bg-[#10243A] hover:bg-[#087F8C] text-white text-xs font-medium rounded shrink-0 transition-colors"
                >
                  Use Role
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <footer className="py-4 px-6 text-center text-xs text-[#617384] border-t border-[#DCE5EC] bg-white">
        SYNTHETIC DEMONSTRATION DATA — NOT AN OFFICIAL AICTE RECORD
      </footer>
    </div>
  );
};

// ============================================================================
// PAGE 21: PUBLIC INSTITUTION VERIFICATION (/public/verify)
// ============================================================================
export const PublicVerifyPage: React.FC = () => {
  const { apiFetch } = useApp();
  const [query, setQuery] = useState('');
  const [stateFilter, setStateFilter] = useState('ALL');
  const [programmeFilter, setProgrammeFilter] = useState('');
  const [institutions, setInstitutions] = useState<InstitutionRecord[]>([]);
  const [disclaimer, setDisclaimer] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchPublicRecords = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query.trim()) params.set('query', query.trim());
      if (stateFilter !== 'ALL') params.set('state', stateFilter);
      if (programmeFilter.trim()) params.set('programme', programmeFilter.trim());
      const data = await apiFetch<{ institutions: InstitutionRecord[]; disclaimer: string }>(
        `/api/v1/public/institutions?${params.toString()}`
      );
      setInstitutions(data.institutions || []);
      setDisclaimer(data.disclaimer || '');
    } catch {
      setInstitutions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPublicRecords();
  }, [stateFilter]);

  return (
    <div className="min-h-screen bg-[#F4F7FA] text-[#172B3A] flex flex-col">
      <header className="px-6 lg:px-12 py-4 bg-white border-b border-[#DCE5EC] flex items-center justify-between gap-6">
        <Link to="/" className="font-display text-lg font-bold text-[#10243A] whitespace-nowrap">
          PROOFMESH AI
        </Link>
        <div className="flex items-center gap-4 text-xs font-medium">
          <Link to="/" className="text-[#617384] hover:text-[#10243A]">
            Overview
          </Link>
          <Link
            to="/dashboard"
            className="px-3.5 py-2 bg-[#10243A] text-white rounded hover:bg-[#183B56] transition-colors"
          >
            Official Workspace
          </Link>
        </div>
      </header>

      <div className="bg-[#183B56] text-white py-2 px-6 lg:px-12 text-xs font-mono">
        PUBLIC INSTITUTION VERIFICATION PORTAL · SYNTHETIC DEMONSTRATION DATA — NOT AN OFFICIAL AICTE RECORD
      </div>

      <main className="max-w-7xl mx-auto w-full py-8 px-6 lg:px-12 space-y-6 flex-1">
        <div className="space-y-2">
          <h1 className="font-display text-2xl font-bold text-[#10243A]">
            Public Institution Approval & Programme Verification
          </h1>
          <p className="text-xs text-[#617384] max-w-3xl">
            Search published institutional records by Institution Name, Identifier, State, District, or Programme. Confidential applications, internal scrutiny notes, and private documents are strictly excluded from public access.
          </p>
        </div>

        {/* Search & Filter Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            fetchPublicRecords();
          }}
          className="bg-white border border-[#DCE5EC] rounded-xl p-4 grid grid-cols-1 md:grid-cols-12 gap-3 items-end"
        >
          <div className="md:col-span-5">
            <label htmlFor="pub-search" className="block text-xs font-medium text-[#172B3A] mb-1">
              Institution Name, ID, or District
            </label>
            <input
              id="pub-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g., Meridian, INST-DEMO-001, Bengaluru..."
              className="w-full px-3 py-2 text-xs border border-[#DCE5EC] rounded focus:outline-none focus:border-[#087F8C]"
            />
          </div>
          <div className="md:col-span-3">
            <label htmlFor="pub-state" className="block text-xs font-medium text-[#172B3A] mb-1">
              State
            </label>
            <select
              id="pub-state"
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-[#DCE5EC] rounded focus:outline-none focus:border-[#087F8C]"
            >
              <option value="ALL">All States</option>
              <option value="Karnataka">Karnataka</option>
              <option value="Maharashtra">Maharashtra</option>
              <option value="Telangana">Telangana</option>
              <option value="Tamil Nadu">Tamil Nadu</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label htmlFor="pub-prog" className="block text-xs font-medium text-[#172B3A] mb-1">
              Programme
            </label>
            <input
              id="pub-prog"
              type="text"
              value={programmeFilter}
              onChange={(e) => setProgrammeFilter(e.target.value)}
              placeholder="e.g., Computer"
              className="w-full px-3 py-2 text-xs border border-[#DCE5EC] rounded focus:outline-none focus:border-[#087F8C]"
            />
          </div>
          <div className="md:col-span-2">
            <button
              type="submit"
              className="w-full py-2 px-4 bg-[#087F8C] hover:bg-[#10243A] text-white text-xs font-semibold rounded transition-colors"
            >
              Search Directory
            </button>
          </div>
        </form>

        {/* Public Non-Presumptive Notice */}
        <div className="bg-white border border-[#DCE5EC] rounded-lg p-3.5 text-xs text-[#617384] flex items-center justify-between gap-4">
          <span>
            <strong className="text-[#172B3A]">Important Notice:</strong> {disclaimer || 'Never interpret a missing search result as proof that an institution is fraudulent or unapproved.'}
          </span>
          <span className="font-mono text-[11px] shrink-0">{institutions.length} record(s) matched</span>
        </div>

        {/* Results */}
        {loading ? (
          <div className="bg-white border border-[#DCE5EC] rounded-xl p-8 text-center text-xs text-[#617384]">
            Loading published institutional records...
          </div>
        ) : institutions.length === 0 ? (
          <div className="bg-white border border-[#DCE5EC] rounded-xl p-8 text-center space-y-2">
            <div className="text-sm font-semibold text-[#10243A]">
              Not found in available records
            </div>
            <p className="text-xs text-[#617384] max-w-xl mx-auto">
              No published synthetic record matched your search criteria. A missing result does not establish that an institution is unapproved; data may require further confirmation from the issuing authority.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {institutions.map((inst) => (
              <div
                key={inst.id}
                className="bg-white border border-[#DCE5EC] rounded-xl p-5 space-y-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#DCE5EC] pb-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs text-[#617384]">
                      <span className="font-mono font-semibold text-[#087F8C]">{inst.institutionCode}</span>
                      <span>·</span>
                      <span>{inst.type}</span>
                      <span>·</span>
                      <span>
                        {inst.district}, {inst.state}
                      </span>
                    </div>
                    <h2 className="font-display text-lg font-bold text-[#10243A]">{inst.name}</h2>
                  </div>
                  <div className="text-right space-y-1">
                    <StatusIndicator status={inst.publicApprovalStatus} size="sm" />
                    <div className="text-[11px] text-[#617384] font-mono">
                      Academic Period: {inst.academicPeriod}
                    </div>
                  </div>
                </div>

                {/* Approved Programmes Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-[#DCE5EC] text-[#617384]">
                        <th className="py-2 pr-4 font-semibold">Published Programme Name</th>
                        <th className="py-2 px-4 font-semibold">Level</th>
                        <th className="py-2 pl-4 font-semibold text-right">Published Approved Intake</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#DCE5EC]">
                      {inst.approvedProgrammes.map((prog, idx) => (
                        <tr key={idx}>
                          <td className="py-2 pr-4 font-medium text-[#172B3A]">{prog.name}</td>
                          <td className="py-2 px-4 text-[#617384]">{prog.level}</td>
                          <td className="py-2 pl-4 text-right font-mono tabular-nums font-semibold">
                            {prog.approvedIntake} seats
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="pt-2 border-t border-[#DCE5EC] flex flex-wrap items-center justify-between gap-3 text-[11px] text-[#617384]">
                  <div>
                    Source Authority: <strong className="text-[#172B3A]">{inst.sourceAuthority}</strong> · Reference:{' '}
                    <span className="font-mono">{inst.sourceReference}</span>
                  </div>
                  <div className="font-mono">
                    Last Checked: {new Date(inst.lastCheckedTimestamp).toLocaleString()} · {inst.syntheticLabel}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};
