// src/components/FullScreenLoader.tsx
export default function FullScreenLoader() {
  return (
    <div
      className="fixed inset-0 z-[9999] w-screen h-screen bg-[url('/mvm.jpg')] bg-cover bg-center bg-no-repeat flex items-center justify-center"
    >
      {/* Можешь добавить надпись или лоадер поверх картинки */}
      {/* <span className="text-white text-2xl font-bold drop-shadow">Загрузка...</span> */}
    </div>
  )
}
