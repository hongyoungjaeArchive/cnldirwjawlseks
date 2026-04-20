import type { AnalysisRequest, AnalysisResult, DiffLine, Language } from './types'

export const OLLAMA_BASE   = process.env.NEXT_PUBLIC_OLLAMA_URL ?? 'http://localhost:11434'
export const DEFAULT_MODEL = 'codellama'
export type  AnalysisPhase = 'pass1' | 'pass2'

/* ── Ollama API 타입 ─────────────────────────────────── */
interface OllamaChatMessage { role: 'system' | 'user' | 'assistant'; content: string }
interface OllamaChatRequest {
  model: string; messages: OllamaChatMessage[]
  format: 'json'; stream: false
  options?: { temperature: number; top_p: number; num_predict: number; repeat_penalty: number }
}
interface OllamaChatResponse { model: string; message: OllamaChatMessage; done: boolean }
interface DetectionResult {
  status: 'vulnerable' | 'safe'; severity: string; confidence: number
  vulnerabilityType: { code: string; name: string; cweId: string; cweName: string }
  vulnerableLines: number[]; functionName?: string
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

  SAFE: `=== No Vulnerability Detected ===
The code applies secure coding practices. Confirm all safe patterns are correctly applied.`,
}

/* ═══════════════════════════════════════════════════════
   PASS 1 — 탐지 전용 시스템 프롬프트
═══════════════════════════════════════════════════════ */
const P1_SYSTEM = `You are a C/C++ vulnerability scanner. Identify IF and WHERE a vulnerability exists.
Do NOT write explanations or fixed code. Focus purely on detection.

Return ONLY this JSON:
{
  "_thinking": "<STEP1: list dangerous functions> <STEP2: match patterns> <STEP3: type + confidence>",
  "status": "vulnerable" | "safe",
  "severity": "critical" | "high" | "medium" | "low",
  "confidence": <0-100>,
  "vulnerabilityType": {"code":"<BOF|UAF|NPD|FMT|INT|OOB|SQLi|SAFE>","name":"<Korean>","cweId":"<CWE-XXX>","cweName":"<English>"},
  "vulnerableLines": [<1-based>],
  "functionName": "<name or null>"
}
Confidence: >85=unambiguous, 60-85=likely, <60=speculative`

/* ─── Pass 1 Few-shot: 전 유형 커버 (BOF·UAF·NPD·INT·OOB·FMT·SAFE) ─── */

// BOF
const P1_BOF_U = 'Scan:\n```c\nvoid f(char *s){char b[10];strcpy(b,s);printf("%s",b);}\n```'
const P1_BOF_A = JSON.stringify({
  _thinking:'STEP1:strcpy,10-byte stack buf,external s. STEP2:unbounded copy into fixed buf=BOF. STEP3:HIGH 93%.',
  status:'vulnerable',severity:'high',confidence:93,
  vulnerabilityType:{code:'BOF',name:'스택 기반 버퍼 오버플로우',cweId:'CWE-121',cweName:'Stack-based Buffer Overflow'},
  vulnerableLines:[1],functionName:'f',
})

// UAF
const P1_UAF_U = 'Scan:\n```c\nvoid f(){\n  int *p=(int*)malloc(4);\n  *p=1;\n  free(p);\n  printf("%d",*p);\n}\n```'
const P1_UAF_A = JSON.stringify({
  _thinking:'STEP1:malloc,free,then *p dereference after free. STEP2:pointer used after freed=UAF CWE-416. STEP3:HIGH 91%.',
  status:'vulnerable',severity:'high',confidence:91,
  vulnerabilityType:{code:'UAF',name:'해제 후 사용',cweId:'CWE-416',cweName:'Use After Free'},
  vulnerableLines:[5],functionName:'f',
})

// NPD
const P1_NPD_U = 'Scan:\n```c\nvoid f(size_t n){\n  char *buf=(char*)malloc(n);\n  memset(buf,0,n);\n}\n```'
const P1_NPD_A = JSON.stringify({
  _thinking:'STEP1:malloc return not checked,memset uses buf immediately. STEP2:if malloc fails(NULL),memset dereferences NULL=NPD. STEP3:MEDIUM 82%.',
  status:'vulnerable',severity:'medium',confidence:82,
  vulnerabilityType:{code:'NPD',name:'널 포인터 역참조',cweId:'CWE-476',cweName:'NULL Pointer Dereference'},
  vulnerableLines:[3],functionName:'f',
})

