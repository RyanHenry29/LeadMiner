'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent } from '@/components/ui/card'
import { Sparkles, Shield, AlertCircle, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { SearchForm } from '@/components/leads/search-form'
import { ResultsList } from '@/components/leads/results-list'
import type { Lead } from '@/lib/types'
import Link from 'next/link'

// Email do admin
const ADMIN_EMAIL = 'ryanhenry.gomes@gmail.com'

export default function BuscarPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<Lead[]>([])
  const [savedLeads, setSavedLeads] = useState<Set<string>>(new Set())
  const [savingLead, setSavingLead] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [hasApiKey, setHasApiKey] = useState(false)
  const [searchQuery, setSearchQuery] = useState({ city: '', state: '', niche: '' })
  const [hasSearched, setHasSearched] = useState(false)

  // Verifica se e admin e se tem API key do Gemini
  useEffect(() => {
    const checkUserConfig = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user?.email === ADMIN_EMAIL) {
        setIsAdmin(true)
        setHasApiKey(true) // Admin sempre tem acesso
        return
      }
      
      if (user) {
        // Verifica se usuario tem API key configurada
        const { data: profile } = await supabase
          .from('profiles')
          .select('gemini_api_key')
          .eq('id', user.id)
          .single()
        
        setHasApiKey(!!profile?.gemini_api_key)
      }
    }
    checkUserConfig()
  }, [])

  // Busca de leads usando Gemini
  const handleSearch = async (params: { city: string; state: string; niche: string }) => {
    const { city, state, niche } = params
    
    setIsLoading(true)
    setResults([])
    setSearchQuery({ city, state, niche })
    setHasSearched(true)
    
    try {
      const response = await fetch('/api/leads/search-gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ city, state, niche }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 403) {
          toast.error('Configure sua API Key do Gemini primeiro')
          router.push('/dashboard/api-config')
          return
        }
        throw new Error(data.error || data.message || 'Erro na busca')
      }

      setResults(data.leads || [])

      if (data.leads && data.leads.length > 0) {
        toast.success(`${data.leads.length} leads encontrados via Gemini AI!`)
      } else {
        toast.warning(data.message || 'Nenhum lead encontrado. Tente outro nicho ou cidade.')
      }
    } catch (error) {
      console.error('Erro na busca:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao buscar leads')
    } finally {
      setIsLoading(false)
    }
  }

  // Salvar lead no CRM
  const handleSaveLead = async (lead: Lead) => {
    setSavingLead(lead.id)
    
    try {
      const response = await fetch('/api/leads/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(lead),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erro ao salvar')
      }

      setSavedLeads(prev => new Set([...prev, lead.id]))
      toast.success('Lead salvo no CRM!')
    } catch (error) {
      console.error('Erro ao salvar lead:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao salvar lead')
    } finally {
      setSavingLead(null)
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Buscar Leads</h1>
        <p className="text-muted-foreground">
          Encontre empresas por localizacao e nicho de mercado usando Gemini AI
        </p>
      </div>

      {/* Aviso Admin */}
      {isAdmin && (
        <Alert className="border-green-500/30 bg-green-500/5">
          <Shield className="h-4 w-4 text-green-500" />
          <AlertDescription className="text-green-500">
            <strong>Modo Admin:</strong> Todas as buscas sao gratuitas e ilimitadas.
          </AlertDescription>
        </Alert>
      )}

      {/* Aviso para configurar API */}
      {!isAdmin && !hasApiKey && (
        <Alert className="border-amber-500/30 bg-amber-500/5">
          <Sparkles className="h-4 w-4 text-amber-500" />
          <AlertDescription className="text-amber-600 flex items-center justify-between">
            <span>
              <strong>Configure sua API Key do Gemini</strong> para comecar a buscar leads. 
              E gratis e leva menos de 2 minutos!
            </span>
            <Button asChild size="sm" variant="outline" className="ml-4">
              <Link href="/dashboard/api-config">
                <Settings className="h-4 w-4 mr-2" />
                Configurar
              </Link>
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Formulario de Busca */}
      <SearchForm 
        onSearch={handleSearch} 
        isLoading={isLoading} 
        isAdmin={isAdmin}
        hasApiKey={hasApiKey}
      />

      {/* Resultados */}
      {results.length > 0 && (
        <ResultsList
          results={results}
          savedLeads={savedLeads}
          savingLead={savingLead}
          onSaveLead={handleSaveLead}
          source="gemini"
          searchQuery={searchQuery}
        />
      )}

      {/* Estado vazio apos busca */}
      {hasSearched && !isLoading && results.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum resultado encontrado</h3>
            <p className="text-muted-foreground text-center max-w-md">
              O Gemini nao encontrou leads para <strong>{searchQuery.niche}</strong> em <strong>{searchQuery.city}, {searchQuery.state}</strong>. 
              Tente ajustar os termos de busca.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Estado inicial */}
      {!hasSearched && !isLoading && (
        <div className="text-center py-12 text-muted-foreground">
          <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Preencha os filtros acima e clique em &quot;Buscar Leads&quot; para iniciar.</p>
          <p className="text-sm mt-2">O Gemini AI ira buscar leads reais com informacoes de contato.</p>
        </div>
      )}
    </div>
  )
}
