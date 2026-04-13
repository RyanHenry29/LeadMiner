'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { 
  Settings, 
  CreditCard, 
  MessageCircle, 
  Palette, 
  Globe,
  Save,
  Loader2,
  ExternalLink,
  DollarSign,
  Link as LinkIcon
} from 'lucide-react'

interface SystemConfig {
  site_name: string
  site_description: string
  payment_gateway: {
    provider: string
    public_key: string
    access_token: string
    webhook_url: string
    enabled: boolean
  }
  custom_gateway: {
    enabled: boolean
    name: string
    api_url: string
    api_key: string
    webhook_url: string
  }
  payment_links: {
    enabled: boolean
    basic_plan_link: string
    intermediate_plan_link: string
    pro_plan_link: string
  }
  whatsapp_default_message: string
  landing_page: {
    hero_title: string
    hero_subtitle: string
    accent_color: string
  }
}

export default function AdminConfiguracoesPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [config, setConfig] = useState<SystemConfig>({
    site_name: 'LeadMiner',
    site_description: 'Plataforma de captura de leads',
    payment_gateway: {
      provider: 'mercadopago',
      public_key: '',
      access_token: '',
      webhook_url: '',
      enabled: false
    },
    custom_gateway: {
      enabled: false,
      name: '',
      api_url: '',
      api_key: '',
      webhook_url: ''
    },
    payment_links: {
      enabled: false,
      basic_plan_link: '',
      intermediate_plan_link: '',
      pro_plan_link: ''
    },
    whatsapp_default_message: 'Ola! Vi sua empresa e gostaria de conversar sobre uma parceria.',
    landing_page: {
      hero_title: 'Encontre leads qualificados em segundos',
      hero_subtitle: 'A plataforma mais avancada de mineracao de leads comerciais',
      accent_color: '#d4f244'
    }
  })

  useEffect(() => {
    loadConfig()
  }, [])

  const loadConfig = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('system_config')
        .select('key, value')

      if (error) throw error

      const configObj: Record<string, unknown> = {}
      data?.forEach(item => {
        configObj[item.key] = item.value
      })

      setConfig(prev => ({
        ...prev,
        site_name: (configObj.site_name as string) || prev.site_name,
        site_description: (configObj.site_description as string) || prev.site_description,
        payment_gateway: (configObj.payment_gateway as typeof prev.payment_gateway) || prev.payment_gateway,
        custom_gateway: (configObj.custom_gateway as typeof prev.custom_gateway) || prev.custom_gateway,
        payment_links: (configObj.payment_links as typeof prev.payment_links) || prev.payment_links,
        whatsapp_default_message: (configObj.whatsapp_default_message as string) || prev.whatsapp_default_message,
        landing_page: (configObj.landing_page as typeof prev.landing_page) || prev.landing_page
      }))
    } catch (error) {
      console.error('Erro ao carregar configuracoes:', error)
      toast.error('Erro ao carregar configuracoes')
    } finally {
      setLoading(false)
    }
  }

  const saveConfig = async (key: string, value: unknown) => {
    setSaving(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('system_config')
        .upsert({ 
          key, 
          value: value,
          updated_at: new Date().toISOString()
        }, { onConflict: 'key' })

      if (error) throw error

      toast.success('Configuracao salva com sucesso!')
    } catch (error) {
      console.error('Erro ao salvar:', error)
      toast.error('Erro ao salvar configuracao')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Configuracoes do Sistema</h1>
        <p className="text-muted-foreground">
          Controle total sobre o site, pagamentos e integracoes
        </p>
      </div>

      <Tabs defaultValue="site" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="site" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Site
          </TabsTrigger>
          <TabsTrigger value="pagamentos" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Pagamentos
          </TabsTrigger>
          <TabsTrigger value="whatsapp" className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            WhatsApp
          </TabsTrigger>
          <TabsTrigger value="landing" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Landing Page
          </TabsTrigger>
        </TabsList>

        {/* Configuracoes do Site */}
        <TabsContent value="site" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Informacoes do Site</CardTitle>
              <CardDescription>
                Configure o nome e descricao do seu site
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="site_name">Nome do Site</Label>
                <Input
                  id="site_name"
                  value={config.site_name}
                  onChange={(e) => setConfig(prev => ({ ...prev, site_name: e.target.value }))}
                  placeholder="LeadMiner"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="site_description">Descricao</Label>
                <Textarea
                  id="site_description"
                  value={config.site_description}
                  onChange={(e) => setConfig(prev => ({ ...prev, site_description: e.target.value }))}
                  placeholder="Descricao do seu site..."
                  rows={3}
                />
              </div>
              <Button 
                onClick={() => {
                  saveConfig('site_name', config.site_name)
                  saveConfig('site_description', config.site_description)
                }}
                disabled={saving}
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Salvar
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configuracoes de Pagamento */}
        <TabsContent value="pagamentos" className="space-y-4">
          {/* Mercado Pago */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Mercado Pago
                  </CardTitle>
                  <CardDescription>
                    Configure sua integracao com Mercado Pago
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="mp_enabled">Ativo</Label>
                  <Switch
                    id="mp_enabled"
                    checked={config.payment_gateway.enabled}
                    onCheckedChange={(checked) => setConfig(prev => ({
                      ...prev,
                      payment_gateway: { ...prev.payment_gateway, enabled: checked }
                    }))}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="mp_public_key">Public Key</Label>
                <Input
                  id="mp_public_key"
                  value={config.payment_gateway.public_key}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    payment_gateway: { ...prev.payment_gateway, public_key: e.target.value }
                  }))}
                  placeholder="APP_USR-xxxxx"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mp_access_token">Access Token</Label>
                <Input
                  id="mp_access_token"
                  type="password"
                  value={config.payment_gateway.access_token}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    payment_gateway: { ...prev.payment_gateway, access_token: e.target.value }
                  }))}
                  placeholder="APP_USR-xxxxx"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mp_webhook">Webhook URL</Label>
                <Input
                  id="mp_webhook"
                  value={config.payment_gateway.webhook_url}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    payment_gateway: { ...prev.payment_gateway, webhook_url: e.target.value }
                  }))}
                  placeholder="https://seusite.com/api/webhooks/mercadopago"
                />
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  onClick={() => saveConfig('payment_gateway', config.payment_gateway)}
                  disabled={saving}
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                  Salvar
                </Button>
                <Button variant="outline" asChild>
                  <a href="https://www.mercadopago.com.br/developers" target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Documentacao
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Gateway Customizado */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Gateway Customizado
                  </CardTitle>
                  <CardDescription>
                    Use sua propria API de pagamento ou outro gateway
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="custom_enabled">Ativo</Label>
                  <Switch
                    id="custom_enabled"
                    checked={config.custom_gateway.enabled}
                    onCheckedChange={(checked) => setConfig(prev => ({
                      ...prev,
                      custom_gateway: { ...prev.custom_gateway, enabled: checked }
                    }))}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="custom_name">Nome do Gateway</Label>
                <Input
                  id="custom_name"
                  value={config.custom_gateway.name}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    custom_gateway: { ...prev.custom_gateway, name: e.target.value }
                  }))}
                  placeholder="Meu Gateway / Stripe / PagSeguro / etc"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="custom_api_url">URL da API</Label>
                <Input
                  id="custom_api_url"
                  value={config.custom_gateway.api_url}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    custom_gateway: { ...prev.custom_gateway, api_url: e.target.value }
                  }))}
                  placeholder="https://api.meugateway.com/v1"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="custom_api_key">API Key / Token</Label>
                <Input
                  id="custom_api_key"
                  type="password"
                  value={config.custom_gateway.api_key}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    custom_gateway: { ...prev.custom_gateway, api_key: e.target.value }
                  }))}
                  placeholder="sk_xxxxx"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="custom_webhook">Webhook URL</Label>
                <Input
                  id="custom_webhook"
                  value={config.custom_gateway.webhook_url}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    custom_gateway: { ...prev.custom_gateway, webhook_url: e.target.value }
                  }))}
                  placeholder="https://seusite.com/api/webhooks/custom"
                />
              </div>
              <Button 
                onClick={() => saveConfig('custom_gateway', config.custom_gateway)}
                disabled={saving}
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Salvar
              </Button>
            </CardContent>
          </Card>

          {/* Links de Pagamento Direto */}
          <Card className="border-2 border-primary/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <LinkIcon className="h-5 w-5 text-primary" />
                    Links de Pagamento Direto
                  </CardTitle>
                  <CardDescription>
                    Cole aqui os links de pagamento do Mercado Pago, PagSeguro, Stripe ou qualquer outro gateway. Os usuarios serao redirecionados diretamente para pagar.
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="links_enabled">Ativo</Label>
                  <Switch
                    id="links_enabled"
                    checked={config.payment_links.enabled}
                    onCheckedChange={(checked) => setConfig(prev => ({
                      ...prev,
                      payment_links: { ...prev.payment_links, enabled: checked }
                    }))}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong>Como funciona:</strong> Cole o link de pagamento gerado pelo seu gateway (ex: Mercado Pago, PagSeguro, Stripe Checkout, etc). 
                  Quando o usuario clicar em &quot;Assinar&quot;, sera redirecionado diretamente para esse link.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="basic_link" className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-blue-500" />
                  Link do Plano Basico (R$ 89,90/mes)
                </Label>
                <Input
                  id="basic_link"
                  value={config.payment_links.basic_plan_link}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    payment_links: { ...prev.payment_links, basic_plan_link: e.target.value }
                  }))}
                  placeholder="https://mpago.la/xxxxx ou https://pag.ae/xxxxx"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="intermediate_link" className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-purple-500" />
                  Link do Plano Intermediario (R$ 179,90/mes)
                </Label>
                <Input
                  id="intermediate_link"
                  value={config.payment_links.intermediate_plan_link}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    payment_links: { ...prev.payment_links, intermediate_plan_link: e.target.value }
                  }))}
                  placeholder="https://mpago.la/xxxxx ou https://pag.ae/xxxxx"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pro_link" className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-amber-500" />
                  Link do Plano Profissional (R$ 449,90/mes)
                </Label>
                <Input
                  id="pro_link"
                  value={config.payment_links.pro_plan_link}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    payment_links: { ...prev.payment_links, pro_plan_link: e.target.value }
                  }))}
                  placeholder="https://mpago.la/xxxxx ou https://pag.ae/xxxxx"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <Button 
                  onClick={() => saveConfig('payment_links', config.payment_links)}
                  disabled={saving}
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                  Salvar Links
                </Button>
                <Button variant="outline" asChild>
                  <a href="https://www.mercadopago.com.br/tools/create" target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Criar Link no Mercado Pago
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configuracoes WhatsApp */}
        <TabsContent value="whatsapp" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Mensagem Padrao do WhatsApp</CardTitle>
              <CardDescription>
                Configure a mensagem que sera enviada automaticamente ao contatar um lead
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="whatsapp_message">Mensagem</Label>
                <Textarea
                  id="whatsapp_message"
                  value={config.whatsapp_default_message}
                  onChange={(e) => setConfig(prev => ({ ...prev, whatsapp_default_message: e.target.value }))}
                  placeholder="Ola! Vi sua empresa e gostaria de conversar..."
                  rows={4}
                />
                <p className="text-xs text-muted-foreground">
                  Voce pode usar as variaveis: {'{nome_empresa}'}, {'{cidade}'}, {'{categoria}'}
                </p>
              </div>
              <Button 
                onClick={() => saveConfig('whatsapp_default_message', config.whatsapp_default_message)}
                disabled={saving}
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Salvar
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configuracoes Landing Page */}
        <TabsContent value="landing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Personalizacao da Landing Page</CardTitle>
              <CardDescription>
                Edite os textos e cores da pagina inicial
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="hero_title">Titulo Principal</Label>
                <Input
                  id="hero_title"
                  value={config.landing_page.hero_title}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    landing_page: { ...prev.landing_page, hero_title: e.target.value }
                  }))}
                  placeholder="Encontre leads qualificados..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hero_subtitle">Subtitulo</Label>
                <Textarea
                  id="hero_subtitle"
                  value={config.landing_page.hero_subtitle}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    landing_page: { ...prev.landing_page, hero_subtitle: e.target.value }
                  }))}
                  placeholder="A plataforma mais avancada..."
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="accent_color">Cor de Destaque</Label>
                <div className="flex items-center gap-3">
                  <Input
                    id="accent_color"
                    type="color"
                    value={config.landing_page.accent_color}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      landing_page: { ...prev.landing_page, accent_color: e.target.value }
                    }))}
                    className="w-16 h-10 p-1 cursor-pointer"
                  />
                  <Input
                    value={config.landing_page.accent_color}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      landing_page: { ...prev.landing_page, accent_color: e.target.value }
                    }))}
                    placeholder="#d4f244"
                    className="flex-1"
                  />
                </div>
              </div>
              <Button 
                onClick={() => saveConfig('landing_page', config.landing_page)}
                disabled={saving}
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Salvar
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