// INT
const P1_INT_U = 'Scan:\n```c\nvoid f(unsigned int len,char *data){\n  char *buf=(char*)malloc(len+1);\n  memcpy(buf,data,len);\n}\n```'
const P1_INT_A = JSON.stringify({
  _thinking:'STEP1:malloc(len+1) where len is user-controlled unsigned int. STEP2:if len=UINT_MAX, len+1 wraps to 0→malloc(0)→tiny alloc→heap BOF via memcpy. STEP3:HIGH 86%.',
  status:'vulnerable',severity:'high',confidence:86,
  vulnerabilityType:{code:'INT',name:'정수 오버플로우',cweId:'CWE-190',cweName:'Integer Overflow or Wraparound'},
  vulnerableLines:[2],functionName:'f',
})

// OOB
const P1_OOB_U = 'Scan:\n```c\nint arr[10];\nint f(int i){\n  return arr[i];\n}\n```'
const P1_OOB_A = JSON.stringify({
  _thinking:'STEP1:arr[i] with user-controlled i, no bounds check. STEP2:i can be negative or >=10=OOB read. STEP3:MEDIUM 88%.',
  status:'vulnerable',severity:'medium',confidence:88,
  vulnerabilityType:{code:'OOB',name:'범위 초과 읽기',cweId:'CWE-125',cweName:'Out-of-bounds Read'},
  vulnerableLines:[3],functionName:'f',
})

// FMT
const P1_FMT_U = 'Scan:\n```c\nvoid log(char *m){printf(m);}\n```'
const P1_FMT_A = JSON.stringify({
  _thinking:'STEP1:printf with user variable as first arg. STEP2:user controls format string=FMT. STEP3:MEDIUM 89%.',
  status:'vulnerable',severity:'medium',confidence:89,
  vulnerabilityType:{code:'FMT',name:'포맷 스트링 취약점',cweId:'CWE-134',cweName:'Use of Externally-Controlled Format String'},
  vulnerableLines:[1],functionName:'log',
})

// SAFE
const P1_SAFE_U = 'Scan:\n```c\nvoid f(char *s){\n  char b[64];\n  strncpy(b,s,sizeof(b)-1);\n  b[sizeof(b)-1]=\'\\0\';\n  printf("%s",b);\n}\n```'
const P1_SAFE_A = JSON.stringify({
  _thinking:'STEP1:strncpy with n-1 limit,explicit null,printf with literal format. STEP2:no unsafe patterns. STEP3:SAFE 4%.',
  status:'safe',severity:'low',confidence:4,
  vulnerabilityType:{code:'SAFE',name:'취약점 없음',cweId:'N/A',cweName:'No vulnerability detected'},
  vulnerableLines:[],functionName:'f',
})

function buildP1UserPrompt(code: string, lang: Language): string {
  return `Scan:\n\`\`\`${lang}\n${code}\n\`\`\``
}

/* ═══════════════════════════════════════════════════════
   PASS 2 — 심층 분석 시스템 프롬프트 (CWE 지식 주입)
═══════════════════════════════════════════════════════ */
function buildP2System(detection: DetectionResult): string {
  const knowledge = CWE_KNOWLEDGE[detection.vulnerabilityType.code] ?? CWE_KNOWLEDGE.SAFE
  return `You are a senior security engineer writing a professional Korean vulnerability report.
Detection result: ${detection.vulnerabilityType.code} (${detection.vulnerabilityType.cweId}) at lines [${detection.vulnerableLines.join(',')}].
DO NOT re-detect. Focus ONLY on explanation, fix, and diff.

## Expert Knowledge for This Vulnerability
${knowledge}

## OUTPUT JSON (Korean for all human text):
{
  "_thinking": "<use expert knowledge above to reason about this specific code>",
  "llmExplanation": {
    "cause":          "<3-4 Korean sentences: exact root cause in this specific code>",
    "attackScenario": "<3-4 Korean sentences: concrete steps an attacker would take>",
    "risk":           "<3-4 Korean sentences: impact, CVSS level, what attacker gains>",
    "fixDescription": "<3-4 Korean sentences: exact fix with function names>"
  },
  "fixedCode": "<complete corrected source, \\n for newlines>",
  "diff": [{"type":"unchanged"|"removed"|"added","content":"<exact line>"}]
}`
}

