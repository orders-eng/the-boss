export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl">
      <body style={{ margin: 0, background: '#F1EFE8', fontFamily: 'system-ui, sans-serif' }}>
        {children}
      </body>
    </html>
  )
}
