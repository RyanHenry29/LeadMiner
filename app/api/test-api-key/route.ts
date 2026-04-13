import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { apiKey } = await request.json()

    if (!apiKey) {
      return NextResponse.json(
        { valid: false, geocoding: false, places: false, error: 'API Key nao fornecida' },
        { status: 400 }
      )
    }

    // Testa Geocoding API
    let geocodingOk = false
    let geocodingStatus = ''
    let geocodingError = ''
    try {
      const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent('Sao Paulo, SP, Brasil')}&key=${apiKey}`
      const geocodeRes = await fetch(geocodeUrl)
      const geocodeData = await geocodeRes.json()
      
      geocodingStatus = geocodeData.status
      geocodingError = geocodeData.error_message || ''
      geocodingOk = geocodeData.status === 'OK' || geocodeData.status === 'ZERO_RESULTS'
    } catch (e) {
      geocodingError = e instanceof Error ? e.message : 'Erro desconhecido'
    }

    // Testa Places API
    let placesOk = false
    let placesStatus = ''
    let placesError = ''
    try {
      const placesUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=restaurante+sao+paulo&key=${apiKey}`
      const placesRes = await fetch(placesUrl)
      const placesData = await placesRes.json()
      
      placesStatus = placesData.status
      placesError = placesData.error_message || ''
      placesOk = placesData.status === 'OK' || placesData.status === 'ZERO_RESULTS'
    } catch (e) {
      placesError = e instanceof Error ? e.message : 'Erro desconhecido'
    }

    const valid = geocodingOk && placesOk

    // Monta mensagem de erro detalhada
    let errorMessage = ''
    if (!geocodingOk) {
      errorMessage += `Geocoding API: ${geocodingStatus || 'ERRO'} - ${geocodingError || 'API nao ativada'}. `
    }
    if (!placesOk) {
      errorMessage += `Places API: ${placesStatus || 'ERRO'} - ${placesError || 'API nao ativada'}.`
    }

    return NextResponse.json({ 
      valid,
      geocoding: geocodingOk,
      places: placesOk,
      geocodingStatus,
      placesStatus,
      error: !valid ? errorMessage.trim() : null
    })

  } catch (error) {
    return NextResponse.json(
      { valid: false, geocoding: false, places: false, error: 'Erro ao testar a API Key: ' + (error instanceof Error ? error.message : 'Desconhecido') },
      { status: 500 }
    )
  }
}