/* ─── Pass 2 Few-shot: BOF·FMT·UAF 심층 분석 예시 ─── */

// BOF deep
const P2_BOF_U = 'Code:\n```c\nvoid f(char *s){char b[10];strcpy(b,s);printf("%s\\n",b);}\n```\nDetected: BOF line 1'
const P2_BOF_A = JSON.stringify({
  _thinking:'strcpy copies all bytes of s into 10-byte stack b without bound. strlen(s)>=10 overwrites RBP+ret addr. Fix:strncpy with sizeof-1 and explicit null.',
  llmExplanation:{
    cause:'`strcpy(b, s)` 함수는 복사할 길이를 인자로 받지 않아, 소스 문자열의 모든 바이트를 무조건 복사합니다. 대상 버퍼 `b`는 스택에 10바이트로 선언되어 있어, 9바이트를 초과하는 입력이 들어오면 인접한 스택 영역이 덮어씌워집니다. 구체적으로 `b` 직후에 위치한 저장된 RBP와 반환 주소가 손상됩니다.',
    attackScenario:'공격자는 10바이트를 초과하는 정밀한 페이로드를 `s`로 전달합니다. 처음 10바이트로 버퍼를 채운 후, 이어지는 8바이트로 저장된 RBP를, 그다음 8바이트로 반환 주소를 ROP 가젯 주소로 교체합니다. 함수가 `ret` 명령을 실행하는 순간 제어 흐름이 공격자의 페이로드로 전환됩니다.',
    risk:'스택 기반 버퍼 오버플로우는 CVSS 3.1 최대 9.8(Critical)로 임의 코드 실행이 가능합니다. ASLR·스택 카나리가 없는 환경에서는 단순 페이로드로 셸 획득이 가능하며, 방어 기제가 있어도 정보 유출과 연계 시 우회됩니다.',
    fixDescription:'`strcpy` 대신 `strncpy(b, s, sizeof(b) - 1)`을 사용해 복사 길이를 버퍼 크기보다 1 작게 제한합니다. 이후 `b[sizeof(b) - 1] = \'\\0\'`으로 명시적 null 종료를 추가해야 합니다. 더 현대적인 대안으로 `snprintf(b, sizeof(b), "%s", s)` 사용을 권장합니다.',
  },
  fixedCode:'void f(char *s) {\n    char b[10];\n    strncpy(b, s, sizeof(b) - 1);\n    b[sizeof(b) - 1] = \'\\0\';\n    printf("%s\\n", b);\n}',
  diff:[
    {type:'unchanged',content:'void f(char *s) {'},
    {type:'unchanged',content:'    char b[10];'},
    {type:'removed',  content:'    strcpy(b, s);'},
    {type:'added',    content:'    strncpy(b, s, sizeof(b) - 1);'},
    {type:'added',    content:"    b[sizeof(b) - 1] = '\\0';"},
    {type:'unchanged',content:'    printf("%s\\n", b);'},
    {type:'unchanged',content:'}'},
  ],
})

// FMT deep
const P2_FMT_U = 'Code:\n```c\nvoid log(char *m){printf(m);}\n```\nDetected: FMT line 1'
const P2_FMT_A = JSON.stringify({
  _thinking:'printf(m) — m is user-controlled format string. %x reads stack, %n writes to stack. Fix: printf("%s",m).',
  llmExplanation:{
    cause:'`printf(m)`은 사용자가 전달한 문자열을 포맷 문자열로 직접 해석합니다. 공격자가 `%x`, `%n` 등의 포맷 지시자를 포함한 입력을 전달하면 printf는 이를 메모리 접근 명령으로 처리합니다.',
    attackScenario:'`%x%x%x%x`를 입력하면 스택의 내용을 16진수로 읽어내어 카나리 값이나 주소를 유출시킬 수 있습니다. `%[offset]$n`을 사용하면 스택 상의 특정 주소에 임의의 값을 쓸 수 있어 GOT 덮어쓰기(GOT overwrite)가 가능합니다.',
    risk:'정보 유출과 임의 메모리 쓰기가 모두 가능한 취약점입니다. 스택 카나리 우회, ASLR 무력화, 함수 포인터 변조에 활용될 수 있으며 다른 취약점과 연계 시 완전한 시스템 장악으로 이어질 수 있습니다.',
    fixDescription:'포맷 문자열은 항상 코드에서 직접 작성한 리터럴을 사용하고, 사용자 입력은 반드시 인자로만 전달해야 합니다. `printf(m)` → `printf("%s", m)`으로 수정하면 포맷 지시자 해석을 완전히 차단할 수 있습니다.',
  },
  fixedCode:'void log(char *m) {\n    printf("%s", m);\n}',
  diff:[
    {type:'unchanged',content:'void log(char *m) {'},
    {type:'removed',  content:'    printf(m);'},
    {type:'added',    content:'    printf("%s", m);'},
    {type:'unchanged',content:'}'},
  ],
})

