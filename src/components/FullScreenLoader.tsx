// src/components/FullScreenLoader.tsx
export default function FullScreenLoader() {
  return (
    <div
      className="fixed inset-0 z-[9999] w-screen h-screen bg-[url('/mvm.jpg')] bg-cover bg-center bg-no-repeat flex items-center justify-center"
    >
      {/* Можешь добавить надпись или лоадер поверх картинки */}
      {/* <span style={{ color: "#fff", fontSize: 32, fontWeight: 700, textShadow: '1px 1px 10px #000'}}>Загрузка...</span> */}
    </div>
  )
}
