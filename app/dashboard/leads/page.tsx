'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Phone,
  Globe,
  MapPin,
  Star,
  MoreVertical,
  MessageCircle,
  Trash2,
  Edit,
  Loader2,
  Users,
  DollarSign,
} from 'lucide-react'
import { toast } from 'sonner'
import type { UserLead, UserLeadStatus, Lead } from '@/lib/types'
import { STATUS_LABELS, STATUS_COLORS } from '@/lib/types'

interface UserLeadWithLead extends UserLead {
  leads: Lead
}

const COLUMNS: { status: UserLeadStatus; title: string; color: string }[] = [
  { status: 'new', title: 'Novo', color: 'bg-blue-500' },
  { status: 'contacted', title: 'Em Contato', color: 'bg-yellow-500' },
  { status: 'negotiating', title: 'Negociando', color: 'bg-orange-500' },
  { status: 'refused', title: 'Recusado', color: 'bg-red-500' },
  { status: 'closed', title: 'Fechado', color: 'bg-green-500' },
]

export default function LeadsPage() {
  const [userLeads, setUserLeads] = useState<UserLeadWithLead[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedLead, setSelectedLead] = useState<UserLeadWithLead | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editForm, setEditForm] = useState({
    notes: '',
    sale_value: '',
    monthly_recurrence: '',
  })

  useEffect(() => {
    fetchUserLeads()
  }, [])

  const fetchUserLeads = async () => {
    try {
      const response = await fetch('/api/user-leads')
      const data = await response.json()
      
      if (!response.ok) {
        toast.error(data.error || 'Erro ao carregar leads')
        return
      }
      
      setUserLeads(data.user_leads)
    } catch (error) {
      console.error('Erro:', error)
      toast.error('Erro ao carregar leads')
    } finally {
      setIsLoading(false)
    }
  }

  const handleStatusChange = async (userLeadId: string, newStatus: UserLeadStatus) => {
    try {
      const response = await fetch('/api/user-leads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: userLeadId, status: newStatus }),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        toast.error(data.error || 'Erro ao atualizar status')
        return
      }
      
      setUserLeads((prev) =>
        prev.map((ul) => (ul.id === userLeadId ? data.user_lead : ul))
      )
      toast.success(`Status atualizado para ${STATUS_LABELS[newStatus]}`)
    } catch (error) {
      console.error('Erro:', error)
      toast.error('Erro ao atualizar status')
    }
  }

  const handleDelete = async (userLeadId: string) => {
    if (!confirm('Tem certeza que deseja remover este lead do CRM?')) return
    
    try {
      const response = await fetch(`/api/user-leads?id=${userLeadId}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        const data = await response.json()
        toast.error(data.error || 'Erro ao remover lead')
        return
      }
      
      setUserLeads((prev) => prev.filter((ul) => ul.id !== userLeadId))
      toast.success('Lead removido do CRM')
    } catch (error) {
      console.error('Erro:', error)
      toast.error('Erro ao remover lead')
    }
  }

  const handleEditOpen = (userLead: UserLeadWithLead) => {
    setSelectedLead(userLead)
    setEditForm({
      notes: userLead.notes || '',
      sale_value: userLead.sale_value?.toString() || '',
      monthly_recurrence: userLead.monthly_recurrence?.toString() || '',
    })
    setIsEditDialogOpen(true)
  }

  const handleEditSave = async () => {
    if (!selectedLead) return
    
    setIsSaving(true)
    try {
      const response = await fetch('/api/user-leads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedLead.id,
          notes: editForm.notes,
          sale_value: editForm.sale_value ? parseFloat(editForm.sale_value) : null,
          monthly_recurrence: editForm.monthly_recurrence ? parseFloat(editForm.monthly_recurrence) : null,
        }),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        toast.error(data.error || 'Erro ao salvar')
        return
      }
      
      setUserLeads((prev) =>
        prev.map((ul) => (ul.id === selectedLead.id ? data.user_lead : ul))
      )
      setIsEditDialogOpen(false)
      toast.success('Informações salvas!')
    } catch (error) {
      console.error('Erro:', error)
      toast.error('Erro ao salvar')
    } finally {
      setIsSaving(false)
    }
  }

  const openWhatsApp = (phone: string, leadName: string) => {
    const cleanPhone = phone.replace(/\D/g, '')
    const message = encodeURIComponent(
      `Olá! Vi sua empresa ${leadName} e gostaria de conversar sobre uma oportunidade de negócio. Podemos conversar?`
    )
    window.open(`https://wa.me/55${cleanPhone}?text=${message}`, '_blank')
  }

  const getLeadsByStatus = (status: UserLeadStatus) => {
    return userLeads.filter((ul) => ul.status === status)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Meus Leads</h1>
          <p className="text-muted-foreground">
            Gerencie seu pipeline de vendas
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="gap-1">
            <Users className="h-3 w-3" />
            {userLeads.length} leads
          </Badge>
          <Badge variant="secondary" className="gap-1 bg-green-100 text-green-700">
            <DollarSign className="h-3 w-3" />
            R$ {userLeads
              .filter((ul) => ul.status === 'closed')
              .reduce((acc, ul) => acc + (Number(ul.sale_value) || 0), 0)
              .toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </Badge>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 overflow-x-auto pb-4">
        {COLUMNS.map((column) => {
          const columnLeads = getLeadsByStatus(column.status)
          
          return (
            <div key={column.status} className="min-w-[280px]">
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-2 h-2 rounded-full ${column.color}`} />
                <h3 className="font-medium">{column.title}</h3>
                <Badge variant="secondary" className="ml-auto">
                  {columnLeads.length}
                </Badge>
              </div>
              
              <div className="space-y-3">
                {columnLeads.map((userLead) => (
                  <Card key={userLead.id} className="shadow-sm">
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm truncate">
                            {userLead.leads.name}
                          </h4>
                          <a 
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${userLead.leads.name} ${userLead.leads.address || ''} ${userLead.leads.city} ${userLead.leads.state}`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs text-muted-foreground mt-1 hover:text-primary transition-colors"
                          >
                            <MapPin className="h-3 w-3" />
                            <span className="truncate hover:underline">
                              {userLead.leads.city}, {userLead.leads.state}
                            </span>
                          </a>
                        </div>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditOpen(userLead)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${userLead.leads.name} ${userLead.leads.address || ''} ${userLead.leads.city} ${userLead.leads.state}`)}`, '_blank')}
                            >
                              <MapPin className="h-4 w-4 mr-2" />
                              Ver no Maps
                            </DropdownMenuItem>
                            {userLead.leads.phone && (
                              <DropdownMenuItem 
                                onClick={() => openWhatsApp(userLead.leads.phone!, userLead.leads.name)}
                              >
                                <MessageCircle className="h-4 w-4 mr-2" />
                                WhatsApp
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            {COLUMNS.filter((c) => c.status !== userLead.status).map((c) => (
                              <DropdownMenuItem
                                key={c.status}
                                onClick={() => handleStatusChange(userLead.id, c.status)}
                              >
                                <div className={`w-2 h-2 rounded-full ${c.color} mr-2`} />
                                Mover para {c.title}
                              </DropdownMenuItem>
                            ))}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleDelete(userLead.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Remover
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-1 mt-2">
                        {userLead.leads.phone && (
                          <Badge variant="outline" className="text-xs gap-1">
                            <Phone className="h-3 w-3" />
                          </Badge>
                        )}
                        {userLead.leads.website && (
                          <Badge variant="outline" className="text-xs gap-1">
                            <Globe className="h-3 w-3" />
                          </Badge>
                        )}
                        {userLead.leads.rating && (
                          <Badge variant="outline" className="text-xs gap-1">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            {userLead.leads.rating}
                          </Badge>
                        )}
                      </div>
                      
                      {userLead.status === 'closed' && userLead.sale_value && (
                        <div className="mt-2 pt-2 border-t">
                          <p className="text-xs text-green-600 font-medium">
                            R$ {Number(userLead.sale_value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                      )}
                      
                      {userLead.notes && (
                        <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                          {userLead.notes}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
                
                {columnLeads.length === 0 && (
                  <Card className="border-dashed">
                    <CardContent className="p-4 text-center text-muted-foreground text-sm">
                      Nenhum lead
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Lead</DialogTitle>
            <DialogDescription>
              {selectedLead?.leads.name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="notes">Notas</Label>
              <Textarea
                id="notes"
                placeholder="Adicione notas sobre este lead..."
                value={editForm.notes}
                onChange={(e) => setEditForm((prev) => ({ ...prev, notes: e.target.value }))}
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sale_value">Valor da Venda (R$)</Label>
                <Input
                  id="sale_value"
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  value={editForm.sale_value}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, sale_value: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="monthly_recurrence">Recorrência Mensal (R$)</Label>
                <Input
                  id="monthly_recurrence"
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  value={editForm.monthly_recurrence}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, monthly_recurrence: e.target.value }))}
                />
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEditSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Empty State */}
      {userLeads.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhum lead ainda</h3>
            <p className="text-muted-foreground text-center max-w-md mb-4">
              Comece buscando leads para adicionar ao seu CRM
            </p>
            <Button asChild>
              <a href="/dashboard/buscar">Buscar Leads</a>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
