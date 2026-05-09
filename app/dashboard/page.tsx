import { createClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user!.id)
    .single()

  const { count: totalBookings } = await supabase
    .from('bookings')
    .select('*', { count: 'exact', head: true })
    .eq('booked_by', user!.id)
    .eq('status', 'confirmed')

  const { count: totalRooms } = await supabase
    .from('rooms')
    .select('*', { count: 'exact', head: true })
    .eq('is_available', true)

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800">
        Welcome, {profile?.full_name} 👋
      </h2>
      <p className="text-gray-500 text-sm mt-1">
        Here's a quick overview of the system.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <StatCard label="Your Active Bookings" value={totalBookings ?? 0} />
        <StatCard label="Available Rooms" value={totalRooms ?? 0} />
        <StatCard label="Your Role"
          value={profile?.role === 'admin' ? 'Admin' : 'Core Member'} />
      </div>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <p className="text-gray-500 text-sm">{label}</p>
      <p className="text-3xl font-bold text-blue-700 mt-2">{value}</p>
    </div>
  )
}