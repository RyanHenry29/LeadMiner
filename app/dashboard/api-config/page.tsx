'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { 
  Key, 
  ExternalLink, 
  CheckCircle2, 
  AlertTriangle, 
  Play,
  Shield,
  Loader2,
  Eye,
  EyeOff,
  Copy,
  MapPin,
  Building2,
  Info
} from 'lucide-react'

// Video tutorial atualizado
const YOUTUBE_TUTORIAL_URL = 'https://youtu.be/phNGWOpboR8?si=3PIlQaLynHXoxUQC'
const YOUTUBE_EMBED_ID = 'phNGWOpboR8'

export default function ApiConfigPage() {
  const [apiKey, setApiKey] = useState('')
  const [isConfigured, setIsConfigured] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [showApiKey, setShowApiKey] = useState(false)
  const [testResult, setTestResult] = useState<{
    geocoding: 'success' | 'error' | 'pending' | null
    places: 'success' | 'error' | 'pending' | null
  }>({ geocoding: null, places: null })

  useEffect(() => {
    loadApiConfig()
  }, [])

  const loadApiConfig = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return

    const { data: profile } = await supabase
      .from('profiles')
      .select('google_places_api_key, api_key_configured')
      .eq('id', user.id)
      .single()

    if (profile) {
      setApiKey(profile.google_places_api_key || '')
      setIsConfigured(profile.api_key_configured || false)
    }
    
    setIsLoading(false)
  }

  const [testErrorDetails, setTestErrorDetails] = useState('')

  const testApiKey = async () => {
    if (!apiKey.trim()) {
      toast.error('Digite sua API Key primeiro')
      return
    }

    setIsTesting(true)
    setTestResult({ geocoding: 'pending', places: 'pending' })
    setTestErrorDetails('')

    try {
      const testResponse = await fetch('/api/test-api-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey })
      })

      const result = await testResponse.json()

      setTestResult({
        geocoding: result.geocoding ? 'success' : 'error',
        places: result.places ? 'success' : 'error'
      })

      if (result.geocoding && result.places) {
        toast.success('Ambas as APIs estao funcionando! Pode salvar.')
        setTestErrorDetails('')
      } else {
        const errors = []
        if (!result.geocoding) errors.push('Geocoding API')
        if (!result.places) errors.push('Places API')
        toast.error(`APIs com problema: ${errors.join(', ')}. Clique nos botoes para ativar.`)
        
        // Mostra detalhes do erro
        if (result.error) {
          setTestErrorDetails(result.error)
        }
      }
    } catch (error) {
      setTestResult({ geocoding: 'error', places: 'error' })
      toast.error('Erro ao testar a API Key')
      setTestErrorDetails('Erro de conexao ao testar a API')
    } finally {
      setIsTesting(false)
    }
  }

  const saveApiKey = async () => {
    if (!apiKey.trim()) {
      toast.error('Digite sua API Key')
      return
    }

    setIsSaving(true)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        toast.error('Usuario nao autenticado')
        return
      }

      const { error } = await supabase
        .from('profiles')
        .update({ 
          google_places_api_key: apiKey,
          api_key_configured: true 
        })
        .eq('id', user.id)

      if (error) throw error

      setIsConfigured(true)
      toast.success('API Key salva com sucesso!')
    } catch (error) {
      toast.error('Erro ao salvar a API Key')
    } finally {
      setIsSaving(false)
    }
  }

  const removeApiKey = async () => {
    setIsSaving(true)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) return

      const { error } = await supabase
        .from('profiles')
        .update({ 
          google_places_api_key: null,
          api_key_configured: false 
        })
        .eq('id', user.id)

      if (error) throw error

      setApiKey('')
      setIsConfigured(false)
      setTestResult({ geocoding: null, places: null })
      toast.success('API Key removida')
    } catch (error) {
      toast.error('Erro ao remover a API Key')
    } finally {
      setIsSaving(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copiado!')
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="container max-w-4xl py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Configuracao da API</h1>
        <p className="text-muted-foreground mt-2">
          Configure sua API Key do Google para buscar leads reais
        </p>
      </div>

      {/* Aviso BILLING - MUITO IMPORTANTE */}
      <Alert variant="destructive" className="border-red-500 bg-red-500/10">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>IMPORTANTE: Ative o Faturamento (Billing)!</AlertTitle>
        <AlertDescription className="space-y-2">
          <p>
            Mesmo que voce tenha ativado as APIs, o Google <strong>EXIGE</strong> que voce ative o faturamento no projeto.
            <strong> Nao se preocupe - voce tem $200 de creditos GRATUITOS por mes e nao sera cobrado!</strong>
          </p>
          <a 
            href="https://console.cloud.google.com/billing" 
            target="_blank" 
            rel="noopener noreferrer"
          >
            <Button variant="destructive" size="sm" className="mt-2 gap-2">
              <ExternalLink className="h-4 w-4" />
              Ativar Faturamento no Google Cloud
            </Button>
          </a>
        </AlertDescription>
      </Alert>

      {/* Aviso API Key */}
      <Alert className="border-amber-500/50 bg-amber-500/10">
        <Info className="h-4 w-4 text-amber-500" />
        <AlertTitle className="text-amber-500">Uma unica API Key para tudo!</AlertTitle>
        <AlertDescription>
          Voce precisa criar <strong>UMA API Key</strong> no Google Cloud Console e habilitar <strong>2 APIs</strong> nela: 
          <strong> Places API</strong> e <strong>Geocoding API</strong>. A mesma chave funciona para ambas.
        </AlertDescription>
      </Alert>

      {/* Status */}
      <Card className={isConfigured ? 'border-green-500/50 bg-green-500/5' : 'border-yellow-500/50 bg-yellow-500/5'}>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            {isConfigured ? (
              <>
                <CheckCircle2 className="h-6 w-6 text-green-500" />
                <div>
                  <p className="font-semibold text-green-600">API Configurada</p>
                  <p className="text-sm text-muted-foreground">Sua API Key esta ativa e pronta para uso</p>
                </div>
              </>
            ) : (
              <>
                <AlertTriangle className="h-6 w-6 text-yellow-500" />
                <div>
                  <p className="font-semibold text-yellow-600">API Nao Configurada</p>
                  <p className="text-sm text-muted-foreground">Configure sua API Key para comecar a buscar leads</p>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tutorial em Video */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="h-5 w-5 text-red-500" />
            Tutorial: Como Configurar suas APIs
          </CardTitle>
          <CardDescription>
            Assista ao video tutorial completo para aprender a criar sua API Key e ativar as APIs necessarias
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="aspect-video bg-muted rounded-lg overflow-hidden">
            <iframe
              width="100%"
              height="100%"
              src={`https://www.youtube.com/embed/${YOUTUBE_EMBED_ID}`}
              title="Tutorial: Como configurar as APIs do Google"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
          
          <div className="flex flex-wrap gap-2">
            <a 
              href={YOUTUBE_TUTORIAL_URL} 
              target="_blank" 
              rel="noopener noreferrer"
            >
              <Button variant="outline" className="gap-2">
                <ExternalLink className="h-4 w-4" />
                Abrir no YouTube
              </Button>
            </a>
            <a 
              href="https://console.cloud.google.com/apis/credentials" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              <Button variant="outline" className="gap-2">
                <Key className="h-4 w-4" />
                Google Cloud Console
              </Button>
            </a>
          </div>
        </CardContent>
      </Card>

      {/* Erro detalhado */}
      {testErrorDetails && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Detalhes do erro</AlertTitle>
          <AlertDescription className="font-mono text-xs mt-2 whitespace-pre-wrap">
            {testErrorDetails}
          </AlertDescription>
        </Alert>
      )}

      {/* APIs Necessarias - Cards grandes */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Places API */}
        <Card className="border-2 border-blue-500/30 bg-blue-500/5">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Building2 className="h-5 w-5 text-blue-500" />
                Places API
              </CardTitle>
              <Badge variant="destructive">Obrigatoria</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Busca empresas no Google Maps, obtem telefone, site, endereco, avaliacoes e todos os detalhes dos estabelecimentos.
            </p>
            
            {testResult.places && (
              <div className={`flex items-center gap-2 text-sm ${testResult.places === 'success' ? 'text-green-500' : testResult.places === 'pending' ? 'text-yellow-500' : 'text-red-500'}`}>
                {testResult.places === 'success' && <CheckCircle2 className="h-4 w-4" />}
                {testResult.places === 'pending' && <Loader2 className="h-4 w-4 animate-spin" />}
                {testResult.places === 'error' && <AlertTriangle className="h-4 w-4" />}
                <span>
                  {testResult.places === 'success' && 'Funcionando!'}
                  {testResult.places === 'pending' && 'Testando...'}
                  {testResult.places === 'error' && 'Nao ativada - clique abaixo para ativar'}
                </span>
              </div>
            )}

            <a 
              href="https://console.cloud.google.com/apis/library/places-backend.googleapis.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="block"
            >
              <Button className="w-full gap-2 bg-blue-500 hover:bg-blue-600">
                <ExternalLink className="h-4 w-4" />
                Ativar Places API
              </Button>
            </a>
          </CardContent>
        </Card>

        {/* Geocoding API */}
        <Card className="border-2 border-green-500/30 bg-green-500/5">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <MapPin className="h-5 w-5 text-green-500" />
                Geocoding API
              </CardTitle>
              <Badge variant="destructive">Obrigatoria</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Converte nomes de cidades (ex: &quot;Guarulhos, SP&quot;) em coordenadas geograficas para a busca funcionar corretamente.
            </p>
            
            {testResult.geocoding && (
              <div className={`flex items-center gap-2 text-sm ${testResult.geocoding === 'success' ? 'text-green-500' : testResult.geocoding === 'pending' ? 'text-yellow-500' : 'text-red-500'}`}>
                {testResult.geocoding === 'success' && <CheckCircle2 className="h-4 w-4" />}
                {testResult.geocoding === 'pending' && <Loader2 className="h-4 w-4 animate-spin" />}
                {testResult.geocoding === 'error' && <AlertTriangle className="h-4 w-4" />}
                <span>
                  {testResult.geocoding === 'success' && 'Funcionando!'}
                  {testResult.geocoding === 'pending' && 'Testando...'}
                  {testResult.geocoding === 'error' && 'Nao ativada - clique abaixo para ativar'}
                </span>
              </div>
            )}

            <a 
              href="https://console.cloud.google.com/apis/library/geocoding-backend.googleapis.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="block"
            >
              <Button className="w-full gap-2 bg-green-500 hover:bg-green-600">
                <ExternalLink className="h-4 w-4" />
                Ativar Geocoding API
              </Button>
            </a>
          </CardContent>
        </Card>
      </div>

      {/* Campo da API Key */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Sua API Key
          </CardTitle>
          <CardDescription>
            Cole aqui a API Key que voce criou no Google Cloud Console (a mesma chave funciona para ambas as APIs)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="apiKey">Google API Key</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="apiKey"
                  type={showApiKey ? 'text' : 'password'}
                  placeholder="AIzaSy..."
                  value={apiKey}
                  onChange={(e) => {
                    setApiKey(e.target.value)
                    setTestResult({ geocoding: null, places: null })
                  }}
                  className="pr-20 font-mono"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setShowApiKey(!showApiKey)}
                  >
                    {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  {apiKey && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => copyToClipboard(apiKey)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Sua API Key e armazenada de forma segura e nunca e compartilhada
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button 
              variant="outline" 
              onClick={testApiKey}
              disabled={!apiKey.trim() || isTesting}
            >
              {isTesting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Testando ambas APIs...
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4 mr-2" />
                  Testar API Key
                </>
              )}
            </Button>
            
            <Button 
              onClick={saveApiKey}
              disabled={!apiKey.trim() || isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Salvar API Key
                </>
              )}
            </Button>

            {isConfigured && (
              <Button 
                variant="destructive" 
                onClick={removeApiKey}
                disabled={isSaving}
              >
                Remover API Key
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Custo */}
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertTitle>Sobre os custos</AlertTitle>
        <AlertDescription>
          O Google oferece <strong>$200 de creditos gratuitos por mes</strong> para novas contas. 
          Cada busca custa aproximadamente $0.017 (Places) + $0.005 (Geocoding) = ~$0.02.
          Com os creditos gratuitos voce pode fazer aproximadamente <strong>10.000 buscas por mes sem pagar nada</strong>.
          Recomendamos configurar alertas de orcamento no Google Cloud Console.
        </AlertDescription>
      </Alert>

      {/* Passo a Passo Resumido */}
      <Card>
        <CardHeader>
          <CardTitle>Passo a Passo Rapido</CardTitle>
          <CardDescription>Siga estes passos ou assista ao video tutorial acima</CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="space-y-4">
            <li className="flex gap-3">
              <Badge variant="outline" className="h-6 w-6 rounded-full flex items-center justify-center shrink-0">1</Badge>
              <div>
                <p className="font-medium">Acesse o Google Cloud Console</p>
                <a 
                  href="https://console.cloud.google.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline"
                >
                  console.cloud.google.com
                </a>
              </div>
            </li>
            <li className="flex gap-3">
              <Badge variant="outline" className="h-6 w-6 rounded-full flex items-center justify-center shrink-0">2</Badge>
              <div>
                <p className="font-medium">Crie um projeto</p>
                <p className="text-sm text-muted-foreground">De um nome como &quot;LeadMiner&quot;</p>
              </div>
            </li>
            <li className="flex gap-3">
              <Badge variant="destructive" className="h-6 w-6 rounded-full flex items-center justify-center shrink-0">3</Badge>
              <div>
                <p className="font-medium text-red-500">ATIVE O FATURAMENTO (Billing)</p>
                <p className="text-sm text-muted-foreground">Obrigatorio! Sem isso as APIs nao funcionam. Voce tem $200/mes gratis.</p>
                <a 
                  href="https://console.cloud.google.com/billing" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline"
                >
                  Ativar Faturamento
                </a>
              </div>
            </li>
            <li className="flex gap-3">
              <Badge variant="outline" className="h-6 w-6 rounded-full flex items-center justify-center shrink-0">4</Badge>
              <div>
                <p className="font-medium">Ative as 2 APIs obrigatorias</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  <a href="https://console.cloud.google.com/apis/library/places-backend.googleapis.com" target="_blank" rel="noopener noreferrer">
                    <Badge className="bg-blue-500 hover:bg-blue-600 cursor-pointer gap-1">
                      <ExternalLink className="h-3 w-3" />
                      Places API
                    </Badge>
                  </a>
                  <a href="https://console.cloud.google.com/apis/library/geocoding-backend.googleapis.com" target="_blank" rel="noopener noreferrer">
                    <Badge className="bg-green-500 hover:bg-green-600 cursor-pointer gap-1">
                      <ExternalLink className="h-3 w-3" />
                      Geocoding API
                    </Badge>
                  </a>
                </div>
              </div>
            </li>
            <li className="flex gap-3">
              <Badge variant="outline" className="h-6 w-6 rounded-full flex items-center justify-center shrink-0">5</Badge>
              <div>
                <p className="font-medium">Crie uma API Key</p>
                <p className="text-sm text-muted-foreground">Em Credenciais &gt; Criar credenciais &gt; Chave de API</p>
              </div>
            </li>
            <li className="flex gap-3">
              <Badge variant="outline" className="h-6 w-6 rounded-full flex items-center justify-center shrink-0">5</Badge>
              <div>
                <p className="font-medium">Configure o faturamento</p>
                <p className="text-sm text-muted-foreground">Adicione um cartao (voce recebe $200 de creditos gratuitos)</p>
              </div>
            </li>
            <li className="flex gap-3">
              <Badge variant="outline" className="h-6 w-6 rounded-full flex items-center justify-center shrink-0">6</Badge>
              <div>
                <p className="font-medium">Cole a API Key aqui e teste</p>
                <p className="text-sm text-muted-foreground">Use o botao &quot;Testar API Key&quot; para verificar se tudo esta funcionando</p>
              </div>
            </li>
          </ol>
        </CardContent>
      </Card>
    </div>
  )
}
