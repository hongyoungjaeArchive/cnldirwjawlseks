'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft, RotateCcw, ShieldCheck, AlertOctagon, Zap } from 'lucide-react'
import { useAnalysis } from '@/lib/context'
import { ResultHeader } from '@/components/results/ResultHeader'
import { CodeExplainPanel } from '@/components/results/CodeExplainPanel'
import { FixedCodePanel } from '@/components/results/FixedCodePanel'
import { DiffPanel } from '@/components/results/DiffPanel'
import { DetailPanel } from '@/components/results/DetailPanel'
import { CWEPanel } from '@/components/results/CWEPanel'
import { PageLoadingSpinner } from '@/components/ui/LoadingState'

const sectionVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.45, ease: [0.16, 1, 0.3, 1] as number[] },
  }),
}

export default function ResultsPage() {
  const router = useRouter()
  const { result, isLoading, clearResult } = useAnalysis()

  useEffect(() => {
    if (!isLoading && !result) {
      router.replace('/analyze')
    }
  }, [result, isLoading, router])

  if (isLoading) return <PageLoadingSpinner />
  if (!result) return null

  const isVulnerable = result.status === 'vulnerable'

  const handleNewAnalysis = () => {
    clearResult()
    router.push('/analyze')
  }

  return (
    <div className="flex-1 flex flex-col px-4 py-7 sm:px-6 max-w-5xl mx-auto w-full">

      {/* 상단 네비 */}
      <div className="flex items-center justify-between mb-7">
        <button
          onClick={handleNewAnalysis}
          className="flex items-center gap-1.5 text-slate-600 hover:text-slate-700 text-sm transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          새 분석
        </button>
        <button
          onClick={handleNewAnalysis}
          className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-slate-200 bg-white
            text-slate-600 text-xs font-medium hover:text-slate-700 hover:border-slate-300 hover:bg-slate-50
            transition-all duration-200 shadow-sm"
        >
          <RotateCcw className="w-3 h-3" />
          다시 분석
        </button>
      </div>

      {/* 결과 타이틀 */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="flex items-center gap-3.5 mb-6"
      >
        <div className="relative w-11 h-11 rounded-2xl overflow-hidden flex-shrink-0 shadow-sm">
          <div className={`absolute inset-0 ${isVulnerable
            ? 'bg-gradient-to-br from-red-400 to-red-600'
            : 'bg-gradient-to-br from-emerald-400 to-emerald-600'}`} />
          <div className="absolute inset-0 flex items-center justify-center">
            {isVulnerable
              ? <AlertOctagon className="w-5 h-5 text-white" />
              : <ShieldCheck className="w-5 h-5 text-white" />
            }
          </div>
        </div>
        <div>
          <h1 className="text-lg font-bold text-slate-800 leading-snug">
            {isVulnerable ? '취약점이 발견되었습니다' : '취약점이 발견되지 않았습니다'}
          </h1>
          <p className="text-slate-600 text-xs mt-0.5">
            {result.vulnerabilityType.cweId} · {result.vulnerabilityType.name}
          </p>
        </div>
      </motion.div>

      {/* 섹션들 */}
      <div className="flex flex-col gap-5">
        <motion.div custom={0} variants={sectionVariants} initial="hidden" animate="visible">
          <SectionLabel num="01" label="분석 결과 요약" />
          <ResultHeader result={result} />
        </motion.div>

        <motion.div custom={1} variants={sectionVariants} initial="hidden" animate="visible">
          <SectionLabel num="02" label="CWE 취약점 상세" />
          <CWEPanel result={result} />
        </motion.div>

        <motion.div custom={2} variants={sectionVariants} initial="hidden" animate="visible">
          <SectionLabel num="03" label="원본 코드 · LLM 설명" />
          <CodeExplainPanel result={result} />
        </motion.div>

        {isVulnerable && (
          <motion.div custom={3} variants={sectionVariants} initial="hidden" animate="visible">
            <SectionLabel num="04" label="수정 코드 제안" />
            <FixedCodePanel result={result} />
          </motion.div>
        )}

        {isVulnerable && (
          <motion.div custom={4} variants={sectionVariants} initial="hidden" animate="visible">
            <SectionLabel num="05" label="Before / After 비교" />
            <DiffPanel result={result} />
          </motion.div>
        )}

        <motion.div custom={5} variants={sectionVariants} initial="hidden" animate="visible">
          <SectionLabel num={isVulnerable ? '06' : '04'} label="세부 분석 정보" />
          <DetailPanel result={result} />
        </motion.div>
      </div>

      {/* 하단 액션 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="flex flex-col sm:flex-row gap-3 mt-10 pt-6 border-t border-slate-200"
      >
        <button
          onClick={handleNewAnalysis}
          className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 h-11 px-6 rounded-xl
            bg-sky-500 text-white text-sm font-semibold
            hover:bg-sky-600 transition-all duration-200
            shadow-lg shadow-sky-200 btn-shimmer"
        >
          <Zap className="w-3.5 h-3.5" />
          새로운 코드 분석하기
        </button>
        <Link href="/" className="flex-1 sm:flex-none">
          <button className="w-full inline-flex items-center justify-center h-11 px-6 rounded-xl
            border border-slate-200 bg-white text-slate-600 text-sm font-medium
            hover:bg-slate-50 hover:text-slate-800 hover:border-slate-300
            transition-all duration-200 shadow-sm">
            홈으로 돌아가기
          </button>
        </Link>
      </motion.div>
    </div>
  )
}

function SectionLabel({ num, label }: { num: string; label: string }) {
  return (
    <div className="flex items-center gap-2.5 mb-2.5">
      <span className="text-[11px] font-bold font-mono text-sky-400">{num}</span>
      <span className="text-xs font-semibold text-slate-600">{label}</span>
      <div className="flex-1 h-px bg-gradient-to-r from-slate-200 to-transparent" />
    </div>
  )
}
