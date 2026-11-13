import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Boxes, CircleAlert as AlertCircle, Loader as Loader2, Lock, Mail } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (loading) return
    setError('')

    if (!email || !password) {
      setError('Please fill in all fields.')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address.')
      return
    }

    setLoading(true)

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })

    if (signInError) {
      setError(signInError.message === 'Invalid login credentials'
        ? 'Invalid email or password.'
        : 'Unable to sign in right now. Please try again.')
      setLoading(false)
      return
    }

    navigate('/dashboard')
  }

  return (
    <AuthCard
      title="Welcome back"
      subtitle="Sign in to your StockFlow account"
      footer={
        <p className="text-sm text-neutral-600">
          Don't have an account?{' '}
          <Link to="/signup" className="font-semibold text-primary-600 hover:text-primary-700">
            Sign up
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {error && (
          <div role="alert" className="flex items-center gap-2 rounded-lg bg-error-50 border border-error-200 px-4 py-3 text-sm text-error-700">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <FormField
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
          icon={Mail}
          autoComplete="email"
        />

        <FormField
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          icon={Lock}
          autoComplete="current-password"
        />

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </AuthCard>
  )
}

export function AuthCard({ title, subtitle, children, footer }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex items-center justify-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-600">
            <Boxes className="h-6 w-6 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-neutral-900">StockFlow</span>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-neutral-900">{title}</h1>
          {subtitle && <p className="mt-1.5 text-sm text-neutral-500">{subtitle}</p>}
          <div className="mt-6">{children}</div>
        </div>

        {footer && <div className="mt-6 text-center">{footer}</div>}
      </div>
    </div>
  )
}

export function FormField({ label, type, value, onChange, placeholder, icon: Icon, autoComplete }) {
  const inputId = label.toLowerCase().replace(/[^a-z0-9]+/g, '-')

  return (
    <div>
      <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-neutral-700">
        {label}
      </label>
      <div className="relative">
        {Icon && (
          <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
        )}
        <input
          id={inputId}
          type={type}
          required
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className={`w-full rounded-lg border border-neutral-300 bg-white py-2.5 ${Icon ? 'pl-10' : 'pl-3.5'} pr-3.5 text-sm text-neutral-900 placeholder-neutral-400 transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200`}
        />
      </div>
    </div>
  )
}
