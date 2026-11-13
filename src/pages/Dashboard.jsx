import { useEffect, useState } from 'react'
import { Boxes, Building2, Calendar, Loader as Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'

export default function Dashboard() {
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [org, setOrg] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadProfile() {
      if (!user?.id) return

      const { data: profileData } = await supabase
        .from('profiles')
        .select('id, organization_id, created_at, organizations(id, name, created_at)')
        .eq('id', user.id)
        .maybeSingle()

      if (profileData) {
        setProfile(profileData)
        setOrg(profileData.organizations)
      }
      setLoading(false)
    }

    loadProfile()
  }, [user])

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
        <h1 className="text-2xl font-bold text-neutral-900">Dashboard</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Welcome to StockFlow{org ? `, ${org.name}` : ''}.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <InfoCard
          icon={Building2}
          label="Organization"
          value={org?.name ?? 'Not linked'}
          sub={
            org?.created_at
              ? `Created ${new Date(org.created_at).toLocaleDateString()}`
              : null
          }
        />
        <InfoCard
          icon={Calendar}
          label="Account"
          value={user?.email ?? ''}
          sub={
            profile?.created_at
              ? `Joined ${new Date(profile.created_at).toLocaleDateString()}`
              : null
          }
        />
      </div>

      <div className="mt-8 rounded-xl border border-dashed border-neutral-300 bg-white p-12 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-neutral-100">
          <Boxes className="h-6 w-6 text-neutral-400" />
        </div>
        <p className="text-sm font-medium text-neutral-600">Inventory features coming soon</p>
        <p className="mt-1 text-sm text-neutral-400">
          Product management and stock tracking will be available in the next phase.
        </p>
      </div>
    </div>
  )
}

function InfoCard({ icon: Icon, label, value, sub }) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50">
          <Icon className="h-5 w-5 text-primary-600" />
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">{label}</p>
          <p className="mt-0.5 text-base font-semibold text-neutral-900">{value}</p>
          {sub && <p className="mt-0.5 text-xs text-neutral-400">{sub}</p>}
        </div>
      </div>
    </div>
  )
}
