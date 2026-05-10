import { ShieldAlert, AlertTriangle, Wrench, Cpu, ExternalLink } from 'lucide-react'
import type { AnalysisResult } from '@/lib/types'
import { cn } from '@/lib/utils'

interface CWEInfo {
  koreanName: string
  cvss: string
  description: string
  rootCauses: string[]
  dangerousFunctions: string[]
  impact: string
  mitigation: string[]
}

const CWE_DETAIL: Record<string, CWEInfo> = {
  BOF: {
    koreanName: '버퍼 오버플로우',
    cvss: 'CVSS 9.8 (Critical)',
    description:
      '버퍼 오버플로우는 프로그램이 배열이나 버퍼의 경계를 넘어 데이터를 쓸 때 발생합니다. 스택 기반(CWE-121)과 힙 기반(CWE-122)으로 나뉘며, 인접 메모리를 덮어써 반환 주소·함수 포인터·힙 메타데이터를 변조할 수 있습니다.',
    rootCauses: [
      '길이 제한 없는 strcpy / gets / sprintf 사용',
      '사용자 입력 크기를 검증하지 않고 고정 크기 버퍼에 복사',
      'scanf("%s") 처럼 상한선 없는 입력 함수 사용',
      'memcpy / memmove 호출 시 크기 인자를 잘못 계산',
    ],
    dangerousFunctions: ['strcpy', 'strcat', 'gets', 'sprintf', 'scanf("%s")', 'memcpy (무검증)'],
    impact:
      '공격자는 스택의 반환 주소를 ROP 가젯이나 셸코드 주소로 덮어 임의 코드를 실행할 수 있습니다. 힙 BOF는 힙 청크 헤더를 변조해 임의 메모리 쓰기로 이어집니다. ASLR·카나리가 없는 환경에서는 단순 페이로드로 즉시 셸 획득이 가능합니다.',
    mitigation: [
      'strcpy → strncpy(dst, src, sizeof(dst)-1) 후 명시적 null 종료',
      'sprintf → snprintf(buf, sizeof(buf), fmt, ...) 사용',
      'gets → fgets(buf, sizeof(buf), stdin) 대체',
      '모든 외부 입력 길이를 복사 전에 명시적으로 검증',
      'C++ 환경은 std::string / std::vector 사용',
    ],
  },
  UAF: {
    koreanName: '해제 후 사용 (Use After Free)',
    cvss: 'CVSS 9.8 (Critical)',
    description:
      'free() 호출로 메모리를 반환한 뒤에도 해당 포인터를 계속 참조하는 취약점입니다(CWE-416). 해제된 청크는 힙 할당자가 재사용할 수 있어, 공격자가 힙 그루밍으로 악의적 데이터를 심어 가상 함수 테이블(vtable)이나 함수 포인터를 변조할 수 있습니다.',
    rootCauses: [
      'free(ptr) 이후 ptr = NULL 초기화 누락',
      '공유 포인터가 여러 경로에서 해제되는 이중 해제(double-free)',
      '콜백·이벤트 핸들러가 객체 삭제 이후 호출되는 구조',
      '컨테이너 반복 중 원소 삭제로 인한 이터레이터 무효화',
    ],
    dangerousFunctions: ['free() 후 포인터 접근', 'realloc() 이후 이전 포인터 사용', 'delete 후 포인터 접근 (C++)'],
    impact:
      '힙 그루밍 공격으로 해제된 메모리를 공격자 제어 데이터로 채운 뒤 UAF 접근을 유발합니다. C++ vtable 포인터를 변조해 가상 함수 호출을 탈취할 수 있으며, 현대 브라우저 익스플로잇의 가장 흔한 원인입니다(CVE 다수).',
    mitigation: [
      'free(ptr) 직후 반드시 ptr = NULL 추가',
      'C++에서 std::unique_ptr / std::shared_ptr 로 소유권 명시',
      '객체 삭제 전 모든 참조·콜백 등록 해제',
      '메모리 안전 언어(Rust) 또는 sanitizer(ASan)로 검증',
    ],
  },
  NPD: {
    koreanName: '널 포인터 역참조',
    cvss: 'CVSS 7.5 (High)',
    description:
      'malloc·realloc·calloc·fopen 등의 반환값이 NULL인지 확인하지 않고 바로 역참조하는 취약점입니다(CWE-476). 일반적으로 프로그램 크래시(DoS)를 유발하지만, 일부 시스템에서는 NULL 페이지 매핑을 통해 임의 코드 실행으로 연결됩니다.',
    rootCauses: [
      'malloc / calloc 반환값 NULL 체크 누락',
      'fopen 실패 시 NULL 포인터 그대로 사용',
      '포인터 반환 함수의 실패 경로 처리 미흡',
      '조건 분기에서 NULL 가능성 있는 경로 누락',
    ],
    dangerousFunctions: ['malloc (미검증)', 'calloc', 'realloc', 'fopen', 'strdup', 'getenv'],
    impact:
      '프로세스 크래시로 서비스 거부(DoS)를 유발합니다. 커널 또는 임베디드 환경에서 NULL 페이지(0x0)를 mmap으로 매핑할 수 있는 경우, NULL 역참조가 임의 코드 실행 또는 권한 상승으로 이어질 수 있습니다.',
    mitigation: [
      'malloc / fopen 등 모든 할당 직후 if (ptr == NULL) 처리',
      '중앙화된 할당 래퍼 함수로 NULL 체크 일원화',
      'C++ 환경에서 new 대신 std::make_unique 등 사용',
      '정적 분석 도구(Clang Static Analyzer)로 NULL 경로 검출',
    ],
  },
  FMT: {
    koreanName: '포맷 스트링 취약점',
    cvss: 'CVSS 9.8 (Critical)',
    description:
      '사용자가 제어하는 문자열이 printf 계열 함수의 첫 번째 인자(포맷 문자열)로 직접 전달될 때 발생합니다(CWE-134). %x로 스택 메모리를 읽고 %n으로 임의 주소에 쓸 수 있어, 정보 유출과 임의 코드 실행이 모두 가능한 치명적 취약점입니다.',
    rootCauses: [
      'printf(user_str) 처럼 포맷 리터럴 없이 사용자 문자열을 직접 전달',
      'fprintf / sprintf / syslog 에도 동일한 패턴 존재',
      '로깅 함수에서 메시지를 포맷으로 전달하는 실수',
    ],
    dangerousFunctions: ['printf(user)', 'fprintf(f, user)', 'sprintf(buf, user)', 'syslog(LOG_INFO, user)', 'err(1, user)'],
    impact:
      '%x, %p 지시자로 스택의 카나리·주소를 유출해 ASLR을 무력화합니다. %n 지시자로 GOT(Global Offset Table) 항목을 덮어 임의 함수 포인터를 교체할 수 있습니다. 단일 포맷 스트링 취약점만으로 셸 획득이 가능한 공격입니다.',
    mitigation: [
      'printf(user) → printf("%s", user) 로 반드시 리터럴 포맷 사용',
      'fprintf(f, user) → fprintf(f, "%s", user)',
      '컴파일 옵션 -Wformat -Wformat-security 활성화',
      'gcc/clang의 __attribute__((format(printf,...))) 적용',
    ],
  },
  INT: {
    koreanName: '정수 오버플로우 / 언더플로우',
    cvss: 'CVSS 9.8 (Critical)',
    description:
      '정수 연산 결과가 해당 타입의 표현 범위를 초과해 랩어라운드(wraparound)가 발생합니다(CWE-190/191). 가장 흔한 공격 체인은 잘못된 정수 값이 malloc 크기 인자로 전달되어 극소 버퍼를 할당한 뒤 힙 오버플로우를 유발하는 것입니다.',
    rootCauses: [
      '사용자 입력 정수를 검증 없이 산술 연산에 사용 (len+1, count*size)',
      'unsigned 타입에서 0 빼기 → SIZE_MAX 언더플로우',
      'signed-to-unsigned 묵시적 변환으로 음수가 큰 양수로 둔갑',
      'int 연산 후 size_t로 캐스팅할 때 오버플로우 미감지',
    ],
    dangerousFunctions: ['malloc(user_len + 1)', 'calloc(count, size)', 'memcpy(buf, src, len*elem)', 'realloc(ptr, new_size)'],
    impact:
      'int 오버플로우 → malloc(0) 호출 → 실제 데이터보다 작은 버퍼 할당 → 힙 버퍼 오버플로우 → 임의 코드 실행. 이 체인은 네트워크 프로토콜 파서에서 특히 자주 발생하며 원격 코드 실행(RCE)으로 이어집니다.',
    mitigation: [
      '곱셈 전 SIZE_MAX / elem >= count 사전 검증',
      '__builtin_add_overflow / __builtin_mul_overflow (GCC/Clang) 사용',
      'safeint 또는 checked_int 같은 안전 정수 라이브러리 도입',
      'calloc(count, size) 는 내부적으로 곱셈 오버플로우를 감지함 — 선호',
    ],
  },
  OOB: {
    koreanName: '범위 초과 읽기 / 쓰기',
    cvss: 'CVSS 9.1 (Critical)',
    description:
      '배열 인덱스나 포인터 오프셋이 할당된 버퍼 범위를 벗어나 메모리를 읽거나 쓰는 취약점입니다(CWE-125 읽기, CWE-787 쓰기). 오프-바이-원(off-by-one) 오류가 대표적이며, 인접 변수·카나리·포인터 등을 변조할 수 있습니다.',
    rootCauses: [
      '루프 조건 i <= n (올바른 i < n)',
      '사용자 제공 인덱스를 범위 검사 없이 배열 접근에 사용',
      '음수 인덱스로 배열 이전 메모리 접근 (부호 없는 비교 실수)',
      '포인터 산술에서 경계값 계산 오류',
    ],
    dangerousFunctions: ['arr[user_index]', 'ptr + user_offset', 'memcpy (크기 초과)', 'strncpy (off-by-one)'],
    impact:
      'OOB 읽기는 인접 메모리의 카나리·포인터·비밀 값을 유출해 ASLR 우회에 사용됩니다. OOB 쓰기는 인접 변수 변조, 함수 포인터 교체, 힙 메타데이터 손상으로 임의 코드 실행으로 이어질 수 있습니다.',
    mitigation: [
      '모든 배열 접근 전 if (index < 0 || index >= size) 검증',
      '루프 상한을 < size 로 통일 (<=는 항상 의심)',
      '사용자 제공 오프셋은 반드시 부호를 포함해 양수 여부 확인',
      'AddressSanitizer(-fsanitize=address)로 테스트 중 경계 위반 탐지',
    ],
  },
  SQLi: {
    koreanName: 'SQL 인젝션',
    cvss: 'CVSS 9.8 (Critical)',
    description:
      '사용자 입력이 SQL 쿼리 문자열에 직접 삽입되어 쿼리 구조가 변조되는 취약점입니다(CWE-89). C 코드에서는 sprintf로 쿼리를 조립하는 패턴이 대표적이며, 인증 우회·데이터 유출·DB 파괴가 가능합니다.',
    rootCauses: [
      'sprintf(query, "SELECT ... WHERE id=\'%s\'", user_input) 처럼 문자열 연결로 쿼리 생성',
      '입력값에서 따옴표·특수문자를 이스케이프하지 않음',
      '동적 쿼리 생성 시 준비된 구문(prepared statement) 미사용',
    ],
    dangerousFunctions: ['sprintf(query, ...user...)', 'strcat(query, user)', 'snprintf (여전히 위험, 파라미터화 미사용)'],
    impact:
      '\' OR \'1\'=\'1 으로 인증을 우회하거나, UNION SELECT로 전체 DB를 덤프할 수 있습니다. 블라인드 인젝션(SLEEP 기반)으로 감지를 회피하며 데이터를 추출합니다. 일부 DB에서는 xp_cmdshell, LOAD_FILE 등으로 OS 명령 실행도 가능합니다.',
    mitigation: [
      '준비된 구문(prepared statement)과 파라미터 바인딩으로 쿼리 구조 분리',
      '사용자 입력을 절대 SQL 문자열에 직접 삽입하지 않음',
      'ORM 또는 쿼리 빌더 라이브러리 사용',
      '최소 권한 DB 계정으로 연결 (SELECT만 필요한 경우 INSERT/DROP 권한 제거)',
    ],
  },
  SAFE: {
    koreanName: '취약점 없음',
    cvss: '해당 없음',
    description:
      '분석 결과 코드에서 알려진 취약점 패턴이 발견되지 않았습니다. 안전한 함수 사용, 입력 검증, 메모리 관리가 적절히 구현되어 있습니다.',
    rootCauses: [],
    dangerousFunctions: [],
    impact: '현재 코드 범위에서 탐지된 보안 위험이 없습니다.',
    mitigation: [
      '정기적인 코드 리뷰와 정적 분석 도구 적용 유지',
      '새로운 기능 추가 시 보안 설계 원칙 준수',
      '의존 라이브러리의 CVE를 주기적으로 모니터링',
    ],
  },
}

