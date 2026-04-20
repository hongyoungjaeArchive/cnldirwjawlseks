# ── Stage 1: 의존성 설치 ──────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ── Stage 2: 빌드 ────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 브라우저에서 Ollama에 접근하는 URL (빌드 시 번들에 포함됨)
# 기본값: 로컬 실행 기준. 원격 서버 배포 시 --build-arg로 교체
ARG NEXT_PUBLIC_OLLAMA_URL=http://localhost:11434
ENV NEXT_PUBLIC_OLLAMA_URL=$NEXT_PUBLIC_OLLAMA_URL

RUN npm run build

# ── Stage 3: 실행 ────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/public ./public

EXPOSE 3000
CMD ["npm", "run", "start"]
