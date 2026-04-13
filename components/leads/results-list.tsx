'use client'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Instagram, MapPin, AlertCircle } from 'lucide-react'
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
      {/* Badge de Fonte */}
      <Alert className={source === 'instagram' 
        ? 'border-pink-500/30 bg-pink-500/5' 
        : source === 'openstreetmap' || source === 'nominatim'
        ? 'border-blue-500/30 bg-blue-500/5'
        : 'border-green-500/30 bg-green-500/5'
      }>
        {source === 'instagram' ? (
          <Instagram className="h-4 w-4 text-pink-500" />
        ) : (
          <MapPin className="h-4 w-4 text-green-500" />
        )}
        <AlertDescription className={
          source === 'instagram' ? 'text-pink-700' 
          : source === 'openstreetmap' || source === 'nominatim' ? 'text-blue-700'
          : 'text-green-700'
        }>
          <strong>Fonte: {
            source === 'instagram' ? 'Instagram' 
            : source === 'openstreetmap' ? 'OpenStreetMap (Gratuito)' 
            : source === 'nominatim' ? 'Nominatim (Gratuito)'
            : 'Google Maps'
          }</strong> - 
          {source === 'instagram' 
            ? ' Perfis comerciais encontrados no Instagram. Clique para visitar o perfil.'
            : source === 'openstreetmap' || source === 'nominatim'
            ? ' Consulta 100% gratuita. Telefone e site podem nao estar disponiveis.'
            : ' Empresas com telefone, site e avaliacoes.'
          }
        </AlertDescription>
      </Alert>

      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          {results.length} leads encontrados
        </h2>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={
            source === 'instagram' 
              ? 'bg-pink-50 text-pink-700 border-pink-200'
              : 'bg-green-50 text-green-700 border-green-200'
          }>
            {source === 'instagram' ? (
              <><Instagram className="h-3 w-3 mr-1" /> Instagram</>
            ) : (
              <><MapPin className="h-3 w-3 mr-1" /> Maps</>
            )}
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
