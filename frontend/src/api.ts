const API_BASE_URL = import.meta.env.VITE_API_URL || window.location.origin

export type DiagramType = 'MERMAID' | 'EXCALIDRAW'

export interface GenerateDiagramRequest {
  prompt: string
  diagram_type: DiagramType
  model?: string
  chart_type?: string
}

export interface GenerateDiagramResponse {
  code?: string  // Mermaid 模式下返回
  data?: string  // Excalidraw 模式下返回
  diagram_type: string
}

export interface AuthResponse {
  access_token: string
  token_type: string
}

export interface UserResponse {
  id: number
  username: string
  email: string
  avatar_url?: string
}

export interface DiagramResponse {
  id: number
  title: string
  diagram_type: DiagramType
  render_engine: DiagramType
  mermaid_code?: string | null
  excalidraw_data?: any
  created_at: string
  updated_at?: string | null
}

export interface DiagramCreateRequest {
  title: string
  diagram_type: DiagramType
  mermaid_code?: string | null
  excalidraw_data?: any
}

export interface RegisterRequest {
  email: string
  password: string
  username?: string
}

export interface LoginRequest {
  email: string
  password: string
}

// 获取存储的 token
function getToken(): string | null {
  return localStorage.getItem('access_token')
}

// 保存 token
function saveToken(token: string) {
  localStorage.setItem('access_token', token)
}

// 移除 token
export function removeToken() {
  localStorage.removeItem('access_token')
  localStorage.removeItem('user_info')
}

// 保存用户信息
function saveUserInfo(user: UserResponse) {
  localStorage.setItem('user_info', JSON.stringify(user))
}

// 获取用户信息
export function getUserInfo(): UserResponse | null {
  const userInfo = localStorage.getItem('user_info')
  if (!userInfo) return null
  try {
    return JSON.parse(userInfo)
  } catch {
    return null
  }
}

// 注册
export async function register(data: RegisterRequest): Promise<UserResponse> {
  const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || '注册失败')
  }

  const userResult = await response.json()
  
  // 注册成功后自动登录获取 token
  await login({ email: data.email, password: data.password })
  
  return userResult
}

// 登录
export async function login(data: LoginRequest): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || '登录失败')
  }

  const result = await response.json()
  saveToken(result.access_token)
  
  // 登录成功后获取用户信息
  await fetchCurrentUser()
  
  return result
}

// 获取当前用户信息
export async function fetchCurrentUser(): Promise<UserResponse> {
  const token = getToken()
  
  if (!token) {
    throw new Error('未登录')
  }

  const response = await fetch(`${API_BASE_URL}/api/users/me`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    if (response.status === 401) {
      removeToken()
      throw new Error('登录已过期，请重新登录')
    }
    const error = await response.json()
    throw new Error(error.detail || '获取用户信息失败')
  }

  const user = await response.json()
  saveUserInfo(user)
  return user
}

// 生成图表
export async function generateDiagram(data: GenerateDiagramRequest): Promise<GenerateDiagramResponse> {
  const token = getToken()
  
  // 开发模式下允许跳过登录验证
  const isDevelopment = import.meta.env.DEV
  
  if (!token && !isDevelopment) {
    throw new Error('未登录，请先登录')
  }

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  }
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE_URL}/api/ai/generate`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    if (response.status === 401) {
      removeToken()
      throw new Error('登录已过期，请重新登录')
    }
    const error = await response.json()
    throw new Error(error.detail || '生成失败')
  }

  return await response.json()
}

// 检查是否已登录
export function isAuthenticated(): boolean {
  return !!getToken()
}

// 保存图形（Mermaid / Excalidraw，包括 Excalidraw JSON）
export async function saveDiagram(data: DiagramCreateRequest): Promise<DiagramResponse> {
  const token = getToken()

  if (!token) {
    throw new Error('未登录，请先登录')
  }

  const response = await fetch(`${API_BASE_URL}/api/diagrams`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    if (response.status === 401) {
      removeToken()
      throw new Error('登录已过期，请重新登录')
    }
    const error = await response.json()
    throw new Error(error.detail || '保存失败')
  }

  return await response.json()
}
