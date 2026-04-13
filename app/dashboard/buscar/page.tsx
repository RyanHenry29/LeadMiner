'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent } from '@/components/ui/card'
import { Info, Shield, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { SearchForm } from '@/components/leads/search-form'
import { ResultsList } from '@/components/leads/results-list'
import type { Lead } from '@/lib/types'

// Email do admin
const ADMIN_EMAIL = 'ryanhenry.gomes@gmail.com'

export default function BuscarPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<Lead[]>([])
  const [savedLeads, setSavedLeads] = useState<Set<string>>(new Set())
  const [savingLead, setSavingLead] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [searchSource, setSearchSource] = useState<string>('instagram')
  const [searchQuery, setSearchQuery] = useState({ city: '', state: '', niche: '' })
  const [hasSearched, setHasSearched] = useState(false)

  // Verifica se e admin
  useEffect(() => {
    const checkAdmin = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.email === ADMIN_EMAIL) {
        setIsAdmin(true)
      }
    }
    checkAdmin()
  }, [])

  // Busca de leads
  const handleSearch = async (params: { city: string; state: string; niche: string; source: 'instagram' | 'maps' }) => {
    const { city, state, niche, source } = params
    
    setIsLoading(true)
    setResults([])
    setSearchQuery({ city, state, niche })
    setSearchSource(source)
    setHasSearched(true)
    
    try {
      // Escolhe a API baseada na fonte selecionada
      let apiUrl = '/api/leads/search-instagram'
      
      if (source === 'maps') {
        // Admin usa API gratuita, usuarios usam Google Places
        apiUrl = isAdmin ? '/api/leads/search-free' : '/api/leads/search'
      }
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ city, state, niche }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 403 && data.redirect) {
          toast.error('Configure sua API Key do Google Places')
          router.push(data.redirect)
          return
        }
        throw new Error(data.error || data.message || 'Erro na busca')
      }

      setResults(data.leads || [])
      setSearchSource(data.source || source)

      if (data.leads && data.leads.length > 0) {
        const sourceText = source === 'instagram' ? ' via Instagram' : ' via Maps'
        toast.success(`${data.leads.length} leads encontrados${sourceText}!`)
      } else if (data.api_error) {
        toast.error(data.message || data.error, {
          duration: 10000,
          action: data.fix_url ? {
            label: 'Corrigir',
            onClick: () => window.open(data.fix_url, '_blank')
          } : undefined
        })
      } else {
        toast.warning('Nenhum lead encontrado. Tente outro nicho ou cidade.')
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
          Encontre empresas por localizacao e nicho de mercado
        </p>
      </div>

      {/* Aviso Admin */}
      {isAdmin && (
        <Alert className="border-amber-500/30 bg-amber-500/5">
          <Shield className="h-4 w-4 text-amber-500" />
          <AlertDescription className="text-amber-600">
            <strong>Modo Admin:</strong> Todas as buscas sao gratuitas e ilimitadas. 
            Instagram e Maps funcionam sem custos de API.
          </AlertDescription>
        </Alert>
      )}

      {/* Aviso Usuario Normal */}
      {!isAdmin && (
        <Alert className="border-blue-500/30 bg-blue-500/5">
          <Info className="h-4 w-4 text-blue-500" />
          <AlertDescription className="text-blue-700">
            <strong>Dica:</strong> A busca por Instagram e 100% gratuita e nao precisa de configuracao! 
            Para usar o Google Maps, configure sua API Key em &quot;Configurar API&quot;.
          </AlertDescription>
        </Alert>
      )}

      {/* Formulario de Busca */}
      <SearchForm 
        onSearch={handleSearch} 
        isLoading={isLoading} 
        isAdmin={isAdmin} 
      />

      {/* Resultados */}
      {results.length > 0 && (
        <ResultsList
          results={results}
          savedLeads={savedLeads}
          savingLead={savingLead}
          onSaveLead={handleSaveLead}
          source={searchSource}
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
              Nao encontramos leads para os filtros selecionados. Tente ajustar sua busca ou usar outra fonte de pesquisa.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Estado inicial */}
      {!hasSearched && !isLoading && (
        <div className="text-center py-12 text-muted-foreground">
          <p>Selecione o meio de pesquisa, preencha os filtros e clique em &quot;Buscar Leads&quot;.</p>
        </div>
      )}
    </div>
  )
}
