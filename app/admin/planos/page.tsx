'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { 
  Edit,
  Save,
  Loader2,
  CreditCard,
  Infinity,
  Plus,
  Trash2
} from 'lucide-react'

interface Plan {
  id: string
  name: string
  display_name: string
  credits_per_day: number
  price_monthly: number
  features: string[]
}

export default function AdminPlanosPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [plans, setPlans] = useState<Plan[]>([])
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null)
  const [featuresText, setFeaturesText] = useState('')

  useEffect(() => {
    loadPlans()
  }, [])

  const loadPlans = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .order('price_monthly', { ascending: true })

      if (error) throw error

      const plansWithFeatures = data?.map(plan => ({
        ...plan,
        features: Array.isArray(plan.features) ? plan.features : JSON.parse(plan.features || '[]')
      })) || []

      setPlans(plansWithFeatures)
    } catch (error) {
      console.error('Erro ao carregar planos:', error)
      toast.error('Erro ao carregar planos')
    } finally {
      setLoading(false)
    }
  }

  const handleEditOpen = (plan: Plan) => {
    setEditingPlan(plan)
    setFeaturesText(plan.features.join('\n'))
  }

  const handleSave = async () => {
    if (!editingPlan) return
    
    setSaving(true)
    try {
      const supabase = createClient()
      
      const features = featuresText.split('\n').filter(f => f.trim() !== '')
      
      const { error } = await supabase
        .from('plans')
        .update({
          display_name: editingPlan.display_name,
          credits_per_day: editingPlan.credits_per_day,
          price_monthly: editingPlan.price_monthly,
          features: JSON.stringify(features)
        })
        .eq('id', editingPlan.id)

      if (error) throw error

      toast.success('Plano atualizado com sucesso!')
      setEditingPlan(null)
      loadPlans()
    } catch (error) {
      console.error('Erro ao salvar:', error)
      toast.error('Erro ao salvar plano')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Gerenciar Planos</h1>
          <p className="text-muted-foreground">
            Edite valores, creditos e beneficios dos planos
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {plans.map((plan) => (
          <Card key={plan.id} className="relative">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{plan.display_name}</CardTitle>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => handleEditOpen(plan)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
              <CardDescription className="text-xs uppercase tracking-wide">
                {plan.name}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-3xl font-bold">
                  {plan.price_monthly === 0 ? (
                    'Gratis'
                  ) : (
                    <>
                      R$ {plan.price_monthly.toFixed(2).replace('.', ',')}
                      <span className="text-sm font-normal text-muted-foreground">/mes</span>
                    </>
                  )}
                </p>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                <span>
                  {plan.credits_per_day === -1 ? (
                    <span className="flex items-center gap-1">
                      <Infinity className="h-4 w-4" /> Ilimitado
                    </span>
                  ) : (
                    `${plan.credits_per_day} leads/dia`
                  )}
                </span>
              </div>

              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Beneficios:</p>
                <ul className="text-xs space-y-1">
                  {plan.features.slice(0, 3).map((feature, i) => (
                    <li key={i} className="text-muted-foreground">• {feature}</li>
                  ))}
                  {plan.features.length > 3 && (
                    <li className="text-muted-foreground">+{plan.features.length - 3} mais...</li>
                  )}
                </ul>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Dialog de edicao */}
      <Dialog open={!!editingPlan} onOpenChange={() => setEditingPlan(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Plano</DialogTitle>
            <DialogDescription>
              Altere os valores e beneficios do plano
            </DialogDescription>
          </DialogHeader>

          {editingPlan && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="display_name">Nome de Exibicao</Label>
                <Input
                  id="display_name"
                  value={editingPlan.display_name}
                  onChange={(e) => setEditingPlan(prev => prev ? {...prev, display_name: e.target.value} : null)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Preco Mensal (R$)</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={editingPlan.price_monthly}
                    onChange={(e) => setEditingPlan(prev => prev ? {...prev, price_monthly: parseFloat(e.target.value) || 0} : null)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="credits">Creditos/Dia</Label>
                  <Input
                    id="credits"
                    type="number"
                    min="-1"
                    value={editingPlan.credits_per_day}
                    onChange={(e) => setEditingPlan(prev => prev ? {...prev, credits_per_day: parseInt(e.target.value) || 0} : null)}
                  />
                  <p className="text-xs text-muted-foreground">-1 = Ilimitado</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="features">Beneficios (um por linha)</Label>
                <Textarea
                  id="features"
                  value={featuresText}
                  onChange={(e) => setFeaturesText(e.target.value)}
                  rows={6}
                  placeholder="5 leads por dia&#10;Busca basica&#10;Exportar CSV"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditingPlan(null)}>
                  Cancelar
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                  Salvar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
