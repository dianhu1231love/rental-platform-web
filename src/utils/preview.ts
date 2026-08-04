/**
 * KKFileView 在线预览工具
 * KKFileView 通过 /onlinePreview?url=<Base64 编码的文件访问地址> 进行预览，
 * 文件访问地址需为 KKFileView 服务可访问的 HTTP(S) 地址（内网直连或后端代理下载地址）。
 */

/** KKFileView 服务地址（来自环境变量，未配置时返回空字符串） */
export function kkFileViewBase(): string {
  return (import.meta.env.VITE_KKFILEVIEW_URL || '').replace(/\/+$/, '')
}

/** 是否为 HTTP(S) 地址（真实文件地址可交给 KKFileView 拉取） */
export function isHttpUrl(url: string): boolean {
  return /^https?:\/\//i.test(url)
}

/** UTF-8 文本转 Base64（避免中文地址在 btoa 下报错） */
function base64EncodeUtf8(text: string): string {
  const bytes = new TextEncoder().encode(text)
  let binary = ''
  bytes.forEach((b) => {
    binary += String.fromCharCode(b)
  })
  return btoa(binary)
}

/**
 * 生成 KKFileView 预览地址
 * 规则：<base>/onlinePreview?url=<encodeURIComponent(Base64(fileUrl))>
 */
export function buildKKFileViewPreviewUrl(fileUrl: string): string {
  const base = kkFileViewBase()
  if (!base) return ''
  const encoded = encodeURIComponent(base64EncodeUtf8(fileUrl))
  return `${base}/onlinePreview?url=${encoded}`
}
