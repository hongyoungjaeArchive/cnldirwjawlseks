'use client'

import { Light as SyntaxHighlighter } from 'react-syntax-highlighter'
import c from 'react-syntax-highlighter/dist/esm/languages/hljs/c'
import cpp from 'react-syntax-highlighter/dist/esm/languages/hljs/cpp'
import { githubGist } from 'react-syntax-highlighter/dist/esm/styles/hljs'
import { AlertTriangle, ShieldAlert, Zap } from 'lucide-react'
import type { AnalysisResult } from '@/lib/types'
import { cn } from '@/lib/utils'

SyntaxHighlighter.registerLanguage('c', c)
SyntaxHighlighter.registerLanguage('cpp', cpp)

interface CodeExplainPanelProps {
  result: AnalysisResult
}

const codeStyle = {
  ...githubGist,
  hljs: {
    ...githubGist.hljs,
    background: 'transparent',
    padding: '0',
  },
}

export function CodeExplainPanel({ result }: CodeExplainPanelProps) {
  const codeLines = result.originalCode.split('\n')

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-px bg-slate-200 rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
      {/* ── 왼쪽: 원본 코드 ── */}
      <div className="bg-white flex flex-col">
        <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 border-b border-slate-100">
          <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
          <span className="text-xs font-medium text-slate-600">원본 코드</span>
          <span className="ml-auto text-xs font-mono text-slate-600">
            {result.language === 'cpp' ? 'C++' : 'C'}
          </span>
        </div>

        <div className="overflow-auto">
          <div className="flex">
            {/* 줄번호 */}
            <div className="select-none flex-shrink-0 px-3 py-4 bg-slate-50/50">
              {codeLines.map((_, i) => {
                const lineNum = i + 1
                const isVuln = result.vulnerableLines.includes(lineNum)
                return (
                  <div
                    key={i}
                    className={cn(
                      'text-xs font-mono h-5 flex items-center justify-end leading-5',
                      isVuln ? 'text-red-500' : 'text-slate-700',
                    )}
                  >
                    {isVuln && (
                      <span className="mr-1.5 text-red-400 text-[10px]">▶</span>
                    )}
                    {lineNum}
                  </div>
                )
              })}
            </div>

            {/* 코드 */}
            <div className="flex-1 overflow-x-auto py-4 pr-4 min-w-0">
              {codeLines.map((line, i) => {
                const lineNum = i + 1
                const isVuln = result.vulnerableLines.includes(lineNum)
                return (
                  <div
                    key={i}
                    className={cn(
                      'h-5 flex items-center text-xs leading-5 font-mono',
                      isVuln && 'bg-red-50 -mx-2 px-2 rounded',
                    )}
                  >
                    <SyntaxHighlighter
                      language={result.language}
                      style={codeStyle}
                      PreTag="span"
                      useInlineStyles
                      customStyle={{ display: 'inline', fontSize: '0.75rem', lineHeight: '1.25rem' }}
                    >
                      {line || ' '}
                    </SyntaxHighlighter>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── 오른쪽: LLM 설명 ── */}
      <div className="bg-white flex flex-col">
        <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 border-b border-slate-100">
          <div className="w-1.5 h-1.5 rounded-full bg-sky-400" />
          <span className="text-xs font-medium text-slate-600">LLM 분석</span>
        </div>

        <div className="flex flex-col gap-3 p-4 overflow-auto">
          <ExplainBlock
            icon={<AlertTriangle className="w-3.5 h-3.5 text-amber-500" />}
            label="취약 원인"
            color="amber"
            content={result.llmExplanation.cause}
          />
          <ExplainBlock
            icon={<Zap className="w-3.5 h-3.5 text-red-500" />}
            label="공격 시나리오"
            color="red"
            content={result.llmExplanation.attackScenario}
          />
          <ExplainBlock
            icon={<ShieldAlert className="w-3.5 h-3.5 text-orange-500" />}
            label="보안 위험"
            color="orange"
            content={result.llmExplanation.risk}
          />
        </div>
      </div>
    </div>
  )
}

function ExplainBlock({
  icon, label, color, content,
}: {
  icon: React.ReactNode
  label: string
  color: 'amber' | 'red' | 'orange'
  content: string
}) {
  const borderMap = { amber: 'border-amber-200', red: 'border-red-200', orange: 'border-orange-200' }
  const bgMap    = { amber: 'bg-amber-50',  red: 'bg-red-50',  orange: 'bg-orange-50' }
  const labelMap = { amber: 'text-amber-700', red: 'text-red-700', orange: 'text-orange-700' }

  return (
    <div className={cn('rounded-xl border p-3', borderMap[color], bgMap[color])}>
      <div className="flex items-center gap-1.5 mb-2">
        {icon}
        <span className={cn('text-xs font-semibold', labelMap[color])}>{label}</span>
      </div>
      <p className="text-xs text-slate-600 leading-relaxed">{content}</p>
    </div>
  )
}
