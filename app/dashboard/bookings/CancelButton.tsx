'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function CancelButton({ bookingId }: { bookingId: number }) {
  const [loading, setLoading] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  const cancel = async () => {
    if (!confirm('Are you sure you want to cancel this booking?')) return
    setLoading(true)
    await supabase
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('id', bookingId)
    setLoading(false)
    router.refresh()
  }

  return (
    <button onClick={cancel} disabled={loading}
      className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50">
      {loading ? 'Cancelling...' : 'Cancel'}
    </button>
  )
}