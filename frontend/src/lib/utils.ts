import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { Severity, AnalysisStatus } from './types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getSeverityLabel(severity: Severity): string {
  const labels: Record<Severity, string> = {
    critical: '심각',
    high: '높음',
    medium: '중간',
    low: '낮음',
  }
  return labels[severity]
}

export function getSeverityColors(severity: Severity) {
  const map: Record<Severity, { text: string; bg: string; border: string; dot: string }> = {
    critical: {
      text: 'text-red-600',
      bg: 'bg-red-50',
      border: 'border-red-200',
      dot: 'bg-red-500',
    },
    high: {
      text: 'text-orange-600',
      bg: 'bg-orange-50',
      border: 'border-orange-200',
      dot: 'bg-orange-500',
    },
    medium: {
      text: 'text-amber-600',
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      dot: 'bg-amber-500',
    },
    low: {
      text: 'text-sky-600',
      bg: 'bg-sky-50',
      border: 'border-sky-200',
      dot: 'bg-sky-500',
    },
  }
  return map[severity]
}

export function getStatusColors(status: AnalysisStatus) {
  if (status === 'vulnerable') {
    return { text: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' }
  }
  return { text: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' }
}

export function formatConfidence(value: number): string {
  return `${value.toFixed(1)}%`
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}
