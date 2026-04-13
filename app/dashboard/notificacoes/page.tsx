'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Bell, 
  DollarSign, 
  Clock, 
  Users, 
  CheckCircle,
  Trash2,
  Check,
  AlertTriangle,
  Info
} from 'lucide-react'
import { toast } from 'sonner'

interface Notification {
  id: string
  type: 'payment_due' | 'payment_reminder' | 'lead_followup' | 'plan_expiring' | 'system'
  title: string
  message: string
  read: boolean
  action_url: string | null
  metadata: Record<string, unknown>
  created_at: string
}

export default function NotificacoesPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      toast.error('Erro ao carregar notificacoes')
      return
    }

    setNotifications(data || [])
    setIsLoading(false)
  }

  const markAsRead = async (id: string) => {
    const supabase = createClient()
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', id)

    if (error) {
      toast.error('Erro ao marcar como lida')
      return
    }

    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    ))
  }

  const markAllAsRead = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', user.id)
      .eq('read', false)

    if (error) {
      toast.error('Erro ao marcar todas como lidas')
      return
    }

    setNotifications(notifications.map(n => ({ ...n, read: true })))
    toast.success('Todas notificacoes marcadas como lidas')
  }

  const deleteNotification = async (id: string) => {
    const supabase = createClient()
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id)

    if (error) {
      toast.error('Erro ao excluir notificacao')
      return
    }

    setNotifications(notifications.filter(n => n.id !== id))
    toast.success('Notificacao excluida')
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'payment_due': return <DollarSign className="h-5 w-5 text-red-500" />
      case 'payment_reminder': return <Clock className="h-5 w-5 text-yellow-500" />
      case 'lead_followup': return <Users className="h-5 w-5 text-blue-500" />
      case 'plan_expiring': return <AlertTriangle className="h-5 w-5 text-orange-500" />
      case 'system': return <Info className="h-5 w-5 text-cyan-500" />
      default: return <Bell className="h-5 w-5 text-gray-500" />
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'payment_due': return 'Pagamento Pendente'
      case 'payment_reminder': return 'Lembrete de Pagamento'
      case 'lead_followup': return 'Follow-up de Lead'
      case 'plan_expiring': return 'Plano Expirando'
      case 'system': return 'Sistema'
      default: return 'Notificacao'
    }
  }

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'payment_due': return 'bg-red-500/20 text-red-400 border-red-500/30'
      case 'payment_reminder': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'lead_followup': return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'plan_expiring': return 'bg-orange-500/20 text-orange-400 border-orange-500/30'
      case 'system': return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  const formatDate = (date: string) => {
    const d = new Date(date)
    const now = new Date()
    const diff = now.getTime() - d.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'Agora'
    if (minutes < 60) return `${minutes}min atras`
    if (hours < 24) return `${hours}h atras`
    if (days < 7) return `${days}d atras`
    return d.toLocaleDateString('pt-BR')
  }

  const filteredNotifications = filter === 'unread' 
    ? notifications.filter(n => !n.read) 
    : notifications

  const unreadCount = notifications.filter(n => !n.read).length

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#d4f244]"></div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Bell className="h-6 w-6 text-[#d4f244]" />
            Notificacoes
            {unreadCount > 0 && (
              <Badge className="bg-red-500 text-white">{unreadCount} novas</Badge>
            )}
          </h1>
          <p className="text-gray-400 mt-1">Gerencie suas notificacoes e alertas</p>
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <Button 
              variant="outline" 
              onClick={markAllAsRead}
              className="border-gray-700 text-gray-300 hover:bg-gray-800"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Marcar todas como lidas
            </Button>
          )}
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-2">
        <Button 
          variant={filter === 'all' ? 'default' : 'outline'}
          onClick={() => setFilter('all')}
          className={filter === 'all' ? 'bg-[#d4f244] text-black hover:bg-[#c4e234]' : 'border-gray-700'}
        >
          Todas ({notifications.length})
        </Button>
        <Button 
          variant={filter === 'unread' ? 'default' : 'outline'}
          onClick={() => setFilter('unread')}
          className={filter === 'unread' ? 'bg-[#d4f244] text-black hover:bg-[#c4e234]' : 'border-gray-700'}
        >
          Nao lidas ({unreadCount})
        </Button>
      </div>

      {/* Lista de Notificacoes */}
      {filteredNotifications.length === 0 ? (
        <Card className="bg-[#0d1117] border-gray-800">
          <CardContent className="p-12 text-center">
            <Bell className="h-16 w-16 mx-auto text-gray-600 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              {filter === 'unread' ? 'Nenhuma notificacao nao lida' : 'Nenhuma notificacao'}
            </h3>
            <p className="text-gray-500">
              {filter === 'unread' 
                ? 'Todas as suas notificacoes foram lidas' 
                : 'Voce ainda nao tem notificacoes'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((notification) => (
            <Card 
              key={notification.id} 
              className={`bg-[#0d1117] border-gray-800 transition-all hover:border-gray-700 ${
                !notification.read ? 'border-l-4 border-l-[#d4f244]' : ''
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl ${!notification.read ? 'bg-[#d4f244]/10' : 'bg-gray-800'}`}>
                    {getIcon(notification.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={getTypeBadgeColor(notification.type)}>
                        {getTypeLabel(notification.type)}
                      </Badge>
                      {!notification.read && (
                        <span className="h-2 w-2 rounded-full bg-[#d4f244]"></span>
                      )}
                    </div>
                    <h3 className="font-semibold text-white">{notification.title}</h3>
                    <p className="text-gray-400 text-sm mt-1">{notification.message}</p>
                    <p className="text-gray-600 text-xs mt-2">{formatDate(notification.created_at)}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    {!notification.read && (
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => markAsRead(notification.id)}
                        className="text-gray-500 hover:text-[#d4f244]"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    )}
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => deleteNotification(notification.id)}
                      className="text-gray-500 hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
