import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Email do admin unico
const ADMIN_EMAIL = 'ryanhenry.gomes@gmail.com'

// Mapeamento EXATO de nichos para tags OSM - SEM AMBIGUIDADE
const nicheToOSMTags: Record<string, { tags: string[], keywords: string[] }> = {
  'Saloes de Beleza': {
    tags: ['shop=hairdresser', 'shop=beauty', 'amenity=beauty_salon'],
    keywords: ['salao', 'beleza', 'cabelo', 'hair', 'beauty', 'cabeleireiro', 'barbearia', 'barber', 'estetica', 'manicure', 'nail']
  },
  'Restaurantes': {
    tags: ['amenity=restaurant'],
    keywords: ['restaurante', 'restaurant', 'comida', 'food', 'gastronomia', 'culinaria']
  },
  'Clinicas': {
    tags: ['amenity=clinic', 'amenity=doctors', 'healthcare=clinic'],
    keywords: ['clinica', 'clinic', 'saude', 'health', 'medico', 'doctor', 'consultorio']
  },
  'Academias': {
    tags: ['leisure=fitness_centre', 'leisure=sports_centre'],
    keywords: ['academia', 'gym', 'fitness', 'crossfit', 'musculacao', 'pilates']
  },
  'Imobiliarias': {
    tags: ['office=estate_agent'],
    keywords: ['imobiliaria', 'imoveis', 'real estate', 'corretor', 'aluguel', 'venda']
  },
  'Escritorios de Advocacia': {
    tags: ['office=lawyer'],
    keywords: ['advogado', 'advocacia', 'lawyer', 'juridico', 'direito', 'attorney']
  },
  'Contabilidade': {
    tags: ['office=accountant'],
    keywords: ['contador', 'contabilidade', 'accountant', 'contabil', 'fiscal']
  },
  'Pet Shops': {
    tags: ['shop=pet'],
    keywords: ['pet', 'petshop', 'animal', 'cachorro', 'gato', 'dog', 'cat', 'veterinaria']
  },
  'Lojas de Roupas': {
    tags: ['shop=clothes', 'shop=boutique', 'shop=fashion'],
    keywords: ['roupa', 'moda', 'fashion', 'clothes', 'vestuario', 'boutique', 'loja', 'store', 'wear', 'confeccao']
  },
  'Mecanicas': {
    tags: ['shop=car_repair'],
    keywords: ['mecanica', 'oficina', 'auto', 'carro', 'car', 'repair', 'automovel']
  },
  'Padarias': {
    tags: ['shop=bakery'],
    keywords: ['padaria', 'bakery', 'pao', 'bread', 'confeitaria', 'bolo']
  },
  'Farmacias': {
    tags: ['amenity=pharmacy'],
    keywords: ['farmacia', 'pharmacy', 'drogaria', 'medicamento', 'remedio']
  },
  'Hoteis': {
    tags: ['tourism=hotel', 'tourism=guest_house'],
    keywords: ['hotel', 'pousada', 'hospedagem', 'hostel', 'inn']
  },
  'Dentistas': {
    tags: ['amenity=dentist', 'healthcare=dentist'],
    keywords: ['dentista', 'dentist', 'odontologia', 'dental', 'odonto', 'dente']
  }
}

// Funcao para verificar se o nome do estabelecimento corresponde ao nicho
function matchesNiche(name: string, niche: string): boolean {
  const nicheConfig = Object.entries(nicheToOSMTags).find(
    ([key]) => key.toLowerCase() === niche.toLowerCase()
  )?.[1]
  
  if (!nicheConfig) return true // Se nao tem config, aceita qualquer um
  
  const nameLower = name.toLowerCase()
  
  // Verifica se o nome contem alguma palavra-chave do nicho
  return nicheConfig.keywords.some(keyword => nameLower.includes(keyword.toLowerCase()))
}

