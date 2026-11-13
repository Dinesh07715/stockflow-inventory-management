import { useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  Check,
  CirclePlus,
  Loader as Loader2,
  Package,
  Pencil,
  Search,
  Trash2,
  X,
} from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'

const emptyForm = {
  name: '',
  sku: '',
  description: '',
  quantity_on_hand: '0',
  cost_price: '',
  selling_price: '',
  low_stock_threshold: '',
}

const DEFAULT_LOW_STOCK_THRESHOLD = 5

function getProductError(error) {
  if (error.code === '23505') {
    return 'A product with this SKU already exists in your organization.'
  }
  if (error.code === '23514') {
    return 'Check the product values: quantities and prices must be valid and non-negative.'
  }
  return error.message || 'Something went wrong while saving the product.'
}

function toProductValues(form) {
  const name = form.name.trim()
  const sku = form.sku.trim()
  if (!name) return { error: 'Product name is required.' }
  if (!sku) return { error: 'SKU is required.' }

  if (!/^\d+$/.test(form.quantity_on_hand)) {
    return { error: 'Quantity must be a whole number greater than or equal to zero.' }
  }
  const quantity = Number(form.quantity_on_hand)
  if (!Number.isSafeInteger(quantity)) {
    return { error: 'Quantity is too large.' }
  }

  const thresholdText = form.low_stock_threshold.trim()
  if (thresholdText && !/^\d+$/.test(thresholdText)) {
    return { error: 'Low stock threshold must be a whole number greater than or equal to zero.' }
  }
  const threshold = thresholdText ? Number(thresholdText) : null
  if (threshold !== null && !Number.isSafeInteger(threshold)) {
    return { error: 'Low stock threshold is too large.' }
  }

  const parsePrice = (value, label) => {
    const trimmed = value.trim()
    if (!trimmed) return { value: null }
    const price = Number(trimmed)
    if (!Number.isFinite(price) || price < 0) {
      return { error: `${label} must be a valid amount greater than or equal to zero.` }
    }
    if (Number(price.toFixed(2)) !== price) {
      return { error: `${label} can have at most two decimal places.` }
    }
    if (price > 9999999999.99) {
      return { error: `${label} cannot exceed 9,999,999,999.99.` }
    }
    return { value: price }
  }

  const costPrice = parsePrice(form.cost_price, 'Cost price')
  if (costPrice.error) return { error: costPrice.error }
  const sellingPrice = parsePrice(form.selling_price, 'Selling price')
  if (sellingPrice.error) return { error: sellingPrice.error }

  return {
    values: {
      name,
      sku,
      description: form.description.trim() || null,
      quantity_on_hand: quantity,
      cost_price: costPrice.value,
      selling_price: sellingPrice.value,
      low_stock_threshold: threshold,
    },
  }
}

function getFormValues(product) {
  if (!product) return emptyForm
  return {
    name: product.name ?? '',
    sku: product.sku ?? '',
    description: product.description ?? '',
    quantity_on_hand: String(product.quantity_on_hand ?? 0),
    cost_price: product.cost_price == null ? '' : String(product.cost_price),
    selling_price: product.selling_price == null ? '' : String(product.selling_price),
    low_stock_threshold: product.low_stock_threshold == null
      ? ''
      : String(product.low_stock_threshold),
  }
}

