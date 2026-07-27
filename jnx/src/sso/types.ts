export interface R<T> {
  code: number
  msg: string
  data: T
}

export interface UserInfo {
  username: string
  nickname: string
  avatar: string
  email: string
  role?: string
}

export interface TokenResponse {
  token: string
}