// UAF deep
const P2_UAF_U = 'Code:\n```c\nvoid f(){\n  int *p=(int*)malloc(4);\n  *p=1;\n  free(p);\n  printf("%d",*p);\n}\n```\nDetected: UAF line 5'
const P2_UAF_A = JSON.stringify({
  _thinking:'free(p) at line 4, then *p dereference at line 5. After free, allocator may reuse the chunk. If attacker can control heap layout, *p reads attacker-controlled data. Fix: p=NULL after free.',
  llmExplanation:{
    cause:'`free(p)` 호출 이후에도 포인터 `p`가 NULL로 초기화되지 않아, `printf("%d", *p)`에서 해제된 메모리를 역참조합니다. `free()` 이후 해당 메모리 청크는 힙 할당자가 재사용할 수 있는 상태가 됩니다.',
    attackScenario:'공격자가 힙 그루밍(heap grooming)을 통해 free된 청크에 동일한 크기의 악의적 데이터를 채운 객체를 배치합니다. 이후 UAF 접근이 발생하면 공격자가 제어하는 데이터를 읽거나 쓸 수 있어 가상 함수 테이블(vtable) 포인터나 함수 포인터를 변조할 수 있습니다.',
    risk:'Use After Free는 힙 기반 임의 코드 실행으로 이어질 수 있는 심각한 취약점입니다(CVSS 최대 9.8). C++에서는 vtable 포인터 변조를 통한 가상 함수 탈취가 특히 위험하며, 현대 브라우저 익스플로잇의 가장 흔한 원인 중 하나입니다.',
    fixDescription:'`free(p)` 직후 반드시 `p = NULL;`을 추가하여 댕글링 포인터를 무효화합니다. C++에서는 `std::unique_ptr` 또는 `std::shared_ptr`를 사용해 소유권 기반 메모리 관리를 적용하면 이 유형의 취약점을 구조적으로 방지할 수 있습니다.',
  },
  fixedCode:'void f() {\n    int *p = (int*)malloc(4);\n    if (p == NULL) return;\n    *p = 1;\n    free(p);\n    p = NULL;\n    /* p는 이후 사용하지 않음 */\n}',
  diff:[
    {type:'unchanged',content:'void f() {'},
    {type:'unchanged',content:'    int *p = (int*)malloc(4);'},
    {type:'added',    content:'    if (p == NULL) return;'},
    {type:'unchanged',content:'    *p = 1;'},
    {type:'unchanged',content:'    free(p);'},
    {type:'added',    content:'    p = NULL;'},
    {type:'removed',  content:'    printf("%d", *p);'},
    {type:'added',    content:'    /* p는 이후 사용하지 않음 */'},
    {type:'unchanged',content:'}'},
  ],
})

function buildP2UserPrompt(code: string, lang: Language, d: DetectionResult): string {
  return `Code:\n\`\`\`${lang}\n${code}\n\`\`\`\nDetected: ${d.vulnerabilityType.code} (${d.vulnerabilityType.cweId}) at line(s) [${d.vulnerableLines.join(',')}], function: ${d.functionName ?? 'unknown'}\n\nProvide the deep analysis JSON.`
}

