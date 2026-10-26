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
    <div className="inline-flex items-center gap-2.5 select-none shrink-0">
      <svg
        width="32"
        height="32"
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="shrink-0"
      >
        <rect width="36" height="36" rx="8" fill="#10243A" />
        <rect x="1" y="1" width="34" height="34" rx="7" stroke="#27A6A1" strokeOpacity="0.45" />
        {/* Connected Evidence Mesh Edges */}
        <path
          d="M11 11L25 11M11 11L11 25M11 11L25 25M25 11L25 25M11 25L25 25M18 18L25 11M18 18L11 25"
          stroke="#27A6A1"
          strokeWidth="1.75"
          strokeLinecap="round"
        />
        {/* Evidence Nodes */}
        <circle cx="11" cy="11" r="3.2" fill="#FFFFFF" stroke="#087F8C" strokeWidth="1.5" />
        <circle cx="25" cy="11" r="3.2" fill="#27A6A1" />
        <circle cx="18" cy="18" r="3.8" fill="#087F8C" stroke="#FFFFFF" strokeWidth="1.5" />
        <circle cx="11" cy="25" r="3.2" fill="#27A6A1" />
        <circle cx="25" cy="25" r="3.2" fill="#FFFFFF" stroke="#087F8C" strokeWidth="1.5" />
      </svg>
      {!compact && (
        <span
          className={`font-display font-bold tracking-tight text-base whitespace-nowrap ${
            lightText ? 'text-white' : 'text-[#10243A] dark:text-white'
          }`}
        >
          PROOFMESH AI
        </span>
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
  let colorClass = 'text-[#2563EB] dark:text-blue-400';

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
    colorClass = 'text-[#B42318] dark:text-red-400';
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
    colorClass = 'text-[#B7791F] dark:text-amber-400';
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
    colorClass = 'text-[#18794E] dark:text-emerald-400';
  } else if (variant === 'info' || s.includes('processing') || s.includes('queued') || s.includes('draft')) {
    Icon = Clock;
    colorClass = 'text-[#087F8C] dark:text-teal-300';
  } else if (variant === 'neutral' || s.includes('medium') || s.includes('low')) {
    Icon = FileWarning;
    colorClass = 'text-[#617384] dark:text-slate-300';
  } else {
    Icon = HelpCircle;
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium ${
        size === 'sm' ? 'text-xs' : 'text-sm'
      } ${colorClass}`}
    >
      <Icon className={size === 'sm' ? 'w-3.5 h-3.5 shrink-0' : 'w-4 h-4 shrink-0'} aria-hidden="true" />
      <span>{displayText}</span>
    </span>
  );
};
