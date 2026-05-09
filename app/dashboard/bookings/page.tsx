import { createClient } from '@/lib/supabase/server'
import CancelButton from './CancelButton'

export default async function MyBookingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: bookings } = await supabase
    .from('bookings')
    .select('*, rooms(room_number, capacity, blocks(name))')
    .eq('booked_by', user!.id)
    .order('date', { ascending: true })

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">My Bookings</h2>

      {bookings?.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center text-gray-400">
          No bookings yet. <a href="/dashboard/bookings/new" className="text-blue-600 hover:underline">Create one →</a>
        </div>
      )}

      <div className="flex flex-col gap-4">
        {bookings?.map(b => (
          <div key={b.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-semibold text-gray-800">
                  {b.rooms?.room_number} — {b.rooms?.blocks?.name}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {b.date} &nbsp;|&nbsp; {b.start_time} → {b.end_time}
                </p>
                <p className="text-sm text-gray-500">
                  Purpose: {b.purpose} &nbsp;|&nbsp; Participants: {b.participant_count}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  b.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                  b.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                  'bg-yellow-100 text-yellow-700'
                }`}>
                  {b.status}
                </span>
                {b.status === 'confirmed' && (
                  <CancelButton bookingId={b.id} />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}