export type Severity = 'critical' | 'high' | 'medium' | 'low'
export type Language = 'c' | 'cpp'
export type AnalysisStatus = 'vulnerable' | 'safe'

export interface VulnerabilityType {
  code: string
  name: string
  cweId: string
  cweName: string
}

export interface LLMExplanation {
  cause: string
  attackScenario: string
  risk: string
  fixDescription: string
}

export interface DiffLine {
  type: 'removed' | 'added' | 'unchanged'
  content: string
}

export interface AnalysisResult {
  id: string
  status: AnalysisStatus
  severity: Severity
  confidence: number
  vulnerabilityType: VulnerabilityType
  originalCode: string
  language: Language
  vulnerableLines: number[]
  functionName?: string
  llmExplanation: LLMExplanation
  fixedCode: string
  diff: DiffLine[]
  modelInfo: {
    name: string
    version: string
    dataset: string
  }
  analyzedAt: string
}

export interface AnalysisRequest {
  code: string
  language: Language
}
