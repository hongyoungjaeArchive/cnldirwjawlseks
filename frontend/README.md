# 동현찾아 천만리

AI 기반 C/C++ 소스코드 취약점 진단 시스템 (프론트엔드)

- **스택:** Next.js 16, React 19, TypeScript, TailwindCSS v4, framer-motion
- **LLM:** Ollama (로컬) — codellama 모델
- **분석 방식:** Two-pass · 7-type Few-shot · Chain-of-Thought · CWE Knowledge

---

## 실행 방법 (Docker Compose — 권장)

> Docker Desktop이 설치되어 있어야 합니다.

```bash
# 1. 저장소 클론
git clone <repo-url>
cd frontend

# 2. 실행 (Ollama 서버 + codellama 자동 설치 + 프론트엔드)
docker compose up --build
```

- 최초 실행 시 **codellama 모델 (~3.8GB)** 을 자동으로 다운로드합니다.
- 브라우저에서 `http://localhost:3000` 접속

### 종료

```bash
docker compose down
```

모델 캐시까지 완전 삭제하려면:

```bash
docker compose down -v
```

---

## 다른 PC에서 서버에 접속하는 경우

`docker-compose.yml`의 `NEXT_PUBLIC_OLLAMA_URL`을 서버 IP로 변경 후 빌드:

```bash
docker compose build --build-arg NEXT_PUBLIC_OLLAMA_URL=http://<서버IP>:11434
docker compose up
```

---

## 로컬 개발 환경 (Docker 없이)

### 사전 조건

- Node.js 20+
- [Ollama](https://ollama.com) 설치 후 실행

```bash
# Ollama 서버 실행
ollama serve

# codellama 모델 설치
ollama pull codellama
```

### 개발 서버 실행

```bash
npm install
npm run dev
```

`http://localhost:3000` 접속

---

## 프로젝트 구조

```
src/
├── app/
│   ├── page.tsx          # 랜딩 페이지
│   ├── analyze/          # 코드 입력 + 분석 시작
│   ├── results/          # 5섹션 분석 결과
│   └── guide/            # 사용 방법
├── components/
│   ├── analyze/          # CodeEditor, FileUpload
│   ├── results/          # ResultHeader, CodeExplainPanel, FixedCodePanel, DiffPanel, DetailPanel
│   ├── layout/           # Header
│   └── ui/               # Button, LoadingState
├── contexts/
│   └── AnalysisContext.tsx
└── lib/
    ├── ollama.ts         # LLM 연동 (Two-pass 분석 엔진)
    └── types.ts
```
