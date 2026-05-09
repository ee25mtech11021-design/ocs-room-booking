'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function AdminCancelButton({ bookingId }: { bookingId: number }) {
  const [loading, setLoading] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  const cancel = async () => {
    if (!confirm('Cancel this booking?')) return
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