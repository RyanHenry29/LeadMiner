import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Check, Zap, Crown, Star, ExternalLink, AlertCircle } from 'lucide-react'
import type { Plan, Profile } from '@/lib/types'

interface PaymentLinks {
  enabled: boolean
  basic_plan_link: string
  intermediate_plan_link: string
  pro_plan_link: string
}

async function getPlansData(userId: string) {
  const supabase = await createClient()
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('*, plans(*)')
    .eq('id', userId)
    .single()
  
  const { data: plans } = await supabase
    .from('plans')
    .select('*')
    .order('price_monthly', { ascending: true })

  // Busca links de pagamento configurados pelo admin
  const { data: paymentLinksConfig } = await supabase
    .from('system_config')
    .select('value')
    .eq('key', 'payment_links')
    .single()

  const paymentLinks: PaymentLinks = paymentLinksConfig?.value 
    ? (typeof paymentLinksConfig.value === 'string' 
        ? JSON.parse(paymentLinksConfig.value) 
        : paymentLinksConfig.value)
    : { enabled: false, basic_plan_link: '', intermediate_plan_link: '', pro_plan_link: '' }
  
  return {
    profile: profile as Profile | null,
    currentPlan: profile?.plans as Plan | null,
    plans: plans as Plan[] || [],
    paymentLinks,
  }
}

const PLAN_ICONS: Record<string, typeof Zap> = {
  free: Zap,
  basic: Star,
  intermediate: Crown,
  pro: Crown,
}

// Mapeia o nome do plano para a chave do link
function getPaymentLink(planName: string, paymentLinks: PaymentLinks): string | null {
  if (!paymentLinks.enabled) return null
  
  switch (planName) {
    case 'basic':
      return paymentLinks.basic_plan_link || null
    case 'intermediate':
      return paymentLinks.intermediate_plan_link || null
    case 'pro':
      return paymentLinks.pro_plan_link || null
    default:
      return null
  }
}

export default async function PlanosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth/login')
  }
  
  const { profile, currentPlan, plans, paymentLinks } = await getPlansData(user.id)
  
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Planos e Assinatura</h1>
        <p className="text-muted-foreground">
          Gerencie sua assinatura e faca upgrade quando precisar
        </p>
      </div>
      
      {/* Current Plan */}
      <Card className="border-primary">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Seu Plano Atual</CardTitle>
              <CardDescription>
                {currentPlan?.display_name || 'Gratuito'}
              </CardDescription>
            </div>
            <Badge className="bg-primary">
              {currentPlan?.credits_per_day === -1 
                ? 'Ilimitado' 
                : `${currentPlan?.credits_per_day || 5} leads/dia`}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold">
              R$ {currentPlan?.price_monthly?.toFixed(2).replace('.', ',') || '0,00'}
            </span>
            <span className="text-muted-foreground">/mes</span>
          </div>
          
          <div className="mt-4 grid gap-2">
            {currentPlan?.features && typeof currentPlan.features === 'object' && Array.isArray(currentPlan.features) && (
              currentPlan.features.map((feature: string) => (
                <div key={feature} className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-primary" />
                  <span>{feature}</span>
                </div>
              ))
            )}
          </div>
          
          <div className="mt-4 pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              Creditos usados hoje: <span className="font-medium">{profile?.credits_used_today || 0}</span>
              {currentPlan?.credits_per_day !== -1 && (
                <> de {currentPlan?.credits_per_day || 5}</>
              )}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Aviso se pagamentos não estão configurados */}
      {!paymentLinks.enabled && (
        <Card className="border-amber-500 bg-amber-500/10">
          <CardContent className="flex items-center gap-3 pt-6">
            <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0" />
            <p className="text-sm text-amber-700 dark:text-amber-300">
              Sistema de pagamentos em manutencao. Entre em contato para assinar um plano.
            </p>
          </CardContent>
        </Card>
      )}
      
      {/* Available Plans */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Outros Planos</h2>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {plans.map((plan) => {
            const isCurrentPlan = currentPlan?.id === plan.id
            const Icon = PLAN_ICONS[plan.name] || Zap
            const features = typeof plan.features === 'string' 
              ? JSON.parse(plan.features) 
              : plan.features || []
            const paymentLink = getPaymentLink(plan.name, paymentLinks)
            const isPaid = plan.price_monthly > 0
            
            return (
              <Card 
                key={plan.id} 
                className={`relative ${plan.name === 'intermediate' ? 'border-primary shadow-lg' : ''}`}
              >
                {plan.name === 'intermediate' && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary">Mais popular</Badge>
                  </div>
                )}
                
                <CardHeader className="text-center pb-2">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-2">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>{plan.display_name}</CardTitle>
                  <div className="mt-2">
                    <span className="text-3xl font-bold">
                      R$ {plan.price_monthly.toFixed(2).replace('.', ',')}
                    </span>
                    <span className="text-muted-foreground">/mes</span>
                  </div>
                  <CardDescription>
                    {plan.credits_per_day === -1 
                      ? 'Leads ilimitados' 
                      : `${plan.credits_per_day} leads/dia`}
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  <ul className="space-y-2 mb-4">
                    {Array.isArray(features) && features.map((feature: string) => (
                      <li key={feature} className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-primary flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  {isCurrentPlan ? (
                    <Button className="w-full" disabled variant="outline">
                      Plano Atual
                    </Button>
                  ) : isPaid && paymentLink ? (
                    <Button 
                      className="w-full" 
                      variant={plan.name === 'intermediate' ? 'default' : 'outline'}
                      asChild
                    >
                      <a href={paymentLink} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Assinar Agora
                      </a>
                    </Button>
                  ) : isPaid && !paymentLink ? (
                    <Button 
                      className="w-full" 
                      variant="outline"
                      disabled
                    >
                      Indisponivel
                    </Button>
                  ) : (
                    <Button 
                      className="w-full" 
                      variant="outline"
                      disabled={isCurrentPlan}
                    >
                      {isCurrentPlan ? 'Plano Atual' : 'Plano Gratuito'}
                    </Button>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
      
      {/* Payment Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Sobre os Pagamentos</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            Os pagamentos sao processados de forma segura pelo gateway configurado. 
            Voce pode pagar com cartao de credito, boleto ou PIX.
          </p>
          <p>
            Os creditos sao renovados diariamente a meia-noite. 
            Creditos nao utilizados nao acumulam para o dia seguinte.
          </p>
          <p>
            Voce pode cancelar sua assinatura a qualquer momento. 
            O acesso ao plano pago continua ate o fim do periodo ja pago.
          </p>
          <p className="pt-2 border-t">
            <strong>Apos o pagamento:</strong> Envie o comprovante para o administrador 
            para liberar seu plano imediatamente.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
