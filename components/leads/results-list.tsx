'use client'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Sparkles, AlertCircle } from 'lucide-react'
import { LeadCard } from './lead-card'
import type { Lead } from '@/lib/types'

interface ResultsListProps {
  results: Lead[]
  savedLeads: Set<string>
  savingLead: string | null
  onSaveLead: (lead: Lead) => void
  source: string
  searchQuery: { city: string; state: string; niche: string }
}

export function ResultsList({ 
  results, 
  savedLeads, 
  savingLead, 
  onSaveLead, 
  source,
  searchQuery 
}: ResultsListProps) {
  if (results.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="h-12 w-12 text-amber-500 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Nenhum lead encontrado</h3>
          <p className="text-muted-foreground text-center max-w-md mb-4">
            Nao encontramos leads para <strong>{searchQuery.niche}</strong> em <strong>{searchQuery.city}, {searchQuery.state}</strong>.
          </p>
          <div className="text-sm text-muted-foreground text-center space-y-1">
            <p>Dicas para melhorar sua busca:</p>
            <ul className="list-disc list-inside text-left">
              <li>Tente termos mais genericos (ex: &quot;moda&quot; ao inves de &quot;loja de roupas&quot;)</li>
              <li>Tente cidades maiores proximas</li>
              <li>Alterne entre Instagram e Google Maps</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Badge de Fonte - Gemini */}
      <Alert className="border-purple-500/30 bg-purple-500/5">
        <Sparkles className="h-4 w-4 text-purple-500" />
        <AlertDescription className="text-purple-400">
          <strong>Fonte: Gemini AI</strong> - Leads sugeridos pela inteligencia artificial.
        </AlertDescription>
      </Alert>

      {/* Aviso importante */}
      <Alert className="border-amber-500/30 bg-amber-500/5">
        <AlertCircle className="h-4 w-4 text-amber-500" />
        <AlertDescription className="text-amber-600 dark:text-amber-400">
          <strong>IMPORTANTE:</strong> Verifique os dados antes de usar! 
          A IA pode sugerir empresas com informacoes desatualizadas ou imprecisas. 
          Confirme telefones e perfis do Instagram antes de contatar.
        </AlertDescription>
      </Alert>

      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          {results.length} leads encontrados
        </h2>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800">
            <Sparkles className="h-3 w-3 mr-1" /> Gemini AI
          </Badge>
          <Badge variant="secondary">
            {searchQuery.niche} em {searchQuery.city}, {searchQuery.state}
          </Badge>
        </div>
      </div>

      {/* Lista de Leads */}
      <div className="grid gap-3">
        {results.map((lead) => (
          <LeadCard
            key={lead.id}
            lead={lead}
            isSaved={savedLeads.has(lead.id)}
            isSaving={savingLead === lead.id}
            onSave={onSaveLead}
            source={source}
          />
        ))}
      </div>
    </div>
  )
}
