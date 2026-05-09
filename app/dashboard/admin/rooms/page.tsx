import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AddRoomForm from './AddRoomForm'

export default async function RoomsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user!.id).single()

  if (profile?.role !== 'admin') redirect('/dashboard')

  const { data: rooms } = await supabase
    .from('rooms')
    .select('*, blocks(name)')
    .order('block_id')

  const { data: blocks } = await supabase.from('blocks').select('*')

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Manage Rooms</h2>
      <AddRoomForm blocks={blocks ?? []} />

      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
            <tr>
              <th className="px-6 py-3 text-left">Block</th>
              <th className="px-6 py-3 text-left">Room</th>
              <th className="px-6 py-3 text-left">Capacity</th>
              <th className="px-6 py-3 text-left">Status</th>
              <th className="px-6 py-3 text-left">Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rooms?.map(room => (
              <tr key={room.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">{room.blocks?.name}</td>
                <td className="px-6 py-4 font-medium">{room.room_number}</td>
                <td className="px-6 py-4">{room.capacity}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    room.is_available
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {room.is_available ? 'Available' : 'Unavailable'}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-400">{room.notes ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}