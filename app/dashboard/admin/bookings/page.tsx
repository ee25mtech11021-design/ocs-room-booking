import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminCancelButton from './AdminCancelButton'

export default async function AllBookingsPage() {

  
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user!.id).single()

  if (profile?.role !== 'admin') redirect('/dashboard')

  const { data: bookings,error } = await supabase
    .from('bookings')
    .select(`
      *,
      rooms(room_number, blocks(name)),
      profiles!bookings_booked_by_fkey(full_name, email)
    `)
    .order('date', { ascending: true })

// Add these two lines temporarily
console.log('bookings:', JSON.stringify(bookings, null, 2))
console.log('error:', error)
    

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">All Bookings</h2>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
            <tr>
              <th className="px-6 py-3 text-left">Room</th>
              <th className="px-6 py-3 text-left">Booked By</th>
              <th className="px-6 py-3 text-left">Purpose</th>
              <th className="px-6 py-3 text-left">Date & Time</th>
              <th className="px-6 py-3 text-left">Participants</th>
              <th className="px-6 py-3 text-left">Status</th>
              <th className="px-6 py-3 text-left">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {bookings?.map(b => (
              <tr key={b.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <p className="font-medium">{b.rooms?.room_number}</p>
                  <p className="text-xs text-gray-400">{b.rooms?.blocks?.name}</p>
                </td>
                <td className="px-6 py-4">
                  <p>{b.profiles?.full_name}</p>
                  <p className="text-xs text-gray-400">{b.profiles?.email}</p>
                </td>
                <td className="px-6 py-4">{b.purpose}</td>
                <td className="px-6 py-4">
                  <p>{b.date}</p>
                  <p className="text-xs text-gray-400">{b.start_time} → {b.end_time}</p>
                </td>
                <td className="px-6 py-4">{b.participant_count}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    b.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                    b.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {b.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {b.status === 'confirmed' && (
                    <AdminCancelButton bookingId={b.id} />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}