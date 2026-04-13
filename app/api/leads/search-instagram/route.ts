import { NextResponse } from 'next/server'

// Esta API está DESABILITADA
// Instagram bloqueia web scraping e não oferece API gratuita confiável
// Para usar Instagram como fonte de leads, você precisa de um serviço pago como:
// - RapidAPI Instagrapi
// - Instagrapi Direct
// - OutBound API

export async function POST(request: Request) {
  return NextResponse.json({
    error: 'Instagram search não está disponível no plano gratuito',
    message: 'Use a busca por Google Maps ou integre um serviço pago de scraping do Instagram',
    leads: []
  }, { status: 501 })
}
