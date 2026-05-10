'use client'

import { useState } from 'react'
import { Eye, EyeOff, Key, ExternalLink, CheckCircle2, X, ShieldCheck, Loader2, AlertCircle } from 'lucide-react'
import { useApiKey } from '@/lib/apiKeyContext'
import { isValidApiKey } from '@/lib/apiKey'
import { cn } from '@/lib/utils'

type VerifyState = 'idle' | 'verifying' | 'success' | 'error'

export function ApiKeyModal() {
  const { isModalOpen, closeModal, saveKey, clearKey, hasKey } = useApiKey()
  const [input, setInput]           = useState('')
  const [show, setShow]             = useState(false)
  const [verifyState, setVerifyState] = useState<VerifyState>('idle')
  const [errorMsg, setErrorMsg]     = useState('')
  const [warning, setWarning]       = useState('')

  const reset = () => {
    setVerifyState('idle')
    setErrorMsg('')
    setWarning('')
  }

  const handleSave = async () => {
    const trimmed = input.trim()

    // 1차: 형식 검사 (즉각 피드백)
    if (!isValidApiKey(trimmed)) {
      setVerifyState('error')
      setErrorMsg('"sk-ant-"로 시작하는 API 키를 입력해주세요')
      return
    }

    // 2차: 실제 API 호출로 키 유효성 검증
    setVerifyState('verifying')
    setErrorMsg('')
    setWarning('')

    try {
      const res = await fetch('/api/verify-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: trimmed }),
      })
      const data = await res.json() as { valid: boolean; error?: string; warning?: string }

      if (!data.valid) {
        setVerifyState('error')
        setErrorMsg(data.error ?? '유효하지 않은 API 키입니다')
        return
      }

      // 성공
      setVerifyState('success')
      if (data.warning) setWarning(data.warning)

      setTimeout(() => {
        saveKey(trimmed)
        setInput('')
        reset()
      }, 800) // 성공 애니메이션 잠깐 보여주고 닫기

    } catch {
      setVerifyState('error')
      setErrorMsg('네트워크 오류가 발생했습니다. 다시 시도해주세요.')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && verifyState !== 'verifying') handleSave()
  }

  if (!isModalOpen) return null

  const isVerifying = verifyState === 'verifying'
  const isSuccess   = verifyState === 'success'
  const isError     = verifyState === 'error'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={hasKey && !isVerifying ? closeModal : undefined}
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
          {hasKey && !isVerifying && (
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
          {hasKey && !isSuccess && (
            <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              <span className="text-xs text-emerald-700 font-medium">API 키가 설정되어 있습니다</span>
            </div>
          )}

          {/* 검증 성공 피드백 */}
          {isSuccess && (
            <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 animate-pulse">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              <span className="text-xs text-emerald-700 font-medium">API 키 확인 완료! 저장 중...</span>
            </div>
          )}

          <p className="text-xs text-slate-600 leading-relaxed">
            Anthropic Claude API 키를 입력하세요.
            키는 <strong className="text-slate-700">이 브라우저에만 저장</strong>되며
            서버나 GitHub에 기록되지 않습니다.
          </p>

          {/* 입력 필드 */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">API Key</label>
            <div className="relative">
              <input
                type={show ? 'text' : 'password'}
                value={input}
                onChange={e => { setInput(e.target.value); reset() }}
                onKeyDown={handleKeyDown}
                disabled={isVerifying || isSuccess}
                placeholder="sk-ant-api03-..."
                className={cn(
                  'w-full pr-10 pl-3.5 py-2.5 rounded-xl border bg-slate-50 text-slate-800 text-xs font-mono',
                  'placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all',
                  'disabled:opacity-60 disabled:cursor-not-allowed',
                  isError
                    ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
                    : isSuccess
                    ? 'border-emerald-300 focus:border-emerald-400 focus:ring-emerald-100'
                    : 'border-slate-200 focus:border-sky-400 focus:ring-sky-100',
                )}
              />
              <button
                type="button"
                onClick={() => setShow(v => !v)}
                disabled={isVerifying || isSuccess}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-40"
              >
                {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* 상태 메시지 */}
            {isVerifying && (
              <div className="flex items-center gap-1.5 text-[11px] text-sky-600">
                <Loader2 className="w-3 h-3 animate-spin" />
                API 키를 검증하는 중입니다...
              </div>
            )}
            {isError && errorMsg && (
              <div className="flex items-center gap-1.5 text-[11px] text-red-500">
                <AlertCircle className="w-3 h-3 flex-shrink-0" />
                {errorMsg}
              </div>
            )}
            {warning && (
              <div className="flex items-center gap-1.5 text-[11px] text-amber-600">
                <AlertCircle className="w-3 h-3 flex-shrink-0" />
                {warning}
              </div>
            )}
          </div>

          {/* 버튼 */}
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={!input.trim() || isVerifying || isSuccess}
              className={cn(
                'flex-1 h-9 rounded-xl text-xs font-semibold transition-all duration-200 flex items-center justify-center gap-1.5',
                input.trim() && !isVerifying && !isSuccess
                  ? 'bg-sky-500 text-white hover:bg-sky-600 shadow-md shadow-sky-200'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed',
              )}
            >
              {isVerifying && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {isVerifying ? '검증 중...' : '저장'}
            </button>
            {hasKey && !isVerifying && !isSuccess && (
              <button
                onClick={clearKey}
                className="h-9 px-4 rounded-xl text-xs font-medium text-red-500 border border-red-200 hover:bg-red-50 transition-all"
              >
                키 삭제
              </button>
            )}
          </div>

          {/* 안내 */}
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
