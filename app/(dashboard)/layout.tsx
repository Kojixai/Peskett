import { redirect } from 'next/navigation'
import { NavLayout } from '@/components/layout/nav-layout'

function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  return !!(
    url &&
    key &&
    url !== 'https://placeholder.supabase.co' &&
    !url.includes('placeholder') &&
    key.length > 50
  )
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const demo = process.env.DEMO_MODE === 'true' || !isSupabaseConfigured()

  if (!demo) {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/auth/login')
  }

  return <NavLayout>{children}</NavLayout>
}
