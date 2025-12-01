const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export interface GenerateDiagramRequest {
  prompt: string
  diagram_type: 'MERMAID' | 'EXCALIDRAW'
  model?: string
}

export interface GenerateDiagramResponse {
  code: string
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
  return result
}

// 生成图表
export async function generateDiagram(data: GenerateDiagramRequest): Promise<GenerateDiagramResponse> {
  const token = getToken()
  
  if (!token) {
    throw new Error('未登录，请先登录')
  }

  const response = await fetch(`${API_BASE_URL}/api/ai/generate`, {
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
    throw new Error(error.detail || '生成失败')
  }

  return await response.json()
}

// 检查是否已登录
export function isAuthenticated(): boolean {
  return !!getToken()
}
