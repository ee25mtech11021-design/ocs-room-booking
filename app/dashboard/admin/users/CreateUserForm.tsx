'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function CreateUserForm() {
  const [fullName, setFullName]   = useState('')
  const [email, setEmail]         = useState('')
  const [password, setPassword]   = useState('')
  const [role, setRole]           = useState('core_member')
  const [loading, setLoading]     = useState(false)
  const [message, setMessage]     = useState('')
  const supabase = createClient()

  const handleCreate = async () => {
    setLoading(true)
    setMessage('')

    // Call your API route to create the user
    const res = await fetch('/api/admin/create-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName, email, password, role }),
    })

    const data = await res.json()
    setMessage(data.message)
    setLoading(false)

    if (res.ok) {
      setFullName(''); setEmail(''); setPassword('')
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="font-semibold text-gray-800 mb-4">Create New User</h3>
      <div className="grid grid-cols-2 gap-4">
        <input placeholder="Full Name" value={fullName}
          onChange={e => setFullName(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm" />
        <input placeholder="Email" value={email}
          onChange={e => setEmail(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm" />
        <input placeholder="Password" type="password" value={password}
          onChange={e => setPassword(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm" />
        <select value={role} onChange={e => setRole(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm">
          <option value="core_member">Core Member</option>
          <option value="viewer">Viewer</option>
          <option value="admin">Admin</option>
        </select>
      </div>
      {message && (
        <p className="text-sm mt-3 text-blue-600">{message}</p>
      )}
      <button onClick={handleCreate} disabled={loading}
        className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">
        {loading ? 'Creating...' : 'Create User'}
      </button>
    </div>
  )
}