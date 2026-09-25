import Taro from '@tarojs/taro'

export interface LoginUser {
  id: string
  username: string
  nickname: string | null
  avatar_url: string | null
  role: string
  created_at: string
}

const TOKEN_KEY = 'auth_token'
const USER_KEY = 'auth_user'

/**
 * 登录鉴权工具（自建账号体系）
 */
export const Auth = {
  getToken(): string {
    return Taro.getStorageSync(TOKEN_KEY) || ''
  },

  getUser(): LoginUser | null {
    const raw = Taro.getStorageSync(USER_KEY)
    if (!raw) return null
    return raw as LoginUser
  },

  isLoggedIn(): boolean {
    const token = this.getToken()
    const user = this.getUser()
    return !!(token && user)
  },

  isAdmin(): boolean {
    return this.isLoggedIn() && this.getUser()?.role === 'admin'
  },

  setAuth(token: string, user: LoginUser) {
    Taro.setStorageSync(TOKEN_KEY, token)
    Taro.setStorageSync(USER_KEY, user)
  },

  clear() {
    Taro.removeStorageSync(TOKEN_KEY)
    Taro.removeStorageSync(USER_KEY)
  },

  /** 构造鉴权请求头；未登录时返回空对象 */
  headers(): Record<string, string> {
    const token = this.getToken()
    return token ? { Authorization: `Bearer ${token}` } : {}
  },
}

export default Auth