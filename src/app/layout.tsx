import type { Metadata } from 'next'
import { Outfit, Inter } from 'next/font/google'
import { BackgroundProvider } from '@/contexts/BackgroundContext'
import { BackgroundWrapper } from '@/components/common/BackgroundWrapper'
import './globals.css'

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'OpenQuiz AI - Học Từ Vựng & Luyện Nói Phản Xạ Thông Minh',
  description: 'Nền tảng học từ vựng SRS lặp lại ngắt quãng, tự động tạo từ vựng bằng AI và luyện phát âm nói phản xạ chi tiết.',
  manifest: '/manifest.json',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="vi" className={`dark ${outfit.variable} ${inter.variable}`} suppressHydrationWarning>
      <body
        className={`${outfit.variable} ${inter.variable} min-h-screen bg-[#090d16] text-slate-100 antialiased selection:bg-purple-500/30 selection:text-purple-200`}
        suppressHydrationWarning
      >
        <BackgroundProvider>
          <BackgroundWrapper>{children}</BackgroundWrapper>
        </BackgroundProvider>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(function(registration) {
                    console.log('ServiceWorker registration successful with scope: ', registration.scope);
                  }, function(err) {
                    console.log('ServiceWorker registration failed: ', err);
                  });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  )
}
