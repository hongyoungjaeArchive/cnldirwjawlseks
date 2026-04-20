import { Database, Cpu, Hash, BarChart3 } from 'lucide-react'
import type { AnalysisResult } from '@/lib/types'
import { cn, getSeverityColors, getSeverityLabel } from '@/lib/utils'

interface DetailPanelProps {
  result: AnalysisResult
}

export function DetailPanel({ result }: DetailPanelProps) {
  const severityColors = getSeverityColors(result.severity)

  return (
    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
      {/* 헤더 */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 border-b border-slate-200">
        <BarChart3 className="w-3.5 h-3.5 text-slate-600" />
        <span className="text-xs font-semibold text-slate-600">세부 분석</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-slate-100">
        {/* 취약 확률 */}
        <DetailCell icon={<BarChart3 className="w-4 h-4 text-slate-600" />} label="취약 확률">
          <ConfidenceBar value={result.confidence} severity={result.severity} />
          <div className="flex items-center gap-2 mt-2">
            <span className={cn('text-xl font-bold font-mono', severityColors.text)}>
              {result.confidence.toFixed(1)}%
            </span>
            <span className={cn(
              'text-xs px-2 py-0.5 rounded-full border',
              severityColors.bg, severityColors.text, severityColors.border,
            )}>
              {getSeverityLabel(result.severity)}
            </span>
          </div>
        </DetailCell>

        {/* 모델 정보 */}
        <DetailCell icon={<Cpu className="w-4 h-4 text-slate-600" />} label="AI 모델">
          <p className="text-sm font-semibold text-slate-700 font-mono">{result.modelInfo.name}</p>
          <p className="text-xs text-slate-600 mt-0.5">v{result.modelInfo.version}</p>
        </DetailCell>

        {/* 학습 데이터셋 */}
        <DetailCell icon={<Database className="w-4 h-4 text-slate-600" />} label="학습 데이터셋">
          <p className="text-sm font-semibold text-slate-700">{result.modelInfo.dataset}</p>
          <p className="text-xs text-slate-600 mt-0.5">Fine-tuned CodeBERT</p>
        </DetailCell>

        {/* CWE */}
        <DetailCell icon={<Hash className="w-4 h-4 text-slate-600" />} label="CWE 분류">
          <p className="text-sm font-bold text-violet-600 font-mono">
            {result.vulnerabilityType.cweId}
          </p>
          <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
            {result.vulnerabilityType.cweName.length > 50
              ? result.vulnerabilityType.cweName.slice(0, 50) + '…'
              : result.vulnerabilityType.cweName}
          </p>
        </DetailCell>
      </div>
    </div>
  )
}

function DetailCell({
  icon, label, children,
}: {
  icon: React.ReactNode
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="bg-white p-4 flex flex-col gap-3">
      <div className="flex items-center gap-1.5">
        {icon}
        <span className="text-xs font-medium text-slate-600">{label}</span>
      </div>
      {children}
    </div>
  )
}

function ConfidenceBar({ value, severity }: { value: number; severity: AnalysisResult['severity'] }) {
  const barColor = {
    critical: 'bg-red-500',
    high: 'bg-orange-500',
    medium: 'bg-amber-500',
    low: 'bg-sky-500',
  }[severity]

  return (
    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
      <div
        className={cn('h-full rounded-full transition-all duration-700', barColor)}
        style={{ width: `${value}%` }}
      />
    </div>
  )
}
