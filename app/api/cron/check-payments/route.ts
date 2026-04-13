import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// Esta rota é chamada por um cron job para verificar pagamentos pendentes
// e criar notificações de cobrança

export async function GET(request: NextRequest) {
  // Verifica o token de autorização do cron
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  // Usa service role para acessar todos os dados
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const now = new Date()
  const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)

  // Busca assinaturas que vencem em 3 dias
  const { data: expiringSubscriptions, error: subError } = await supabase
    .from('subscriptions')
    .select('*, profiles(id, email, full_name), plans(display_name)')
    .eq('status', 'active')
    .lte('next_billing_date', threeDaysFromNow.toISOString())
    .gte('next_billing_date', now.toISOString())

  if (subError) {
    console.error('Erro ao buscar assinaturas:', subError)
    return NextResponse.json({ error: subError.message }, { status: 500 })
  }

  const notificationsCreated: string[] = []

  // Cria notificações para cada assinatura
  for (const sub of expiringSubscriptions || []) {
    const daysUntilExpiry = Math.ceil(
      (new Date(sub.next_billing_date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    )

    // Verifica se já existe notificação recente
    const { data: existingNotif } = await supabase
      .from('notifications')
      .select('id')
      .eq('user_id', sub.user_id)
      .eq('type', 'payment_reminder')
      .gte('created_at', new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString())
      .single()

    if (!existingNotif) {
      const { error: notifError } = await supabase
        .from('notifications')
        .insert({
          user_id: sub.user_id,
          type: 'payment_reminder',
          title: 'Pagamento próximo',
          message: `Seu plano ${sub.plans?.display_name || 'atual'} vence em ${daysUntilExpiry} dia(s). Valor: R$ ${sub.amount.toFixed(2)}`,
          action_url: '/dashboard/planos',
          metadata: {
            subscription_id: sub.id,
            amount: sub.amount,
            due_date: sub.next_billing_date
          }
        })

      if (!notifError) {
        notificationsCreated.push(sub.user_id)
      }
    }
  }

  // Busca assinaturas expiradas
  const { data: expiredSubscriptions, error: expError } = await supabase
    .from('subscriptions')
    .select('*, profiles(id, email, full_name)')
    .eq('status', 'active')
    .lt('next_billing_date', now.toISOString())

  if (!expError && expiredSubscriptions) {
    for (const sub of expiredSubscriptions) {
      // Atualiza status para expirado
      await supabase
        .from('subscriptions')
        .update({ status: 'expired' })
        .eq('id', sub.id)

      // Cria notificação de expiração
      await supabase
        .from('notifications')
        .insert({
          user_id: sub.user_id,
          type: 'payment_due',
          title: 'Assinatura expirada',
          message: 'Sua assinatura expirou. Renove agora para continuar usando todos os recursos.',
          action_url: '/dashboard/planos',
          metadata: {
            subscription_id: sub.id
          }
        })

      // Rebaixa usuário para plano gratuito
      const { data: freePlan } = await supabase
        .from('plans')
        .select('id')
        .eq('name', 'free')
        .single()

      if (freePlan) {
        await supabase
          .from('profiles')
          .update({ plan_id: freePlan.id })
          .eq('id', sub.user_id)
      }
    }
  }

  // Verifica leads que precisam de follow-up (30 dias sem contato)
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  
  const { data: staleLeads } = await supabase
    .from('user_leads')
    .select('*, leads(name), profiles(id)')
    .in('status', ['new', 'contacted'])
    .lt('updated_at', thirtyDaysAgo.toISOString())

  for (const lead of staleLeads || []) {
    // Verifica se já existe notificação
    const { data: existingNotif } = await supabase
      .from('notifications')
      .select('id')
      .eq('user_id', lead.user_id)
      .eq('type', 'lead_followup')
      .eq('metadata->>lead_id', lead.id)
      .gte('created_at', new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .single()

    if (!existingNotif) {
      await supabase
        .from('notifications')
        .insert({
          user_id: lead.user_id,
          type: 'lead_followup',
          title: 'Lead aguardando follow-up',
          message: `O lead "${lead.leads?.name || 'Lead'}" está há mais de 30 dias sem interação.`,
          action_url: '/dashboard/leads',
          metadata: {
            lead_id: lead.id,
            lead_name: lead.leads?.name
          }
        })
    }
  }

  return NextResponse.json({ 
    success: true, 
    notificationsCreated: notificationsCreated.length,
    expiredSubscriptions: expiredSubscriptions?.length || 0,
    staleLeads: staleLeads?.length || 0
  })
}
