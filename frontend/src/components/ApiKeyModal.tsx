'use client'

import { useState } from 'react'
import { Eye, EyeOff, Key, ExternalLink, CheckCircle2, X, ShieldCheck } from 'lucide-react'
import { useApiKey } from '@/lib/apiKeyContext'
import { isValidApiKey } from '@/lib/apiKey'
import { cn } from '@/lib/utils'

export function ApiKeyModal() {
  const { isModalOpen, closeModal, saveKey, clearKey, hasKey } = useApiKey()
  const [input, setInput]   = useState('')
  const [show, setShow]     = useState(false)
  const [error, setError]   = useState('')

  const handleSave = () => {
    const trimmed = input.trim()
    if (!isValidApiKey(trimmed)) {
      setError('API 키는 "sk-ant-"로 시작해야 합니다')
      return
    }
    saveKey(trimmed)
    setInput('')
    setError('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave()
  }

  if (!isModalOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* 오버레이 — 키가 설정된 경우만 클릭으로 닫기 */}
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={hasKey ? closeModal : undefined}
      />

      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">

        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-sky-50 to-violet-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center shadow-sm">
              <Key className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800">Claude API 키 설정</h2>
              <p className="text-[11px] text-slate-500 mt-0.5">분석 엔진 인증</p>
            </div>
          </div>
          {hasKey && (
            <button
              onClick={closeModal}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* 바디 */}
        <div className="px-6 py-5 space-y-4">

          {/* 현재 키 설정 상태 */}
          {hasKey && (
            <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              <span className="text-xs text-emerald-700 font-medium">API 키가 설정되어 있습니다</span>
            </div>
          )}

          {/* 안내 */}
          <div className="space-y-1.5">
            <p className="text-xs text-slate-600 leading-relaxed">
              Anthropic Claude API 키를 입력하세요.
              키는 <strong className="text-slate-700">이 브라우저에만 저장</strong>되며
              서버나 GitHub에 전송·저장되지 않습니다.
            </p>
          </div>

          {/* 입력 필드 */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
              API Key
            </label>
            <div className="relative">
              <input
                type={show ? 'text' : 'password'}
                value={input}
                onChange={e => { setInput(e.target.value); setError('') }}
                onKeyDown={handleKeyDown}
                placeholder="sk-ant-api03-..."
                className={cn(
                  'w-full pr-10 pl-3.5 py-2.5 rounded-xl border bg-slate-50 text-slate-800 text-xs font-mono',
                  'placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all',
                  error
                    ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
                    : 'border-slate-200 focus:border-sky-400 focus:ring-sky-100',
                )}
              />
              <button
                type="button"
                onClick={() => setShow(v => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {error && (
              <p className="text-[11px] text-red-500 flex items-center gap-1">{error}</p>
            )}
          </div>

          {/* 버튼 */}
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={!input.trim()}
              className={cn(
                'flex-1 h-9 rounded-xl text-xs font-semibold transition-all duration-200',
                input.trim()
                  ? 'bg-sky-500 text-white hover:bg-sky-600 shadow-md shadow-sky-200'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed',
              )}
            >
              저장
            </button>
            {hasKey && (
              <button
                onClick={clearKey}
                className="h-9 px-4 rounded-xl text-xs font-medium text-red-500 border border-red-200 hover:bg-red-50 transition-all"
              >
                키 삭제
              </button>
            )}
          </div>

          {/* 보안 안내 + 콘솔 링크 */}
          <div className="flex flex-col gap-2 pt-1 border-t border-slate-100">
            <div className="flex items-start gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
              <p className="text-[11px] text-slate-500 leading-relaxed">
                키는 localStorage에만 저장됩니다. 다른 기기에서는 다시 입력해야 합니다.
              </p>
            </div>
            <a
              href="https://console.anthropic.com/settings/keys"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-[11px] text-sky-500 hover:text-sky-600 transition-colors w-fit"
            >
              <ExternalLink className="w-3 h-3" />
              Anthropic 콘솔에서 API 키 발급받기
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
