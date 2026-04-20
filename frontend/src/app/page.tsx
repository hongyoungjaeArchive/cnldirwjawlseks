'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  ShieldCheck, Brain, ArrowRight, CheckCircle2,
  Zap, FileSearch, MessageSquareCode, FileCode2,
  ArrowUpRight, Cpu, Lock,
} from 'lucide-react'

const features = [
  {
    icon: <FileSearch className="w-5 h-5 text-sky-500" />,
    title: 'AI 취약점 탐지',
    description: 'CodeBERT를 Devign·Big-Vul 데이터셋으로 파인튜닝한 모델이 함수 단위로 취약점을 정밀 탐지합니다.',
    accent: 'hover:border-sky-300 hover:shadow-sky-100',
    iconBg: 'bg-sky-50 ring-1 ring-sky-100',
  },
  {
    icon: <MessageSquareCode className="w-5 h-5 text-violet-500" />,
    title: 'LLM 자연어 설명',
    description: '탐지된 취약점의 원인, 공격 시나리오, 보안 위험을 LLM이 쉬운 언어로 상세히 설명합니다.',
    accent: 'hover:border-violet-300 hover:shadow-violet-100',
    iconBg: 'bg-violet-50 ring-1 ring-violet-100',
  },
  {
    icon: <FileCode2 className="w-5 h-5 text-emerald-500" />,
    title: '수정 코드 제안',
    description: '취약한 코드를 안전하게 수정하는 예시 코드와 Before/After diff 비교를 자동으로 제공합니다.',
    accent: 'hover:border-emerald-300 hover:shadow-emerald-100',
    iconBg: 'bg-emerald-50 ring-1 ring-emerald-100',
  },
]

const steps = [
  { num: '01', label: 'C/C++ 코드 입력', desc: '직접 붙여넣기 또는 파일 업로드', icon: <FileSearch className="w-4 h-4" />, color: 'text-sky-500 bg-sky-50 ring-sky-100' },
  { num: '02', label: 'AI 모델 분석', desc: 'CodeBERT가 취약점 여부 판단', icon: <Cpu className="w-4 h-4" />, color: 'text-violet-500 bg-violet-50 ring-violet-100' },
  { num: '03', label: 'LLM 설명 생성', desc: '원인·위험·수정방법 자동 작성', icon: <Brain className="w-4 h-4" />, color: 'text-indigo-500 bg-indigo-50 ring-indigo-100' },
  { num: '04', label: '결과 시각화', desc: '코드 하이라이트 + diff 비교', icon: <Lock className="w-4 h-4" />, color: 'text-emerald-500 bg-emerald-50 ring-emerald-100' },
]

const terminalLines = [
  { delay: 0,   color: 'text-slate-600', text: '$ vulnai analyze main.c' },
  { delay: 0.5, color: 'text-sky-500',   text: '▶ 코드 파싱 중...' },
  { delay: 1.0, color: 'text-sky-500',   text: '▶ AI 모델 추론 중... (CodeBERT)' },
  { delay: 1.6, color: 'text-amber-500', text: '⚠  취약점 탐지됨: BOF (신뢰도 87.4%)' },
  { delay: 2.1, color: 'text-violet-500',text: '▶ LLM 설명 생성 중...' },
  { delay: 2.7, color: 'text-emerald-500', text: '✓  분석 완료 — 결과를 확인하세요' },
]

const stats = [
  { value: '7+', label: '취약점 유형' },
  { value: '2',  label: 'Two-Pass 분석' },
  { value: 'CWE', label: '전문 지식 기반' },
  { value: '100%', label: '로컬 실행' },
]

