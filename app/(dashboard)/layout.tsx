import { redirect } from 'next/navigation'
import { NavLayout } from '@/components/layout/nav-layout'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')
  return <NavLayout>{children}</NavLayout>
}
