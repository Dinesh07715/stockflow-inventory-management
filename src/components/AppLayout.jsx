import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { Boxes, LayoutDashboard, LogOut, Menu, Package } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/products', label: 'Products', icon: Package },
]

export default function AppLayout({ children }) {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="flex min-h-screen bg-neutral-50">
      {/* Sidebar — desktop */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-neutral-200 bg-white lg:flex">
        <SidebarContent onSignOut={handleSignOut} />
      </aside>

      {/* Sidebar — mobile drawer */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-neutral-900/50" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-64 flex-col border-r border-neutral-200 bg-white">
            <SidebarContent onSignOut={handleSignOut} onNavigate={() => setSidebarOpen(false)} />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-1 flex-col lg:pl-64">
        {/* Top bar */}
        <header className="flex h-16 items-center justify-between border-b border-neutral-200 bg-white px-4 lg:px-8">
          <button
            className="rounded-lg p-2 text-neutral-600 hover:bg-neutral-100 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-3 ml-auto">
            <div className="flex items-center gap-2 rounded-lg bg-neutral-100 px-3 py-1.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-600 text-xs font-semibold text-white">
                {user?.email?.[0]?.toUpperCase() ?? '?'}
              </div>
              <span className="text-sm font-medium text-neutral-700">{user?.email}</span>
            </div>
            <button
              className="rounded-lg p-2 text-neutral-500 hover:bg-neutral-100 hover:text-error-600"
              onClick={handleSignOut}
              title="Sign out"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-8">{children}</main>
      </div>
    </div>
  )
}

function SidebarContent({ onSignOut, onNavigate }) {
  return (
    <div className="flex flex-1 flex-col">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2.5 border-b border-neutral-200 px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-600">
          <Boxes className="h-5 w-5 text-white" />
        </div>
        <span className="text-lg font-bold tracking-tight text-neutral-900">StockFlow</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
              }`
            }
          >
            <Icon className="h-5 w-5" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-neutral-200 p-3">
        <button
          onClick={onSignOut}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-neutral-600 hover:bg-neutral-100 hover:text-error-600"
        >
          <LogOut className="h-5 w-5" />
          Sign out
        </button>
      </div>
    </div>
  )
}
