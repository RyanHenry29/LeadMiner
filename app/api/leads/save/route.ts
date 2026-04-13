import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import type { Lead } from '@/lib/types'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Verificar autenticacao
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
    }
    
    const body = await request.json()
    
    // Pode receber lead_id (existente) ou lead completo (novo)
    let leadId: string
    
    if (body.lead_id) {
      // Lead existente
      leadId = body.lead_id
      
      // Verificar se o lead existe
      const { data: lead } = await supabase
        .from('leads')
        .select('id')
        .eq('id', leadId)
        .single()
      
      if (!lead) {
        return NextResponse.json({ error: 'Lead nao encontrado' }, { status: 404 })
      }
    } else if (body.id && body.name) {
      // Lead novo (do Instagram ou outras fontes)
      const lead = body as Lead
      
      // Verifica se ja existe pelo ID ou pelo nome + cidade
      const { data: existingLead } = await supabase
        .from('leads')
        .select('id')
        .or(`id.eq.${lead.id},and(name.eq.${lead.name},city.eq.${lead.city || ''})`)
        .single()
      
      if (existingLead) {
        leadId = existingLead.id
      } else {
        // Cria o lead no banco
        const { data: newLead, error: insertError } = await supabase
          .from('leads')
          .insert({
            id: lead.id,
            name: lead.name,
            phone: lead.phone || null,
            email: lead.email || null,
            website: lead.website || null,
            address: lead.address || null,
            city: lead.city || null,
            state: lead.state || null,
            category: lead.niche || lead.category || null,
            rating: lead.rating || null,
            reviews_count: lead.reviews_count || 0,
            has_website: !!lead.website,
            website_quality: lead.website ? 'good' : 'none',
            has_social_media: !!lead.instagram,
            social_media: lead.instagram ? { instagram: `https://instagram.com/${lead.instagram}` } : {},
            raw_data: {
              source: lead.instagram ? 'instagram' : 'maps',
              bio: lead.bio,
              followers: lead.followers,
              profile_url: lead.profile_url,
              maps_url: lead.maps_url
            }
          })
          .select('id')
          .single()
        
        if (insertError) {
          console.error('Erro ao criar lead:', insertError)
          // Tenta buscar novamente caso tenha sido criado por outra requisicao
          const { data: retryLead } = await supabase
            .from('leads')
            .select('id')
            .eq('name', lead.name)
            .eq('city', lead.city || '')
            .single()
          
          if (retryLead) {
            leadId = retryLead.id
          } else {
            return NextResponse.json({ error: 'Erro ao salvar lead' }, { status: 500 })
          }
        } else {
          leadId = newLead.id
        }
      }
    } else {
      return NextResponse.json(
        { error: 'Dados do lead sao obrigatorios' },
        { status: 400 }
      )
    }
    
    // Verificar se o usuario ja salvou este lead
    const { data: existingUserLead } = await supabase
      .from('user_leads')
      .select('id')
      .eq('user_id', user.id)
      .eq('lead_id', leadId)
      .single()
    
    if (existingUserLead) {
      return NextResponse.json(
        { error: 'Este lead ja esta no seu CRM' },
        { status: 409 }
      )
    }
    
    // Salvar lead para o usuario
    const { data: userLead, error } = await supabase
      .from('user_leads')
      .insert({
        user_id: user.id,
        lead_id: leadId,
        status: 'new',
      })
      .select()
      .single()
    
    if (error) {
      console.error('Erro ao salvar user_lead:', error)
      return NextResponse.json(
        { error: 'Erro ao salvar lead no CRM' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ success: true, user_lead: userLead })
    
  } catch (error) {
    console.error('Erro ao salvar lead:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
