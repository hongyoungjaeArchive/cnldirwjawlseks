import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { Header } from '@/components/Header'
import { AnalysisProvider } from '@/lib/context'
import { ApiKeyProvider } from '@/lib/apiKeyContext'
import { ApiKeyModal } from '@/components/ApiKeyModal'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] })

export const metadata: Metadata = {
  title: '동현찾아 천만리 — 소스코드 취약점 분석',
  description: 'CodeBERT + LLM 기반 C/C++ 소스코드 보안 취약점 자동 분석 시스템',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full`}
    >
      <body className="min-h-full flex flex-col bg-sky-50 text-slate-900 antialiased">
        <ApiKeyProvider>
          <AnalysisProvider>
            <ApiKeyModal />
            <Header />
            <main className="flex-1 flex flex-col">{children}</main>
          </AnalysisProvider>
        </ApiKeyProvider>
      </body>
    </html>
  )
}