export default function HomePage() {
  return (
    <div className="flex flex-col bg-grid bg-radial-fade">

      {/* ───────── Hero ───────── */}
      <section className="relative flex flex-col items-center text-center px-4 pt-24 pb-28 sm:pt-32 sm:pb-36 overflow-hidden">
        {/* 배경 글로우 */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] rounded-full bg-sky-300/20 blur-[120px] animate-glow-pulse" />
          <div className="absolute top-10 right-1/4 w-[300px] h-[300px] rounded-full bg-sky-200/15 blur-[80px]" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 flex flex-col items-center gap-7 max-w-3xl"
        >
          {/* 태그 배지 */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full
            border border-sky-200 bg-white text-sky-600 text-xs font-medium shadow-sm">
            <div className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
            CodeBERT + LLM 기반 보안 분석 플랫폼
          </div>

          {/* 메인 제목 */}
          <h1 className="text-4xl sm:text-5xl lg:text-[62px] font-bold tracking-tight leading-[1.1]">
            <span className="text-slate-900">소스코드의 </span>
            <span className="text-gradient">취약점</span>
            <br />
            <span className="text-slate-900">AI가 찾고 설명합니다</span>
          </h1>

          {/* 부제 */}
          <p className="text-slate-600 text-base sm:text-lg leading-relaxed max-w-lg">
            C/C++ 코드를 입력하면 AI 모델이 보안 취약점을 탐지하고,
            LLM이 원인과 수정 방법을 전문적으로 설명해 드립니다.
          </p>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <Link href="/analyze">
              <button className="group inline-flex items-center gap-2 h-12 px-7 rounded-xl
                bg-sky-500 text-white font-semibold text-sm
                hover:bg-sky-600 transition-all duration-200
                shadow-lg shadow-sky-200 hover:shadow-xl hover:shadow-sky-300/50
                btn-shimmer">
                <Zap className="w-4 h-4" />
                코드 분석 시작
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </Link>
            <Link href="/guide">
              <button className="inline-flex items-center gap-2 h-12 px-7 rounded-xl
                border border-slate-200 bg-white text-slate-600 font-medium text-sm
                hover:bg-slate-50 hover:border-slate-300 hover:text-slate-800
                transition-all duration-200 shadow-sm">
                사용 방법 보기
                <ArrowUpRight className="w-3.5 h-3.5 opacity-50" />
              </button>
            </Link>
          </div>

          {/* 신뢰 지표 */}
          <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-slate-600 text-xs mt-1">
            {['C / C++ 지원', 'CodeBERT 기반', 'Devign + Big-Vul 학습', '완전 로컬 실행'].map(t => (
              <span key={t} className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                <span>{t}</span>
              </span>
            ))}
          </div>
        </motion.div>

        {/* 터미널 데모 */}
        <motion.div
          initial={{ opacity: 0, y: 36 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 mt-16 w-full max-w-lg"
        >
          <div className="rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/60 overflow-hidden">
            {/* 터미널 헤더 */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100 bg-slate-50">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              </div>
              <span className="text-slate-600 text-xs font-mono ml-2">vulnai — bash</span>
              <div className="ml-auto flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-emerald-600 text-[10px] font-medium">live</span>
              </div>
            </div>
            {/* 터미널 내용 */}
            <div className="p-5 font-mono text-[13px] space-y-1.5 min-h-[190px] bg-slate-50/50 bg-dot-grid">
              {terminalLines.map((line, i) => (
                <motion.p
                  key={i}
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: line.delay + 0.5, duration: 0.3 }}
                  className={line.color}
                >
                  {line.text}
                </motion.p>
              ))}
            </div>
          </div>
        </motion.div>

        {/* 스탯 바 */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="relative z-10 mt-12 grid grid-cols-4 gap-px w-full max-w-lg rounded-2xl overflow-hidden border border-slate-200 bg-slate-200 shadow-sm"
        >
          {stats.map((s, i) => (
            <div key={i} className="flex flex-col items-center py-4 bg-white gap-0.5">
              <span className="text-xl font-bold text-sky-600 font-mono">{s.value}</span>
              <span className="text-[10px] text-slate-600 leading-tight text-center px-1">{s.label}</span>
            </div>
          ))}
        </motion.div>
      </section>

      <div className="section-divider" />

      {/* ───────── Features ───────── */}
      <section className="px-4 py-24 sm:py-28">
        <div className="mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-sky-200 bg-sky-50 text-sky-600 text-xs font-medium mb-4">
              핵심 기능
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
              탐지에서 설명까지, 전 과정 자동화
            </h2>
            <p className="text-slate-600 mt-3 text-sm max-w-md mx-auto">
              수동 코드 리뷰에 드는 시간을 AI가 대신합니다
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className={`group relative rounded-2xl border border-slate-200 bg-white
                  p-6 transition-all duration-300 cursor-default shadow-sm
                  hover:shadow-lg ${f.accent}`}
              >
                <div className={`w-11 h-11 rounded-xl ${f.iconBg} flex items-center justify-center mb-5 ring-1`}>
                  {f.icon}
                </div>
                <h3 className="font-semibold text-slate-800 mb-2.5 text-[15px]">{f.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{f.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* ───────── How it works ───────── */}
      <section className="px-4 py-24 sm:py-28">
        <div className="mx-auto max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-sky-200 bg-sky-50 text-sky-600 text-xs font-medium mb-4">
              분석 흐름
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
              4단계로 완성되는 취약점 분석
            </h2>
          </motion.div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {steps.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col items-center text-center p-5 rounded-2xl
                  border border-slate-200 bg-white shadow-sm
                  hover:border-sky-200 hover:shadow-md hover:shadow-sky-100/50
                  transition-all duration-300 group"
              >
                <div className={`relative w-12 h-12 rounded-2xl ${step.color} ring-1 flex items-center justify-center mb-4`}>
                  {step.icon}
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-white border border-slate-200 flex items-center justify-center text-[9px] font-bold font-mono text-slate-600 shadow-sm">
                    {i + 1}
                  </span>
                </div>
                <span className="text-sm font-semibold text-slate-700 mb-1.5">{step.label}</span>
                <span className="text-xs text-slate-600 leading-relaxed">{step.desc}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── CTA ───────── */}
      <section className="px-4 py-24 sm:py-28">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto max-w-2xl"
        >
          <div className="relative rounded-3xl overflow-hidden border border-sky-200 bg-gradient-to-br from-sky-50 via-white to-indigo-50 shadow-xl shadow-sky-100/50 p-12 sm:p-16 text-center">
            {/* 배경 장식 */}
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-sky-400/40 to-transparent" />
            <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full bg-sky-300/15 blur-[60px] pointer-events-none" />

            <div className="relative">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl
                bg-sky-100 border border-sky-200 mb-6 shadow-md shadow-sky-100">
                <ShieldCheck className="w-7 h-7 text-sky-500" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3">
                지금 바로 코드를 분석하세요
              </h2>
              <p className="text-slate-600 text-sm mb-8 leading-relaxed max-w-sm mx-auto">
                C/C++ 코드를 붙여넣거나 파일을 업로드하면
                AI가 즉시 보안 취약점을 분석해 드립니다.
              </p>
              <Link href="/analyze">
                <button className="group inline-flex items-center gap-2.5 h-12 px-8 rounded-xl
                  bg-sky-500 text-white font-semibold text-sm
                  hover:bg-sky-600 transition-all duration-200
                  shadow-lg shadow-sky-200 hover:shadow-xl hover:shadow-sky-300/50
                  btn-shimmer">
                  <Brain className="w-4 h-4" />
                  무료로 분석 시작
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </Link>
              <p className="mt-6 text-xs text-slate-600">
                완전 로컬 실행 · 데이터 전송 없음 · 오픈소스 모델 기반
              </p>
            </div>
          </div>
        </motion.div>
      </section>

    </div>
  )
}
