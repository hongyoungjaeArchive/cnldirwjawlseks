'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Code2, Upload, Play, ChevronRight,
  Info, AlertCircle, Bot, Zap, Sparkles,
} from 'lucide-react'
import { CodeEditor } from '@/components/analyze/CodeEditor'
import { FileUpload } from '@/components/analyze/FileUpload'
import { AnalysisLoadingState } from '@/components/ui/LoadingState'
import { useAnalysis } from '@/lib/context'
import { useApiKey } from '@/lib/apiKeyContext'
import { cn } from '@/lib/utils'
import type { Language } from '@/lib/types'
import type { Pass2Model } from '@/lib/claude'

type InputMode = 'editor' | 'upload'

const EXAMPLE_C = `#include <stdio.h>
#include <string.h>

void process_input(char *input) {
    char buf[10];
    strcpy(buf, input);  // 취약점: 버퍼 오버플로우
    printf("%s\\n", buf);
}

int main() {
    char user_input[256];
    scanf("%s", user_input);
    process_input(user_input);
    return 0;
}
`

const EXAMPLE_CPP = `#include <iostream>
#include <cstring>

void vulnerable_func(const char* input) {
    char buffer[16];
    strcpy(buffer, input);  // 취약점: 버퍼 오버플로우
    std::cout << buffer << std::endl;
}

int main() {
    std::string input;
    std::cin >> input;
    vulnerable_func(input.c_str());
    return 0;
}
`

