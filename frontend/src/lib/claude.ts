import type { AnalysisRequest, AnalysisResult, DiffLine } from './types'
import { getStoredApiKey } from './apiKey'

export type AnalysisPhase = 'pass1' | 'pass2'
export type Pass2Model = 'sonnet' | 'opus'

export const PASS2_MODEL_LABELS: Record<Pass2Model, string> = {
  sonnet: 'Claude Sonnet',
  opus:   'Claude Opus',
}

interface DetectionResult {
  status: 'vulnerable' | 'safe'
  severity: string
  confidence: number
  vulnerabilityType: { code: string; name: string; cweId: string; cweName: string }
  vulnerableLines: number[]
  functionName?: string
}

async function callAnalyzeAPI(payload: Record<string, unknown>): Promise<Record<string, unknown>> {
  const apiKey = getStoredApiKey()
  if (!apiKey) throw new Error('API 키가 설정되지 않았습니다. 헤더의 키 버튼을 클릭하여 Claude API 키를 입력해주세요.')

  const res = await fetch('/api/analyze', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': apiKey,
    },
    body: JSON.stringify(payload),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error ?? `API 오류 (${res.status})`)
  return data
}

async function runPass1(req: AnalysisRequest): Promise<DetectionResult> {
  const data = await callAnalyzeAPI({ pass: 1, code: req.code, language: req.language })
  return data as unknown as DetectionResult
}

async function runPass2(
  req: AnalysisRequest,
  detection: DetectionResult,
  pass2Model: Pass2Model,
): Promise<{ llmExplanation: AnalysisResult['llmExplanation']; fixedCode: string; diff: DiffLine[]; usedModel: Pass2Model }> {
  const data = await callAnalyzeAPI({
    pass: 2,
    pass2Model,
    code: req.code,
    language: req.language,
    isSafe: detection.status === 'safe',
    detection: {
      vulnCode:     detection.vulnerabilityType.code,
      cweId:        detection.vulnerabilityType.cweId,
      lines:        detection.vulnerableLines,
      functionName: detection.functionName,
    },
  })
  return {
    llmExplanation: {
      cause:           String((data.llmExplanation as Record<string,unknown>)?.cause          ?? ''),
      attackScenario:  String((data.llmExplanation as Record<string,unknown>)?.attackScenario ?? ''),
      risk:            String((data.llmExplanation as Record<string,unknown>)?.risk           ?? ''),
      fixDescription:  String((data.llmExplanation as Record<string,unknown>)?.fixDescription ?? ''),
    },
    fixedCode: String(data.fixedCode ?? req.code),
    diff: (data.diff ?? []) as DiffLine[],
    usedModel: (data.usedModel as Pass2Model) ?? pass2Model,
  }
}

export async function analyzeWithClaude(
  request: AnalysisRequest,
  pass2Model: Pass2Model = 'sonnet',
  onPhase?: (phase: AnalysisPhase) => void,
): Promise<AnalysisResult> {
  onPhase?.('pass1')
  const detection = await runPass1(request)

  // 취약·안전 모두 Pass 2 실행 — Claude가 항상 설명 생성
  onPhase?.('pass2')
  const details = await runPass2(request, detection, pass2Model)

  const modelLabel = PASS2_MODEL_LABELS[details.usedModel]

  return {
    id: crypto.randomUUID(),
    status:     detection.status,
    severity:   detection.severity as AnalysisResult['severity'],
    confidence: Math.min(100, Math.max(0, detection.confidence)),
    vulnerabilityType:  detection.vulnerabilityType,
    originalCode:       request.code,
    language:           request.language,
    vulnerableLines:    detection.vulnerableLines,
    functionName:       detection.functionName,
    llmExplanation:     details.llmExplanation,
    fixedCode: details.fixedCode,
    diff:      details.diff,
    modelInfo: {
      name:    'Claude (Anthropic)',
      version: `Haiku 4.5 + ${modelLabel}`,
      dataset: 'Tool Use · Prompt Caching · CWE Knowledge',
    },
    analyzedAt: new Date().toISOString(),
  }
}
