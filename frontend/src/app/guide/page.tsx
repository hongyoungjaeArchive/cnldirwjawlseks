'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  ArrowRight, Code2, Upload, Bot, Play, BarChart3,
  ChevronRight, FileCode2, AlertTriangle, Wrench, ArrowLeftRight,
  CheckCircle2, XCircle, Terminal,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { delay, duration: 0.45 },
})

const steps = [
  {
    num: '01',
    icon: <Code2 className="w-5 h-5 text-sky-600" />,
    title: '코드 입력',
    color: 'sky',
    desc: 'C/C++ 소스코드를 입력합니다.',
    items: [
      { icon: <Code2 className="w-3.5 h-3.5 text-slate-600" />, text: '에디터에 직접 붙여넣기' },
      { icon: <Upload className="w-3.5 h-3.5 text-slate-600" />, text: '.c / .cpp 파일 드래그 & 드롭 업로드' },
      { icon: <FileCode2 className="w-3.5 h-3.5 text-slate-600" />, text: '예시 코드 버튼으로 샘플 불러오기' },
    ],
  },
  {
    num: '02',
    icon: <Bot className="w-5 h-5 text-violet-600" />,
    title: 'Ollama 모델 선택',
    color: 'violet',
    desc: '로컬에서 실행 중인 Ollama 모델을 선택합니다.',
    items: [
      { icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />, text: 'Ollama 연결 상태가 초록색이면 준비 완료' },
      { icon: <Terminal className="w-3.5 h-3.5 text-slate-600" />, text: '드롭다운에서 설치된 모델 선택' },
      { icon: <CheckCircle2 className="w-3.5 h-3.5 text-sky-500" />, text: 'codellama / qwen2.5-coder 모델을 권장' },
    ],
  },
  {
    num: '03',
    icon: <Play className="w-5 h-5 text-emerald-600" />,
    title: '분석 시작',
    color: 'emerald',
    desc: '언어를 선택하고 분석 버튼을 누릅니다.',
    items: [
      { icon: <Code2 className="w-3.5 h-3.5 text-slate-600" />, text: 'C / C++ 중 해당 언어 선택' },
      { icon: <Play className="w-3.5 h-3.5 text-slate-600" />, text: '분석 시작 버튼 클릭' },
      { icon: <Bot className="w-3.5 h-3.5 text-slate-600" />, text: 'Ollama LLM이 코드를 분석 (30초~2분 소요)' },
    ],
  },
  {
    num: '04',
    icon: <BarChart3 className="w-5 h-5 text-amber-600" />,
    title: '결과 확인',
    color: 'amber',
    desc: '5개 섹션으로 구성된 분석 결과를 확인합니다.',
    items: [
      { icon: <CheckCircle2 className="w-3.5 h-3.5 text-slate-600" />, text: '취약 여부 · 위험도 · 신뢰도 요약' },
      { icon: <AlertTriangle className="w-3.5 h-3.5 text-slate-600" />, text: '원본 코드 하이라이트 + LLM 설명' },
      { icon: <Wrench className="w-3.5 h-3.5 text-slate-600" />, text: '수정 코드 제안 + Before/After 비교' },
    ],
  },
]

const resultSections = [
  {
    num: '01',
    icon: <BarChart3 className="w-4 h-4 text-slate-600" />,
    title: '분석 결과 요약',
    desc: '취약/정상 여부, 위험도(심각·높음·중간·낮음), AI 신뢰도(%), 취약점 유형(BOF·UAF 등)을 한눈에 확인합니다.',
  },
  {
    num: '02',
    icon: <Code2 className="w-4 h-4 text-sky-500" />,
    title: '원본 코드 · LLM 설명',
    desc: '왼쪽에는 취약한 줄이 빨간색으로 하이라이트된 원본 코드, 오른쪽에는 LLM이 생성한 취약 원인·공격 시나리오·보안 위험 설명이 표시됩니다.',
  },
  {
    num: '03',
    icon: <Wrench className="w-4 h-4 text-emerald-500" />,
    title: '수정 코드 제안',
    desc: 'LLM이 취약점을 제거한 안전한 코드를 제안합니다. 복사 버튼으로 바로 가져다 쓸 수 있습니다.',
  },
  {
    num: '04',
    icon: <ArrowLeftRight className="w-4 h-4 text-sky-500" />,
    title: 'Before / After 비교',
    desc: '취약한 원본 코드(빨강)와 수정된 코드(초록)를 diff 형태로 나란히 비교합니다.',
  },
  {
    num: '05',
    icon: <BarChart3 className="w-4 h-4 text-violet-500" />,
    title: '세부 분석 정보',
    desc: '취약 확률 수치, 사용 AI 모델 정보, CWE 분류(예: CWE-119 Buffer Overflow)를 확인할 수 있습니다.',
  },
]

