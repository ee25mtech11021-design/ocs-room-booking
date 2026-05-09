'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const PURPOSES = ['OA', 'Interview', 'PPT']

export default function BookingForm({
  blocks,
  userId,
}: {
  blocks: any[]
  userId: string
}) {
  const supabase = useRouter()
  const router = useRouter()
  const db = createClient()

  const [step, setStep]                     = useState(1)
  const [purpose, setPurpose]               = useState('')
  const [date, setDate]                     = useState('')
  const [startTime, setStartTime]           = useState('')
  const [endTime, setEndTime]               = useState('')
  const [participants, setParticipants]     = useState('')
  const [blockId, setBlockId]               = useState('')
  const [availableRooms, setAvailableRooms] = useState<any[]>([])
  const [selectedRoom, setSelectedRoom]     = useState<any>(null)
  const [notes, setNotes]                   = useState('')
  const [loading, setLoading]               = useState(false)
  const [error, setError]                   = useState('')
  const [searching, setSearching]           = useState(false)

  const searchRooms = async () => {
    setError('')
    if (!purpose || !date || !startTime || !endTime || !participants || !blockId) {
      setError('Please fill in all fields before searching.')
      return
    }
    if (endTime <= startTime) {
      setError('End time must be after start time.')
      return
    }

    setSearching(true)

    // Get all rooms in the block with enough capacity
    const { data: rooms } = await db
      .from('rooms')
      .select('*, blocks(name)')
      .eq('block_id', parseInt(blockId))
      .eq('is_available', true)
      .gte('capacity', parseInt(participants))
      .contains('allowed_purposes', [purpose])

    if (!rooms || rooms.length === 0) {
      setAvailableRooms([])
      setSearching(false)
      setError('No rooms found matching your criteria.')
      return
    }

    // Check each room for conflicts
    const available = []
    for (const room of rooms) {
      const { data: conflicts } = await db
        .from('bookings')
        .select('id')
        .eq('room_id', room.id)
        .eq('date', date)
        .eq('status', 'confirmed')
        .lt('start_time', endTime)
        .gt('end_time', startTime)

      if (!conflicts || conflicts.length === 0) {
        available.push(room)
      }
    }

    setAvailableRooms(available)
    setSearching(false)
    if (available.length === 0) {
      setError('All matching rooms are already booked for this time slot.')
    } else {
      setStep(2)
    }
  }

  const confirmBooking = async () => {
    if (!selectedRoom) {
      setError('Please select a room.')
      return
    }
    setLoading(true)
    setError('')

    // Final conflict check before inserting
    const { data: conflicts } = await db
      .from('bookings')
      .select('id')
      .eq('room_id', selectedRoom.id)
      .eq('date', date)
      .eq('status', 'confirmed')
      .lt('start_time', endTime)
      .gt('end_time', startTime)

    if (conflicts && conflicts.length > 0) {
      setError('This room was just booked by someone else. Please go back and search again.')
      setLoading(false)
      return
    }

    const { error } = await db.from('bookings').insert({
      room_id: selectedRoom.id,
      booked_by: userId,
      purpose,
      date,
      start_time: startTime,
      end_time: endTime,
      participant_count: parseInt(participants),
      notes,
      status: 'confirmed',
    })

    setLoading(false)
    if (error) {
      setError(error.message)
    } else {
      router.push('/dashboard/bookings')
    }
  }

  return (
    <div className="max-w-2xl">
      {/* Step Indicator */}
      <div className="flex items-center gap-4 mb-8">
        {['Search Rooms', 'Select Room', 'Confirm'].map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
              step > i + 1 ? 'bg-green-500 text-white' :
              step === i + 1 ? 'bg-blue-600 text-white' :
              'bg-gray-200 text-gray-500'
            }`}>
              {step > i + 1 ? '✓' : i + 1}
            </div>
            <span className={`text-sm ${step === i + 1 ? 'font-medium text-gray-800' : 'text-gray-400'}`}>
              {s}
            </span>
            {i < 2 && <div className="w-8 h-px bg-gray-300" />}
          </div>
        ))}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          {error}
        </div>
      )}

      {/* Step 1: Search */}
      {step === 1 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Booking Details</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500">Purpose</label>
              <select value={purpose} onChange={e => setPurpose(e.target.value)}
                className="border rounded-lg px-3 py-2 text-sm">
                <option value="">Select purpose</option>
                {PURPOSES.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500">Block</label>
              <select value={blockId} onChange={e => setBlockId(e.target.value)}
                className="border rounded-lg px-3 py-2 text-sm">
                <option value="">Select block</option>
                {blocks.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500">Date</label>
              <input type="date" value={date}
                min={new Date().toISOString().split('T')[0]}
                onChange={e => setDate(e.target.value)}
                className="border rounded-lg px-3 py-2 text-sm" />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500">Expected Participants</label>
              <input type="number" placeholder="e.g. 50" value={participants}
                onChange={e => setParticipants(e.target.value)}
                className="border rounded-lg px-3 py-2 text-sm" />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500">Start Time</label>
              <input type="time" value={startTime}
                onChange={e => setStartTime(e.target.value)}
                className="border rounded-lg px-3 py-2 text-sm" />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500">End Time</label>
              <input type="time" value={endTime}
                onChange={e => setEndTime(e.target.value)}
                className="border rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>

          <button onClick={searchRooms} disabled={searching}
            className="mt-6 bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
            {searching ? 'Searching...' : 'Search Available Rooms →'}
          </button>
        </div>
      )}

      {/* Step 2: Select Room */}
      {step === 2 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-semibold text-gray-800 mb-4">
            Available Rooms ({availableRooms.length} found)
          </h3>
          <div className="flex flex-col gap-3">
            {availableRooms.map(room => (
              <div key={room.id}
                onClick={() => setSelectedRoom(room)}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedRoom?.id === room.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300'
                }`}>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-gray-800">{room.room_number}</p>
                    <p className="text-xs text-gray-500">{room.blocks?.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-blue-700">
                      Capacity: {room.capacity}
                    </p>
                    {room.notes && (
                      <p className="text-xs text-gray-400">{room.notes}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-3 mt-6">
            <button onClick={() => { setStep(1); setSelectedRoom(null) }}
              className="px-4 py-2 rounded-lg text-sm border border-gray-300 hover:bg-gray-50">
              ← Back
            </button>
            <button onClick={() => { if (selectedRoom) setStep(3) }}
              disabled={!selectedRoom}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
              Continue →
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Confirm */}
      {step === 3 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Confirm Booking</h3>

          <div className="bg-gray-50 rounded-lg p-4 flex flex-col gap-2 text-sm mb-4">
            <Row label="Room" value={`${selectedRoom?.room_number} — ${selectedRoom?.blocks?.name}`} />
            <Row label="Purpose" value={purpose} />
            <Row label="Date" value={date} />
            <Row label="Time" value={`${startTime} → ${endTime}`} />
            <Row label="Participants" value={participants} />
            <Row label="Room Capacity" value={selectedRoom?.capacity} />
          </div>

          <div className="flex flex-col gap-1 mb-4">
            <label className="text-xs text-gray-500">Additional Notes (optional)</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="Any special requirements..."
              rows={3}
              className="border rounded-lg px-3 py-2 text-sm resize-none" />
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep(2)}
              className="px-4 py-2 rounded-lg text-sm border border-gray-300 hover:bg-gray-50">
              ← Back
            </button>
            <button onClick={confirmBooking} disabled={loading}
              className="bg-green-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50">
              {loading ? 'Confirming...' : '✓ Confirm Booking'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function Row({ label, value }: { label: string; value: any }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-800">{value}</span>
    </div>
  )
}