// Funcao para verificar se NAO e de outro nicho (ex: padaria quando busca salao)
function isWrongNiche(name: string, searchedNiche: string): boolean {
  const nameLower = name.toLowerCase()
  
  // Lista de palavras que indicam nichos ERRADOS
  const wrongKeywords: Record<string, string[]> = {
    'Saloes de Beleza': ['padaria', 'bakery', 'restaurante', 'farmacia', 'mercado', 'supermercado', 'loja de roupa', 'mecanica', 'oficina', 'pet', 'clinica', 'hospital'],
    'Restaurantes': ['salao', 'cabelo', 'hair', 'farmacia', 'mecanica', 'oficina', 'pet', 'clinica'],
    'Padarias': ['salao', 'cabelo', 'hair', 'mecanica', 'oficina', 'pet', 'clinica', 'roupa', 'moda'],
    'Lojas de Roupas': ['padaria', 'bakery', 'salao', 'cabelo', 'farmacia', 'mecanica', 'pet', 'clinica', 'restaurante'],
  }
  
  const wrongWords = wrongKeywords[searchedNiche] || []
  return wrongWords.some(word => nameLower.includes(word))
}

// Busca usando Overpass API (OpenStreetMap) - CORRIGIDO
async function searchOverpassStrict(niche: string, city: string, state: string): Promise<Array<{name: string, phone: string | null, address: string, rating: number | null, reviews: number}>> {
  try {
    // Geocode usando Nominatim
    const geoUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city + ', ' + state + ', Brazil')}&format=json&limit=1`
    
    const geoResponse = await fetch(geoUrl, {
      headers: { 'User-Agent': 'LeadMiner/1.0' }
    })
    
    if (!geoResponse.ok) return []
    
    const geoData = await geoResponse.json()
    if (!geoData.length) return []
    
    const { lat, lon } = geoData[0]
    
    // Encontra as tags OSM corretas para o nicho
    const nicheNormalized = niche.toLowerCase()
    let tags: string[] = []
    
    for (const [key, config] of Object.entries(nicheToOSMTags)) {
      if (key.toLowerCase() === nicheNormalized || key.toLowerCase().includes(nicheNormalized) || nicheNormalized.includes(key.toLowerCase())) {
        tags = config.tags
        break
      }
    }
    
    if (tags.length === 0) {
      // Busca generica se nao encontrou nicho especifico
      tags = ['shop', 'amenity', 'office']
    }
    
    // Query Overpass - APENAS com as tags especificas do nicho
    const tagQueries = tags.map(tag => {
      const [key, value] = tag.split('=')
      if (value) {
        return `node["${key}"="${value}"](around:8000,${lat},${lon});way["${key}"="${value}"](around:8000,${lat},${lon});`
      }
      return ''
    }).filter(Boolean).join('')
    
    if (!tagQueries) return []
    
    const overpassQuery = `[out:json][timeout:30];(${tagQueries});out center body qt 50;`
    
    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: `data=${encodeURIComponent(overpassQuery)}`
    })
    
    if (!response.ok) return []
    
    const data = await response.json()
    
    // Filtra RIGOROSAMENTE os resultados
    const results = (data.elements || [])
      .filter((el: { tags?: { name?: string } }) => {
        if (!el.tags?.name) return false
        const name = el.tags.name
        
        // Rejeita se for de outro nicho
        if (isWrongNiche(name, niche)) return false
        
        return true
      })
      .map((el: { tags?: { name?: string; phone?: string; 'contact:phone'?: string; website?: string; 'contact:website'?: string; 'addr:street'?: string; 'addr:housenumber'?: string; 'addr:city'?: string } }) => ({
        name: el.tags?.name || 'Sem nome',
        phone: el.tags?.phone || el.tags?.['contact:phone'] || null,
        website: el.tags?.website || el.tags?.['contact:website'] || null,
        address: [
          el.tags?.['addr:street'],
          el.tags?.['addr:housenumber'],
          el.tags?.['addr:city'] || city
        ].filter(Boolean).join(', ') || city,
        rating: null,
        reviews: 0
      }))
    
    return results
  } catch (error) {
    console.error('[v0] Overpass error:', error)
    return []
  }
}

// Busca usando Nominatim Search (busca por nome)
async function searchNominatim(niche: string, city: string, state: string): Promise<Array<{name: string, phone: string | null, address: string, rating: number | null, reviews: number}>> {
  try {
    // Mapeamento de termos de busca em portugues
    const searchTerms: Record<string, string[]> = {
      'Saloes de Beleza': ['salao de beleza', 'cabeleireiro', 'barbearia', 'estetica'],
      'Restaurantes': ['restaurante', 'churrascaria', 'pizzaria'],
      'Clinicas': ['clinica', 'consultorio medico'],
      'Academias': ['academia', 'crossfit', 'pilates'],
      'Lojas de Roupas': ['loja de roupas', 'boutique', 'moda'],
      'Padarias': ['padaria', 'confeitaria'],
      'Farmacias': ['farmacia', 'drogaria'],
      'Pet Shops': ['pet shop', 'petshop'],
      'Mecanicas': ['mecanica', 'oficina mecanica'],
      'Dentistas': ['dentista', 'clinica odontologica'],
    }
    
    const terms = searchTerms[niche] || [niche.toLowerCase()]
    const allResults: Array<{name: string, phone: string | null, address: string, rating: number | null, reviews: number}> = []
    const seenNames = new Set<string>()
    
    for (const term of terms.slice(0, 2)) {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(term + ' ' + city + ' ' + state + ' Brazil')}&format=json&limit=10&addressdetails=1`
      
      try {
        const response = await fetch(url, {
          headers: { 'User-Agent': 'LeadMiner/1.0' }
        })
        
        if (response.ok) {
          const data = await response.json()
          
          for (const item of data) {
            const name = item.name || item.display_name?.split(',')[0]
            if (!name || seenNames.has(name.toLowerCase())) continue
            if (isWrongNiche(name, niche)) continue
            
            seenNames.add(name.toLowerCase())
            allResults.push({
              name,
              phone: null,
              address: item.display_name || city,
              rating: null,
              reviews: 0
            })
          }
        }
      } catch {
        continue
      }
      
      if (allResults.length >= 15) break
    }
    
    return allResults
  } catch (error) {
    console.error('[v0] Nominatim search error:', error)
    return []
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    
    // Verifica autenticacao
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
    }
    
    // Verifica se e o admin
    if (user.email !== ADMIN_EMAIL) {
      return NextResponse.json({ 
        error: 'Acesso negado', 
        message: 'Esta API e exclusiva para o administrador' 
      }, { status: 403 })
    }
    
    const { city, state, niche } = await request.json()
    
    if (!city || !state || !niche) {
      return NextResponse.json({ error: 'Preencha todos os campos' }, { status: 400 })
    }
    
    // 1. Tenta Overpass com filtro estrito
    console.log('[v0] Searching with strict Overpass filter for:', niche)
    let apiLeads = await searchOverpassStrict(niche, city, state)
    let source = 'openstreetmap'
    
    // 2. Se nao encontrou, tenta Nominatim
    if (apiLeads.length === 0) {
      console.log('[v0] Trying Nominatim search...')
      apiLeads = await searchNominatim(niche, city, state)
      source = 'nominatim'
    }
    
    if (apiLeads.length === 0) {
      return NextResponse.json({ 
        error: 'Nenhum resultado',
        message: `Nao encontramos "${niche}" em ${city}/${state} no OpenStreetMap. Tente usar a busca por Instagram ou Google Maps.`,
        leads: [],
        total_results: 0,
        source: 'none'
      })
    }
    
    // Converte para formato padrao de leads
    const leads = apiLeads.map((lead, index) => ({
      id: `free-${Date.now()}-${index}`,
      google_place_id: null,
      name: lead.name,
      phone: lead.phone,
      email: null,
      website: null,
      address: lead.address,
      city: city,
      state: state,
      niche: niche,
      category: niche,
      rating: lead.rating,
      reviews_count: lead.reviews || 0,
      has_website: false,
      website_quality: 'none' as const,
      has_social_media: false,
      social_media: {},
      maps_url: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(lead.name + ' ' + city + ' ' + state)}`,
      source: source
    }))
    
    // Salva no historico
    await supabase.from('search_history').insert({
      user_id: user.id,
      city,
      state,
      niche,
      results_count: leads.length,
      credits_used: 0,
      results_data: leads.map(lead => ({
        id: lead.id,
        name: lead.name,
        phone: lead.phone,
        address: lead.address,
        rating: lead.rating,
        source: source
      }))
    })
    
    return NextResponse.json({
      leads,
      credits_used: 0,
      credits_remaining: -1,
      total_results: leads.length,
      source: source,
      is_free: true
    })
    
  } catch (error) {
    console.error('[v0] Search free error:', error)
    return NextResponse.json(
      { error: 'Erro interno', message: 'Erro ao buscar leads. Tente novamente.' },
      { status: 500 }
    )
  }
}
