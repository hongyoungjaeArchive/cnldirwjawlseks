'use client'

import dynamic from 'next/dynamic'
import { Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Language } from '@/lib/types'

const MonacoEditor = dynamic(
  () => import('@monaco-editor/react').then(m => m.default),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full bg-slate-50 rounded-b-2xl">
        <div className="flex flex-col items-center gap-3 text-slate-600">
          <div className="w-6 h-6 border-2 border-slate-200 border-t-sky-500 rounded-full animate-spin" />
          <span className="text-xs">에디터 로딩 중...</span>
        </div>
      </div>
    ),
  },
)

interface CodeEditorProps {
  value: string
  onChange: (value: string) => void
  language: Language
  className?: string
}

const langMap: Record<Language, string> = { c: 'c', cpp: 'cpp' }
const langLabel: Record<Language, string> = { c: 'C', cpp: 'C++' }

export function CodeEditor({ value, onChange, language, className }: CodeEditorProps) {
  const lineCount = value ? value.split('\n').length : 0

  return (
    <div className={cn('flex flex-col rounded-2xl border border-slate-200 overflow-hidden shadow-sm bg-white', className)}>
      {/* 에디터 헤더 */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
          </div>
          <span className="text-slate-600 text-xs font-mono">
            main.{language === 'cpp' ? 'cpp' : 'c'}
          </span>
          <span className="text-slate-700 text-xs">|</span>
          <span className="text-slate-600 text-xs">{lineCount} lines</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-lg text-xs font-mono font-semibold bg-sky-50 text-sky-600 border border-sky-200">
            {langLabel[language]}
          </span>
          {value && (
            <button
              onClick={() => onChange('')}
              className="p-1 rounded-lg text-slate-600 hover:text-red-500 hover:bg-red-50 transition-colors"
              title="코드 초기화"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Monaco 에디터 */}
      <MonacoEditor
        height="100%"
        language={langMap[language]}
        value={value}
        onChange={v => onChange(v ?? '')}
        theme="vs"
        options={{
          fontSize: 13,
          fontFamily: "'Geist Mono', 'JetBrains Mono', 'Fira Code', monospace",
          fontLigatures: true,
          lineNumbers: 'on',
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          padding: { top: 16, bottom: 16 },
          renderLineHighlight: 'line',
          cursorBlinking: 'smooth',
          smoothScrolling: true,
          automaticLayout: true,
          tabSize: 4,
          wordWrap: 'on',
          lineDecorationsWidth: 0,
          overviewRulerLanes: 0,
          hideCursorInOverviewRuler: true,
          scrollbar: {
            verticalScrollbarSize: 4,
            horizontalScrollbarSize: 4,
          },
        }}
      />
    </div>
  )
}