/* ═══════════════════════════════════════════════════════
   JSON 자동 복구
   모델이 살짝 망친 JSON(후행 쉼표, undefined 등)을 수정
═══════════════════════════════════════════════════════ */
function repairJSON(raw: string): string {
  return raw
    .replace(/,(\s*[}\]])/g, '$1')          // 후행 쉼표 제거
    .replace(/:\s*undefined\b/g, ': null')   // undefined → null
    .replace(/\/\/[^\n]*/g, '')              // 인라인 주석 제거
    .replace(/\/\*[\s\S]*?\*\//g, '')        // 블록 주석 제거
    .replace(/([{,]\s*)(\w+)\s*:/g, '$1"$2":') // 따옴표 없는 키 수정
    .trim()
}

function extractJSON(raw: string): string {
  const fence = raw.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fence) return repairJSON(fence[1].trim())
  const a = raw.indexOf('{'), b = raw.lastIndexOf('}')
  if (a !== -1 && b !== -1) return repairJSON(raw.slice(a, b + 1))
  return repairJSON(raw.trim())
}

/* ═══════════════════════════════════════════════════════
   Ollama fetch 헬퍼
═══════════════════════════════════════════════════════ */
async function ollamaChat(
  model: string, messages: OllamaChatMessage[],
  options: { temperature: number; top_p: number; num_predict: number; repeat_penalty: number },
  timeoutMs: number,
): Promise<string> {
  const body: OllamaChatRequest = { model, messages, format: 'json', stream: false, options }
  let res: Response
  try {
    res = await fetch(`${OLLAMA_BASE}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
    })
  } catch (err) {
    if (err instanceof Error && err.name === 'TimeoutError')
      throw new Error('Ollama 응답 시간이 초과되었습니다. 모델이 너무 크거나 서버가 바쁩니다.')
    throw new Error('Ollama에 연결할 수 없습니다. 터미널에서 `ollama serve`를 실행해주세요.')
  }
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    if (res.status === 404)
      throw new Error(`모델 "${model}"을 찾을 수 없습니다. \`ollama pull ${model}\`을 실행해주세요.`)
    throw new Error(`Ollama 오류 (${res.status}): ${text}`)
  }
  const data = (await res.json()) as OllamaChatResponse
  return data.message?.content ?? ''
}

/* ═══════════════════════════════════════════════════════
   PASS 1
═══════════════════════════════════════════════════════ */
async function runPass1(req: AnalysisRequest, model: string): Promise<DetectionResult> {
  const raw = await ollamaChat(
    model,
    [
      { role: 'system',    content: P1_SYSTEM },
      // 전 유형 few-shot: BOF, UAF, NPD, INT, OOB, FMT, SAFE
      { role: 'user',      content: P1_BOF_U  }, { role: 'assistant', content: P1_BOF_A  },
      { role: 'user',      content: P1_UAF_U  }, { role: 'assistant', content: P1_UAF_A  },
      { role: 'user',      content: P1_NPD_U  }, { role: 'assistant', content: P1_NPD_A  },
      { role: 'user',      content: P1_INT_U  }, { role: 'assistant', content: P1_INT_A  },
      { role: 'user',      content: P1_OOB_U  }, { role: 'assistant', content: P1_OOB_A  },
      { role: 'user',      content: P1_FMT_U  }, { role: 'assistant', content: P1_FMT_A  },
      { role: 'user',      content: P1_SAFE_U }, { role: 'assistant', content: P1_SAFE_A },
      { role: 'user',      content: buildP1UserPrompt(req.code, req.language) },
    ],
    { temperature: 0.05, top_p: 0.9, num_predict: 900, repeat_penalty: 1.1 },
    90_000,
  )

  let p: Record<string, unknown>
  try { p = JSON.parse(extractJSON(raw)) }
  catch { throw new Error('1단계 탐지에서 올바른 응답을 받지 못했습니다. 다시 시도해주세요.') }

  const vt = (p.vulnerabilityType ?? {}) as Record<string, unknown>
  return {
    status:    p.status === 'safe' ? 'safe' : 'vulnerable',
    severity:  ['critical','high','medium','low'].includes(p.severity as string) ? p.severity as string : 'medium',
    confidence: typeof p.confidence === 'number' ? p.confidence : 70,
    vulnerabilityType: {
      code:    String(vt.code    ?? 'UNKNOWN'),
      name:    String(vt.name    ?? '알 수 없음'),
      cweId:   String(vt.cweId   ?? 'CWE-000'),
      cweName: String(vt.cweName ?? 'Unknown'),
    },
    vulnerableLines: Array.isArray(p.vulnerableLines)
      ? (p.vulnerableLines as unknown[]).filter((n): n is number => typeof n === 'number') : [],
    functionName: typeof p.functionName === 'string' && p.functionName !== 'null'
      ? p.functionName : undefined,
  }
}

