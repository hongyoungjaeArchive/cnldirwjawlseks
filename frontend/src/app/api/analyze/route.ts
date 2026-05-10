import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

// prompt-caching 베타 헤더 포함
const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  defaultHeaders: { 'anthropic-beta': 'prompt-caching-2024-07-31' },
})

const PASS1_MODEL = 'claude-haiku-4-5-20251001'
const PASS2_MODELS = {
  sonnet: 'claude-sonnet-4-6',
  opus:   'claude-opus-4-7',
} as const
type Pass2ModelKey = keyof typeof PASS2_MODELS

/* ═══════════════════════════════════════════════════════
   Tool Use 스키마 — 구조화된 출력 강제 (JSON 파싱 실패 없음)
═══════════════════════════════════════════════════════ */
const detectTool: Anthropic.Tool = {
  name: 'detect_vulnerability',
  description: 'Classify the single most critical vulnerability in C/C++ code. Use SAFE only when you are highly confident there is no exploitable issue.',
  input_schema: {
    type: 'object' as const,
    properties: {
      status:     { type: 'string', enum: ['vulnerable', 'safe'] },
      severity:   { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
      confidence: { type: 'number', description: '0-100. >85=certain, 60-85=likely, <60=speculative' },
      vulnerabilityType: {
        type: 'object',
        properties: {
          code:    { type: 'string', enum: ['BOF', 'UAF', 'NPD', 'FMT', 'INT', 'OOB', 'SQLi', 'SAFE'] },
          name:    { type: 'string', description: 'Korean vulnerability name' },
          cweId:   { type: 'string', description: 'e.g. CWE-121' },
          cweName: { type: 'string', description: 'English CWE name' },
        },
        required: ['code', 'name', 'cweId', 'cweName'],
      },
      vulnerableLines: { type: 'array', items: { type: 'integer' }, description: '1-based line numbers' },
      functionName:    { type: 'string', description: 'Name of the vulnerable function, or null' },
    },
    required: ['status', 'severity', 'confidence', 'vulnerabilityType', 'vulnerableLines'],
  },
}

const analyzeTool: Anthropic.Tool = {
  name: 'analyze_vulnerability',
  description: 'Write a comprehensive Korean security report with explanation, fixed code, and diff.',
  input_schema: {
    type: 'object' as const,
    properties: {
      llmExplanation: {
        type: 'object',
        properties: {
          cause:          { type: 'string', description: '3-4 Korean sentences: exact root cause, referencing specific line numbers and function names' },
          attackScenario: { type: 'string', description: '3-4 Korean sentences: step-by-step attacker actions with technical details' },
          risk:           { type: 'string', description: '3-4 Korean sentences: CVSS range, what attacker gains, real-world impact' },
          fixDescription: { type: 'string', description: '3-4 Korean sentences: exact fix using specific safe API names' },
        },
        required: ['cause', 'attackScenario', 'risk', 'fixDescription'],
      },
      fixedCode: { type: 'string', description: 'Complete corrected source code (entire file, not just the changed function)' },
      diff: {
        type: 'array',
        description: 'All lines with type unchanged/removed/added',
        items: {
          type: 'object',
          properties: {
            type:    { type: 'string', enum: ['unchanged', 'removed', 'added'] },
            content: { type: 'string' },
          },
          required: ['type', 'content'],
        },
      },
    },
    required: ['llmExplanation', 'fixedCode', 'diff'],
  },
}

/* ═══════════════════════════════════════════════════════
   CWE 전문 지식 베이스
═══════════════════════════════════════════════════════ */
const CWE_KNOWLEDGE: Record<string, string> = {
  BOF: `=== Buffer Overflow (CWE-119/120/121/122) ===
ROOT CAUSES: strcpy, gets, sprintf, scanf("%s"), memcpy without size validation
STACK vs HEAP: Stack BOF → overwrites saved RBP + return address → control flow hijack
               Heap BOF  → corrupts heap metadata, next chunk header, or adjacent objects
EXPLOITATION: overflow → overwrite return address → ROP chain / ret2libc / shellcode
BYPASS: Stack canary leak via format string; ASLR bypass via info leak
SECURE ALT: strncpy(dst,src,n-1)+explicit null; strlcpy; snprintf; fgets(buf,n,stdin)`,

  UAF: `=== Use After Free (CWE-416) ===
ROOT CAUSE: pointer dereferenced after free() without setting to NULL
HEAP GROOMING: attacker allocates same-size chunk → freed memory reused → controlled content
EXPLOITATION: vtable pointer overwrite (C++), function pointer corruption, type confusion
TRIGGER CONTEXTS: callbacks called after object deletion, iterator invalidation during loop
SECURE FIX: free(ptr); ptr = NULL; — always nullify; prefer C++ smart pointers`,

  NPD: `=== Null Pointer Dereference (CWE-476) ===
ROOT CAUSE: return value of malloc/realloc/calloc/fopen not checked before use
NULL PAGE ATTACK: if attacker maps address 0, NULL deref → arbitrary write
DETECTION: ptr = malloc(n); ptr->field = x; — missing NULL check between lines
SECURE FIX: if(ptr == NULL){ handle_error(); return; } before first dereference`,

  FMT: `=== Format String (CWE-134) ===
ROOT CAUSE: user-controlled string passed as first arg to printf/fprintf/sprintf
READ: "%x" reads stack bytes; "%s" reads memory at stack pointer → info leak
WRITE: "%n" writes byte-count to address on stack → arbitrary write
EXPLOITATION: leak canary/addresses via %x → bypass ASLR/canary → GOT overwrite via %n
SECURE FIX: printf("%s", user_var) — ALWAYS use literal format string`,

  INT: `=== Integer Overflow/Underflow (CWE-190/191) ===
OVERFLOW: (uint)(large+1) wraps to 0 → malloc(0*elem) → tiny alloc → heap BOF
UNDERFLOW: (size_t)(0-1) = SIZE_MAX → huge allocation
SIGN: signed negative cast to size_t → huge positive → over-allocate/copy
COMMON CHAIN: int overflow → wrong malloc size → buffer overflow
SECURE FIX: validate before arithmetic; __builtin_add_overflow; cast to larger type first`,

  OOB: `=== Out-of-Bounds Read/Write (CWE-125/787) ===
OOB READ (125): adjacent memory disclosure → bypass ASLR, leak secrets, crash
OOB WRITE (787): overwrite adjacent variables, vtable pointers, heap metadata
OFF-BY-ONE: i <= n instead of i < n → write at exactly one past the end
SECURE FIX: if(index >= size) return error; before every array access`,

  SQLi: `=== SQL Injection (CWE-89) ===
ROOT CAUSE: user input concatenated into SQL string without parameterization
ATTACK FORMS: ' OR '1'='1 (auth bypass); UNION SELECT (data exfil); ; DROP TABLE
BLIND: boolean-based or time-based (SLEEP()) when no direct output
C CONTEXT: sprintf(query,"SELECT * FROM users WHERE id='%s'",user_input)
SECURE FIX: parameterized queries with ? placeholders; never concat user input into SQL`,

  SAFE: `=== Safe Code Patterns ===
Confirm which secure coding practices are present: bounds checking, null validation, safe APIs (strncpy, snprintf, fgets), proper error handling.`,
}

/* ═══════════════════════════════════════════════════════
   시스템 프롬프트 빌더
═══════════════════════════════════════════════════════ */
const P1_SYSTEM = `You are an expert C/C++ memory-safety vulnerability scanner for a cybersecurity capstone project.

Identify the SINGLE most critical vulnerability, if any exists. Vulnerability types:
- BOF: Buffer Overflow — strcpy/gets/sprintf/memcpy without bounds check
- UAF: Use After Free — pointer used after free() without nullification
- NPD: Null Pointer Dereference — malloc/calloc/fopen return unchecked before use
- FMT: Format String — user input as first argument to printf/fprintf/sprintf
- INT: Integer Overflow/Underflow — unchecked arithmetic on user values used in alloc/copy
- OOB: Out-of-Bounds Read/Write — array access without bounds check, off-by-one errors
- SQLi: SQL Injection — user input concatenated into SQL query string in C
- SAFE: No exploitable vulnerability — all inputs validated, safe APIs used correctly

Decision rules:
1. Only mark SAFE when highly confident (no dangerous patterns present)
2. vulnerableLines must point to the exact line(s) where exploitation begins
3. confidence > 85 means unambiguous; 60-85 means likely; < 60 means speculative`

function buildP2VulnSystem(vulnCode: string, cweId: string, lines: number[]): string {
  const knowledge = CWE_KNOWLEDGE[vulnCode] ?? ''
  return `You are a senior security engineer writing a detailed Korean vulnerability report for a cybersecurity capstone project.

This analysis is for an academic vulnerability detection system. Your explanations must be comprehensive and educational — helping students understand the vulnerability at a deep technical level.

Detected: ${vulnCode} (${cweId}) at lines [${lines.join(', ')}]
DO NOT re-detect. Provide explanation, fixed code, and diff ONLY.

## Expert Knowledge for ${vulnCode}
${knowledge}

## Writing Guidelines
- cause: Explain the exact root cause referencing specific line numbers and function names in the code
- attackScenario: Describe step-by-step attacker actions with technical details (memory layout, payload structure, exploitation flow)
- risk: State the CVSS score range, what privilege/access the attacker gains, and real-world consequences
- fixDescription: Name the specific safe API to use and explain exactly why it prevents exploitation
- fixedCode: Return the COMPLETE corrected source (entire file, using the same structure as input)
- diff: Cover ALL lines — every line must appear as "unchanged", "removed", or "added"

All human-readable text (cause/attackScenario/risk/fixDescription) must be in Korean.`
}

function buildP2SafeSystem(): string {
  return `You are a senior security engineer reviewing C/C++ code for a cybersecurity capstone project.

The code has been confirmed SAFE — no critical vulnerability detected.
Write a Korean security review that is educational and comprehensive.

## Writing Guidelines
- cause: Identify the specific secure coding patterns applied (e.g., bounds checking with strncpy, null checks after malloc, literal format strings)
- attackScenario: Describe which attack classes (BOF, UAF, FMT string, etc.) these patterns prevent and how
- risk: Explain what would happen if a developer removed these protections — what vulnerability would emerge
- fixDescription: Suggest any additional hardening improvements that could make the code even more robust
- fixedCode: Return the original code UNCHANGED
- diff: Return an empty array []

All human-readable text must be in Korean.`
}

/* ═══════════════════════════════════════════════════════
   Tool Use 결과 추출 헬퍼
═══════════════════════════════════════════════════════ */
function extractToolInput(msg: Anthropic.Message): Record<string, unknown> | null {
  const block = msg.content.find(b => b.type === 'tool_use')
  if (block?.type === 'tool_use') return block.input as Record<string, unknown>
  return null
}

/* ═══════════════════════════════════════════════════════
   요청 바디 타입
═══════════════════════════════════════════════════════ */
interface RequestBody {
  code: string
  language: string
  pass: 1 | 2
  pass2Model?: Pass2ModelKey
  isSafe?: boolean
  detection?: {
    vulnCode: string
    cweId: string
    lines: number[]
    functionName?: string
  }
}

/* ═══════════════════════════════════════════════════════
   POST /api/analyze
═══════════════════════════════════════════════════════ */
export async function POST(req: NextRequest) {
  let body: RequestBody
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: '잘못된 요청 형식' }, { status: 400 })
  }

  const { code, language, pass, pass2Model, isSafe, detection } = body

  try {
    /* ── Pass 1: 취약점 탐지 ── */
    if (pass === 1) {
      const msg = await client.messages.create({
        model: PASS1_MODEL,
        max_tokens: 1024,
        // 시스템 프롬프트 캐싱 — 동일 프롬프트 반복 요청 시 속도 ↑, 비용 ↓
        system: [{ type: 'text', text: P1_SYSTEM, cache_control: { type: 'ephemeral' } }],
        tools: [detectTool],
        tool_choice: { type: 'tool', name: 'detect_vulnerability' },
        messages: [{ role: 'user', content: `Scan this code:\n\`\`\`${language}\n${code}\n\`\`\`` }],
      })

      const input = extractToolInput(msg)
      if (!input) return NextResponse.json({ error: '탐지 도구 응답 없음' }, { status: 500 })

      const vt = (input.vulnerabilityType ?? {}) as Record<string, unknown>
      return NextResponse.json({
        status:    input.status === 'safe' ? 'safe' : 'vulnerable',
        severity:  ['critical','high','medium','low'].includes(input.severity as string) ? input.severity : 'medium',
        confidence: typeof input.confidence === 'number' ? Math.round(input.confidence) : 70,
        vulnerabilityType: {
          code:    String(vt.code    ?? 'UNKNOWN'),
          name:    String(vt.name    ?? '알 수 없음'),
          cweId:   String(vt.cweId   ?? 'CWE-000'),
          cweName: String(vt.cweName ?? 'Unknown'),
        },
        vulnerableLines: Array.isArray(input.vulnerableLines)
          ? (input.vulnerableLines as unknown[]).filter((n): n is number => typeof n === 'number') : [],
        functionName: typeof input.functionName === 'string' && input.functionName !== 'null'
          ? input.functionName : undefined,
      })
    }

    /* ── Pass 2: 심층 분석 (취약/안전 모두) ── */
    const selectedModel = PASS2_MODELS[pass2Model ?? 'sonnet']
    const det = detection ?? { vulnCode: 'SAFE', cweId: 'N/A', lines: [] }

    const systemText = isSafe
      ? buildP2SafeSystem()
      : buildP2VulnSystem(det.vulnCode, det.cweId, det.lines)

    const userContent = isSafe
      ? `Review this code (confirmed safe) and explain the secure patterns in Korean:\n\`\`\`${language}\n${code}\n\`\`\``
      : `Analyze this code:\n\`\`\`${language}\n${code}\n\`\`\`\nDetected: ${det.vulnCode} (${det.cweId}) at line(s) [${det.lines.join(', ')}]${det.functionName ? `, function: ${det.functionName}` : ''}\n\nWrite the full Korean security report.`

    const msg = await client.messages.create({
      model: selectedModel,
      max_tokens: 4096,
      // CWE 지식 + 지침이 담긴 대형 시스템 프롬프트 캐싱
      system: [{ type: 'text', text: systemText, cache_control: { type: 'ephemeral' } }],
      tools: [analyzeTool],
      tool_choice: { type: 'tool', name: 'analyze_vulnerability' },
      messages: [{ role: 'user', content: userContent }],
    })

    const input = extractToolInput(msg)
    if (!input) return NextResponse.json({ error: '분석 도구 응답 없음' }, { status: 500 })

    const exp = (input.llmExplanation ?? {}) as Record<string, unknown>
    return NextResponse.json({
      llmExplanation: {
        cause:           String(exp.cause          ?? ''),
        attackScenario:  String(exp.attackScenario ?? ''),
        risk:            String(exp.risk           ?? ''),
        fixDescription:  String(exp.fixDescription ?? ''),
      },
      fixedCode: String(input.fixedCode ?? code),
      diff: Array.isArray(input.diff)
        ? (input.diff as Record<string,unknown>[]).map(d => ({
            type: ['removed','added','unchanged'].includes(d.type as string) ? d.type : 'unchanged',
            content: String(d.content ?? ''),
          }))
        : [],
      usedModel: pass2Model ?? 'sonnet',
    })

  } catch (e) {
    const errMsg = e instanceof Error ? e.message : '서버 오류'
    return NextResponse.json({ error: errMsg }, { status: 500 })
  }
}
