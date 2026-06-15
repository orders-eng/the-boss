export default function Home() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, padding: 20 }}>
      <h1 style={{ fontSize: 32, fontWeight: 700, color: '#2C2C2A' }}>הבוס 💼</h1>
      <p style={{ fontSize: 16, color: '#888780' }}>האפליקציה עובדת! 🎉</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, width: '100%', maxWidth: 300 }}>
        <button style={{ background: '#1D9E75', color: '#fff', border: 'none', borderRadius: 16, padding: '20px 8px', fontSize: 18, fontWeight: 500, cursor: 'pointer' }}>
          + הכנסה
        </button>
        <button style={{ background: '#E24B4A', color: '#fff', border: 'none', borderRadius: 16, padding: '20px 8px', fontSize: 18, fontWeight: 500, cursor: 'pointer' }}>
          − הוצאה
        </button>
      </div>
    </div>
  )
}