/* ═══════════════════════════════════════════════════════
   PASS 2
═══════════════════════════════════════════════════════ */
async function runPass2(
  req: AnalysisRequest, model: string, detection: DetectionResult,
): Promise<{ llmExplanation: AnalysisResult['llmExplanation']; fixedCode: string; diff: DiffLine[] }> {
  const raw = await ollamaChat(
    model,
    [
      { role: 'system',    content: buildP2System(detection) },
      // BOF·FMT·UAF 심층 분석 예시
      { role: 'user',      content: P2_BOF_U }, { role: 'assistant', content: P2_BOF_A },
      { role: 'user',      content: P2_FMT_U }, { role: 'assistant', content: P2_FMT_A },
      { role: 'user',      content: P2_UAF_U }, { role: 'assistant', content: P2_UAF_A },
      { role: 'user',      content: buildP2UserPrompt(req.code, req.language, detection) },
    ],
    { temperature: 0.15, top_p: 0.9, num_predict: 2800, repeat_penalty: 1.1 },
    150_000,
  )

  let p: Record<string, unknown>
  try { p = JSON.parse(extractJSON(raw)) }
  catch { throw new Error('2단계 분석에서 올바른 응답을 받지 못했습니다. 다시 시도해주세요.') }

  const exp = (p.llmExplanation ?? {}) as Record<string, unknown>
  const diff: DiffLine[] = Array.isArray(p.diff)
    ? (p.diff as Record<string,unknown>[]).map(d => ({
        type: ['removed','added','unchanged'].includes(d.type as string)
          ? d.type as DiffLine['type'] : 'unchanged',
        content: String(d.content ?? ''),
      }))
    : []

  return {
    llmExplanation: {
      cause:           String(exp.cause          ?? ''),
      attackScenario:  String(exp.attackScenario ?? ''),
      risk:            String(exp.risk           ?? ''),
      fixDescription:  String(exp.fixDescription ?? ''),
    },
    fixedCode: String(p.fixedCode ?? req.code),
    diff,
  }
}

/* ═══════════════════════════════════════════════════════
   메인 — Two-pass 조합
═══════════════════════════════════════════════════════ */
export async function analyzeWithOllama(
  request: AnalysisRequest,
  model: string = DEFAULT_MODEL,
  onPhase?: (phase: AnalysisPhase) => void,
): Promise<AnalysisResult> {
  onPhase?.('pass1')
  const detection = await runPass1(request, model)

  let details: Awaited<ReturnType<typeof runPass2>> | null = null
  if (detection.status === 'vulnerable') {
    onPhase?.('pass2')
    details = await runPass2(request, model, detection)
  }

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
    llmExplanation: details?.llmExplanation ?? {
      cause:          '취약점이 발견되지 않았습니다.',
      attackScenario: '알려진 공격 시나리오가 없습니다.',
      risk:           '현재 코드 범위에서 보안 위험이 발견되지 않았습니다.',
      fixDescription: '수정이 필요하지 않습니다.',
    },
    fixedCode: details?.fixedCode ?? request.code,
    diff:      details?.diff      ?? [],
    modelInfo: {
      name:    `Ollama / ${model}`,
      version: '3.0.0',
      dataset: 'Two-Pass · 7-type Few-shot · CoT · CWE Knowledge',
    },
    analyzedAt: new Date().toISOString(),
  }
}

/* ── 설치된 모델 목록 조회 ──────────────────────────── */
export async function fetchOllamaModels(): Promise<string[]> {
  try {
    const res = await fetch(`${OLLAMA_BASE}/api/tags`, { signal: AbortSignal.timeout(5_000) })
    if (!res.ok) return []
    const data = await res.json() as { models?: { name: string }[] }
    return (data.models ?? []).map(m => m.name)
  } catch { return [] }
}
