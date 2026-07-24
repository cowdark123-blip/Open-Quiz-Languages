'use client'

import { useEffect, useState, ReactNode } from 'react'
import { AlertTriangle, Save, RefreshCw, X, ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface NavigationGuardProps {
  isDirty: boolean
  onSaveAndExit?: () => void
  onDiscardAndExit?: () => void
  onForceExit?: () => void
  children?: ReactNode
}

export default function NavigationGuard({ isDirty, onSaveAndExit, onDiscardAndExit, onForceExit, children }: NavigationGuardProps) {
  const [showModal, setShowModal] = useState(false)
  const [pendingUrl, setPendingUrl] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault()
        e.returnValue = ''
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [isDirty])

  useEffect(() => {
    if (!isDirty) return

    const handlePopState = (e: PopStateEvent) => {
      window.history.pushState(null, '', window.location.href)
      setPendingUrl(null)
      setShowModal(true)
    }

    window.history.pushState(null, '', window.location.href)
    window.addEventListener('popstate', handlePopState)

    const handleAnchorClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('a')
      if (target && target.href && target.target !== '_blank') {
        const url = new URL(target.href)
        if (url.origin === window.location.origin && url.pathname !== window.location.pathname) {
          e.preventDefault()
          e.stopPropagation()
          setPendingUrl(target.href)
          setShowModal(true)
        }
      }
    }

    document.addEventListener('click', handleAnchorClick, { capture: true })

    return () => {
      window.removeEventListener('popstate', handlePopState)
      document.removeEventListener('click', handleAnchorClick, { capture: true })
    }
  }, [isDirty])

  return (
    <>
      {/* Wrapper to intercept custom Exit clicks if we want to provide a wrapped exit button */}
      {children}

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md glass-panel p-6 rounded-3xl border border-amber-500/30 shadow-2xl relative space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Bạn có chắc muốn thoát?</h3>
                <p className="text-xs text-slate-300 mt-1">Phiên học của bạn chưa được lưu. Tiến trình sẽ bị mất nếu bạn thoát bây giờ.</p>
              </div>
            </div>

            <div className="space-y-3">
              {onSaveAndExit && (
                <button
                  onClick={async () => {
                    setShowModal(false)
                    await onSaveAndExit()
                    if (pendingUrl) router.push(pendingUrl)
                  }}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20"
                >
                  <Save className="w-4 h-4" />
                  <span>Lưu Tiến Trình & Thoát</span>
                </button>
              )}

              <button
                onClick={async () => {
                  setShowModal(false)
                  if (onForceExit) {
                    await onForceExit()
                  } else if (onDiscardAndExit) {
                    await onDiscardAndExit()
                  }
                  if (pendingUrl) {
                    router.push(pendingUrl)
                  } else {
                    window.history.go(-2)
                  }
                }}
                className="w-full py-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 font-bold text-sm flex items-center justify-center gap-2 transition-all"
              >
                <span>Thoát Mà Không Lưu</span>
              </button>
            </div>

            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </>
  )
}
