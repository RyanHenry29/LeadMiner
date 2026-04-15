import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const ADMIN_EMAIL = 'ryanhenry.gomes@gmail.com'

interface Lead {
  id: string
  name: string
  phone: string | null
  email: string | null
  website: string | null
  address: string
  city: string
  state: string
  niche: string
  instagram: string | null
  rating: number | null
  source: string
}

export async function POST(request: Request) {
  try {
    const { city, state, niche } = await request.json()

    if (!city || !state || !niche) {
      return NextResponse.json(
        { error: 'Cidade, estado e nicho sao obrigatorios' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })
    }

    // Busca a API Key do Gemini do usuario
    const { data: profile } = await supabase
      .from('profiles')
      .select('gemini_api_key')
      .eq('id', user.id)
      .single()

    const isAdmin = user.email === ADMIN_EMAIL

    // Admin pode usar sem API Key (usa a do sistema)
    let apiKey = profile?.gemini_api_key
    
    if (!apiKey && !isAdmin) {
      return NextResponse.json(
        { error: 'Configure sua API Key do Gemini em Configurar API' },
        { status: 400 }
      )
    }

    // Se nao tem API Key e e admin, usa a variavel de ambiente
    if (!apiKey && isAdmin) {
      apiKey = process.env.GEMINI_API_KEY
    }

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API Key do Gemini nao configurada' },
        { status: 400 }
      )
    }

    console.log('[v0] Buscando leads com Gemini:', { city, state, niche })

    // Prompt para o Gemini buscar leads
    const prompt = `Voce e um assistente especializado em encontrar empresas e negocios locais.

Busque empresas do nicho "${niche}" na cidade de "${city}, ${state}, Brasil".

IMPORTANTE:
- Retorne APENAS empresas REAIS que existem de verdade
- Inclua o maximo de informacoes que voce conhece: nome, telefone, endereco, site, instagram
- Foque em empresas locais, pequenas e medias, nao apenas grandes redes
- Se nao souber o telefone/site exato, deixe como null
- Retorne entre 10 e 20 empresas

Retorne APENAS um JSON valido no seguinte formato, sem markdown, sem explicacoes:
{
  "leads": [
    {
      "name": "Nome da Empresa",
      "phone": "(11) 99999-9999 ou null",
      "website": "www.site.com.br ou null",
      "instagram": "@perfil ou null",
      "address": "Rua, numero, bairro",
      "rating": 4.5
    }
  ]
}

RESPONDA APENAS O JSON, SEM TEXTO ADICIONAL.`

    // Usa gemini-pro que e estavel e tem boa cota gratuita
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 4096,
          }
        })
      }
    )

    if (!response.ok) {
      const error = await response.json()
      console.error('[v0] Erro Gemini:', error)
      
      const errorMessage = error.error?.message || 'Erro na API do Gemini'
      
      // Verifica se e erro de cota excedida
      if (errorMessage.includes('Quota exceeded') || errorMessage.includes('quota')) {
        return NextResponse.json(
          { 
            error: 'Cota gratuita do Gemini excedida. Aguarde alguns minutos e tente novamente, ou crie uma nova API Key em aistudio.google.com',
            quotaExceeded: true,
            leads: []
          },
          { status: 429 }
        )
      }
      
      return NextResponse.json(
        { error: errorMessage, leads: [] },
        { status: 500 }
      )
    }

    const data = await response.json()
    const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text

    if (!textContent) {
      return NextResponse.json(
        { error: 'Resposta vazia do Gemini', leads: [] },
        { status: 200 }
      )
    }

    console.log('[v0] Resposta Gemini:', textContent.substring(0, 500))

    // Parse do JSON da resposta
    let parsedLeads: Lead[] = []
    
    try {
      // Remove possivel markdown
      const jsonText = textContent
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim()
      
      const parsed = JSON.parse(jsonText)
      
      if (parsed.leads && Array.isArray(parsed.leads)) {
        parsedLeads = parsed.leads.map((lead: Record<string, unknown>, index: number) => ({
          id: `gemini_${Date.now()}_${index}`,
          name: lead.name as string || 'Empresa',
          phone: lead.phone as string || null,
          email: lead.email as string || null,
          website: lead.website as string || null,
          address: `${lead.address || ''}, ${city}, ${state}`,
          city: city,
          state: state,
          niche: niche,
          instagram: lead.instagram as string || null,
          rating: lead.rating as number || null,
          source: 'gemini'
        }))
      }
    } catch (parseError) {
      console.error('[v0] Erro ao parsear JSON:', parseError)
      // Tenta extrair dados mesmo sem JSON perfeito
      parsedLeads = []
    }

    console.log('[v0] Leads encontrados:', parsedLeads.length)

    return NextResponse.json({
      leads: parsedLeads,
      source: 'gemini',
      total_results: parsedLeads.length,
      credits_used: 0,
      credits_remaining: isAdmin ? -1 : 1500,
      message: parsedLeads.length > 0 
        ? `Encontrados ${parsedLeads.length} leads via Gemini AI`
        : 'Nenhum lead encontrado. Tente outro nicho ou cidade.'
    })

  } catch (error) {
    console.error('[v0] Erro na busca Gemini:', error)
    return NextResponse.json(
      { error: 'Erro interno na busca', leads: [] },
      { status: 500 }
    )
  }
}
