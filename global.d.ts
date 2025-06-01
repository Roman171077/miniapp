// global.d.ts
export {}; // делает файл модулем, чтобы сработал `declare global`

declare global {
  interface Window {
    ymaps: any;
  }
}
