'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  TrendingUp, 
  TrendingDown,
  DollarSign, 
  Users, 
  Search,
  Bell,
  CheckCircle,
  Clock,
  AlertTriangle,
  ArrowUpRight,
  Package,
  Target,
  Zap,
  BarChart3
} from 'lucide-react'
import Link from 'next/link'

interface DashboardStats {
  vendasHoje: number
  lucroHoje: number
  possiveisVendas: number
  possivelLucro: number
  totalDia: number
  leadsHoje: number
  leadsAtivos: number
  taxaFinalizacao: number
  vendasMes: number
  lucroMes: number
  totalLeadsMes: number
  taxaFinalizacaoMes: number
  variacaoVendasOntem: number
  variacaoMesAnterior: number
  creditosRestantes: number
  creditosTotal: number
  notificacoesNaoLidas: number
}

interface Notification {
  id: string
  type: string
  title: string
  message: string
  read: boolean
  created_at: string
}

interface RecentLead {
  id: string
  name: string
  city: string
  state: string
  status: string
  sale_value: number | null
  created_at: string
}

// Email do admin unico
const ADMIN_EMAIL = 'ryanhenry.gomes@gmail.com'

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    vendasHoje: 0, lucroHoje: 0, possiveisVendas: 0, possivelLucro: 0,
    totalDia: 0, leadsHoje: 0, leadsAtivos: 0, taxaFinalizacao: 0,
    vendasMes: 0, lucroMes: 0, totalLeadsMes: 0, taxaFinalizacaoMes: 0,
    variacaoVendasOntem: 0, variacaoMesAnterior: 0,
    creditosRestantes: 0, creditosTotal: 5, notificacoesNaoLidas: 0
  })
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [recentLeads, setRecentLeads] = useState<RecentLead[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState('')

  useEffect(() => {
    const now = new Date()
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long' }
    setCurrentDate(now.toLocaleDateString('pt-BR', options).replace(/^\w/, c => c.toUpperCase()))
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase
      .from('profiles')
      .select('*, plans(*)')
      .eq('id', user.id)
      .single()

    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1)

    const { data: userLeads } = await supabase
      .from('user_leads')
      .select('*, leads(*)')
      .eq('user_id', user.id)

    const leadsHoje = userLeads?.filter(l => new Date(l.created_at) >= hoje) || []
    const vendasHoje = userLeads?.filter(l => l.status === 'closed' && l.closed_at && new Date(l.closed_at) >= hoje) || []
    const lucroHoje = vendasHoje.reduce((acc, l) => acc + (Number(l.sale_value) || 0), 0)
    const emNegociacao = userLeads?.filter(l => l.status === 'negotiating') || []
    const possiveisVendas = emNegociacao.reduce((acc, l) => acc + (Number(l.sale_value) || 0), 0)
    const vendasMes = userLeads?.filter(l => l.status === 'closed' && l.closed_at && new Date(l.closed_at) >= inicioMes) || []
    const lucroMes = vendasMes.reduce((acc, l) => acc + (Number(l.sale_value) || 0), 0)
    const totalFechados = userLeads?.filter(l => l.status === 'closed').length || 0
    const totalLeads = userLeads?.length || 0
    const taxaFinalizacao = totalLeads > 0 ? Math.round((totalFechados / totalLeads) * 100) : 0

    const { data: notifs } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5)

    const recentLeadsData = userLeads
      ?.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5)
      .map(ul => ({
        id: ul.id, name: ul.leads?.name || 'Lead', city: ul.leads?.city || '',
        state: ul.leads?.state || '', status: ul.status, sale_value: ul.sale_value, created_at: ul.created_at
      })) || []

    const isAdmin = user.email === ADMIN_EMAIL
    const creditosUsados = profile?.credits_used_today || 0
    const creditosTotal = profile?.plans?.credits_per_day || 5
    // Admin sempre tem creditos ilimitados
    const creditosRestantes = isAdmin ? -1 : (creditosTotal === -1 ? -1 : Math.max(0, creditosTotal - creditosUsados))

    setStats({
      vendasHoje: vendasHoje.length, lucroHoje, possiveisVendas: emNegociacao.length,
      possivelLucro: possiveisVendas, totalDia: lucroHoje + possiveisVendas,
      leadsHoje: leadsHoje.length,
      leadsAtivos: userLeads?.filter(l => l.status !== 'closed' && l.status !== 'refused').length || 0,
      taxaFinalizacao, vendasMes: vendasMes.length, lucroMes,
      totalLeadsMes: userLeads?.filter(l => new Date(l.created_at) >= inicioMes).length || 0,
      taxaFinalizacaoMes: taxaFinalizacao, variacaoVendasOntem: 0, variacaoMesAnterior: 0,
      creditosRestantes, creditosTotal, notificacoesNaoLidas: notifs?.filter(n => !n.read).length || 0
    })
    setNotifications(notifs || [])
    setRecentLeads(recentLeadsData)
    setIsLoading(false)
  }

  const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      new: 'bg-blue-500/20 text-blue-400', contacted: 'bg-yellow-500/20 text-yellow-400',
      negotiating: 'bg-orange-500/20 text-orange-400', closed: 'bg-green-500/20 text-green-400',
      refused: 'bg-red-500/20 text-red-400'
    }
    return colors[status] || 'bg-gray-500/20 text-gray-400'
  }
  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = { new: 'Novo', contacted: 'Contatado', negotiating: 'Negociando', closed: 'Fechado', refused: 'Recusado' }
    return labels[status] || status
  }
  const mesAtual = new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).toUpperCase()

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#d4f244]"></div></div>
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">DASHBOARD</h1>
          <p className="text-sm text-gray-400 capitalize">{currentDate}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
            <span className="text-sm text-green-500">Sistema ativo</span>
          </div>
          <Link href="/dashboard/notificacoes">
            <Button variant="ghost" size="icon" className="relative text-gray-400 hover:text-white">
              <Bell className="h-5 w-5" />
              {stats.notificacoesNaoLidas > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-xs flex items-center justify-center text-white">{stats.notificacoesNaoLidas}</span>
              )}
            </Button>
          </Link>
        </div>
      </div>

      {/* Cards de Acao Rapida */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-orange-500/20 to-orange-600/5 border-orange-500/30 hover:border-orange-400/50 transition-all">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-orange-500/20"><Package className="h-6 w-6 text-orange-400" /></div>
            <div><p className="text-3xl font-bold text-orange-400">{stats.leadsAtivos}</p><p className="text-sm text-gray-400">Leads pendentes</p></div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/5 border-yellow-500/30 hover:border-yellow-400/50 transition-all">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-yellow-500/20"><AlertTriangle className="h-6 w-6 text-yellow-400" /></div>
            <div><p className="text-3xl font-bold text-yellow-400">{stats.possiveisVendas}</p><p className="text-sm text-gray-400">Em negociacao</p></div>
          </CardContent>
        </Card>

        <Link href="/dashboard/buscar" className="block">
          <Card className="bg-gradient-to-br from-cyan-500/20 to-cyan-600/5 border-cyan-500/30 hover:border-cyan-400 hover:shadow-lg hover:shadow-cyan-500/10 transition-all cursor-pointer h-full">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-cyan-500/20"><Zap className="h-6 w-6 text-cyan-400" /></div>
              <div><p className="text-sm font-bold text-cyan-400">ACAO RAPIDA</p><p className="text-sm text-gray-400">Buscar novos leads</p></div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/leads" className="block">
          <Card className="bg-gradient-to-br from-gray-500/10 to-gray-600/5 border-gray-600/30 hover:border-gray-500 hover:shadow-lg transition-all cursor-pointer h-full">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gray-500/20"><Target className="h-6 w-6 text-gray-400" /></div>
              <div><p className="text-sm font-bold text-gray-300">VER CRM</p><p className="text-sm text-gray-500">Gerenciar leads</p></div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Vendas de Hoje */}
      <div>
        <h2 className="text-xs font-bold text-gray-500 mb-4 tracking-wider">VENDAS DE HOJE</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-[#0d1117] border-gray-800 border-l-4 border-l-green-500">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2"><CheckCircle className="h-4 w-4 text-green-500" /><span className="text-xs text-green-500 font-bold tracking-wide">VENDAS CONFIRMADAS</span></div>
              <p className="text-2xl font-bold text-green-500">{formatCurrency(stats.lucroHoje)}</p>
              <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                {stats.variacaoVendasOntem >= 0 ? <TrendingUp className="h-3 w-3 text-green-500" /> : <TrendingDown className="h-3 w-3 text-red-500" />}
                <span className={stats.variacaoVendasOntem >= 0 ? 'text-green-500' : 'text-red-500'}>{stats.variacaoVendasOntem}% vs ontem</span>
              </p>
            </CardContent>
          </Card>

          <Card className="bg-[#0d1117] border-gray-800 border-l-4 border-l-emerald-500">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2"><DollarSign className="h-4 w-4 text-emerald-500" /><span className="text-xs text-emerald-500 font-bold tracking-wide">LUCRO CONFIRMADO</span></div>
              <p className="text-2xl font-bold text-emerald-500">{formatCurrency(stats.lucroHoje)}</p>
              <p className="text-xs text-gray-500">{stats.vendasHoje} pedidos finalizados</p>
            </CardContent>
          </Card>

          <Card className="bg-[#0d1117] border-gray-800 border-l-4 border-l-red-500">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2"><Clock className="h-4 w-4 text-red-500" /><span className="text-xs text-red-500 font-bold tracking-wide">POSSIVEIS VENDAS</span></div>
              <p className="text-2xl font-bold text-red-500">{formatCurrency(stats.possivelLucro)}</p>
              <p className="text-xs text-gray-500">{stats.possiveisVendas} leads pendentes</p>
            </CardContent>
          </Card>

          <Card className="bg-[#0d1117] border-gray-800 border-l-4 border-l-yellow-500">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2"><TrendingUp className="h-4 w-4 text-yellow-500" /><span className="text-xs text-yellow-500 font-bold tracking-wide">POSSIVEL LUCRO</span></div>
              <p className="text-2xl font-bold text-yellow-500">{formatCurrency(stats.possivelLucro)}</p>
              <p className="text-xs text-gray-500">Aguardando finalizacao</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Metricas Secundarias */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-[#0d1117] border-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2"><DollarSign className="h-4 w-4 text-gray-500" /><span className="text-xs text-gray-500 font-bold">TOTAL DO DIA</span></div>
            <p className="text-2xl font-bold text-cyan-400">{formatCurrency(stats.totalDia)}</p>
            <p className="text-xs text-gray-600">Confirmadas + Pendentes</p>
          </CardContent>
        </Card>

        <Card className="bg-[#0d1117] border-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2"><Users className="h-4 w-4 text-gray-500" /><span className="text-xs text-gray-500 font-bold">LEADS HOJE</span></div>
            <p className="text-2xl font-bold text-white">{stats.leadsHoje}</p>
            <p className="text-xs text-gray-600">0 aguardando</p>
          </CardContent>
        </Card>

        <Card className="bg-[#0d1117] border-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2"><Target className="h-4 w-4 text-gray-500" /><span className="text-xs text-gray-500 font-bold">LEADS ATIVOS</span></div>
            <p className="text-2xl font-bold text-white">{stats.leadsAtivos}</p>
            <p className="text-xs text-gray-600">Em acompanhamento</p>
          </CardContent>
        </Card>

        <Card className="bg-[#0d1117] border-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2"><BarChart3 className="h-4 w-4 text-gray-500" /><span className="text-xs text-gray-500 font-bold">TAXA FINALIZACAO</span></div>
            <p className="text-2xl font-bold text-white">{stats.taxaFinalizacao}%</p>
            <p className="text-xs text-gray-600">{stats.vendasHoje} de {stats.leadsHoje} finalizados</p>
          </CardContent>
        </Card>
      </div>

      {/* Vendas do Mes */}
      <div>
        <h2 className="text-xs font-bold text-gray-500 mb-4 tracking-wider">VENDAS DO MES - {mesAtual}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2"><DollarSign className="h-4 w-4 text-blue-400" /><span className="text-xs text-blue-400 font-bold">VENDAS DO MES</span></div>
              <p className="text-2xl font-bold text-blue-400">{formatCurrency(stats.lucroMes)}</p>
              <p className="text-xs text-green-500">+{stats.variacaoMesAnterior}% vs mes anterior</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 border-cyan-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2"><TrendingUp className="h-4 w-4 text-cyan-400" /><span className="text-xs text-cyan-400 font-bold">LUCRO DO MES</span></div>
              <p className="text-2xl font-bold text-cyan-400">{formatCurrency(stats.lucroMes)}</p>
              <p className="text-xs text-gray-500">{stats.vendasMes} pedidos finalizados</p>
            </CardContent>
          </Card>

          <Card className="bg-[#0d1117] border-gray-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2"><Users className="h-4 w-4 text-gray-500" /><span className="text-xs text-gray-500 font-bold">TOTAL LEADS</span></div>
              <p className="text-2xl font-bold text-white">{stats.totalLeadsMes}</p>
              <p className="text-xs text-green-500">{stats.vendasMes} finalizados</p>
            </CardContent>
          </Card>

          <Card className="bg-[#0d1117] border-gray-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2"><CheckCircle className="h-4 w-4 text-gray-500" /><span className="text-xs text-gray-500 font-bold">TAXA FINALIZACAO</span></div>
              <p className="text-2xl font-bold text-white">{stats.taxaFinalizacaoMes}%</p>
              <p className="text-xs text-gray-600">Todos finalizados</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Grid Inferior */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Creditos */}
        <Card className="bg-[#0d1117] border-gray-800">
          <CardContent className="p-6">
            <h3 className="font-bold mb-4 flex items-center gap-2 text-white"><Search className="h-5 w-5 text-[#d4f244]" />Creditos de Busca</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Restantes hoje</span>
                <span className="text-3xl font-bold text-[#d4f244]">{stats.creditosRestantes === -1 ? 'Ilimitado' : stats.creditosRestantes}</span>
              </div>
              {stats.creditosRestantes !== -1 && (
                <div className="w-full bg-gray-800 rounded-full h-3">
                  <div className="bg-[#d4f244] h-3 rounded-full transition-all" style={{ width: `${(stats.creditosRestantes / stats.creditosTotal) * 100}%` }}></div>
                </div>
              )}
              <p className="text-sm text-gray-500">{stats.creditosRestantes === -1 ? 'Voce tem buscas ilimitadas!' : `${stats.creditosRestantes} de ${stats.creditosTotal} creditos`}</p>
              <Link href="/dashboard/planos"><Button className="w-full bg-[#d4f244] text-black hover:bg-[#c4e234] font-bold"><ArrowUpRight className="h-4 w-4 mr-2" />Fazer upgrade</Button></Link>
            </div>
          </CardContent>
        </Card>

        {/* Leads Recentes */}
        <Card className="bg-[#0d1117] border-gray-800">
          <CardContent className="p-6">
            <h3 className="font-bold mb-4 flex items-center gap-2 text-white"><Users className="h-5 w-5 text-[#d4f244]" />Leads Recentes</h3>
            {recentLeads.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Nenhum lead salvo ainda</p>
                <Link href="/dashboard/buscar"><Button variant="link" className="mt-2 text-[#d4f244]">Buscar leads agora</Button></Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recentLeads.map((lead) => (
                  <div key={lead.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-800/50 hover:bg-gray-800 transition-colors">
                    <div><p className="font-medium text-sm text-white">{lead.name}</p><p className="text-xs text-gray-500">{lead.city}, {lead.state}</p></div>
                    <Badge className={getStatusColor(lead.status)}>{getStatusLabel(lead.status)}</Badge>
                  </div>
                ))}
                <Link href="/dashboard/leads"><Button variant="ghost" className="w-full mt-2 text-gray-400 hover:text-white">Ver todos<ArrowUpRight className="h-4 w-4 ml-2" /></Button></Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
