import { useEffect, useState } from 'react'
import {
  AlertCircle,
  Check,
  Loader as Loader2,
  Save,
  Settings as SettingsIcon,
} from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'

const DEFAULT_THRESHOLD = 5
const MAX_INTEGER = 2147483647

export default function Settings() {
  const { user } = useAuth()
  const [organizationId, setOrganizationId] = useState(null)
  const [threshold, setThreshold] = useState(String(DEFAULT_THRESHOLD))
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    let active = true

    async function loadSettings() {
      setLoading(true)
      setError('')
      setMessage('')
      setOrganizationId(null)
      setThreshold(String(DEFAULT_THRESHOLD))

      if (!user?.id) {
        setError('Your session could not be verified. Please sign in again.')
        setLoading(false)
        return
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .maybeSingle()

      if (!active) return
      if (profileError) {
        setError(`Unable to load your organization profile: ${profileError.message}`)
        setLoading(false)
        return
      }
      if (!profile?.organization_id) {
        setError('Your account is not linked to an organization. Please contact support.')
        setLoading(false)
        return
      }

      const { data: settings, error: settingsError } = await supabase
        .from('organization_settings')
        .select('default_low_stock_threshold')
        .eq('organization_id', profile.organization_id)
        .maybeSingle()

      if (!active) return
      if (settingsError) {
        setError(`Unable to load inventory settings: ${settingsError.message}`)
        setLoading(false)
        return
      }

      setOrganizationId(profile.organization_id)
      setThreshold(String(settings?.default_low_stock_threshold ?? DEFAULT_THRESHOLD))
      setLoading(false)
    }

    loadSettings()
    return () => {
      active = false
    }
  }, [user?.id])

  const handleSave = async (event) => {
    event.preventDefault()
    setError('')
    setMessage('')

    if (!/^\d+$/.test(threshold)) {
      setError('Default low stock threshold must be a non-negative whole number.')
      return
    }
    const thresholdValue = Number(threshold)
    if (!Number.isSafeInteger(thresholdValue) || thresholdValue > MAX_INTEGER) {
      setError('Default low stock threshold must be within the supported integer range.')
      return
    }
    if (!organizationId) {
      setError('Your organization could not be verified. Reload the page and try again.')
      return
    }

    setSaving(true)
    const { error: saveError } = await supabase
      .from('organization_settings')
      .upsert(
        {
          organization_id: organizationId,
          default_low_stock_threshold: thresholdValue,
        },
        { onConflict: 'organization_id' }
      )
    setSaving(false)

    if (saveError) {
      setError(`Unable to save inventory settings: ${saveError.message}`)
      return
    }
    setMessage('Inventory settings saved successfully.')
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-neutral-900">Settings</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Configure inventory defaults for your organization.
        </p>
      </div>

      {error && (
        <div role="alert" className="mb-5 flex items-center gap-2 rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {message && (
        <div role="status" className="mb-5 flex items-center gap-2 rounded-lg border border-success-200 bg-success-50 px-4 py-3 text-sm text-success-700">
          <Check className="h-4 w-4 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      <section className="rounded-xl border border-neutral-200 bg-white shadow-sm">
        <div className="flex items-center gap-3 border-b border-neutral-200 px-5 py-4 sm:px-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50">
            <SettingsIcon className="h-5 w-5 text-primary-600" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-neutral-900">Inventory Settings</h2>
            <p className="mt-0.5 text-sm text-neutral-500">
              Set the default threshold used when a product has no custom threshold.
            </p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-5 px-5 py-5 sm:px-6">
          <div className="max-w-sm">
            <label htmlFor="default-low-stock-threshold" className="mb-1.5 block text-sm font-medium text-neutral-700">
              Default Low Stock Threshold
            </label>
            <input
              id="default-low-stock-threshold"
              type="number"
              min="0"
              max={MAX_INTEGER}
              step="1"
              required
              value={threshold}
              onChange={(event) => setThreshold(event.target.value)}
              disabled={!organizationId || saving}
              className="w-full rounded-lg border border-neutral-300 bg-white px-3.5 py-2.5 text-sm text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200 disabled:bg-neutral-100"
            />
            <p className="mt-1.5 text-xs text-neutral-500">
              Must be a non-negative whole number. New organizations default to 5.
            </p>
          </div>

          <button
            type="submit"
            disabled={!organizationId || saving}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? 'Saving…' : 'Save settings'}
          </button>
        </form>
      </section>
    </div>
  )
}
