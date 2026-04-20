'use client'

import { useState } from 'react'
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter'
import c from 'react-syntax-highlighter/dist/esm/languages/hljs/c'
import cpp from 'react-syntax-highlighter/dist/esm/languages/hljs/cpp'
import { githubGist } from 'react-syntax-highlighter/dist/esm/styles/hljs'
import { Check, Copy, Wrench } from 'lucide-react'
import type { AnalysisResult } from '@/lib/types'

SyntaxHighlighter.registerLanguage('c', c)
SyntaxHighlighter.registerLanguage('cpp', cpp)

interface FixedCodePanelProps {
  result: AnalysisResult
}

const codeStyle = {
  ...githubGist,
  hljs: { ...githubGist.hljs, background: 'transparent', padding: '0' },
}

export function FixedCodePanel({ result }: FixedCodePanelProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(result.fixedCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="rounded-2xl border border-emerald-200 bg-white overflow-hidden shadow-sm">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-emerald-50 border-b border-emerald-200">
        <div className="flex items-center gap-2">
          <Wrench className="w-3.5 h-3.5 text-emerald-600" />
          <span className="text-xs font-semibold text-emerald-700">수정 코드 제안</span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all
            bg-white text-emerald-600 border border-emerald-200
            hover:bg-emerald-50 hover:border-emerald-300"
        >
          {copied ? (
            <><Check className="w-3 h-3" /> 복사됨</>
          ) : (
            <><Copy className="w-3 h-3" /> 복사</>
          )}
        </button>
      </div>

      {/* 설명 */}
      <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
        <p className="text-xs text-slate-600 leading-relaxed">
          💡 {result.llmExplanation.fixDescription}
        </p>
      </div>

      {/* 코드 */}
      <div className="p-4 overflow-x-auto">
        <SyntaxHighlighter
          language={result.language}
          style={codeStyle}
          showLineNumbers
          lineNumberStyle={{ color: '#cbd5e1', minWidth: '2.5em', paddingRight: '1em', fontSize: '0.7rem' }}
          customStyle={{ background: 'transparent', fontSize: '0.8rem', margin: 0 }}
          wrapLines
        >
          {result.fixedCode}
        </SyntaxHighlighter>
      </div>
    </div>
  )
}
