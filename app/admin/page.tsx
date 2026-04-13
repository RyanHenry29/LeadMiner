'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { Users, Search, CreditCard, TrendingUp, DollarSign, UserCheck } from 'lucide-react'

interface AdminStats {
  totalUsers: number
  totalLeads: number
  totalSearches: number
  usersWithPaidPlan: number
  revenueEstimate: number
  newUsersToday: number
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalLeads: 0,
    totalSearches: 0,
    usersWithPaidPlan: 0,
    revenueEstimate: 0,
    newUsersToday: 0,
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    const supabase = createClient()

    // Total users
    const { count: totalUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })

    // Total leads
    const { count: totalLeads } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })

    // Total searches
    const { count: totalSearches } = await supabase
      .from('search_history')
      .select('*', { count: 'exact', head: true })

    // Users with paid plans
    const { data: paidPlans } = await supabase
      .from('plans')
      .select('id')
      .neq('name', 'free')

    const paidPlanIds = paidPlans?.map(p => p.id) || []

    const { count: usersWithPaidPlan } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .in('plan_id', paidPlanIds)

    // Revenue estimate (users * plan price)
    const { data: usersWithPlans } = await supabase
      .from('profiles')
      .select('plan_id, plans(price_monthly)')
      .in('plan_id', paidPlanIds)

    const revenueEstimate = usersWithPlans?.reduce((acc, user) => {
      const price = (user.plans as any)?.price_monthly || 0
      return acc + Number(price)
    }, 0) || 0

    // New users today
    const today = new Date().toISOString().split('T')[0]
    const { count: newUsersToday } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today)

    setStats({
      totalUsers: totalUsers || 0,
      totalLeads: totalLeads || 0,
      totalSearches: totalSearches || 0,
      usersWithPaidPlan: usersWithPaidPlan || 0,
      revenueEstimate,
      newUsersToday: newUsersToday || 0,
    })

    setIsLoading(false)
  }

  const statCards = [
    {
      title: 'Total de Usuarios',
      value: stats.totalUsers,
      icon: Users,
      description: `+${stats.newUsersToday} hoje`,
      color: 'text-blue-600',
    },
    {
      title: 'Leads no Sistema',
      value: stats.totalLeads,
      icon: Search,
      description: 'Leads minerados',
      color: 'text-green-600',
    },
    {
      title: 'Buscas Realizadas',
      value: stats.totalSearches,
      icon: TrendingUp,
      description: 'Total de buscas',
      color: 'text-orange-600',
    },
    {
      title: 'Assinantes Pagos',
      value: stats.usersWithPaidPlan,
      icon: UserCheck,
      description: 'Planos pagos ativos',
      color: 'text-purple-600',
    },
    {
      title: 'Receita Mensal',
      value: `R$ ${stats.revenueEstimate.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      icon: DollarSign,
      description: 'Estimativa MRR',
      color: 'text-emerald-600',
    },
    {
      title: 'Taxa de Conversao',
      value: stats.totalUsers > 0 
        ? `${((stats.usersWithPaidPlan / stats.totalUsers) * 100).toFixed(1)}%`
        : '0%',
      icon: CreditCard,
      description: 'Free para Pago',
      color: 'text-cyan-600',
    },
  ]

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard Administrativo</h1>
        <p className="text-muted-foreground">
          Visao geral da plataforma LeadMiner
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? '...' : stat.value}
              </div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Acoes Rapidas</CardTitle>
            <CardDescription>Tarefas administrativas comuns</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <a 
              href="/admin/usuarios" 
              className="block p-3 rounded-lg border hover:bg-muted transition-colors"
            >
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Gerenciar Usuarios</p>
                  <p className="text-sm text-muted-foreground">Ver e editar usuarios, promover admins</p>
                </div>
              </div>
            </a>
            <a 
              href="/admin/leads" 
              className="block p-3 rounded-lg border hover:bg-muted transition-colors"
            >
              <div className="flex items-center gap-3">
                <Search className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Ver Todos os Leads</p>
                  <p className="text-sm text-muted-foreground">Leads minerados por todos usuarios</p>
                </div>
              </div>
            </a>
            <a 
              href="/admin/assinaturas" 
              className="block p-3 rounded-lg border hover:bg-muted transition-colors"
            >
              <div className="flex items-center gap-3">
                <CreditCard className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Assinaturas</p>
                  <p className="text-sm text-muted-foreground">Gerenciar planos dos usuarios</p>
                </div>
              </div>
            </a>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribuicao de Planos</CardTitle>
            <CardDescription>Usuarios por tipo de plano</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-gray-400" />
                  <span className="text-sm">Gratuito</span>
                </div>
                <span className="text-sm font-medium">
                  {stats.totalUsers - stats.usersWithPaidPlan}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span className="text-sm">Basico</span>
                </div>
                <span className="text-sm font-medium">-</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-purple-500" />
                  <span className="text-sm">Intermediario</span>
                </div>
                <span className="text-sm font-medium">-</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="text-sm">Profissional</span>
                </div>
                <span className="text-sm font-medium">-</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
