// src/components/FullScreenLoader.tsx
export default function FullScreenLoader() {
  return (
    <div
      style={{
        position: 'fixed',
        zIndex: 9999,
        inset: 0,
        width: '100vw',
        height: '100vh',
        backgroundImage: 'url("/mvm.jpg")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Можешь добавить надпись или лоадер поверх картинки */}
      {/* <span style={{ color: "#fff", fontSize: 32, fontWeight: 700, textShadow: '1px 1px 10px #000'}}>Загрузка...</span> */}
    </div>
  )
}
