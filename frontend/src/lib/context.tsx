'use client'

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import type { AnalysisResult, AnalysisRequest } from '@/lib/types'
import { analyzeWithOllama, DEFAULT_MODEL, type AnalysisPhase } from '@/lib/ollama'

interface AnalysisContextValue {
  result:       AnalysisResult | null
  isLoading:    boolean
  phase:        AnalysisPhase | null   // 현재 진행 중인 단계
  error:        string | null
  model:        string
  setModel:     (model: string) => void
  runAnalysis:  (req: AnalysisRequest) => Promise<void>
  clearResult:  () => void
}

const AnalysisContext = createContext<AnalysisContextValue | null>(null)

export function AnalysisProvider({ children }: { children: ReactNode }) {
  const [result,    setResult]    = useState<AnalysisResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [phase,     setPhase]     = useState<AnalysisPhase | null>(null)
  const [error,     setError]     = useState<string | null>(null)
  const [model,     setModel]     = useState(DEFAULT_MODEL)

  const runAnalysis = useCallback(async (req: AnalysisRequest) => {
    setIsLoading(true)
    setError(null)
    setPhase(null)
    try {
      const data = await analyzeWithOllama(req, model, (p) => setPhase(p))
      setResult(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : '분석 중 알 수 없는 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
      setPhase(null)
    }
  }, [model])

  const clearResult = useCallback(() => {
    setResult(null)
    setError(null)
    setPhase(null)
  }, [])

  return (
    <AnalysisContext.Provider value={{ result, isLoading, phase, error, model, setModel, runAnalysis, clearResult }}>
      {children}
    </AnalysisContext.Provider>
  )
}

export function useAnalysis() {
  const ctx = useContext(AnalysisContext)
  if (!ctx) throw new Error('useAnalysis must be used within AnalysisProvider')
  return ctx
}
