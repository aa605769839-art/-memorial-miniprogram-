import { Network } from '@/network'
import Taro from '@tarojs/taro'

const KEY = 'track_log'

/**
 * 轻量埋点：本地记录 + 后台上报到 /api/track（失败静默，不影响主流程）。
 * 事件命名与 V2.0 需求文档一致。
 */
export function trackEvent(event: string, extra?: Record<string, unknown>) {
  const payload = { event, ts: Date.now(), extra: extra || null }
  try {
    const q: unknown[] = Taro.getStorageSync(KEY) || []
    q.push(payload)
    Taro.setStorageSync(KEY, q.slice(-300))
  } catch {
    /* 忽略本地日志失败 */
  }
  Network.request({ url: '/api/track', method: 'POST', data: payload }).catch(() => {
    /* 埋点上报失败静默 */
  })
}