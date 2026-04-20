import { ArrowLeftRight } from 'lucide-react'
import type { AnalysisResult, DiffLine } from '@/lib/types'
import { cn } from '@/lib/utils'

interface DiffPanelProps {
  result: AnalysisResult
}

export function DiffPanel({ result }: DiffPanelProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
      {/* 헤더 */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 border-b border-slate-200">
        <ArrowLeftRight className="w-3.5 h-3.5 text-slate-600" />
        <span className="text-xs font-semibold text-slate-600">Before / After 비교</span>
        <div className="ml-auto flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1.5 text-red-500">
            <span className="w-2 h-2 rounded-sm bg-red-100 border border-red-300" />
            제거
          </span>
          <span className="flex items-center gap-1.5 text-emerald-600">
            <span className="w-2 h-2 rounded-sm bg-emerald-100 border border-emerald-300" />
            추가
          </span>
        </div>
      </div>

      {/* Diff 라인 */}
      <div className="p-4 overflow-x-auto">
        <div className="font-mono text-xs leading-6 min-w-max">
          {result.diff.map((line, i) => (
            <DiffLineRow key={i} line={line} />
          ))}
        </div>
      </div>
    </div>
  )
}

function DiffLineRow({ line }: { line: DiffLine }) {
  const configs: Record<DiffLine['type'], {
    bg: string; border: string; prefix: string; prefixColor: string; textColor: string
  }> = {
    removed: {
      bg: 'bg-red-50',
      border: 'border-l-2 border-red-400',
      prefix: '-',
      prefixColor: 'text-red-500',
      textColor: 'text-red-700',
    },
    added: {
      bg: 'bg-emerald-50',
      border: 'border-l-2 border-emerald-400',
      prefix: '+',
      prefixColor: 'text-emerald-600',
      textColor: 'text-emerald-700',
    },
    unchanged: {
      bg: '',
      border: 'border-l-2 border-transparent',
      prefix: ' ',
      prefixColor: 'text-slate-700',
      textColor: 'text-slate-600',
    },
  }

  const c = configs[line.type]
  return (
    <div className={cn('flex items-center gap-3 px-3 py-0.5 rounded-sm', c.bg, c.border)}>
      <span className={cn('w-4 text-center select-none flex-shrink-0 font-bold', c.prefixColor)}>
        {c.prefix}
      </span>
      <span className={cn('select-all whitespace-pre', c.textColor)}>{line.content}</span>
    </div>
  )
}
