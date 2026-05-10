import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  let apiKey: string
  try {
    const body = await req.json()
    apiKey = body.apiKey
  } catch {
    return NextResponse.json({ valid: false, error: '잘못된 요청 형식' }, { status: 400 })
  }

  if (!apiKey?.startsWith('sk-ant-')) {
    return NextResponse.json({ valid: false, error: 'API 키 형식이 올바르지 않습니다 (sk-ant-로 시작해야 합니다)' }, { status: 400 })
  }

  try {
    const client = new Anthropic({ apiKey })
    // 가장 저렴한 호출로 키 유효성만 확인 (1 토큰)
    await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1,
      messages: [{ role: 'user', content: 'Hi' }],
    })
    return NextResponse.json({ valid: true })
  } catch (e) {
    if (e instanceof Anthropic.AuthenticationError) {
      return NextResponse.json({ valid: false, error: '유효하지 않은 API 키입니다. Anthropic 콘솔에서 키를 확인해주세요.' }, { status: 401 })
    }
    if (e instanceof Anthropic.PermissionDeniedError) {
      return NextResponse.json({ valid: false, error: '이 API 키는 접근 권한이 없습니다.' }, { status: 403 })
    }
    if (e instanceof Anthropic.RateLimitError) {
      // 키는 유효하지만 한도 초과 — 저장 허용
      return NextResponse.json({ valid: true, warning: '요청 한도에 도달했습니다. 잠시 후 분석이 가능합니다.' })
    }
    const msg = e instanceof Error ? e.message : '알 수 없는 오류'
    return NextResponse.json({ valid: false, error: `키 검증 실패: ${msg}` }, { status: 500 })
  }
}
