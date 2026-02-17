# Smart Bookmark App

A modern, real-time bookmark manager built with Next.js and Supabase. Organize your links with a clean interface that syncs instantly across devices.

## Features

- **Real-time Sync:** Bookmarks update instantly across all open tabs and devices using Supabase Realtime.
- **Google Authentication:** Secure login via Google OAuth.
- **Optimistic UI:** Instant feedback when adding or deleting bookmarks (UI updates before the server responds).
- **Auto-Favicons:** Automatically fetches favicons for your saved links.
- **Responsive Design:** Works seamlessly on desktop and mobile.

## Tech Stack

- **Framework:** [Next.js](https://nextjs.org/) (App Router)
- **Language:** TypeScript
- **Backend/Database:** [Supabase](https://supabase.com/) (PostgreSQL, Auth, Realtime)
- **Styling:** Tailwind CSS & Custom CSS

## Getting Started

### Prerequisites

- Node.js installed.
- A Supabase account.

### 1. Installation

Install the dependencies:

```bash
npm install
# or
yarn install
```

### 2. Environment Setup

Create a `.env.local` file in the root directory and add your Supabase credentials:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Supabase Setup

1.  **Create a Project:** Go to your Supabase dashboard and create a new project.
2.  **Create Table:** Run the following SQL in the Supabase SQL Editor to create the `bookmarks` table:

    ```sql
    create table public.bookmarks (
      id uuid not null default gen_random_uuid (),
      created_at timestamp with time zone not null default now(),
      title text not null,
      url text not null,
      user_id uuid not null default auth.uid (),
      constraint bookmarks_pkey primary key (id),
      constraint bookmarks_user_id_fkey foreign key (user_id) references auth.users (id) on delete cascade
    );
    ```

3.  **Row Level Security (RLS):**
    Enable RLS to ensure users can only see and manage their own bookmarks. Run this SQL:

    ```sql
    -- Enable RLS
    alter table public.bookmarks enable row level security;

    -- Allow users to view their own bookmarks
    create policy "Users can view their own bookmarks"
    on public.bookmarks for select
    using ( auth.uid() = user_id );

    -- Allow users to insert their own bookmarks
    create policy "Users can insert their own bookmarks"
    on public.bookmarks for insert
    with check ( auth.uid() = user_id );

    -- Allow users to delete their own bookmarks
    create policy "Users can delete their own bookmarks"
    on public.bookmarks for delete
    using ( auth.uid() = user_id );
    ```

4.  **Enable Realtime:**
    *   Go to **Database** -> **Replication** in your Supabase dashboard.
    *   Enable replication for the `bookmarks` table by toggling the switch for the `public` schema or the specific table.

### 4. Run the application

```bash
npm run dev
```

Open http://localhost:3000 with your browser.