const ollamaSetup = [
  { cmd: 'curl -fsSL https://ollama.com/install.sh | sh', desc: 'Ollama 설치 (macOS/Linux)' },
  { cmd: 'ollama serve', desc: '서버 실행' },
  { cmd: 'ollama pull codellama', desc: '코드 분석 특화 모델 다운로드' },
  { cmd: 'ollama pull qwen2.5-coder', desc: '대안 모델 (더 빠름)' },
]

const colorMap: Record<string, { border: string; bg: string; numColor: string; iconBg: string }> = {
  sky:     { border: 'border-sky-200',    bg: 'bg-sky-50',    numColor: 'text-sky-600',    iconBg: 'bg-sky-100' },
  violet:  { border: 'border-violet-200', bg: 'bg-violet-50', numColor: 'text-violet-600', iconBg: 'bg-violet-100' },
  emerald: { border: 'border-emerald-200',bg: 'bg-emerald-50',numColor: 'text-emerald-600',iconBg: 'bg-emerald-100' },
  amber:   { border: 'border-amber-200',  bg: 'bg-amber-50',  numColor: 'text-amber-600',  iconBg: 'bg-amber-100' },
}

export default function GuidePage() {
  return (
    <div className="flex-1 flex flex-col">
      {/* 히어로 */}
      <section className="px-4 py-14 sm:py-20 text-center border-b border-sky-100 bg-gradient-to-b from-sky-50 to-white">
        <motion.div {...fadeUp()} className="mx-auto max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-sky-200 bg-white text-sky-600 text-xs font-medium mb-5 shadow-sm">
            <CheckCircle2 className="w-3 h-3" />
            사용 가이드
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
            사용 방법 안내
          </h1>
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
            C/C++ 코드를 입력하면 AI가 취약점을 탐지하고<br className="hidden sm:block" />
            LLM이 원인과 수정 방법을 설명해 드립니다.
          </p>
        </motion.div>
      </section>

      <div className="mx-auto max-w-4xl w-full px-4 py-12 sm:py-16 flex flex-col gap-16">

        {/* ── 사용 흐름 4단계 ── */}
        <section>
          <motion.div {...fadeUp()} className="mb-8">
            <SectionTitle label="사용 흐름" title="4단계로 취약점 분석 완료" />
          </motion.div>

          <div className="flex flex-col gap-4">
            {steps.map((step, i) => {
              const c = colorMap[step.color]
              return (
                <motion.div key={i} {...fadeUp(i * 0.08)}>
                  <div className={`rounded-2xl border p-5 ${c.border} ${c.bg} shadow-sm`}>
                    <div className="flex items-start gap-4">
                      <div className="flex flex-col items-center gap-2 flex-shrink-0">
                        <span className={`text-2xl font-bold font-mono ${c.numColor}`}>{step.num}</span>
                        <div className={`w-9 h-9 rounded-xl ${c.iconBg} border ${c.border} flex items-center justify-center`}>
                          {step.icon}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-slate-800 mb-1">{step.title}</h3>
                        <p className="text-slate-600 text-sm mb-3">{step.desc}</p>
                        <ul className="flex flex-col gap-2">
                          {step.items.map((item, j) => (
                            <li key={j} className="flex items-center gap-2 text-sm text-slate-700">
                              <span className="flex-shrink-0">{item.icon}</span>
                              {item.text}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </section>

        {/* ── 결과 화면 구성 ── */}
        <section>
          <motion.div {...fadeUp()} className="mb-8">
            <SectionTitle label="결과 화면" title="5개 섹션으로 구성된 분석 리포트" />
          </motion.div>

          <div className="flex flex-col gap-3">
            {resultSections.map((s, i) => (
              <motion.div key={i} {...fadeUp(i * 0.07)}>
                <div className="flex gap-4 p-4 rounded-2xl border border-slate-200 bg-white hover:border-sky-200 hover:shadow-sm transition-all shadow-sm">
                  <div className="flex flex-col items-center gap-1.5 flex-shrink-0 pt-0.5">
                    <span className="text-xs font-bold font-mono text-sky-400">{s.num}</span>
                    <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center">
                      {s.icon}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800 mb-1">{s.title}</p>
                    <p className="text-xs text-slate-600 leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── Ollama 설정 ── */}
        <section>
          <motion.div {...fadeUp()} className="mb-8">
            <SectionTitle label="Ollama 설정" title="로컬 LLM 설치 및 실행 방법" />
          </motion.div>

          <motion.div {...fadeUp(0.1)} className="rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="flex items-center gap-2 px-4 py-3 bg-slate-100 border-b border-slate-200">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              </div>
              <span className="text-slate-600 text-xs font-mono ml-2">terminal</span>
            </div>
            <div className="p-4 flex flex-col gap-3 bg-slate-50 font-mono">
              {ollamaSetup.map((item, i) => (
                <div key={i} className="flex flex-col gap-1">
                  <span className="text-slate-600 text-xs"># {item.desc}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sky-500 text-sm select-none">$</span>
                    <code className="text-emerald-700 text-sm">{item.cmd}</code>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div {...fadeUp(0.15)} className="mt-4 p-4 rounded-2xl border border-amber-200 bg-amber-50 shadow-sm">
            <div className="flex gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-700 mb-1">권장 모델</p>
                <p className="text-xs text-slate-600 leading-relaxed">
                  코드 분석에는{' '}
                  <code className="font-mono text-amber-700 bg-amber-100 px-1 rounded">codellama</code> 또는{' '}
                  <code className="font-mono text-amber-700 bg-amber-100 px-1 rounded">qwen2.5-coder</code>를 권장합니다.
                  일반 모델(llama3.1 등)도 동작하지만 코드 이해도가 낮을 수 있습니다.
                </p>
              </div>
            </div>
          </motion.div>
        </section>

        {/* ── 취약점 유형 ── */}
        <section>
          <motion.div {...fadeUp()} className="mb-8">
            <SectionTitle label="탐지 가능 취약점" title="지원하는 취약점 유형" />
          </motion.div>

          <motion.div {...fadeUp(0.1)} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { code: 'BOF',  cwe: 'CWE-119/120', name: 'Buffer Overflow',         desc: '버퍼 경계를 초과한 메모리 쓰기' },
              { code: 'UAF',  cwe: 'CWE-416',     name: 'Use After Free',           desc: '해제된 메모리에 접근' },
              { code: 'NPD',  cwe: 'CWE-476',     name: 'Null Pointer Dereference', desc: 'NULL 포인터 역참조' },
              { code: 'FMT',  cwe: 'CWE-134',     name: 'Format String',            desc: '포맷 문자열 취약점' },
              { code: 'INT',  cwe: 'CWE-190',     name: 'Integer Overflow',         desc: '정수 오버플로우/언더플로우' },
              { code: 'OOB',  cwe: 'CWE-125/787', name: 'Out-of-Bounds',           desc: '범위 초과 읽기/쓰기' },
              { code: 'SQLi', cwe: 'CWE-89',      name: 'SQL Injection',            desc: 'SQL 쿼리 삽입 공격' },
              { code: 'SAFE', cwe: '—',           name: '취약점 없음',              desc: '정상 코드' },
            ].map((v, i) => (
              <div key={i} className="flex items-start gap-3 p-3.5 rounded-2xl border border-slate-200 bg-white shadow-sm hover:border-sky-200 transition-colors">
                <span className="font-mono text-xs font-bold px-2 py-1 rounded-lg bg-violet-50 text-violet-600 border border-violet-200 flex-shrink-0 mt-0.5">
                  {v.code}
                </span>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-semibold text-slate-800">{v.name}</span>
                    <span className="text-xs text-slate-600 font-mono">{v.cwe}</span>
                  </div>
                  <span className="text-xs text-slate-600">{v.desc}</span>
                </div>
              </div>
            ))}
          </motion.div>
        </section>

        {/* ── 주의사항 ── */}
        <section>
          <motion.div {...fadeUp()} className="mb-6">
            <SectionTitle label="주의사항" title="알아두면 좋은 점" />
          </motion.div>
          <motion.div {...fadeUp(0.1)} className="flex flex-col gap-3">
            {[
              { icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" />, text: '분석 결과는 참고용이며, 실제 보안 감사를 대체하지 않습니다.' },
              { icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" />, text: '코드가 길수록 정확도가 낮아질 수 있으므로 함수 단위로 잘라서 분석을 권장합니다.' },
              { icon: <XCircle className="w-4 h-4 text-red-500" />, text: 'Ollama가 실행되지 않으면 분석이 불가합니다. 연결 상태를 먼저 확인하세요.' },
              { icon: <XCircle className="w-4 h-4 text-red-500" />, text: '코드에 개인정보가 포함된 경우 민감 데이터를 제거 후 분석하세요. (로컬 처리이므로 외부 전송 없음)' },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3 p-3.5 rounded-2xl border border-slate-200 bg-white text-sm text-slate-700 shadow-sm">
                <span className="flex-shrink-0 mt-0.5">{item.icon}</span>
                {item.text}
              </div>
            ))}
          </motion.div>
        </section>

        {/* ── CTA ── */}
        <motion.div {...fadeUp()} className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-200">
          <Link href="/analyze" className="flex-1 sm:flex-none">
            <Button size="lg" className="w-full gap-2">
              코드 분석 시작하기
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <Link href="/" className="flex-1 sm:flex-none">
            <Button variant="secondary" size="lg" className="w-full">
              홈으로
            </Button>
          </Link>
        </motion.div>

      </div>
    </div>
  )
}

function SectionTitle({ label, title }: { label: string; title: string }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs font-semibold text-sky-600 uppercase tracking-wide">{label}</span>
        <ChevronRight className="w-3 h-3 text-slate-600" />
      </div>
      <h2 className="text-xl sm:text-2xl font-bold text-slate-900">{title}</h2>
    </div>
  )
}
