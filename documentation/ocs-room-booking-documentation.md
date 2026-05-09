# OCS IITH Room Booking System
### Documentation
**Prepared for:** Office of Career Services, IIT Hyderabad
**Version:** 1.0

---

## Table of Contents
1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [System Architecture](#3-system-architecture)
4. [Database Schema](#4-database-schema)
5. [Authentication & Access Control](#5-authentication--access-control)
6. [Features](#6-features)
7. [User Workflows](#7-user-workflows)
8. [Deployment](#8-deployment)
9. [Rooms Reference](#9-rooms-reference)
10. [Future Enhancements](#10-future-enhancements)

---

## 1. Project Overview

The OCS IITH Room Booking System is a secure, web-based platform designed to centralize and simplify room allocation for placement-related activities at IIT Hyderabad. The system allows only authorized users to book rooms across multiple campus blocks for:

- **Online Assessments (OA)**
- **Interviews**
- **Pre-Placement Talks (PPTs)**

The system enforces strict access control, prevents overlapping bookings, respects room capacity limits, and gives administrators full control over users, rooms, and bookings.

---

## 2. Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend & Backend | Next.js (React) | UI, routing, and API routes in one framework |
| Database | Supabase (PostgreSQL) | Managed database with built-in auth |
| Authentication | Supabase Auth | Secure login, no self-registration |
| Styling | Tailwind CSS | Utility-first CSS framework |
| Deployment | Vercel | Automatic deployment on every GitHub push |
| Spreadsheet Import | SheetJS (xlsx) | Import rooms from Excel or CSV files |

---

## 3. System Architecture

```
┌─────────────────────────────────────┐
│            Vercel (Hosting)         │
│                                     │
│   ┌─────────────────────────────┐   │
│   │        Next.js App          │   │
│   │                             │   │
│   │  /login                     │   │
│   │  /dashboard                 │   │
│   │  /dashboard/bookings        │   │
│   │  /dashboard/bookings/new    │   │
│   │  /dashboard/admin/users     │   │
│   │  /dashboard/admin/rooms     │   │
│   │  /dashboard/admin/bookings  │   │
│   │  /dashboard/settings        │   │
│   │                             │   │
│   │  /api/admin/create-user     │   │
│   └────────────┬────────────────┘   │
└────────────────┼────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────┐
│           Supabase                  │
│                                     │
│   ┌─────────┐   ┌───────────────┐   │
│   │  Auth   │   │  PostgreSQL   │   │
│   │  Users  │   │  Database     │   │
│   └─────────┘   │               │   │
│                 │  profiles     │   │
│                 │  blocks       │   │
│                 │  rooms        │   │
│                 │  bookings     │   │
│                 └───────────────┘   │
└─────────────────────────────────────┘
```

---

## 4. Database Schema

### `profiles`
Stores user information and roles. Linked to Supabase Auth.

| Field | Type | Description |
|---|---|---|
| id | uuid | Primary key, linked to auth.users |
| full_name | text | Display name of the user |
| email | text | Unique email address |
| role | text | `admin`, `core_member`, or `viewer` |
| is_active | boolean | Whether the user can log in |
| created_at | timestamptz | Account creation timestamp |
| updated_at | timestamptz | Last update timestamp |

---

### `blocks`
Stores campus building/block names.

| Field | Type | Description |
|---|---|---|
| id | serial | Auto-increment primary key |
| name | text | Unique block name (e.g. LHC, A Block) |
| description | text | Optional notes about the block |
| is_active | boolean | Whether the block is active |
| created_at | timestamptz | Creation timestamp |

**Pre-loaded blocks:** A Block, BT/BM Block, C Block, CSE Block, CY Block, EE Block, LHC, MA Block, MSME Block, PH Block

---

### `rooms`
Stores all room details, capacity, and booking restrictions.

| Field | Type | Description |
|---|---|---|
| id | serial | Auto-increment primary key |
| block_id | integer | Foreign key → blocks.id |
| room_number | text | Room name or number |
| capacity | integer | Maximum seating capacity |
| is_available | boolean | Whether room is available for booking |
| allowed_purposes | booking_purpose[] | Array of OA, Interview, PPT |
| notes | text | Special constraints or equipment info |
| created_at | timestamptz | Creation timestamp |
| updated_at | timestamptz | Last update timestamp |

---

### `bookings`
Stores all booking records.

| Field | Type | Description |
|---|---|---|
| id | serial | Auto-increment primary key |
| room_id | integer | Foreign key → rooms.id |
| booked_by | uuid | Foreign key → profiles.id |
| purpose | booking_purpose | OA, Interview, or PPT |
| date | date | Booking date |
| start_time | time | Start time of booking |
| end_time | time | End time of booking |
| participant_count | integer | Expected number of participants |
| status | text | `confirmed`, `cancelled`, or `overridden` |
| notes | text | Optional remarks from user |
| cancelled_by | uuid | Who cancelled (if applicable) |
| created_at | timestamptz | Creation timestamp |
| updated_at | timestamptz | Last update timestamp |

---

### Conflict Detection
Before every booking insert, the system checks for overlapping bookings using a time overlap query:

```sql
select exists (
  select 1 from bookings
  where room_id = p_room_id
    and date = p_date
    and status = 'confirmed'
    and (start_time, end_time) overlaps (p_start_time, p_end_time)
);
```

If a conflict exists, the booking is rejected.

---

## 5. Authentication & Access Control

### Rules
- Users **cannot** sign up by themselves
- Only an **admin** can create user accounts
- Each user logs in with **admin-provided credentials**
- Admin can **deactivate** any user account at any time
- Deactivated users are **immediately blocked** from logging in

### Roles

| Role | Capabilities |
|---|---|
| **Admin** | Full control — manage users, rooms, and all bookings |
| **Core Member** | Search rooms, create bookings, view and cancel own bookings |
| **Viewer** | View bookings and schedules only (read-only) |

### Row Level Security (RLS)
The database enforces access control at the row level:
- Admins can read and modify all records
- Core members can only read and modify their own bookings
- All authenticated users can read room and block data

---

## 6. Features

### Admin Features
- Create, deactivate, and manage user accounts
- Assign roles to users (admin, core_member, viewer)
- Add, edit, and delete rooms
- Import rooms in bulk from Excel or CSV spreadsheets
- View all bookings across all users
- Cancel or override any booking
- Monitor room utilization

### User Features
- Secure login with admin-provided credentials
- Change password from settings page
- Search available rooms by block, capacity, purpose, and time
- View real-time room availability
- Create bookings in a 3-step guided flow
- View personal booking history
- Cancel own confirmed bookings

### Booking Engine
- 3-step booking flow: Search → Select Room → Confirm
- Filters rooms by block, capacity, and allowed purposes
- Checks every room for time slot conflicts before showing it
- Performs a final conflict check at the moment of confirmation
- Prevents double-booking even under simultaneous requests

### Spreadsheet Import
- Supports Excel (.xlsx, .xls) and CSV files
- Previews all rows before importing
- Shows validation errors row by row
- Flexible column name matching
- Updates existing rooms if already present (upsert)
- Downloadable template available from the rooms page

---

## 7. User Workflows

### Admin: Creating a New User
1. Log in at the system URL
2. Go to **Admin → Manage Users**
3. Fill in full name, email, password, and role
4. Click **Create User**
5. Share the email and password with the new user directly
6. User logs in and changes their password from **Settings**

### Admin: Adding Rooms
**Option A — Manual:**
1. Go to **Admin → Manage Rooms**
2. Fill in block, room number, capacity, and notes
3. Click **Add Room**

**Option B — Spreadsheet Import:**
1. Prepare an Excel or CSV file with columns: Block, Room Number, Capacity, Notes
2. Go to **Admin → Manage Rooms → Import Rooms from Spreadsheet**
3. Upload the file and review the preview
4. Click **Import** to confirm

### User: Creating a Booking
1. Log in and go to **New Booking**
2. **Step 1 — Search:** Select purpose, block, date, time range, and participant count → click Search
3. **Step 2 — Select Room:** Choose from the list of available rooms that fit the criteria
4. **Step 3 — Confirm:** Review booking details, add optional notes, and confirm
5. Booking appears in **My Bookings** with status `confirmed`

### User: Cancelling a Booking
1. Go to **My Bookings**
2. Find the booking and click **Cancel**
3. Confirm the cancellation
4. Booking status changes to `cancelled`

---

## 8. Deployment

### Environment Variables
The following variables must be set in both local development (`.env.local`) and Vercel:

```
NEXT_PUBLIC_SUPABASE_URL        → Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY   → Supabase anon/public key
SUPABASE_SERVICE_ROLE_KEY       → Supabase service role key (server-side only)
```

> ⚠️ Never expose `SUPABASE_SERVICE_ROLE_KEY` in frontend code. It is only used in server-side API routes.

### Local Development
```bash
npm install
npm run dev
```
Visit `http://localhost:3000`

### Deploying Updates
Every push to the `main` branch on GitHub triggers an automatic redeployment on Vercel:
```bash
git add .
git commit -m "your update"
git push
```

### Supabase Auth Configuration
Under **Authentication → URL Configuration** in Supabase:
```
Site URL:      https://your-app.vercel.app
Redirect URLs: https://your-app.vercel.app/**
               http://localhost:3000/**
```

---

## 9. Rooms Reference

54 rooms pre-loaded across 10 blocks:

| Block | Rooms | Capacity Range |
|---|---|---|
| A Block | Class Rooms, LH-1, LH-2, Auditorium | 36 – 289 |
| BT/BM Block | 009, 010, 118 | 24 – 60 |
| C Block | LH-2 to LH-10 | 60 – 138 |
| CSE Block | LH-01, LH-02, LH-03 | 70 |
| CY Block | LH-1, LH-2, LH-3 | 30 – 90 |
| EE Block | 004 (GF), 20 (SF) | 60 – 80 |
| LHC | LH-01 to LH-15 | 72 – 800 |
| MA Block | MA-01, MA-02, MA-114 | 30 – 56 |
| MSME Block | LH-1, LH-2, LH-3 | 36 – 106 |
| PH Block | PH-1, PH-2, PH-3 | 50 – 80 |

Room data can be updated at any time by the admin from the Manage Rooms page.

---

## 10. Future Enhancements

The following features are planned for future versions:

- **Approval Workflow** — certain bookings require admin approval before confirmation
- **Calendar View** — visual calendar showing all room schedules
- **Email Notifications** — automatic email on booking confirmation and cancellation
- **Booking Analytics** — usage reports and room utilization statistics
- **Exportable Schedules** — download daily or weekly room schedules as PDF or Excel
- **Bulk Booking** — book multiple rooms for a single event at once
- **Recurring Bookings** — repeat a booking across multiple dates automatically
- **Block Import** — bulk import of new blocks and rooms when the full verified list is available
