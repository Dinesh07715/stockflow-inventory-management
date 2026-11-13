import { useEffect, useState } from 'react'
import {
  AlertCircle,
  AlertTriangle,
  Building2,
  Calendar,
  Loader as Loader2,
  Package,
  RefreshCw,
  Boxes,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'

const emptyInventory = {
  totalProducts: 0,
  totalStockQuantity: 0,
  lowStockItems: [],
  defaultThreshold: 5,
}

export default function Dashboard() {
  const { user } = useAuth()
  const userId = user?.id
  const [profile, setProfile] = useState(null)
  const [org, setOrg] = useState(null)
  const [inventory, setInventory] = useState(emptyInventory)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    let active = true

    async function loadDashboard() {
      setLoading(true)
      setError('')
      setProfile(null)
      setOrg(null)
      setInventory(emptyInventory)

      if (!userId) {
        setError('Your session could not be verified. Please sign in again.')
        setLoading(false)
        return
      }

      try {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, organization_id, created_at, organizations(id, name, created_at)')
          .eq('id', userId)
          .maybeSingle()

        if (!active) return
        if (profileError) {
          setError('Unable to load your organization profile. Please retry.')
          return
        }
        if (!profileData?.organization_id) {
          setError('Your account is not linked to an organization. Please contact support.')
          return
        }

        setProfile(profileData)
        setOrg(profileData.organizations)

        const [settingsResult, productsResult] = await Promise.all([
          supabase
            .from('organization_settings')
            .select('default_low_stock_threshold')
            .eq('organization_id', profileData.organization_id)
            .maybeSingle(),
          supabase
            .from('products')
            .select('id, name, sku, quantity_on_hand, low_stock_threshold')
            .eq('organization_id', profileData.organization_id)
            .order('name', { ascending: true }),
        ])

        if (!active) return
        if (settingsResult.error) {
          setError('Unable to load inventory settings. Please retry.')
          return
        }
        if (productsResult.error) {
          setError('Unable to load inventory. Please retry.')
          return
        }

        const productRows = productsResult.data ?? []
        const defaultThreshold = settingsResult.data?.default_low_stock_threshold ?? 5
        setInventory({
          totalProducts: productRows.length,
          totalStockQuantity: productRows.reduce(
            (total, product) => total + product.quantity_on_hand,
            0
          ),
          lowStockItems: productRows.filter(
            (product) => product.quantity_on_hand <= (
              product.low_stock_threshold ?? defaultThreshold
            )
          ),
          defaultThreshold,
        })
      } catch {
        if (active) {
          setError('Unable to load the dashboard. Please retry.')
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    loadDashboard()
    return () => {
      active = false
    }
  }, [userId, retryCount])

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-neutral-900">Dashboard</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Welcome to StockFlow{org ? `, ${org.name}` : ''}.
        </p>
      </div>

      {error && (
        <div role="alert" className="mb-6 flex flex-col gap-3 rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => setRetryCount((count) => count + 1)}
            className="inline-flex shrink-0 items-center gap-2 self-start rounded-md px-2 py-1 font-medium hover:bg-error-100 sm:self-auto"
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </button>
        </div>
      )}

      {!error && (
        <>
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <StatCard
              icon={Package}
              label="Total products"
              value={inventory.totalProducts.toLocaleString()}
            />
            <StatCard
              icon={Boxes}
              label="Total stock quantity"
              value={inventory.totalStockQuantity.toLocaleString()}
            />
          </div>

          <section className="mb-6 overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-neutral-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-warning-600" />
                <h2 className="text-base font-semibold text-neutral-900">Low Stock Items</h2>
                <span className="rounded-full bg-warning-100 px-2.5 py-0.5 text-xs font-medium text-warning-800">
                  {inventory.lowStockItems.length.toLocaleString()}
                </span>
              </div>
              <Link
                to="/products"
                className="text-sm font-semibold text-primary-600 hover:text-primary-700"
              >
                Manage products
              </Link>
            </div>

            {inventory.lowStockItems.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <p className="text-sm font-medium text-neutral-700">No low stock items</p>
                <p className="mt-1 text-sm text-neutral-500">
                  All products are above their low-stock thresholds.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-left text-sm">
                  <thead className="bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
                    <tr>
                      <th scope="col" className="px-5 py-3 font-semibold">Product</th>
                      <th scope="col" className="px-5 py-3 font-semibold">SKU</th>
                      <th scope="col" className="px-5 py-3 font-semibold">Quantity on hand</th>
                      <th scope="col" className="px-5 py-3 font-semibold">Threshold</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {inventory.lowStockItems.map((product) => (
                      <tr key={product.id} className="hover:bg-neutral-50">
                        <td className="px-5 py-3.5 font-medium text-neutral-900">{product.name}</td>
                        <td className="px-5 py-3.5 text-neutral-600">{product.sku}</td>
                        <td className="px-5 py-3.5 font-medium text-neutral-900">
                          {product.quantity_on_hand.toLocaleString()}
                        </td>
                        <td className="px-5 py-3.5 text-neutral-600">
                          {product.low_stock_threshold ?? inventory.defaultThreshold}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}

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

      <div className="mt-8 flex flex-col gap-4 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary-50">
            <Package className="h-6 w-6 text-primary-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-neutral-900">Product inventory</p>
            <p className="mt-1 text-sm text-neutral-500">
              Manage your catalog, stock levels, and product prices.
            </p>
          </div>
        </div>
        <Link
          to="/products"
          className="inline-flex items-center justify-center rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
        >
          View products
        </Link>
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary-50">
          <Icon className="h-5 w-5 text-primary-600" />
        </div>
        <div>
          <p className="text-sm font-medium text-neutral-500">{label}</p>
          <p className="mt-1 text-2xl font-bold text-neutral-900">{value}</p>
        </div>
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
