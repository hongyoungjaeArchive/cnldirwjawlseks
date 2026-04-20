'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ShieldCheck, Menu, X, Zap } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/', label: '홈' },
  { href: '/analyze', label: '코드 분석' },
  { href: '/guide', label: '사용 방법' },
]

export function Header() {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full bg-white/90 backdrop-blur-md border-b border-sky-100 shadow-sm shadow-sky-100/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex h-14 items-center justify-between">

          {/* 로고 */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="relative flex h-8 w-8 items-center justify-center rounded-xl overflow-hidden shadow-sm">
              <div className="absolute inset-0 bg-gradient-to-br from-sky-400 to-sky-600" />
              <ShieldCheck className="relative h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-[14px] text-slate-800 tracking-tight group-hover:text-sky-600 transition-colors">
              동현찾아<span className="text-sky-500"> 천만리</span>
            </span>
          </Link>

          {/* 데스크탑 네비 */}
          <nav className="hidden sm:flex items-center gap-0.5">
            {navItems.map(item => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'relative px-3.5 py-1.5 rounded-lg text-[13px] font-medium transition-all duration-200',
                    isActive
                      ? 'text-sky-600 bg-sky-50'
                      : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50',
                  )}
                >
                  <span className="relative">{item.label}</span>
                  {isActive && (
                    <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-sky-500 rounded-full" />
                  )}
                </Link>
              )
            })}
          </nav>

          {/* 오른쪽 */}
          <div className="flex items-center gap-2">
            <Link
              href="/analyze"
              className="hidden sm:inline-flex items-center gap-1.5 h-8 px-3.5 rounded-lg text-[12px] font-semibold
                bg-sky-500 text-white hover:bg-sky-600 transition-all duration-200
                shadow-md shadow-sky-200 btn-shimmer"
            >
              <Zap className="h-3 w-3" />
              분석 시작
            </Link>

            <button
              className="sm:hidden p-1.5 text-slate-600 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
              onClick={() => setMenuOpen(v => !v)}
              aria-label="메뉴"
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* 모바일 드롭다운 */}
        {menuOpen && (
          <div className="sm:hidden border-t border-sky-100 py-3 flex flex-col gap-0.5">
            {navItems.map(item => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className={cn(
                  'px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  pathname === item.href
                    ? 'bg-sky-50 text-sky-600'
                    : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50',
                )}
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-2 px-1">
              <Link
                href="/analyze"
                onClick={() => setMenuOpen(false)}
                className="flex items-center justify-center gap-1.5 h-9 rounded-lg bg-sky-500 text-white text-sm font-semibold shadow-md shadow-sky-200 btn-shimmer"
              >
                <Zap className="h-3.5 w-3.5" />
                분석 시작
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