interface CWEPanelProps {
  result: AnalysisResult
}

export function CWEPanel({ result }: CWEPanelProps) {
  const code = result.vulnerabilityType.code
  const info = CWE_DETAIL[code] ?? CWE_DETAIL.SAFE
  const isSafe = code === 'SAFE'

  const severityColor = {
    critical: { bg: 'bg-red-50', border: 'border-red-200', badge: 'bg-red-100 text-red-700 border-red-200', text: 'text-red-700' },
    high:     { bg: 'bg-orange-50', border: 'border-orange-200', badge: 'bg-orange-100 text-orange-700 border-orange-200', text: 'text-orange-700' },
    medium:   { bg: 'bg-amber-50', border: 'border-amber-200', badge: 'bg-amber-100 text-amber-700 border-amber-200', text: 'text-amber-700' },
    low:      { bg: 'bg-sky-50', border: 'border-sky-200', badge: 'bg-sky-100 text-sky-700 border-sky-200', text: 'text-sky-700' },
  }[result.severity] ?? { bg: 'bg-slate-50', border: 'border-slate-200', badge: 'bg-slate-100 text-slate-700 border-slate-200', text: 'text-slate-700' }

  return (
    <div className="rounded-2xl border border-violet-200 bg-white overflow-hidden shadow-sm">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-violet-50 border-b border-violet-200">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-3.5 h-3.5 text-violet-600" />
          <span className="text-xs font-semibold text-violet-700">CWE 취약점 상세 정보</span>
        </div>
        <div className="flex items-center gap-2">
          {!isSafe && (
            <span className={cn('px-2 py-0.5 rounded-full text-[11px] font-semibold border', severityColor.badge)}>
              {info.cvss}
            </span>
          )}
          <span className="px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 border border-violet-200 text-[11px] font-mono font-semibold">
            {result.vulnerabilityType.cweId}
          </span>
        </div>
      </div>

      <div className="p-4 flex flex-col gap-4">
        {/* 타이틀 */}
        <div>
          <h3 className="text-base font-bold text-slate-800">{info.koreanName}</h3>
          <p className="text-xs text-slate-500 mt-0.5 font-mono">{result.vulnerabilityType.cweName}</p>
        </div>

        {/* 개요 */}
        <div className="px-3.5 py-3 rounded-xl bg-slate-50 border border-slate-200">
          <p className="text-xs text-slate-700 leading-relaxed">{info.description}</p>
        </div>

        {!isSafe && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* 발생 원인 */}
            {info.rootCauses.length > 0 && (
              <InfoSection
                icon={<AlertTriangle className="w-3.5 h-3.5 text-amber-500" />}
                title="주요 발생 원인"
                color="amber"
              >
                <ul className="flex flex-col gap-1.5 mt-2">
                  {info.rootCauses.map((cause, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-slate-700 leading-relaxed">
                      <span className="text-amber-400 mt-0.5 flex-shrink-0">•</span>
                      {cause}
                    </li>
                  ))}
                </ul>
              </InfoSection>
            )}

            {/* 위험 함수 */}
            {info.dangerousFunctions.length > 0 && (
              <InfoSection
                icon={<Cpu className="w-3.5 h-3.5 text-red-500" />}
                title="위험 함수 / 패턴"
                color="red"
              >
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {info.dangerousFunctions.map((fn, i) => (
                    <code key={i} className="px-2 py-0.5 rounded-md bg-red-50 border border-red-200 text-red-700 text-[11px] font-mono">
                      {fn}
                    </code>
                  ))}
                </div>
              </InfoSection>
            )}
          </div>
        )}

        {/* 영향 / 공격 결과 */}
        <InfoSection
          icon={<ShieldAlert className="w-3.5 h-3.5 text-orange-500" />}
          title={isSafe ? '보안 상태' : '악용 시 영향'}
          color="orange"
        >
          <p className="text-xs text-slate-700 leading-relaxed mt-2">{info.impact}</p>
        </InfoSection>

        {/* 권장 수정 방법 */}
        <InfoSection
          icon={<Wrench className="w-3.5 h-3.5 text-emerald-600" />}
          title="권장 수정 방법"
          color="emerald"
        >
          <ul className="flex flex-col gap-1.5 mt-2">
            {info.mitigation.map((m, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-slate-700 leading-relaxed">
                <span className="text-emerald-500 mt-0.5 flex-shrink-0">✓</span>
                {m}
              </li>
            ))}
          </ul>
        </InfoSection>

        {/* MITRE 링크 */}
        {result.vulnerabilityType.cweId !== 'N/A' && (
          <div className="flex justify-end">
            <a
              href={`https://cwe.mitre.org/data/definitions/${result.vulnerabilityType.cweId.replace('CWE-', '')}.html`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[11px] text-violet-600 hover:text-violet-800 transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
              MITRE CWE 공식 문서 보기
            </a>
          </div>
        )}
      </div>
    </div>
  )
}

function InfoSection({
  icon, title, color, children,
}: {
  icon: React.ReactNode
  title: string
  color: 'amber' | 'red' | 'orange' | 'emerald'
  children: React.ReactNode
}) {
  const borderMap = {
    amber:   'border-amber-200',
    red:     'border-red-200',
    orange:  'border-orange-200',
    emerald: 'border-emerald-200',
  }
  const labelMap = {
    amber:   'text-amber-700',
    red:     'text-red-700',
    orange:  'text-orange-700',
    emerald: 'text-emerald-700',
  }

  return (
    <div className={cn('rounded-xl border p-3', borderMap[color])}>
      <div className="flex items-center gap-1.5">
        {icon}
        <span className={cn('text-xs font-semibold', labelMap[color])}>{title}</span>
      </div>
      {children}
    </div>
  )
}
