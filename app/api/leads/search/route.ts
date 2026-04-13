import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

interface GooglePlace {
  place_id: string
  name: string
  formatted_address: string
  formatted_phone_number?: string
  website?: string
  rating?: number
  user_ratings_total?: number
  geometry: {
    location: {
      lat: number
      lng: number
    }
  }
  types?: string[]
  business_status?: string
}

// Email do admin unico - usa API do sistema
const ADMIN_EMAIL = 'ryanhenry.gomes@gmail.com'

// Busca lugares reais no Google Places API
async function searchGooglePlaces(query: string, location: string, apiKey: string): Promise<GooglePlace[]> {
  if (!apiKey) {
    console.log('[v0] Google Places API key not configured')
    return []
  }

  try {
    // Geocode para obter coordenadas da cidade
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(location)}&key=${apiKey}`
    console.log('[v0] Geocode URL:', geocodeUrl.replace(apiKey, 'API_KEY_HIDDEN'))
    
    const geocodeRes = await fetch(geocodeUrl)
    const geocodeData = await geocodeRes.json()
    console.log('[v0] Geocode response status:', geocodeData.status)

    if (geocodeData.status !== 'OK' || !geocodeData.results?.[0]) {
      console.log('[v0] Geocode failed:', geocodeData.status, geocodeData.error_message || '')
      // Retorna array vazio com info do erro para tratamento
      throw new Error(`GEOCODE_ERROR:${geocodeData.status}:${geocodeData.error_message || 'Ative a Geocoding API no Google Cloud Console'}`)
    }

    const { lat, lng } = geocodeData.results[0].geometry.location
    console.log('[v0] Geocode success - Lat:', lat, 'Lng:', lng)

    // Busca lugares na regiao
    const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&location=${lat},${lng}&radius=50000&key=${apiKey}&language=pt-BR`
    console.log('[v0] Places search URL:', searchUrl.replace(apiKey, 'API_KEY_HIDDEN'))
    
    const searchRes = await fetch(searchUrl)
    const searchData = await searchRes.json()
    console.log('[v0] Places search status:', searchData.status)

    if (searchData.status !== 'OK') {
      console.log('[v0] Places search failed:', searchData.status, searchData.error_message || '')
      throw new Error(`PLACES_ERROR:${searchData.status}:${searchData.error_message || 'Ative a Places API no Google Cloud Console'}`)
    }

    console.log('[v0] Places search results count:', searchData.results?.length || 0)
    return searchData.results || []
  } catch (error) {
    // Repassa o erro para ser tratado corretamente
    throw error
  }
}

