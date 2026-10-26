import React from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileWarning,
  Info,
  ShieldAlert,
  HelpCircle,
} from 'lucide-react';

export const ProofMeshLogo: React.FC<{ compact?: boolean; lightText?: boolean }> = ({
  compact = false,
  lightText = false,
}) => {
  return (
    <div className="inline-flex items-center gap-2.5 select-none shrink-0 group">
      <svg
        width="34"
        height="34"
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="shrink-0 transition-transform duration-200 group-hover:scale-105"
      >
        <defs>
          <linearGradient id="pmBrandGrad" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#1E3A8A" />
            <stop offset="55%" stopColor="#0F4C81" />
            <stop offset="100%" stopColor="#0D9488" />
          </linearGradient>
        </defs>
        <rect width="36" height="36" rx="9" fill="url(#pmBrandGrad)" />
        <rect x="1" y="1" width="34" height="34" rx="8" stroke="#FFFFFF" strokeOpacity="0.22" />
        {/* Connected Evidence Mesh Edges */}
        <path
          d="M11 11L25 11M11 11L11 25M11 11L25 25M25 11L25 25M11 25L25 25M18 18L25 11M18 18L11 25"
          stroke="#5EEAD4"
          strokeWidth="1.75"
          strokeLinecap="round"
        />
        {/* Evidence Nodes */}
        <circle cx="11" cy="11" r="3.2" fill="#FFFFFF" stroke="#0D9488" strokeWidth="1.5" />
        <circle cx="25" cy="11" r="3.2" fill="#5EEAD4" />
        <circle cx="18" cy="18" r="3.8" fill="#0D9488" stroke="#FFFFFF" strokeWidth="1.5" />
        <circle cx="11" cy="25" r="3.2" fill="#5EEAD4" />
        <circle cx="25" cy="25" r="3.2" fill="#FFFFFF" stroke="#0D9488" strokeWidth="1.5" />
      </svg>
      {!compact && (
        <div className="flex flex-col leading-none">
          <span
            className={`font-display font-extrabold tracking-tight text-[15px] whitespace-nowrap ${
              lightText ? 'text-white' : 'text-[#0F172A]'
            }`}
          >
            PROOFMESH <span className="text-[#0D9488]">AI</span>
          </span>
          <span
            className={`font-mono text-[9px] font-semibold tracking-widest uppercase mt-0.5 ${
              lightText ? 'text-teal-200' : 'text-[#64748B]'
            }`}
          >
            Regulatory Intelligence
          </span>
        </div>
      )}
    </div>
  );
};

export const StatusIndicator: React.FC<{
  status?: string;
  label?: string;
  variant?: 'critical' | 'warning' | 'success' | 'info' | 'neutral';
  size?: 'sm' | 'md';
}> = ({ status, label, variant, size = 'sm' }) => {
  const displayText = label || status || 'Status';
  const s = displayText.toLowerCase();
  let Icon = Info;
  let pillClass = 'bg-blue-50 text-blue-700 border-blue-200';

  if (
    variant === 'critical' ||
    s.includes('critical') ||
    s.includes('mismatch') ||
    s.includes('expired') ||
    s.includes('missing') ||
    s.includes('failed') ||
    s.includes('discrepancy') ||
    s.includes('conflict') ||
    s.includes('non-compliant') ||
    s.includes('contradicted')
  ) {
    Icon = ShieldAlert;
    pillClass = 'bg-rose-50 text-rose-700 border-rose-200';
  } else if (
    variant === 'warning' ||
    s.includes('high') ||
    s.includes('warning') ||
    s.includes('awaiting') ||
    s.includes('pending') ||
    s.includes('requires') ||
    s.includes('unavailable') ||
    s.includes('incomplete') ||
    s.includes('unresolved') ||
    s.includes('partially')
  ) {
    Icon = AlertTriangle;
    pillClass = 'bg-amber-50 text-amber-800 border-amber-200';
  } else if (
    variant === 'success' ||
    s.includes('completed') ||
    s.includes('verified') ||
    s.includes('present') ||
    s.includes('accepted') ||
    s.includes('active') ||
    s.includes('approved') ||
    s.includes('confirmed') ||
    s.includes('no discrepancy') ||
    s.includes('no material') ||
    s.includes('cleared')
  ) {
    Icon = CheckCircle2;
    pillClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  } else if (variant === 'info' || s.includes('processing') || s.includes('queued') || s.includes('draft')) {
    Icon = Clock;
    pillClass = 'bg-teal-50 text-teal-700 border-teal-200';
  } else if (variant === 'neutral' || s.includes('medium') || s.includes('low')) {
    Icon = FileWarning;
    pillClass = 'bg-slate-100 text-slate-700 border-slate-200';
  } else {
    Icon = HelpCircle;
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-semibold px-2.5 py-0.5 rounded-md border ${
        size === 'sm' ? 'text-[11px]' : 'text-xs'
      } ${pillClass}`}
    >
      <Icon className={size === 'sm' ? 'w-3.5 h-3.5 shrink-0' : 'w-4 h-4 shrink-0'} aria-hidden="true" />
      <span>{displayText}</span>
    </span>
  );
};
