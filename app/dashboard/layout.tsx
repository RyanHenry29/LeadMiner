import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/app-sidebar'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { Bell, Shield } from 'lucide-react'
import type { Profile, Plan } from '@/lib/types'

// Email do admin unico
const ADMIN_EMAIL = 'ryanhenry.gomes@gmail.com'

async function getProfileWithPlan(userId: string): Promise<{ profile: Profile | null; plan: Plan | null }> {
  const supabase = await createClient()
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  
  let plan: Plan | null = null
  
  if (profile?.plan_id) {
    const { data: planData } = await supabase
      .from('plans')
      .select('*')
      .eq('id', profile.plan_id)
      .single()
    
    plan = planData
  } else {
    // Default to free plan
    const { data: freePlan } = await supabase
      .from('plans')
      .select('*')
      .eq('name', 'free')
      .single()
    
    plan = freePlan
  }
  
  return { profile, plan }
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth/login')
  }
  
  const { profile, plan } = await getProfileWithPlan(user.id)
  
  // Busca notificações não lidas
  const { data: unreadNotifications } = await supabase
    .from('notifications')
    .select('id')
    .eq('user_id', user.id)
    .eq('read', false)
  
  const unreadCount = unreadNotifications?.length || 0
  const isAdmin = user.email === ADMIN_EMAIL
  
  // Texto do header baseado se e admin ou nao
  const headerText = isAdmin 
    ? 'Admin - Creditos Ilimitados'
    : `${plan?.display_name || 'Gratuito'} - ${plan?.credits_per_day === -1 ? 'Ilimitado' : `${Math.max(0, (plan?.credits_per_day || 5) - (profile?.credits_used_today || 0))} creditos restantes`}`
  
  return (
    <SidebarProvider>
      <AppSidebar profile={profile} plan={plan} />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center justify-between border-b px-4">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            {isAdmin ? (
              <span className="text-sm font-medium text-amber-500 flex items-center gap-1">
                <Shield className="h-4 w-4" />
                {headerText}
              </span>
            ) : (
              <span className="text-sm text-muted-foreground">
                {headerText}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Link href="/dashboard/notificacoes">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-xs text-destructive-foreground flex items-center justify-center font-medium">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Button>
            </Link>
          </div>
        </header>
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
