import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AlertCircle, Building2, Loader2, Lock, Mail } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { AuthCard, FormField } from './Login'

export default function Signup() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [orgName, setOrgName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!email || !password || !confirmPassword || !orgName) {
      setError('Please fill in all fields.')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address.')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    if (orgName.trim().length < 2) {
      setError('Organization name must be at least 2 characters.')
      return
    }

    setLoading(true)

    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    })

    if (signUpError) {
      setError(
        signUpError.message.includes('already')
          ? 'An account with this email already exists.'
          : signUpError.message
      )
      setLoading(false)
      return
    }

    const userId = authData?.user?.id
    if (!userId) {
      setError('Sign-up succeeded but session could not be established. Please log in.')
      setLoading(false)
      return
    }

    const { error: orgError } = await supabase
      .from('organizations')
      .insert({ name: orgName.trim() })

    if (orgError) {
      setError('Account created, but we could not create your organization. Please contact support.')
      setLoading(false)
      return
    }

    const { data: orgData, error: orgFetchError } = await supabase
      .from('organizations')
      .select('id')
      .eq('name', orgName.trim())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (orgFetchError || !orgData) {
      setError('Organization created, but we could not link your profile. Please contact support.')
      setLoading(false)
      return
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .insert({ id: userId, organization_id: orgData.id })

    if (profileError) {
      setError('Organization created, but we could not link your profile. Please contact support.')
      setLoading(false)
      return
    }

    navigate('/dashboard')
  }

  return (
    <AuthCard
      title="Create your account"
      subtitle="Start managing your inventory in minutes"
      footer={
        <p className="text-sm text-neutral-600">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-primary-600 hover:text-primary-700">
            Sign in
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {error && (
          <div className="flex items-center gap-2 rounded-lg bg-error-50 border border-error-200 px-4 py-3 text-sm text-error-700">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <FormField
          label="Organization name"
          type="text"
          value={orgName}
          onChange={(e) => setOrgName(e.target.value)}
          placeholder="Acme Inc."
          icon={Building2}
          autoComplete="organization"
        />

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
          placeholder="At least 6 characters"
          icon={Lock}
          autoComplete="new-password"
        />

        <FormField
          label="Confirm password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Re-enter your password"
          icon={Lock}
          autoComplete="new-password"
        />

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {loading ? 'Creating account…' : 'Create account'}
        </button>
      </form>
    </AuthCard>
  )
}
