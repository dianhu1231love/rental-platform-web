/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string
  readonly VITE_USE_MOCK: string
  readonly VITE_API_BASE_URL: string
  /** KKFileView 在线预览服务地址，如 http://localhost:8012（未配置时附件预览自动回退为浏览器内置/下载） */
  readonly VITE_KKFILEVIEW_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
