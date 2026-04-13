'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { createClient } from '@/lib/supabase/client'
import { Search, Loader2, CreditCard, Edit } from 'lucide-react'
import { toast } from 'sonner'

interface Plan {
  id: string
  name: string
  display_name: string
  credits_per_day: number
  price_monthly: number
}

interface UserWithPlan {
  id: string
  email: string
  full_name: string | null
  plan_id: string | null
  created_at: string
  plans: Plan | null
}

export default function AdminAssinaturasPage() {
  const [users, setUsers] = useState<UserWithPlan[]>([])
  const [plans, setPlans] = useState<Plan[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedUser, setSelectedUser] = useState<UserWithPlan | null>(null)
  const [selectedPlanId, setSelectedPlanId] = useState<string>('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const supabase = createClient()
    
    // Fetch plans
    const { data: plansData } = await supabase
      .from('plans')
      .select('*')
      .order('price_monthly', { ascending: true })

    setPlans(plansData || [])

    // Fetch users with their plans
    const { data: usersData, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, plan_id, created_at, plans(*)')
      .order('created_at', { ascending: false })

    if (error) {
      console.error(error)
      toast.error('Erro ao carregar dados')
      return
    }

    setUsers(usersData || [])
    setIsLoading(false)
  }

  const handleEditPlan = (user: UserWithPlan) => {
    setSelectedUser(user)
    setSelectedPlanId(user.plan_id || '')
    setIsDialogOpen(true)
  }

  const handleSavePlan = async () => {
    if (!selectedUser || !selectedPlanId) return

    setIsSaving(true)
    const supabase = createClient()

    const { error } = await supabase
      .from('profiles')
      .update({ plan_id: selectedPlanId })
      .eq('id', selectedUser.id)

    if (error) {
      toast.error('Erro ao atualizar plano')
      console.error(error)
    } else {
      toast.success('Plano atualizado com sucesso!')
      fetchData()
      setIsDialogOpen(false)
    }

    setIsSaving(false)
  }

  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getPlanBadgeColor = (planName: string | undefined) => {
    switch (planName) {
      case 'free': return 'bg-gray-100 text-gray-700'
      case 'basic': return 'bg-blue-100 text-blue-700'
      case 'intermediate': return 'bg-purple-100 text-purple-700'
      case 'pro': return 'bg-emerald-100 text-emerald-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Gerenciar Assinaturas</h1>
        <p className="text-muted-foreground">
          Visualize e altere os planos dos usuarios
        </p>
      </div>

      {/* Plans Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        {plans.map((plan) => {
          const usersOnPlan = users.filter(u => u.plan_id === plan.id).length
          return (
            <Card key={plan.id}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{plan.display_name}</p>
                    <p className="text-2xl font-bold">{usersOnPlan}</p>
                  </div>
                  <Badge className={getPlanBadgeColor(plan.name)}>
                    R$ {plan.price_monthly.toFixed(2)}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Usuarios e Planos</CardTitle>
              <CardDescription>
                Clique em Editar para alterar o plano de um usuario
              </CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por email ou nome..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Plano Atual</TableHead>
                  <TableHead>Creditos/Dia</TableHead>
                  <TableHead>Valor Mensal</TableHead>
                  <TableHead>Cadastro</TableHead>
                  <TableHead className="w-[100px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{user.full_name || 'Sem nome'}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getPlanBadgeColor(user.plans?.name)}>
                        {user.plans?.display_name || 'Sem plano'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.plans?.credits_per_day === -1 
                        ? 'Ilimitado' 
                        : user.plans?.credits_per_day || '-'}
                    </TableCell>
                    <TableCell>
                      R$ {(user.plans?.price_monthly || 0).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      {new Date(user.created_at).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEditPlan(user)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Editar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Plan Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar Plano</DialogTitle>
            <DialogDescription>
              Alterando plano de {selectedUser?.email}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Selecione o novo plano</label>
              <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um plano" />
                </SelectTrigger>
                <SelectContent>
                  {plans.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      <div className="flex items-center justify-between w-full gap-4">
                        <span>{plan.display_name}</span>
                        <span className="text-muted-foreground">
                          R$ {plan.price_monthly.toFixed(2)}/mes
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSavePlan} disabled={isSaving || !selectedPlanId}>
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
    </div>
  )
}
