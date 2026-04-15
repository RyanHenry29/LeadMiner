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
  Loader2,
  Eye,
  EyeOff,
  Copy,
  Sparkles,
  Zap
} from 'lucide-react'

export default function ApiConfigPage() {
  const [apiKey, setApiKey] = useState('')
  const [isConfigured, setIsConfigured] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [showApiKey, setShowApiKey] = useState(false)
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null)

  useEffect(() => {
    loadApiConfig()
  }, [])

  const loadApiConfig = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return

    const { data: profile } = await supabase
      .from('profiles')
      .select('gemini_api_key, api_key_configured')
      .eq('id', user.id)
      .single()

    if (profile) {
      setApiKey(profile.gemini_api_key || '')
      setIsConfigured(!!profile.gemini_api_key)
    }
    
    setIsLoading(false)
  }

  const testApiKey = async () => {
    if (!apiKey.trim()) {
      toast.error('Digite sua API Key primeiro')
      return
    }

    setIsTesting(true)
    setTestResult(null)

    try {
      const response = await fetch('/api/test-gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey })
      })

      const result = await response.json()

      if (result.success) {
        setTestResult('success')
        toast.success('API do Gemini funcionando!')
      } else {
        setTestResult('error')
        if (result.quotaExceeded) {
          toast.error('Cota gratuita excedida. Aguarde alguns minutos ou crie uma nova API Key.')
        } else {
          toast.error(result.error || 'Erro ao testar API')
        }
      }
    } catch {
      setTestResult('error')
      toast.error('Erro ao testar a API Key')
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
          gemini_api_key: apiKey,
          api_key_configured: true 
        })
        .eq('id', user.id)

      if (error) throw error

      setIsConfigured(true)
      toast.success('API Key do Gemini salva!')
    } catch {
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
          gemini_api_key: null,
          api_key_configured: false 
        })
        .eq('id', user.id)

      if (error) throw error

      setApiKey('')
      setIsConfigured(false)
      setTestResult(null)
      toast.success('API Key removida')
    } catch {
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
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Sparkles className="h-8 w-8 text-blue-500" />
          Configuracao da API Gemini
        </h1>
        <p className="text-muted-foreground mt-2">
          Configure sua API Key do Google Gemini para buscar leads com inteligencia artificial
        </p>
      </div>

      {/* Destaque - Gemini e GRATIS */}
      <Alert className="border-green-500/50 bg-green-500/10">
        <Zap className="h-4 w-4 text-green-500" />
        <AlertTitle className="text-green-600">100% Gratuito!</AlertTitle>
        <AlertDescription>
          A API do Google Gemini oferece <strong>1500 requisicoes gratuitas por dia</strong> no plano free. 
          Nao precisa de cartao de credito! Perfeito para buscar leads ilimitados.
        </AlertDescription>
      </Alert>

      {/* Status */}
      <Card className={isConfigured ? 'border-green-500/50 bg-green-500/5' : 'border-amber-500/50 bg-amber-500/5'}>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            {isConfigured ? (
              <>
                <CheckCircle2 className="h-6 w-6 text-green-500" />
                <div>
                  <p className="font-semibold text-green-600">API Gemini Configurada</p>
                  <p className="text-sm text-muted-foreground">Sua API Key esta ativa e pronta para buscar leads</p>
                </div>
              </>
            ) : (
              <>
                <AlertTriangle className="h-6 w-6 text-amber-500" />
                <div>
                  <p className="font-semibold text-amber-600">API Nao Configurada</p>
                  <p className="text-sm text-muted-foreground">Configure sua API Key do Gemini para comecar</p>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Passo a Passo */}
      <Card>
        <CardHeader>
          <CardTitle>Como obter sua API Key (2 minutos)</CardTitle>
          <CardDescription>Siga estes passos simples para configurar</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ol className="space-y-4">
            <li className="flex gap-3">
              <Badge variant="outline" className="h-6 w-6 rounded-full flex items-center justify-center shrink-0">1</Badge>
              <div>
                <p className="font-medium">Acesse o Google AI Studio</p>
                <a 
                  href="https://aistudio.google.com/app/apikey" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline flex items-center gap-1"
                >
                  aistudio.google.com/app/apikey
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </li>
            <li className="flex gap-3">
              <Badge variant="outline" className="h-6 w-6 rounded-full flex items-center justify-center shrink-0">2</Badge>
              <div>
                <p className="font-medium">Faca login com sua conta Google</p>
                <p className="text-sm text-muted-foreground">Use sua conta Google pessoal ou empresarial</p>
              </div>
            </li>
            <li className="flex gap-3">
              <Badge variant="outline" className="h-6 w-6 rounded-full flex items-center justify-center shrink-0">3</Badge>
              <div>
                <p className="font-medium">Clique em &quot;Create API Key&quot;</p>
                <p className="text-sm text-muted-foreground">Selecione &quot;Create API key in new project&quot;</p>
              </div>
            </li>
            <li className="flex gap-3">
              <Badge variant="outline" className="h-6 w-6 rounded-full flex items-center justify-center shrink-0">4</Badge>
              <div>
                <p className="font-medium">Copie e cole aqui</p>
                <p className="text-sm text-muted-foreground">Sua API Key comeca com &quot;AIza...&quot;</p>
              </div>
            </li>
          </ol>

          <a 
            href="https://aistudio.google.com/app/apikey" 
            target="_blank" 
            rel="noopener noreferrer"
            className="block"
          >
            <Button className="w-full gap-2 bg-blue-500 hover:bg-blue-600">
              <Sparkles className="h-4 w-4" />
              Criar API Key do Gemini (Gratis)
            </Button>
          </a>
        </CardContent>
      </Card>

      {/* Campo da API Key */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Sua API Key do Gemini
          </CardTitle>
          <CardDescription>
            Cole aqui a API Key que voce criou no Google AI Studio
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="apiKey">Gemini API Key</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="apiKey"
                  type={showApiKey ? 'text' : 'password'}
                  placeholder="AIzaSy..."
                  value={apiKey}
                  onChange={(e) => {
                    setApiKey(e.target.value)
                    setTestResult(null)
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
          </div>

          {/* Resultado do teste */}
          {testResult && (
            <div className={`flex items-start gap-2 p-3 rounded-lg ${
              testResult === 'success' 
                ? 'bg-green-500/10 text-green-600' 
                : 'bg-red-500/10 text-red-600'
            }`}>
              {testResult === 'success' ? (
                <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
              )}
              <div>
                <span className="font-medium block">
                  {testResult === 'success' 
                    ? 'API funcionando! Pode salvar.' 
                    : 'Erro na API. Verifique se a chave esta correta.'}
                </span>
                {testResult === 'error' && (
                  <span className="text-sm opacity-80 mt-1 block">
                    Se o erro for de cota excedida, aguarde alguns minutos ou crie uma nova API Key no Google AI Studio.
                  </span>
                )}
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <Button 
              variant="outline" 
              onClick={testApiKey}
              disabled={!apiKey.trim() || isTesting}
            >
              {isTesting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Testando...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  Testar API
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

      {/* Info sobre limites */}
      <Alert>
        <Sparkles className="h-4 w-4" />
        <AlertTitle>Limites do Plano Gratuito</AlertTitle>
        <AlertDescription>
          O Gemini oferece <strong>1500 requisicoes por dia</strong> e <strong>1 milhao de tokens por minuto</strong> gratuitamente. 
          Isso e suficiente para buscar milhares de leads por dia sem pagar nada!
        </AlertDescription>
      </Alert>
    </div>
  )
}
