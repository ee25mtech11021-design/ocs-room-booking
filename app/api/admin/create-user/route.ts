import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Admin client that bypasses RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  const { fullName, email, password, role } = await req.json()

  // Create auth user
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (error) return NextResponse.json(
    { message: error.message }, { status: 400 }
  )

  // Insert into profiles
  await supabaseAdmin.from('profiles').insert({
    id: data.user.id,
    full_name: fullName,
    email,
    role,
  })

  return NextResponse.json({ message: `User ${email} created successfully!` })
}