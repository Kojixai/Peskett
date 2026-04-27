import { NavLayout } from '@/components/layout/nav-layout'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <NavLayout>{children}</NavLayout>
}
