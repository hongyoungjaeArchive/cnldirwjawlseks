'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Search, BrainCircuit, CheckCircle2 } from 'lucide-react'
import type { AnalysisPhase } from '@/lib/ollama'

interface Props {
  model?: string
  phase?: AnalysisPhase | null
}

const PHASES = [
  {
    key:   'pass1' as AnalysisPhase,
    icon:  <Search className="w-4 h-4" />,
    label: '1단계 — 취약점 패턴 스캔',
    sub:   '코드에서 위험 패턴을 빠르게 탐지합니다',
    color: 'text-sky-600',
    ringColor: '#0ea5e9',
    bg:    'bg-sky-50 border-sky-200',
  },
  {
    key:   'pass2' as AnalysisPhase,
    icon:  <BrainCircuit className="w-4 h-4" />,
    label: '2단계 — 심층 분석 및 설명 생성',
    sub:   'CWE 전문 지식 기반으로 원인·수정 코드를 작성합니다',
    color: 'text-violet-600',
    ringColor: '#7c3aed',
    bg:    'bg-violet-50 border-violet-200',
  },
]

export function AnalysisLoadingState({ model, phase }: Props) {
  const currentIndex = phase ? PHASES.findIndex(p => p.key === phase) : -1
  const activePhase = PHASES[currentIndex]

  return (
    <div className="flex flex-col items-center justify-center gap-8 py-16 w-full max-w-sm mx-auto">

      {/* 스피너 */}
      <div className="relative w-24 h-24">
        <div
          className="absolute inset-0 rounded-full blur-xl opacity-20 animate-glow-pulse"
          style={{ background: activePhase?.ringColor ?? '#0ea5e9' }}
        />
        <svg className="w-24 h-24 -rotate-90 absolute inset-0" viewBox="0 0 96 96">
          <circle cx="48" cy="48" r="40" fill="none" stroke="#e0f2fe" strokeWidth="3" />
          <motion.circle
            cx="48" cy="48" r="40"
            fill="none"
            stroke={activePhase?.ringColor ?? '#0ea5e9'}
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray="251"
            strokeDashoffset="60"
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: 'linear' }}
            style={{ transformOrigin: '48px 48px' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="w-4 h-4 rounded-full animate-pulse"
            style={{ background: activePhase?.ringColor ?? '#0ea5e9', opacity: 0.7 }}
          />
        </div>
      </div>

      {/* 텍스트 */}
      <div className="text-center">
        <p className="text-slate-800 text-xl font-semibold">코드 분석 중...</p>
        {model && (
          <p className="text-slate-600 text-sm mt-1.5">
            Ollama ·{' '}
            <span className="font-mono text-violet-600">{model}</span>
          </p>
        )}
      </div>

      {/* Two-pass 진행 카드 */}
      <div className="w-full flex flex-col gap-2.5">
        {PHASES.map((p, i) => {
          const isDone    = currentIndex > i
          const isActive  = currentIndex === i
          const isPending = currentIndex < i

          return (
            <motion.div
              key={p.key}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: isPending ? 0.4 : 1, x: 0 }}
              transition={{ delay: i * 0.15, duration: 0.4 }}
              className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all duration-500
                ${isActive  ? p.bg : ''}
                ${isDone    ? 'border-emerald-200 bg-emerald-50' : ''}
                ${isPending ? 'border-slate-200 bg-white' : ''}
              `}
            >
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5
                ${isActive  ? `bg-white shadow-sm ${p.color}` : ''}
                ${isDone    ? 'bg-white text-emerald-600 shadow-sm' : ''}
                ${isPending ? 'bg-slate-100 text-slate-600' : ''}
              `}>
                {isDone ? <CheckCircle2 className="w-4 h-4" /> : p.icon}
              </div>

              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold
                  ${isActive  ? p.color : ''}
                  ${isDone    ? 'text-emerald-600' : ''}
                  ${isPending ? 'text-slate-600'   : ''}
                `}>
                  {p.label}
                  {isDone && (
                    <span className="ml-2 text-[10px] font-normal text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded-full">완료</span>
                  )}
                </p>
                <AnimatePresence>
                  {isActive && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="text-xs text-slate-600 mt-0.5 leading-relaxed"
                    >
                      {p.sub}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              {isActive && (
                <div className="flex-shrink-0 mt-2 flex gap-0.5">
                  {[0, 1, 2].map(j => (
                    <div
                      key={j}
                      className="w-1 h-1 rounded-full"
                      style={{
                        background: p.ringColor,
                        animation: `dot-blink 1.2s ease-in-out infinite`,
                        animationDelay: `${j * 0.2}s`,
                      }}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

export function PageLoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-sky-50">
      <div className="w-8 h-8 border-[2px] border-sky-100 border-t-sky-500 rounded-full animate-spin" />
    </div>
  )
}
