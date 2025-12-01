import React, { useState } from 'react'
import { Sparkles, Mail, Lock, User, LogIn, UserPlus } from 'lucide-react'
import { login, register } from '../api'

interface AuthProps {
  onSuccess?: () => void
}

export default function Auth({ onSuccess }: AuthProps) {
  const [isLogin, setIsLogin] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  // 表单数据
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (isLoading) return

    setErrorMessage('')

    // 表单验证
    if (!email || !password) {
      setErrorMessage('请填写所有必填项')
      return
    }

    if (!isLogin && !username) {
      setErrorMessage('请输入用户名')
      return
    }

    setIsLoading(true)

    try {
      if (isLogin) {
        // 登录
        await login({ email, password })
        onSuccess?.()
      } else {
        // 注册
        await register({ email, password, username })
        onSuccess?.()
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '操作失败,请重试')
    } finally {
      setIsLoading(false)
    }
  }

  const toggleMode = () => {
    setIsLogin(!isLogin)
    setErrorMessage('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit(e as unknown as React.FormEvent)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 transition-colors duration-300">
      {/* 背景装饰 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl"></div>
      </div>

      {/* 认证卡片 */}
      <div className="relative w-full max-w-md">
        {/* Logo 和标题 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-violet-600 flex items-center justify-center shadow-lg">
              <Sparkles size={20} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">DiagramAI</h1>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {isLogin ? '欢迎回来!登录继续使用' : '创建账户,开始你的旅程'}
          </p>
        </div>

        {/* 主表单卡片 */}
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-violet-600 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-500"></div>
          <div className="relative bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-8 shadow-xl transition-colors">
            
            {/* Tab 切换 */}
            <div className="flex gap-2 mb-6 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
              <button
                onClick={toggleMode}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-all ${
                  isLogin
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <LogIn size={16} />
                <span>登录</span>
              </button>
              <button
                onClick={toggleMode}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-all ${
                  !isLogin
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <UserPlus size={16} />
                <span>注册</span>
              </button>
            </div>

            {/* 错误提示 */}
            {errorMessage && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
                {errorMessage}
              </div>
            )}

            {/* 表单 */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* 用户名(仅注册时显示) */}
              {!isLogin && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">用户名</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User size={18} className="text-slate-400 dark:text-slate-500" />
                    </div>
                    <input
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      type="text"
                      placeholder="请输入用户名"
                      onKeyDown={handleKeyDown}
                      disabled={isLoading}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>
              )}

              {/* 邮箱 */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">邮箱</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail size={18} className="text-slate-400 dark:text-slate-500" />
                  </div>
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    type="email"
                    placeholder="your@email.com"
                    onKeyDown={handleKeyDown}
                    disabled={isLoading}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              {/* 密码 */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">密码</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock size={18} className="text-slate-400 dark:text-slate-500" />
                  </div>
                  <input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    type="password"
                    placeholder="••••••••"
                    onKeyDown={handleKeyDown}
                    disabled={isLoading}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              {/* 提交按钮 */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white font-medium rounded-lg shadow-lg shadow-blue-900/20 transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed mt-6"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>处理中...</span>
                  </>
                ) : (
                  <span>{isLogin ? '登录' : '注册'}</span>
                )}
              </button>
            </form>

            {/* 底部提示 */}
            <div className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
              继续即表示您同意我们的服务条款和隐私政策
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
