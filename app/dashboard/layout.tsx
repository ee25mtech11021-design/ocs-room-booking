import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { logout } from '@/lib/actions/auth'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .single()

  const isAdmin = profile?.role === 'admin'

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-blue-900 text-white flex flex-col p-6 gap-6">
        <div>
          <h1 className="text-xl font-bold">OCS IITH</h1>
          <p className="text-blue-300 text-xs mt-1">Room Booking System</p>
        </div>

        <nav className="flex flex-col gap-2 text-sm flex-1">
          <Link href="/dashboard"
            className="px-3 py-2 rounded-lg hover:bg-blue-800">
            🏠 Dashboard
          </Link>
          <Link href="/dashboard/bookings/new"
            className="px-3 py-2 rounded-lg hover:bg-blue-800">
            📅 New Booking
          </Link>
          <Link href="/dashboard/bookings"
            className="px-3 py-2 rounded-lg hover:bg-blue-800">
            📋 My Bookings
            
          </Link>

          <Link href="/dashboard/settings"
  className="px-3 py-2 rounded-lg hover:bg-blue-800">
  ⚙️ Settings
</Link>

          {isAdmin && (
            <>
              <div className="text-blue-400 text-xs mt-4 px-3">ADMIN</div>
              <Link href="/dashboard/admin/bookings"
                className="px-3 py-2 rounded-lg hover:bg-blue-800">
                📊 All Bookings
              </Link>
              <Link href="/dashboard/admin/rooms"
                className="px-3 py-2 rounded-lg hover:bg-blue-800">
                🚪 Manage Rooms
              </Link>
              <Link href="/dashboard/admin/users"
                className="px-3 py-2 rounded-lg hover:bg-blue-800">
                👥 Manage Users
              </Link>
            </>
          )}
        </nav>

        <div className="border-t border-blue-800 pt-4 text-sm">
          <p className="text-blue-300 text-xs">{profile?.full_name}</p>
          <p className="text-blue-400 text-xs capitalize">{profile?.role}</p>
          <form action={logout}>
            <button className="mt-2 text-xs text-red-400 hover:text-red-300">
              Logout
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 bg-gray-50 p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}