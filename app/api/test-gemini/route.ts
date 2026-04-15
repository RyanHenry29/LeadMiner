import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { apiKey } = await request.json()

    if (!apiKey) {
      return NextResponse.json({ success: false, error: 'API Key e obrigatoria' })
    }

    // Testa a API do Gemini com uma requisicao simples
    // Usa gemini-pro que e estavel e tem boa cota gratuita
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'Responda apenas: OK' }] }]
        })
      }
    )

    if (!response.ok) {
      const error = await response.json()
      const errorMessage = error.error?.message || 'API Key invalida'
      
      // Verifica se e erro de cota excedida
      if (errorMessage.includes('Quota exceeded') || errorMessage.includes('quota')) {
        return NextResponse.json({ 
          success: false, 
          error: 'Cota gratuita excedida. Aguarde alguns minutos ou crie uma nova API Key.',
          quotaExceeded: true
        })
      }
      
      return NextResponse.json({ 
        success: false, 
        error: errorMessage 
      })
    }

    const data = await response.json()
    const hasContent = data.candidates?.[0]?.content?.parts?.[0]?.text

    return NextResponse.json({ 
      success: !!hasContent,
      message: hasContent ? 'API funcionando!' : 'Resposta vazia'
    })

  } catch (error) {
    console.error('Erro ao testar Gemini:', error)
    return NextResponse.json({ success: false, error: 'Erro de conexao' })
  }
}
