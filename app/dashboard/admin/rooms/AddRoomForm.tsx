'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function AddRoomForm({ blocks }: { blocks: any[] }) {
  const [blockId, setBlockId]         = useState('')
  const [roomNumber, setRoomNumber]   = useState('')
  const [capacity, setCapacity]       = useState('')
  const [notes, setNotes]             = useState('')
  const [loading, setLoading]         = useState(false)
  const [message, setMessage]         = useState('')
  const supabase = createClient()
  const router = useRouter()

  const handleAdd = async () => {
    setLoading(true)
    const { error } = await supabase.from('rooms').insert({
      block_id: parseInt(blockId),
      room_number: roomNumber,
      capacity: parseInt(capacity),
      notes,
    })
    setLoading(false)
    setMessage(error ? error.message : 'Room added successfully!')
    if (!error) {
      setRoomNumber(''); setCapacity(''); setNotes('')
      router.refresh()
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="font-semibold text-gray-800 mb-4">Add New Room</h3>
      <div className="grid grid-cols-2 gap-4">
        <select value={blockId} onChange={e => setBlockId(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm">
          <option value="">Select Block</option>
          {blocks.map(b => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
        <input placeholder="Room Number / Name" value={roomNumber}
          onChange={e => setRoomNumber(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm" />
        <input placeholder="Capacity" type="number" value={capacity}
          onChange={e => setCapacity(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm" />
        <input placeholder="Notes (optional)" value={notes}
          onChange={e => setNotes(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm" />
      </div>
      {message && <p className="text-sm mt-3 text-blue-600">{message}</p>}
      <button onClick={handleAdd} disabled={loading}
        className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">
        {loading ? 'Adding...' : 'Add Room'}
      </button>
    </div>
  )
}