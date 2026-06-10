import type { Metadata, Viewport } from 'next'

export const metadata: Metadata = {
  title: 'הבוס',
  description: 'ניהול עסק בוטיק — פשוט, מהיר, ויזואלי',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'הבוס'
  }
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#F1EFE8'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl">
      <body style={{
        margin: 0,
        padding: 0,
        background: '#F1EFE8',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        WebkitFontSmoothing: 'antialiased'
      }}>
        {children}
      </body>
    </html>
  )
}
