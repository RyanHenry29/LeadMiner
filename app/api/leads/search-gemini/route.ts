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
  verified: boolean
}

// Funcao para validar se um perfil do Instagram parece real
function isValidInstagram(instagram: string | null): boolean {
  if (!instagram) return true // null e valido
  const cleaned = instagram.replace('@', '').toLowerCase()
  // Rejeita perfis muito genericos ou obvimente falsos
  const fakePatterns = [
    /^(loja|store|shop|moda|fashion|beleza|beauty|restaurante|clinica|academia)[\d_]*$/i,
    /^[a-z]+\d{4,}$/i, // palavraseguidas de muitos numeros
    /^(exemplo|example|teste|test)/i,
    /^[a-z]{1,3}$/i, // muito curto
  ]
  return !fakePatterns.some(pattern => pattern.test(cleaned))
}

// Funcao para validar telefone brasileiro
function isValidPhone(phone: string | null): boolean {
  if (!phone) return true // null e valido
  const cleaned = phone.replace(/\D/g, '')
  // Telefone brasileiro tem 10 ou 11 digitos
  return cleaned.length >= 10 && cleaned.length <= 11
}

// Funcao para validar se o nome parece real
function isValidBusinessName(name: string): boolean {
  if (!name || name.length < 3) return false
  // Rejeita nomes muito genericos
  const fakePatterns = [
    /^(loja de roupas|restaurante|salao de beleza|clinica|academia)\s*\d*$/i,
    /^empresa\s*\d*$/i,
    /^negocio\s*\d*$/i,
    /^comercio\s*\d*$/i,
  ]
  return !fakePatterns.some(pattern => pattern.test(name.trim()))
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

    // Prompt MUITO mais rigoroso para evitar dados inventados
    const prompt = `Voce e um assistente que conhece empresas brasileiras.

TAREFA: Liste empresas REAIS do nicho "${niche}" em "${city}, ${state}, Brasil".

REGRAS OBRIGATORIAS:
1. Liste APENAS empresas que voce TEM CERTEZA ABSOLUTA que existem
2. NAO INVENTE nomes, telefones, enderecos ou perfis de Instagram
3. Se voce nao conhece empresas reais desta cidade/nicho, retorne lista VAZIA
4. E MELHOR retornar poucos resultados REAIS do que muitos FALSOS
5. Telefones devem estar no formato (XX) XXXXX-XXXX ou (XX) XXXX-XXXX
6. Instagram deve ser o @ real da empresa, nao invente
7. Se nao souber uma informacao, use null

PRIORIZE empresas conhecidas e estabelecidas que voce tem certeza que existem.

Formato JSON obrigatorio (sem markdown):
{
  "leads": [
    {
      "name": "Nome REAL da empresa",
      "phone": "(XX) XXXXX-XXXX ou null se nao souber",
      "website": "site.com.br ou null se nao souber",
      "instagram": "@perfil_real ou null se nao souber",
      "address": "Endereco real ou 'Centro' se nao souber exato",
      "rating": 4.5,
      "confidence": "alta"
    }
  ],
  "note": "explicacao se lista estiver vazia"
}

Se NAO conhecer empresas REAIS deste nicho em ${city}, retorne: {"leads": [], "note": "Nao conheco empresas verificadas deste nicho nesta cidade"}

RESPONDA APENAS JSON:`

    // Usa gemini-2.5-flash-lite
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.1, // Baixa temperatura para respostas mais factuais
            topK: 20,
            topP: 0.8,
            maxOutputTokens: 4096,
          }
        })
      }
    )

    if (!response.ok) {
      const error = await response.json()
      console.error('[v0] Erro Gemini:', error)
      
      const errorMessage = error.error?.message || 'Erro na API do Gemini'
      
      if (errorMessage.includes('Quota exceeded') || errorMessage.includes('quota')) {
        return NextResponse.json(
          { 
            error: 'Cota gratuita do Gemini excedida. Aguarde alguns minutos e tente novamente.',
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
      return NextResponse.json({
        leads: [],
        source: 'gemini',
        total_results: 0,
        message: 'Nenhum resultado encontrado. Tente outra cidade ou nicho.'
      })
    }

    console.log('[v0] Resposta Gemini:', textContent.substring(0, 500))

    // Parse do JSON da resposta
    let parsedLeads: Lead[] = []
    let geminiNote = ''
    
    try {
      const jsonText = textContent
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim()
      
      const parsed = JSON.parse(jsonText)
      geminiNote = parsed.note || ''
      
      if (parsed.leads && Array.isArray(parsed.leads)) {
        // Filtra e valida cada lead
        parsedLeads = parsed.leads
          .filter((lead: Record<string, unknown>) => {
            const name = lead.name as string
            const phone = lead.phone as string | null
            const instagram = lead.instagram as string | null
            
            // Validacoes
            if (!isValidBusinessName(name)) return false
            if (!isValidPhone(phone)) return false
            if (!isValidInstagram(instagram)) return false
            
            // Rejeita se confidence for baixa
            if (lead.confidence === 'baixa') return false
            
            return true
          })
          .map((lead: Record<string, unknown>, index: number) => ({
            id: `gemini_${Date.now()}_${index}`,
            name: lead.name as string,
            phone: lead.phone as string || null,
            email: lead.email as string || null,
            website: lead.website as string || null,
            address: `${lead.address || city}, ${city}, ${state}`,
            city: city,
            state: state,
            niche: niche,
            instagram: lead.instagram as string || null,
            rating: lead.rating as number || null,
            source: 'gemini',
            verified: false // Marcado como nao verificado
          }))
      }
    } catch (parseError) {
      console.error('[v0] Erro ao parsear JSON:', parseError)
      parsedLeads = []
    }

    console.log('[v0] Leads validos apos filtragem:', parsedLeads.length)

    // Mensagem de retorno
    let message = ''
    if (parsedLeads.length > 0) {
      message = `Encontrados ${parsedLeads.length} leads. IMPORTANTE: Verifique os dados antes de usar, pois sao sugestoes da IA.`
    } else if (geminiNote) {
      message = geminiNote
    } else {
      message = `Nenhuma empresa verificada encontrada para "${niche}" em ${city}. A IA nao tem informacoes confiaveis sobre este nicho nesta cidade.`
    }

    return NextResponse.json({
      leads: parsedLeads,
      source: 'gemini',
      total_results: parsedLeads.length,
      credits_used: 0,
      credits_remaining: isAdmin ? -1 : 1500,
      message: message,
      warning: parsedLeads.length > 0 
        ? 'Dados gerados por IA. Verifique telefones e perfis antes de contatar.'
        : undefined
    })

  } catch (error) {
    console.error('[v0] Erro na busca Gemini:', error)
    return NextResponse.json(
      { error: 'Erro interno na busca', leads: [] },
      { status: 500 }
    )
  }
}