export default function Products() {
  const { user } = useAuth()
  const [organizationId, setOrganizationId] = useState(null)
  const [defaultThreshold, setDefaultThreshold] = useState(DEFAULT_LOW_STOCK_THRESHOLD)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [query, setQuery] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [formError, setFormError] = useState('')
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  useEffect(() => {
    let active = true

    async function loadProducts() {
      setLoading(true)
      setLoadError('')
      setOrganizationId(null)
      setProducts([])
      setDefaultThreshold(DEFAULT_LOW_STOCK_THRESHOLD)

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .maybeSingle()

      if (!active) return
      if (profileError) {
        setLoadError(`Unable to load your organization profile: ${profileError.message}`)
        setLoading(false)
        return
      }
      if (!profile?.organization_id) {
        setLoadError('Your account is not linked to an organization. Please contact support.')
        setLoading(false)
        return
      }

      setOrganizationId(profile.organization_id)
      const [settingsResult, productsResult] = await Promise.all([
        supabase
          .from('organization_settings')
          .select('default_low_stock_threshold')
          .eq('organization_id', profile.organization_id)
          .maybeSingle(),
        supabase
          .from('products')
          .select('*')
          .eq('organization_id', profile.organization_id)
          .order('created_at', { ascending: false }),
      ])

      if (!active) return
      const errors = []
      if (settingsResult.error) {
        errors.push(`Unable to load inventory settings: ${settingsResult.error.message}`)
      } else {
        setDefaultThreshold(
          settingsResult.data?.default_low_stock_threshold ?? DEFAULT_LOW_STOCK_THRESHOLD
        )
      }
      if (productsResult.error) {
        errors.push(`Unable to load products: ${productsResult.error.message}`)
      } else {
        setProducts(productsResult.data ?? [])
      }
      if (errors.length > 0) setLoadError(errors.join(' '))
      setLoading(false)
    }

    loadProducts()
    return () => {
      active = false
    }
  }, [user.id])

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    if (!normalizedQuery) return products
    return products.filter((product) =>
      product.name.toLowerCase().includes(normalizedQuery)
      || product.sku.toLowerCase().includes(normalizedQuery)
    )
  }, [products, query])

  const openNewProduct = () => {
    setEditingProduct(null)
    setForm(emptyForm)
    setFormError('')
    setMessage('')
    setIsFormOpen(true)
  }

  const openEditProduct = (product) => {
    setEditingProduct(product)
    setForm(getFormValues(product))
    setFormError('')
    setMessage('')
    setIsFormOpen(true)
  }

  const closeForm = () => {
    if (saving) return
    setIsFormOpen(false)
    setEditingProduct(null)
    setFormError('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setFormError('')
    setMessage('')

    const { values, error: validationError } = toProductValues(form)
    if (validationError) {
      setFormError(validationError)
      return
    }
    if (!organizationId) {
      setFormError('Your organization could not be verified. Reload the page and try again.')
      return
    }

    setLoadError('')
    setSaving(true)
    const request = editingProduct
      ? supabase
        .from('products')
        .update(values)
        .eq('id', editingProduct.id)
        .eq('organization_id', organizationId)
        .select()
        .maybeSingle()
      : supabase
        .from('products')
        .insert({ ...values, organization_id: organizationId })
        .select()
        .single()

    const { data: savedProduct, error } = await request
    setSaving(false)
    if (error) {
      setFormError(getProductError(error))
      return
    }
    if (!savedProduct) {
      setFormError('This product could not be found in your organization. Refresh and try again.')
      return
    }

    setProducts((current) => editingProduct
      ? current.map((product) => product.id === savedProduct.id ? savedProduct : product)
      : [savedProduct, ...current])
    setIsFormOpen(false)
    setEditingProduct(null)
    setForm(emptyForm)
    setMessage(editingProduct ? 'Product updated successfully.' : 'Product created successfully.')
  }

  const handleDelete = async (product) => {
    const confirmed = window.confirm(`Delete "${product.name}"? This action cannot be undone.`)
    if (!confirmed) return

    setMessage('')
    setLoadError('')
    setDeletingId(product.id)
    const { data, error } = await supabase
      .from('products')
      .delete()
      .eq('id', product.id)
      .eq('organization_id', organizationId)
      .select('id')
      .maybeSingle()

    setDeletingId(null)
    if (error) {
      setLoadError(`Unable to delete product: ${error.message}`)
      return
    }
    if (!data) {
      setLoadError('This product could not be found in your organization. Refresh and try again.')
      return
    }

    setProducts((current) => current.filter((item) => item.id !== product.id))
    setMessage('Product deleted successfully.')
  }

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Products</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Manage your products, prices, and on-hand stock.
          </p>
        </div>
        <button
          type="button"
          onClick={openNewProduct}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
        >
          <CirclePlus className="h-4 w-4" />
          Add product
        </button>
      </div>

      {message && (
        <div role="status" className="mb-4 flex items-center gap-2 rounded-lg border border-success-200 bg-success-50 px-4 py-3 text-sm text-success-700">
          <Check className="h-4 w-4 shrink-0" />
          {message}
        </div>
      )}
      {loadError && (
        <div role="alert" className="mb-4 flex items-center gap-2 rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{loadError}</span>
        </div>
      )}

      <div className="rounded-xl border border-neutral-200 bg-white shadow-sm">
        <div className="border-b border-neutral-200 p-4 sm:p-5">
          <label className="relative block max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <span className="sr-only">Search products by name or SKU</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search products by name or SKU"
              className="w-full rounded-lg border border-neutral-300 bg-white py-2.5 pl-10 pr-3.5 text-sm text-neutral-900 placeholder-neutral-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
            />
          </label>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-neutral-500">
            <Loader2 className="h-5 w-5 animate-spin text-primary-600" />
            Loading products…
          </div>
        ) : loadError && products.length === 0 ? (
          <div className="py-16 text-center text-sm text-neutral-500">
            Products could not be loaded. Please reload the page and try again.
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100">
              <Package className="h-6 w-6 text-neutral-400" />
            </div>
            <p className="text-sm font-semibold text-neutral-700">
              {query.trim() ? 'No matching products' : 'No products yet'}
            </p>
            <p className="mt-1 text-sm text-neutral-500">
              {query.trim()
                ? 'Try another product name or SKU.'
                : 'Add your first product to start tracking inventory.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
                <tr>
                  <th scope="col" className="px-5 py-3 font-semibold">Name</th>
                  <th scope="col" className="px-5 py-3 font-semibold">SKU</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Quantity</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Stock status</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Selling price</th>
                  <th scope="col" className="px-5 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredProducts.map((product) => {
                  const threshold = product.low_stock_threshold ?? defaultThreshold
                  const isLowStock = product.quantity_on_hand <= threshold
                  return (
                    <tr key={product.id} className="hover:bg-neutral-50">
                      <td className="px-5 py-4">
                        <p className="font-medium text-neutral-900">{product.name}</p>
                        {product.description && (
                          <p className="mt-0.5 max-w-xs truncate text-xs text-neutral-500">
                            {product.description}
                          </p>
                        )}
                      </td>
                      <td className="px-5 py-4 text-neutral-600">{product.sku}</td>
                      <td className="px-5 py-4 font-medium text-neutral-900">
                        {product.quantity_on_hand}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                          isLowStock
                            ? 'bg-warning-100 text-warning-800'
                            : 'bg-success-100 text-success-800'
                        }`}>
                          {isLowStock ? 'Low stock' : 'In stock'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-neutral-600">
                        {product.selling_price == null
                          ? '—'
                          : Number(product.selling_price).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => openEditProduct(product)}
                            aria-label={`Edit ${product.name}`}
                            className="rounded-md p-2 text-neutral-500 hover:bg-primary-50 hover:text-primary-700"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(product)}
                            disabled={deletingId === product.id}
                            aria-label={`Delete ${product.name}`}
                            className="rounded-md p-2 text-neutral-500 hover:bg-error-50 hover:text-error-700 disabled:opacity-50"
                          >
                            {deletingId === product.id
                              ? <Loader2 className="h-4 w-4 animate-spin" />
                              : <Trash2 className="h-4 w-4" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-neutral-950/50 p-4">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="product-form-title"
            className="my-auto w-full max-w-2xl rounded-2xl bg-white shadow-xl"
          >
            <div className="flex items-start justify-between border-b border-neutral-200 px-5 py-4 sm:px-6">
              <div>
                <h2 id="product-form-title" className="text-lg font-semibold text-neutral-900">
                  {editingProduct ? 'Edit product' : 'Add product'}
                </h2>
                <p className="mt-1 text-sm text-neutral-500">
                  Product name, SKU, and quantity are required.
                </p>
              </div>
              <button
                type="button"
                onClick={closeForm}
                disabled={saving}
                aria-label="Close form"
                className="rounded-md p-2 text-neutral-500 hover:bg-neutral-100 disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} noValidate>
              <div className="grid gap-4 px-5 py-5 sm:grid-cols-2 sm:px-6">
                {formError && (
                  <div role="alert" className="col-span-full flex items-center gap-2 rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}
                <ProductField label="Product name" required>
                  <input
                    autoFocus
                    required
                    maxLength={200}
                    value={form.name}
                    onChange={(event) => setForm({ ...form, name: event.target.value })}
                    className={inputClass}
                  />
                </ProductField>
                <ProductField label="SKU" required>
                  <input
                    required
                    maxLength={100}
                    value={form.sku}
                    onChange={(event) => setForm({ ...form, sku: event.target.value })}
                    className={inputClass}
                  />
                </ProductField>
                <ProductField label="Quantity" required help="Whole number, zero or greater">
                  <input
                    required
                    type="number"
                    min="0"
                    step="1"
                    value={form.quantity_on_hand}
                    onChange={(event) => setForm({ ...form, quantity_on_hand: event.target.value })}
                    className={inputClass}
                  />
                </ProductField>
                <ProductField
                  label="Low stock threshold"
                  help={`Leave empty to use organization default (${defaultThreshold})`}
                >
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={form.low_stock_threshold}
                    onChange={(event) => setForm({ ...form, low_stock_threshold: event.target.value })}
                    className={inputClass}
                  />
                </ProductField>
                <ProductField label="Cost price" help="Optional">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.cost_price}
                    onChange={(event) => setForm({ ...form, cost_price: event.target.value })}
                    className={inputClass}
                  />
                </ProductField>
                <ProductField label="Selling price" help="Optional">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.selling_price}
                    onChange={(event) => setForm({ ...form, selling_price: event.target.value })}
                    className={inputClass}
                  />
                </ProductField>
                <div className="sm:col-span-2">
                  <ProductField label="Description" help="Optional">
                    <textarea
                      rows="3"
                      maxLength={2000}
                      value={form.description}
                      onChange={(event) => setForm({ ...form, description: event.target.value })}
                      className={`${inputClass} resize-y`}
                    />
                  </ProductField>
                </div>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-neutral-200 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
                <button
                  type="button"
                  onClick={closeForm}
                  disabled={saving}
                  className="rounded-lg border border-neutral-300 px-4 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  {saving ? 'Saving…' : editingProduct ? 'Save changes' : 'Create product'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  )
}

const inputClass = 'w-full rounded-lg border border-neutral-300 bg-white px-3.5 py-2.5 text-sm text-neutral-900 placeholder-neutral-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200'

function ProductField({ label, required = false, help, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-neutral-700">
        {label}{required && <span className="ml-1 text-error-600">*</span>}
      </span>
      {children}
      {help && <span className="mt-1 block text-xs text-neutral-500">{help}</span>}
    </label>
  )
}