export default function AnalyzePage() {
  const router = useRouter()
  const { runAnalysis, isLoading, phase, error, clearResult, pass2Model, setPass2Model } = useAnalysis()
  const { hasKey, openModal } = useApiKey()

  const [language, setLanguage] = useState<Language>('c')
  const [code, setCode] = useState('')
  const [inputMode, setInputMode] = useState<InputMode>('editor')

  useEffect(() => {
    clearResult()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleAnalyze = async () => {
    if (!code.trim()) return
    await runAnalysis({ code, language })
    router.push('/results')
  }

  const handleExample = () => {
    setCode(language === 'c' ? EXAMPLE_C : EXAMPLE_CPP)
    setInputMode('editor')
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <AnalysisLoadingState model={`Claude Haiku + ${pass2Model === 'opus' ? 'Opus' : 'Sonnet'}`} phase={phase} />
      </div>
    )
  }

  const canAnalyze = code.trim().length > 0 && hasKey

  return (
    <div className="flex-1 flex flex-col px-4 py-7 sm:px-6 max-w-7xl mx-auto w-full">

      {/* 브레드크럼 */}
      <nav className="flex items-center gap-1.5 text-xs text-slate-600 mb-7">
        <span className="hover:text-slate-600 cursor-pointer transition-colors">홈</span>
        <ChevronRight className="w-3 h-3" />
        <span className="text-slate-600">코드 분석</span>
      </nav>

      {/* 페이지 헤더 */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="mb-7"
      >
        <div className="flex items-center gap-3 mb-1.5">
          <div className="relative w-9 h-9 rounded-xl overflow-hidden flex-shrink-0 shadow-sm">
            <div className="absolute inset-0 bg-gradient-to-br from-sky-400 to-sky-600" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Code2 className="w-4 h-4 text-white" />
            </div>
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800 leading-none mb-0.5">코드 분석</h1>
            <p className="text-slate-600 text-xs">
              C/C++ 코드를 입력하거나 파일을 업로드하여 취약점을 분석하세요
            </p>
          </div>
        </div>
      </motion.div>

      {/* 에러 배너 */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-3 mb-5 px-4 py-3 rounded-xl bg-red-50 border border-red-200"
        >
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-600 leading-relaxed">{error}</p>
        </motion.div>
      )}

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4 min-h-0">

        {/* ── 왼쪽: 에디터 ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col gap-3 min-h-0"
        >
          <div className="flex items-center gap-1 p-1 rounded-xl bg-white border border-slate-200 shadow-sm w-fit">
            <TabButton
              active={inputMode === 'editor'}
              onClick={() => setInputMode('editor')}
              icon={<Code2 className="w-3.5 h-3.5" />}
              label="직접 입력"
            />
            <TabButton
              active={inputMode === 'upload'}
              onClick={() => setInputMode('upload')}
              icon={<Upload className="w-3.5 h-3.5" />}
              label="파일 업로드"
            />
          </div>

          {inputMode === 'editor' ? (
            <CodeEditor
              value={code}
              onChange={setCode}
              language={language}
              className="flex-1 min-h-[400px] lg:min-h-0"
            />
          ) : (
            <div className="flex-1 flex flex-col gap-4 min-h-[400px]">
              <FileUpload
                onCodeLoaded={c => { setCode(c); setInputMode('editor') }}
                language={language}
              />
              {code && (
                <div className="px-3.5 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-600 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  파일 로드 완료 — 에디터 탭에서 코드를 확인하세요
                </div>
              )}
            </div>
          )}
        </motion.div>

        {/* ── 오른쪽: 설정 패널 ── */}
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.18, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col gap-3"
        >
          {/* Claude API 상태 */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <Bot className="w-3.5 h-3.5 text-violet-500" />
                <p className="text-xs font-semibold text-slate-600">AI 모델</p>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[11px] font-medium text-emerald-600">준비됨</span>
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-violet-50 border border-violet-200">
                <span className="text-xs text-violet-700 font-medium">1단계 탐지</span>
                <span className="text-xs font-mono text-violet-600">Claude Haiku</span>
              </div>
              <div className="space-y-1.5">
                <span className="text-xs text-slate-500 px-1">2단계 분석 모델</span>
                <div className="grid grid-cols-2 gap-1.5">
                  {(['sonnet', 'opus'] as Pass2Model[]).map((m) => (
                    <button
                      key={m}
                      onClick={() => setPass2Model(m)}
                      className={cn(
                        'py-2 rounded-xl text-xs font-semibold font-mono border transition-all duration-200',
                        pass2Model === m
                          ? m === 'opus'
                            ? 'bg-amber-50 text-amber-700 border-amber-300 shadow-sm'
                            : 'bg-sky-50 text-sky-600 border-sky-300 shadow-sm'
                          : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-slate-300',
                      )}
                    >
                      {m === 'sonnet' ? 'Sonnet' : 'Opus'}
                    </button>
                  ))}
                </div>
                {pass2Model === 'opus' && (
                  <p className="text-[11px] text-amber-600 px-1 leading-relaxed">
                    Opus는 최고 품질이지만 응답이 느리고 비용이 높습니다.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* 언어 선택 */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold text-slate-600 mb-3">언어 선택</p>
            <div className="grid grid-cols-2 gap-2">
              {(['c', 'cpp'] as Language[]).map(lang => (
                <button
                  key={lang}
                  onClick={() => setLanguage(lang)}
                  className={cn(
                    'py-2.5 rounded-xl text-sm font-bold font-mono border transition-all duration-200',
                    language === lang
                      ? 'bg-sky-50 text-sky-600 border-sky-300 shadow-sm'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:text-slate-600 hover:border-slate-300',
                  )}
                >
                  {lang === 'c' ? 'C' : 'C++'}
                </button>
              ))}
            </div>
          </div>

          {/* 예시 코드 */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold text-slate-600 mb-1.5">예시 코드</p>
            <p className="text-xs text-slate-600 mb-3 leading-relaxed">
              버퍼 오버플로우 취약점이 포함된 예시로 테스트해 보세요.
            </p>
            <button
              onClick={handleExample}
              className="w-full flex items-center justify-center gap-1.5 h-8 rounded-lg
                border border-slate-200 bg-slate-50 text-slate-600 text-xs font-medium
                hover:bg-sky-50 hover:text-sky-600 hover:border-sky-200
                transition-all duration-200"
            >
              <Sparkles className="w-3 h-3" />
              예시 코드 불러오기
            </button>
          </div>

          {/* 코드 정보 */}
          {code && (
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold text-slate-600 mb-3">코드 정보</p>
              <div className="flex flex-col gap-2 text-xs">
                <InfoRow label="줄 수" value={`${code.split('\n').length} lines`} />
                <InfoRow label="문자 수" value={`${code.length} chars`} />
                <InfoRow label="언어" value={language === 'c' ? 'C' : 'C++'} />
                <InfoRow label="엔진" value="Claude API" />
              </div>
            </div>
          )}

          {/* 분석 팁 */}
          <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4">
            <div className="flex gap-2 mb-2.5">
              <Info className="w-3.5 h-3.5 text-sky-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs font-semibold text-sky-600">분석 팁</p>
            </div>
            <ul className="text-xs text-slate-600 space-y-1.5 leading-relaxed">
              <li className="flex items-start gap-1.5">
                <span className="text-sky-400 mt-0.5">•</span>
                함수 단위 또는 전체 파일을 입력하세요
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-sky-400 mt-0.5">•</span>
                1단계(Haiku)로 빠르게 탐지, 2단계(Sonnet)로 심층 분석합니다
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-sky-400 mt-0.5">•</span>
                BOF, UAF, NPD, FMT, INT, OOB, SQLi 7가지 유형을 지원합니다
              </li>
            </ul>
          </div>

          {/* 분석 버튼 */}
          <div className="mt-auto pt-1">
            <button
              onClick={handleAnalyze}
              disabled={!canAnalyze || isLoading}
              className={cn(
                'w-full flex items-center justify-center gap-2 h-11 rounded-xl font-semibold text-sm transition-all duration-200',
                canAnalyze
                  ? 'bg-sky-500 text-white hover:bg-sky-600 shadow-lg shadow-sky-200 hover:shadow-xl hover:shadow-sky-300/50 btn-shimmer'
                  : 'bg-slate-100 text-slate-600 border border-slate-200 cursor-not-allowed',
              )}
            >
              <Play className="w-3.5 h-3.5" />
              분석 시작
              {canAnalyze && <Zap className="w-3 h-3 opacity-60" />}
            </button>
            {!hasKey ? (
              <p className="text-center text-[11px] text-amber-600 mt-2">
                <button onClick={openModal} className="underline hover:text-amber-700">API 키를 설정</button>하면 분석이 가능합니다
              </p>
            ) : !code.trim() && (
              <p className="text-center text-[11px] text-slate-600 mt-2">
                코드를 입력하면 분석 버튼이 활성화됩니다
              </p>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}

function TabButton({
  active, onClick, icon, label,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200',
        active
          ? 'bg-sky-50 text-sky-600 shadow-sm'
          : 'text-slate-600 hover:text-slate-600',
      )}
    >
      {icon}
      {label}
    </button>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-600">{label}</span>
      <span className="text-slate-600 font-mono truncate max-w-[140px] text-right">{value}</span>
    </div>
  )
}
