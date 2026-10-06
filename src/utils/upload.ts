import Taro from '@tarojs/taro'
import { Network } from '@/network'

/**
 * 跨端文件上传
 *
 * 背景：Coze 平台在 H5 端通过 Service Worker 拦截 blob fetch，
 * 导致 Taro.uploadFile / XHR 上传图片偶发被 CORS 拦截（见 AGENTS 跨端经验）。
 * 因此在 H5 端使用原始 File 对象手动构建 FormData + fetch 上传，绕过 SW 干扰；
 * 小程序端仍走 Network.uploadFile。
 *
 * AGENTS 要求：禁止修改 @/network，故在本文件统一封装跨端上传逻辑。
 */

interface UploadOption {
  filePath: string
  name?: string
  category?: string
  /** 自定义上传地址（默认 /api/upload） */
  url?: string
}

interface UploadResult {
  statusCode: number
  url?: string
  data?: string
}

const createUrl = (url: string): string => {
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }
  return `${PROJECT_DOMAIN}${url}`
}

/**
 * H5 端：取原始 File 对象手动构建 FormData 上传
 * 小程序端：Taro.getFileSystemManager 读不到 File，退化为 Network.uploadFile
 */
export async function uploadCrossPlatform(option: UploadOption): Promise<UploadResult> {
  const isWeapp = Taro.getEnv() === Taro.ENV_TYPE.WEAPP
  const uploadUrl = option.url || '/api/upload'

  if (isWeapp) {
    const res = await Network.uploadFile({
      url: uploadUrl,
      filePath: option.filePath,
      name: option.name || 'file',
      formData: option.category ? { category: option.category } : undefined,
    })
    return { statusCode: res.statusCode, data: res.data as string }
  }

  // ===== H5 分支：手动 FormData + fetch =====
  try {
    const file = await resolveH5File(option.filePath)
    const formData = new FormData()
    formData.append(option.name || 'file', file)
    if (option.category) {
      formData.append('category', option.category)
    }
    const resp = await fetch(createUrl(uploadUrl), {
      method: 'POST',
      body: formData,
      // 不携带 credentials，避免与后端 Access-Control-Allow-Origin 反射冲突
      credentials: 'omit',
    })
    const text = await resp.text()
    return { statusCode: resp.status, data: text }
  } catch (err) {
    console.error('[uploadCrossPlatform] H5 fetch 上传失败，回退 Network.uploadFile', err)
    const res = await Network.uploadFile({
      url: uploadUrl,
      filePath: option.filePath,
      name: option.name || 'file',
      formData: option.category ? { category: option.category } : undefined,
    })
    return { statusCode: res.statusCode, data: res.data as string }
  }
}

/**
 * H5 端把 ChooseImage 得到的 filePath 解析为原始 File 对象。
 * - 若 filePath 已是 File/Blob，直接返回
 * - 若是 blob: 或 http(s):/ 链接，通过 fetch 转 Blob
 * - 若是本地对象路径，则回退 Network.uploadFile（交由上层兜底）
 */
async function resolveH5File(filePath: string): Promise<File> {
  if (filePath.startsWith('blob:')) {
    const resp = await fetch(filePath)
    const blob = await resp.blob()
    return new File([blob], 'upload.png', { type: blob.type || 'image/png' })
  }
  if (/^https?:\/\//.test(filePath)) {
    const resp = await fetch(filePath)
    const blob = await resp.blob()
    const name = filePath.split('/').pop()?.split('?')[0] || 'upload.png'
    return new File([blob], name, { type: blob.type || 'image/png' })
  }
  // 本地临时路径：让上层走 Network.uploadFile 兜底
  throw new Error('H5 无法直接解析本地临时文件路径，需回退 Taro.uploadFile')
}

/**
 * 统一解析上传响应为 url 列表
 */
export function resolveUploadUrls(raw: string): string[] {
  try {
    const data = JSON.parse(raw)
    if (data && (data.code === 200 || data.success)) {
      // 支持 { data: { url } } 或 { data: { files: [...] } }
      const d = data.data || data
      if (typeof d === 'string') return [d]
      if (Array.isArray(d)) return d.map((x: unknown) => (typeof x === 'string' ? x : (x as { url?: string }).url || '')).filter(Boolean)
      if (d.url) return [d.url]
      if (d.files) return d.files.map((x: { url?: string }) => x.url || '').filter(Boolean)
    }
  } catch {
    /* 忽略解析失败 */
  }
  return []
}