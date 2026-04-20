import type { AnalysisResult } from '@/lib/types'
import { StatusBadge, SeverityBadge, TypeBadge } from '@/components/ui/Badge'
import { formatConfidence, formatDate } from '@/lib/utils'
import { Clock } from 'lucide-react'

interface ResultHeaderProps {
  result: AnalysisResult
}

export function ResultHeader({ result }: ResultHeaderProps) {
  const conf = result.confidence
  const confidenceColor =
    conf >= 85 ? 'text-red-600' :
    conf >= 65 ? 'text-amber-600' : 'text-sky-600'

  const barColor =
    conf >= 85 ? 'from-red-500 to-red-400' :
    conf >= 65 ? 'from-amber-500 to-amber-400' : 'from-sky-500 to-sky-400'

  return (
    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
      {/* 배지 영역 */}
      <div className="flex flex-wrap items-center gap-2 px-5 py-4 border-b border-slate-100">
        <StatusBadge status={result.status} />
        <SeverityBadge severity={result.severity} />
        <TypeBadge code={result.vulnerabilityType.code} />

        {result.functionName && (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-mono
            bg-slate-50 text-slate-600 border border-slate-200">
            fn: {result.functionName}()
          </span>
        )}

        <div className="ml-auto flex items-center gap-1.5 text-slate-600 text-xs">
          <Clock className="w-3 h-3" />
          <span>{formatDate(result.analyzedAt)}</span>
        </div>
      </div>

      {/* 신뢰도 영역 */}
      <div className="px-5 py-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-slate-600">신뢰도</span>
          <span className={`text-2xl font-bold font-mono leading-none ${confidenceColor}`}>
            {formatConfidence(conf)}
          </span>
        </div>
        <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
          <div
            className={`h-full rounded-full bg-gradient-to-r ${barColor} transition-all duration-700`}
            style={{ width: `${conf}%` }}
          />
        </div>
        <div className="flex justify-between mt-1.5 text-[10px] text-slate-700">
          <span>낮음</span>
          <span>높음</span>
        </div>
      </div>
    </div>
  )
}
