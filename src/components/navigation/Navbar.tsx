'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import {
  Brain,
  LayoutDashboard,
  BookOpen,
  Sparkles,
  Trophy,
  CalendarClock,
  Palette,
  Bug,
  Menu,
  X,
  LogOut,
  User,
  ChevronRight,
  Zap,
} from 'lucide-react'
import { BackgroundSwitcher } from '@/components/dashboard/BackgroundSwitcher'
import { BugReportModal } from '@/components/dashboard/BugReportModal'

export function Navbar() {
  const pathname = usePathname()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [isBgSwitcherOpen, setIsBgSwitcherOpen] = useState(false)
  const [isBugReportOpen, setIsBugReportOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        setIsLoggedIn(true)
        setUserEmail(data.session.user.email || null)
      }
    })

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setIsLoggedIn(true)
        setUserEmail(session.user.email || null)
      } else {
        setIsLoggedIn(false)
        setUserEmail(null)
      }
    })

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [])

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const navLinks = [
    { href: '/dashboard', label: 'Bảng Điều Khiển', icon: LayoutDashboard },
    { href: '/sets', label: 'Bộ Từ Vựng', icon: BookOpen },
    { href: '/quiz', label: 'Kiểm Tra Quiz', icon: Trophy },
  ]

  return (
    <>
      <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-800/80 px-4 md:px-8 py-3 transition-all duration-300">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-purple-500/20 group-hover:scale-105 transition-transform duration-300">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-lg tracking-tight text-white flex items-center gap-1.5 font-outfit">
                OpenQuiz{' '}
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-semibold tracking-normal">
                  AI
                </span>
              </span>
              <span className="text-[10px] text-slate-400 font-medium">SRS & Reflex Learning</span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-900/60 p-1.5 rounded-2xl border border-slate-800/80">
            {navLinks.map((link) => {
              const Icon = link.icon
              const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href))
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-2 ${
                    isActive
                      ? 'text-white bg-purple-600/30 border border-purple-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-purple-400' : 'text-slate-400'}`} />
                  <span>{link.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="activeTabGlow"
                      className="absolute bottom-0 left-3 right-3 h-[2px] bg-gradient-to-r from-purple-500 to-cyan-400 rounded-full"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                </Link>
              )
            })}
          </nav>

          {/* Action Trigger Buttons & Auth */}
          <div className="hidden md:flex items-center gap-3">
            {/* Background Switcher Trigger */}
            <button
              onClick={() => setIsBgSwitcherOpen(true)}
              className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-purple-400 transition-all flex items-center gap-1.5 text-xs font-semibold"
              title="Đổi Giao Diện Nền"
            >
              <Palette className="w-4 h-4 text-purple-400" />
              <span className="hidden lg:inline">Đổi Nền</span>
            </button>

            {/* Bug Report Trigger */}
            <button
              onClick={() => setIsBugReportOpen(true)}
              className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-rose-400 transition-all flex items-center gap-1.5 text-xs font-semibold"
              title="Báo Cáo Sự Cố"
            >
              <Bug className="w-4 h-4 text-rose-400" />
              <span className="hidden lg:inline">Báo Lỗi</span>
            </button>

            <div className="h-5 w-px bg-slate-800" />

            {/* Auth Buttons */}
            {isLoggedIn ? (
              <div className="flex items-center gap-3">
                <Link
                  href="/dashboard"
                  className="text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 px-4 py-2.5 rounded-xl shadow-lg shadow-purple-500/20 transition-all flex items-center gap-2"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>{userEmail ? userEmail.split('@')[0] : 'Tài Khoản'}</span>
                </Link>
                <button
                  onClick={handleSignOut}
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                  title="Đăng xuất"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="text-xs font-semibold text-slate-300 hover:text-white px-3 py-2 transition-colors"
                >
                  Đăng nhập
                </Link>
                <Link
                  href="/register"
                  className="text-xs font-bold text-white bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 hover:opacity-95 px-4 py-2.5 rounded-xl shadow-lg shadow-purple-500/20 transition-all"
                >
                  Đăng ký ngay
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Navigation Toggle Button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setIsBgSwitcherOpen(true)}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-purple-400"
              title="Đổi Giao Diện"
            >
              <Palette className="w-4 h-4" />
            </button>

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
              aria-label="Toggle Mobile Menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            {/* Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            />

            {/* Slide-in Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute right-0 top-0 bottom-0 w-4/5 max-w-sm glass-panel p-6 border-l border-slate-800 shadow-2xl flex flex-col justify-between"
            >
              <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <Brain className="w-6 h-6 text-purple-400" />
                    <span className="font-bold text-white text-base">OpenQuiz AI</span>
                  </div>
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-2 rounded-xl text-slate-400 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Nav Links */}
                <nav className="space-y-2">
                  {navLinks.map((link) => {
                    const Icon = link.icon
                    const isActive = pathname === link.href
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`flex items-center justify-between p-3 rounded-2xl text-sm font-bold transition-all ${
                          isActive
                            ? 'bg-purple-600/30 text-white border border-purple-500/40'
                            : 'text-slate-300 hover:bg-slate-900/80'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className={`w-5 h-5 ${isActive ? 'text-purple-400' : 'text-slate-400'}`} />
                          <span>{link.label}</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-500" />
                      </Link>
                    )
                  })}
                </nav>

                {/* Quick Action Triggers */}
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false)
                      setIsBugReportOpen(true)
                    }}
                    className="w-full p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-bold flex items-center justify-between"
                  >
                    <span className="flex items-center gap-2">
                      <Bug className="w-4 h-4 text-rose-400" />
                      Báo Cáo Sự Cố
                    </span>
                    <ChevronRight className="w-4 h-4 text-rose-400" />
                  </button>
                </div>
              </div>

              {/* Bottom Auth Section */}
              <div className="pt-6 border-t border-slate-800">
                {isLoggedIn ? (
                  <button
                    onClick={handleSignOut}
                    className="w-full py-3 rounded-xl bg-slate-900 border border-slate-800 text-rose-400 font-bold text-xs flex items-center justify-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Đăng xuất</span>
                  </button>
                ) : (
                  <div className="space-y-2">
                    <Link
                      href="/register"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-center font-bold text-xs shadow-lg"
                    >
                      Bắt đầu ngay
                    </Link>
                    <Link
                      href="/login"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block w-full py-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-center font-semibold text-xs"
                    >
                      Đăng nhập
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modals */}
      <BackgroundSwitcher isOpen={isBgSwitcherOpen} onClose={() => setIsBgSwitcherOpen(false)} />
      <BugReportModal isOpen={isBugReportOpen} onClose={() => setIsBugReportOpen(false)} />
    </>
  )
}
