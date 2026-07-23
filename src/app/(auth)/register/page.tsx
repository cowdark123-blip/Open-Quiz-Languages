'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Brain, AlertCircle, ShieldCheck } from 'lucide-react'

export default function RegisterPage() {
  const [loadingProvider, setLoadingProvider] = useState<'google' | 'github' | null>(null)
  const [errorMsg, setErrorMsg] = useState('')

  const handleOAuthLogin = async (provider: 'google' | 'github') => {
    setLoadingProvider(provider)
    setErrorMsg('')

    try {
      const supabase = createClient()
      const origin = typeof window !== 'undefined' ? window.location.origin : ''
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${origin}/auth/callback`,
        },
      })

      if (error) {
        setErrorMsg(`Không thể kết nối ${provider}: ${error.message}`)
        setLoadingProvider(null)
      }
    } catch (err: any) {
      setErrorMsg(`Lỗi kết nối: ${err.message || 'Vui lòng thử lại'}`)
      setLoadingProvider(null)
    }
  }

  return (
    <div className="min-h-screen bg-[#090d16] flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[400px] h-[400px] bg-purple-600/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-cyan-600/20 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md glass-panel p-8 rounded-3xl border border-slate-800 shadow-2xl relative z-10 space-y-6">
        <div className="flex flex-col items-center text-center">
          <Link href="/" className="flex items-center gap-2 mb-4 group">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-purple-500/20 group-hover:scale-105 transition-transform">
              <Brain className="w-7 h-7 text-white" />
            </div>
          </Link>
          <h2 className="text-2xl font-black text-white">Tạo Tài Khoản OpenQuiz AI</h2>
          <p className="text-slate-400 text-xs mt-1">
            Đăng ký nhanh chóng thông qua tài khoản Google hoặc GitHub của bạn
          </p>
        </div>

        {errorMsg && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-red-400 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* OAuth Buttons Container */}
        <div className="space-y-3 pt-2">
          {/* Google Button */}
          <button
            onClick={() => handleOAuthLogin('google')}
            disabled={loadingProvider !== null}
            className="w-full py-3.5 px-4 rounded-2xl glass-card hover:bg-slate-800 text-slate-100 font-bold text-sm border border-slate-700/80 hover:border-purple-500/50 transition-all shadow-lg flex items-center justify-center gap-3 group active:scale-98 disabled:opacity-50"
          >
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>{loadingProvider === 'google' ? 'Đang kết nối Google...' : 'Đăng ký với Google'}</span>
          </button>

          {/* GitHub Button */}
          <button
            onClick={() => handleOAuthLogin('github')}
            disabled={loadingProvider !== null}
            className="w-full py-3.5 px-4 rounded-2xl glass-card hover:bg-slate-800 text-slate-100 font-bold text-sm border border-slate-700/80 hover:border-purple-500/50 transition-all shadow-lg flex items-center justify-center gap-3 group active:scale-98 disabled:opacity-50"
          >
            <svg className="w-5 h-5 fill-white shrink-0" viewBox="0 0 24 24">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
            <span>{loadingProvider === 'github' ? 'Đang kết nối GitHub...' : 'Đăng ký với GitHub'}</span>
          </button>
        </div>

        <div className="text-center pt-4">
          <p className="text-[11px] text-slate-500 flex items-center justify-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Bảo mật thông tin người dùng với Supabase Auth SSL
          </p>
        </div>
      </div>
    </div>
  )
}