// Busca detalhes de um lugar (telefone, site, etc)
async function getPlaceDetails(placeId: string, apiKey: string) {
  if (!apiKey) return null

  try {
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_address,formatted_phone_number,website,rating,user_ratings_total,geometry,types,business_status,url&key=${apiKey}&language=pt-BR`
    const res = await fetch(url)
    const data = await res.json()

    if (data.status !== 'OK') return null
    return data.result
  } catch (error) {
    console.error('[v0] Place details error:', error)
    return null
  }
}

// Analisa qualidade do site
function analyzeWebsite(website: string | undefined): { has_website: boolean; website_quality: 'none' | 'poor' | 'good' } {
  if (!website) return { has_website: false, website_quality: 'none' }

  // Sites em redes sociais = baixa qualidade (nao tem site proprio)
  const socialMedia = ['facebook.com', 'instagram.com', 'twitter.com', 'linkedin.com', 'wa.me', 'whatsapp.com', 'youtube.com']
  if (socialMedia.some(d => website.toLowerCase().includes(d))) {
    return { has_website: true, website_quality: 'poor' }
  }

  // Sites gratuitos = baixa qualidade
  const freeBuilders = ['wix.com', 'weebly.com', 'wordpress.com', 'blogspot.com', 'sites.google.com', 'webnode.com', 'jimdo.com']
  if (freeBuilders.some(d => website.toLowerCase().includes(d))) {
    return { has_website: true, website_quality: 'poor' }
  }

  return { has_website: true, website_quality: 'good' }
}

// Interface para lead
interface Lead {
  id: string
  google_place_id: string
  name: string
  phone: string | null
  email: string | null
  website: string | null
  address: string
  city: string
  state: string
  category: string
  rating: number | null
  reviews_count: number
  has_website: boolean
  website_quality: 'none' | 'poor' | 'good'
  has_social_media: boolean
  social_media: Record<string, string>
  raw_data: GooglePlace | null
  maps_url: string
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { city, state, niche } = body

    if (!city || !state || !niche) {
      return NextResponse.json({ error: 'Cidade, estado e nicho sao obrigatorios' }, { status: 400 })
    }

    // Busca perfil e plano
    const { data: profile } = await supabase
      .from('profiles')
      .select('*, plans(*)')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Perfil nao encontrado' }, { status: 404 })
    }

    const plan = profile.plans
    const creditsPerDay = plan?.credits_per_day ?? 5
    const creditsUsed = profile.credits_used_today ?? 0

    // Reseta creditos se for novo dia
    const today = new Date().toISOString().split('T')[0]
    const resetAt = profile.credits_reset_at
    let currentCreditsUsed = creditsUsed

    if (resetAt !== today) {
      await supabase
        .from('profiles')
        .update({ credits_used_today: 0, credits_reset_at: today })
        .eq('id', user.id)
      currentCreditsUsed = 0
    }

    // Verifica se e o admin
    const isAdmin = user.email === ADMIN_EMAIL

    // Admin tem creditos ilimitados
    if (!isAdmin && creditsPerDay !== -1 && currentCreditsUsed >= creditsPerDay) {
      return NextResponse.json({ 
        error: 'Creditos esgotados',
        message: 'Faca upgrade do seu plano para mais buscas.',
        credits_remaining: 0
      }, { status: 403 })
    }

    // Determina qual API key usar
    // Admin usa a API do sistema, outros usuarios usam a propria
    let apiKey: string | null = null

    if (isAdmin) {
      // Admin usa a API key do sistema
      apiKey = process.env.GOOGLE_PLACES_API_KEY || null
      if (!apiKey) {
        return NextResponse.json({ 
          error: 'API do sistema nao configurada',
          message: 'Configure a variavel GOOGLE_PLACES_API_KEY nas configuracoes do projeto.',
        }, { status: 500 })
      }
    } else {
      // Usuario comum precisa ter API configurada
      if (!profile.api_key_configured || !profile.google_places_api_key) {
        return NextResponse.json({ 
          error: 'API nao configurada',
          message: 'Voce precisa configurar sua API Key do Google Places antes de buscar leads.',
          redirect: '/dashboard/api-config'
        }, { status: 403 })
      }
      apiKey = profile.google_places_api_key
    }

    const location = `${city}, ${state}, Brasil`
    const query = `${niche} em ${city}`
    
    let leads: Lead[] = []

    // Usa Google Places API real - APENAS DADOS REAIS
    console.log('[v0] Searching with Google Places API for:', query, 'in', location)
    
    let places: GooglePlace[] = []
    try {
      places = await searchGooglePlaces(query, location, apiKey)
      console.log('[v0] Places found from Google:', places.length)
    } catch (apiError: unknown) {
      const errorMsg = apiError instanceof Error ? apiError.message : String(apiError)
      console.error('[v0] API Error:', errorMsg)
      
      if (errorMsg.includes('GEOCODE_ERROR')) {
        const parts = errorMsg.split(':')
        return NextResponse.json({ 
          error: 'Erro na Geocoding API',
          message: `Nao foi possivel localizar "${city}/${state}". Verifique se a Geocoding API esta ATIVADA no Google Cloud Console. Status: ${parts[1]}`,
          leads: [],
          credits_used: 0,
          credits_remaining: isAdmin ? -1 : (creditsPerDay === -1 ? -1 : creditsPerDay - currentCreditsUsed),
          total_results: 0,
          api_error: true,
          fix_url: 'https://console.cloud.google.com/apis/library/geocoding-backend.googleapis.com'
        })
      }
      
      if (errorMsg.includes('PLACES_ERROR')) {
        const parts = errorMsg.split(':')
        return NextResponse.json({ 
          error: 'Erro na Places API',
          message: `Nao foi possivel buscar "${niche}". Verifique se a Places API esta ATIVADA no Google Cloud Console. Status: ${parts[1]}`,
          leads: [],
          credits_used: 0,
          credits_remaining: isAdmin ? -1 : (creditsPerDay === -1 ? -1 : creditsPerDay - currentCreditsUsed),
          total_results: 0,
          api_error: true,
          fix_url: 'https://console.cloud.google.com/apis/library/places-backend.googleapis.com'
        })
      }
      
      return NextResponse.json({ 
        error: 'Erro na API do Google',
        message: errorMsg,
        leads: [],
        credits_used: 0,
        credits_remaining: isAdmin ? -1 : (creditsPerDay === -1 ? -1 : creditsPerDay - currentCreditsUsed),
        total_results: 0,
        api_error: true
      })
    }

    if (places.length === 0) {
      return NextResponse.json({ 
        error: 'Nenhum resultado encontrado',
        message: `Nao encontramos "${niche}" em ${city}/${state}. Tente outro nicho ou verifique se digitou corretamente.`,
        leads: [],
        credits_used: 0,
        credits_remaining: isAdmin ? -1 : (creditsPerDay === -1 ? -1 : creditsPerDay - currentCreditsUsed),
        total_results: 0
      })
    }

    // Busca detalhes de cada lugar
    const detailedPlaces = await Promise.all(
      places.slice(0, 20).map(async (place) => {
        const details = await getPlaceDetails(place.place_id, apiKey!)
        if (!details) return null

        const { has_website, website_quality } = analyzeWebsite(details.website)
        const addressParts = details.formatted_address?.split(',') || []

        return {
          id: `gp-${place.place_id}`,
          google_place_id: place.place_id,
          name: details.name,
          phone: details.formatted_phone_number || null,
          email: null,
          website: details.website || null,
          address: details.formatted_address,
          city: addressParts[1]?.trim() || city,
          state: addressParts[2]?.trim().split(' ')[0] || state,
          category: niche,
          rating: details.rating || null,
          reviews_count: details.user_ratings_total || 0,
          has_website,
          website_quality,
          has_social_media: details.website?.includes('facebook') || details.website?.includes('instagram') || false,
          social_media: {},
          raw_data: details,
          maps_url: details.url || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(details.name + ' ' + details.formatted_address)}`
        }
      })
    )

    leads = detailedPlaces.filter(Boolean) as Lead[]
    console.log('[v0] Leads with details:', leads.length)

    // Prioriza empresas SEM site ou com site ruim (mais oportunidade de venda)
    leads.sort((a, b) => {
      const order = { none: 0, poor: 1, good: 2 }
      return order[a.website_quality] - order[b.website_quality]
    })

    if (leads.length === 0) {
      return NextResponse.json({ 
        error: 'Erro ao buscar detalhes',
        message: 'Encontramos lugares mas nao conseguimos obter os detalhes. Verifique se a Places API (Place Details) esta ativada.',
        leads: [],
        credits_used: 0,
        credits_remaining: isAdmin ? -1 : (creditsPerDay === -1 ? -1 : creditsPerDay - currentCreditsUsed),
        total_results: 0
      })
    }

    // Calcula creditos a usar: 1 credito = 5 leads
    // Admin nao gasta creditos
    const leadsPerCredit = 5
    const creditsToUse = isAdmin ? 0 : Math.ceil(leads.length / leadsPerCredit)
    
    // Atualiza creditos usados (apenas se nao for admin)
    if (!isAdmin && creditsToUse > 0) {
      await supabase
        .from('profiles')
        .update({ credits_used_today: currentCreditsUsed + creditsToUse })
        .eq('id', user.id)
    }

    // Salva no historico com os dados dos leads
    await supabase.from('search_history').insert({
      user_id: user.id,
      city,
      state,
      niche,
      results_count: leads.length,
      credits_used: creditsToUse,
      results_data: leads.map(lead => ({
        id: lead.id,
        name: lead.name,
        phone: lead.phone,
        website: lead.website,
        address: lead.address,
        rating: lead.rating,
        reviews_count: lead.reviews_count,
        has_website: lead.has_website,
        website_quality: lead.website_quality,
        maps_url: lead.maps_url
      }))
    })

    // Salva leads no banco
    for (const lead of leads) {
      if (lead.google_place_id) {
        const { data: existing } = await supabase
          .from('leads')
          .select('id')
          .eq('google_place_id', lead.google_place_id)
          .single()

        if (!existing) {
          await supabase.from('leads').insert({
            google_place_id: lead.google_place_id,
            name: lead.name,
            phone: lead.phone,
            email: lead.email,
            website: lead.website,
            address: lead.address,
            city: lead.city,
            state: lead.state,
            category: lead.category,
            rating: lead.rating,
            reviews_count: lead.reviews_count,
            has_website: lead.has_website,
            website_quality: lead.website_quality,
            has_social_media: lead.has_social_media,
            social_media: lead.social_media,
            raw_data: lead.raw_data
          })
        }
      }
    }

    return NextResponse.json({
      leads,
      credits_used: creditsToUse,
      credits_remaining: isAdmin ? -1 : (creditsPerDay === -1 ? -1 : creditsPerDay - currentCreditsUsed - creditsToUse),
      total_results: leads.length,
      is_admin: isAdmin,
      leads_per_credit: leadsPerCredit
    })

  } catch (error) {
    console.error('[v0] Search error:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
