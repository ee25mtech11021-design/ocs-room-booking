import { createClient } from '@/lib/supabase/server'
import BookingForm from './BookingForm'

export default async function NewBookingPage() {
  const supabase = await createClient()

  const { data: blocks } = await supabase
    .from('blocks')
    .select('*')
    .eq('is_active', true)
    .order('name')

  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-2">New Booking</h2>
      <p className="text-gray-500 text-sm mb-6">
        Fill in the details below to book a room.
      </p>
      <BookingForm blocks={blocks ?? []} userId={user!.id} />
    </div>
  )
}