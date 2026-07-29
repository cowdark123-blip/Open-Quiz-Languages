'use client'

import { useState, useEffect } from 'react'
import { Flame, Palette, Layers, ChevronLeft, ChevronRight, Brain, Search, Trash2 } from 'lucide-react'
import { BackgroundSwitcher } from '@/components/dashboard/BackgroundSwitcher'
import { SRSSetupModal } from '@/components/srs/SRSSetupModal'
import { Suspense } from 'react'
import { QuickDictionaryModal } from '@/components/common/QuickDictionaryModal'
import { TrashModal } from '@/components/dashboard/TrashModal'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function FloatingActionToolsContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  
  const [isExpanded, setIsExpanded] = useState(false)
  
  // Modals state
  const [isBgSwitcherOpen, setIsBgSwitcherOpen] = useState(false)
  const [isSRSSetupOpen, setIsSRSSetupOpen] = useState(false)
  const [isDictOpen, setIsDictOpen] = useState(false)
  const [isTrashOpen, setIsTrashOpen] = useState(false)
  const [srsPreselect, setSrsPreselect] = useState<string | null>(null)
  const [streak, setStreak] = useState(1)

  // Listen to URL query params for opening SRS
  useEffect(() => {
    if (searchParams?.get('srs_setup') === 'true') {
      const preselect = searchParams.get('preselect')
      setSrsPreselect(preselect)
      setIsSRSSetupOpen(true)
      
      // Clean up URL
      const newUrl = new URL(window.location.href)
      newUrl.searchParams.delete('srs_setup')
      newUrl.searchParams.delete('preselect')
      router.replace(newUrl.pathname + newUrl.search)
    }
  }, [searchParams, router])

  useEffect(() => {
    async function loadStreak() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('streak_count')
          .eq('id', user.id)
          .single()
        if (profile) setStreak(profile.streak_count || 1)
      }
    }
    loadStreak()
  }, [])

  const tools = [
    {
      id: 'dict',
      icon: Search,
      label: 'Tra từ',
      color: 'text-cyan-400',
      bg: 'bg-cyan-500/10',
      action: () => setIsDictOpen(true)
    },
    {
      id: 'srs',
      icon: Layers,
      label: 'Ôn SRS',
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
      action: () => setIsSRSSetupOpen(true)
    },
    {
      id: 'bg',
      icon: Palette,
      label: 'Đổi nền',
      color: 'text-purple-400',
      bg: 'bg-purple-500/10',
      action: () => setIsBgSwitcherOpen(true)
    },
    {
      id: 'trash',
      icon: Trash2,
      label: 'Thùng rác',
      color: 'text-red-400',
      bg: 'bg-red-500/10',
      action: () => setIsTrashOpen(true)
    },
    {
      id: 'streak',
      icon: Flame,
      label: `${streak} Ngày`,
      color: 'text-orange-400',
      bg: 'bg-orange-500/10',
      action: () => {
        // Just visual for now or can open a Streak modal
      }
    }
  ]

  return (
    <>
      <div 
        className={`fixed right-0 top-[20%] md:top-1/2 -translate-y-1/2 z-[45] flex items-center transition-transform duration-300 ${
          isExpanded ? 'translate-x-0' : 'translate-x-[calc(100%-2rem)]'
        }`}
      >
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="h-16 w-8 bg-slate-900/80 backdrop-blur-md border border-r-0 border-slate-700/50 rounded-l-xl flex items-center justify-center shadow-[-4px_0_15px_-3px_rgba(0,0,0,0.5)] touch-manipulation"
        >
          {isExpanded ? (
            <ChevronRight className="w-5 h-5 text-slate-400" />
          ) : (
            <ChevronLeft className="w-5 h-5 text-slate-400" />
          )}
        </button>

        <div className="bg-slate-900/80 backdrop-blur-md border border-r-0 border-slate-700/50 p-2 sm:p-3 rounded-l-2xl shadow-[-10px_0_30px_-10px_rgba(0,0,0,0.5)] flex flex-col gap-2 sm:gap-3">
          {tools.map((tool) => {
            const Icon = tool.icon
            return (
              <button
                key={tool.id}
                onClick={tool.action}
                className="group relative w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-xl bg-slate-800/50 hover:bg-slate-700/80 transition-colors border border-slate-700/50 hover:border-slate-600 touch-manipulation"
              >
                <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${tool.color}`} />
                
                <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-slate-800 text-slate-200 text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap border border-slate-700">
                  {tool.label}
                  <div className="absolute top-1/2 -right-1 -translate-y-1/2 w-2 h-2 bg-slate-800 border-t border-r border-slate-700 rotate-45" />
                </div>
              </button>
            )
          })}
        </div>
      </div>

      <QuickDictionaryModal isOpen={isDictOpen} onClose={() => setIsDictOpen(false)} />
      <BackgroundSwitcher isOpen={isBgSwitcherOpen} onClose={() => setIsBgSwitcherOpen(false)} />
      <SRSSetupModal isOpen={isSRSSetupOpen} onClose={() => setIsSRSSetupOpen(false)} preselectId={srsPreselect} />
      <TrashModal isOpen={isTrashOpen} onClose={() => setIsTrashOpen(false)} />
    </>
  )
}

export function FloatingActionTools() {
  return (
    <Suspense fallback={null}>
      <FloatingActionToolsContent />
    </Suspense>
  )
}
