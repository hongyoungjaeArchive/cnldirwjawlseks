import { cn } from '@/lib/utils'
import type { Severity, AnalysisStatus } from '@/lib/types'
import { getSeverityColors, getSeverityLabel, getStatusColors } from '@/lib/utils'

interface SeverityBadgeProps {
  severity: Severity
  className?: string
}

export function SeverityBadge({ severity, className }: SeverityBadgeProps) {
  const colors = getSeverityColors(severity)
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border',
        colors.bg,
        colors.text,
        colors.border,
        className,
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full', colors.dot)} />
      위험도 {getSeverityLabel(severity)}
    </span>
  )
}

interface StatusBadgeProps {
  status: AnalysisStatus
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const colors = getStatusColors(status)
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border',
        colors.bg,
        colors.text,
        colors.border,
        className,
      )}
    >
      <span className={cn(
        'w-1.5 h-1.5 rounded-full',
        status === 'vulnerable' ? 'bg-red-500 animate-pulse' : 'bg-emerald-500',
      )} />
      {status === 'vulnerable' ? '취약' : '정상'}
    </span>
  )
}

interface TypeBadgeProps {
  code: string
  className?: string
}

export function TypeBadge({ code, className }: TypeBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold font-mono',
        'bg-violet-50 text-violet-600 border border-violet-200',
        className,
      )}
    >
      {code}
    </span>
  )
}
