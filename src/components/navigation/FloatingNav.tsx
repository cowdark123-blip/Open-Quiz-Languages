'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, BookOpen, Target, MessageSquare, Settings, Brain } from 'lucide-react'

export function FloatingNav() {
  const pathname = usePathname()

  const navItems = [
    { name: 'Trang chủ', href: '/dashboard', icon: Home },
    { name: 'Bộ từ', href: '/sets', icon: BookOpen },
    { name: 'Luyện tập', href: '/quiz', icon: Target },
    { name: 'Hội thoại', href: '/conversation', icon: MessageSquare },
    { name: 'Cài đặt', href: '/settings', icon: Settings },
  ]

  return (
    <div className="fixed z-[40] left-1/2 -translate-x-1/2 bottom-6 md:bottom-auto md:top-6 w-[92%] max-w-[720px] flex justify-center pointer-events-none">
      <nav className="pointer-events-auto bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 shadow-2xl shadow-purple-900/20 rounded-full px-2 py-2 flex items-center justify-between sm:justify-center gap-1 sm:gap-2 w-full sm:w-max mx-auto overflow-x-auto no-scrollbar">
        {/* Logo/Brand for Desktop */}
        <Link href="/" className="hidden sm:flex shrink-0 items-center justify-center w-10 h-10 rounded-full bg-gradient-to-tr from-purple-600 to-cyan-500 shadow-lg shadow-purple-500/20 hover:scale-105 transition-transform mr-2">
          <Brain className="w-5 h-5 text-white" />
        </Link>
        
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`shrink-0 flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 rounded-full transition-all touch-manipulation group ${
                isActive
                  ? 'bg-purple-500/15 text-purple-300 border border-purple-500/20 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-purple-400' : 'group-hover:scale-110 transition-transform'}`} />
              <span className={`text-[11px] sm:text-xs font-medium whitespace-nowrap ${isActive ? 'block' : 'hidden md:block'}`}>
                {item.name}
              </span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
