'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function EditRoomRow({ room, blocks }: { room: any, blocks: any[] }) {
  const [editing, setEditing]       = useState(false)
  const [roomNumber, setRoomNumber] = useState(room.room_number)
  const [capacity, setCapacity]     = useState(room.capacity)
  const [blockId, setBlockId]       = useState(room.block_id)
  const [notes, setNotes]           = useState(room.notes ?? '')
  const [isAvailable, setIsAvailable] = useState(room.is_available)
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')
  const supabase = createClient()
  const router = useRouter()

  const handleSave = async () => {
    setLoading(true)
    setError('')

    const { error } = await supabase
      .from('rooms')
      .update({
        room_number: roomNumber,
        capacity: parseInt(capacity),
        block_id: parseInt(blockId),
        notes,
        is_available: isAvailable,
      })
      .eq('id', room.id)

    setLoading(false)
    if (error) {
      setError(error.message)
    } else {
      setEditing(false)
      router.refresh()
    }
  }

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${room.room_number}? This cannot be undone.`)) return
    setLoading(true)

    const { error } = await supabase
      .from('rooms')
      .delete()
      .eq('id', room.id)

    setLoading(false)
    if (error) {
      setError('Cannot delete room — it may have existing bookings.')
    } else {
      router.refresh()
    }
  }

  // Editing row
  if (editing) {
    return (
      <>
        <tr className="bg-blue-50">
          <td className="px-4 py-3">
            <select value={blockId} onChange={e => setBlockId(e.target.value)}
              className="border rounded-lg px-2 py-1 text-sm w-full">
              {blocks.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </td>
          <td className="px-4 py-3">
            <input value={roomNumber} onChange={e => setRoomNumber(e.target.value)}
              className="border rounded-lg px-2 py-1 text-sm w-full" />
          </td>
          <td className="px-4 py-3">
            <input type="number" value={capacity} onChange={e => setCapacity(e.target.value)}
              className="border rounded-lg px-2 py-1 text-sm w-24" />
          </td>
          <td className="px-4 py-3">
            <select value={isAvailable.toString()} onChange={e => setIsAvailable(e.target.value === 'true')}
              className="border rounded-lg px-2 py-1 text-sm">
              <option value="true">Available</option>
              <option value="false">Unavailable</option>
            </select>
          </td>
          <td className="px-4 py-3">
            <input value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="Notes"
              className="border rounded-lg px-2 py-1 text-sm w-full" />
          </td>
          <td className="px-4 py-3">
            <div className="flex gap-2">
              <button onClick={handleSave} disabled={loading}
                className="bg-green-600 text-white px-3 py-1 rounded-lg text-xs hover:bg-green-700 disabled:opacity-50">
                {loading ? 'Saving...' : 'Save'}
              </button>
              <button onClick={() => { setEditing(false); setError('') }}
                className="bg-gray-200 text-gray-700 px-3 py-1 rounded-lg text-xs hover:bg-gray-300">
                Cancel
              </button>
            </div>
            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
          </td>
        </tr>
      </>
    )
  }

  // Normal row
  return (
    <tr className="hover:bg-gray-50">
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
      <td className="px-6 py-4">
        <div className="flex gap-3">
          <button onClick={() => setEditing(true)}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium">
            Edit
          </button>
          <button onClick={handleDelete} disabled={loading}
            className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50">
            Delete
          </button>
        </div>
      </td>
    </tr>
  )
}