'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Search, 
  Calendar, 
  ChevronDown, 
  ChevronUp, 
  Phone, 
  Globe, 
  MapPin, 
  Star,
  ExternalLink,
  Copy,
  Check
} from 'lucide-react'
import { toast } from 'sonner'

interface LeadData {
  id: string
  name: string
  phone: string | null
  website: string | null
  address: string
  rating: number | null
  reviews_count: number
  has_website: boolean
  website_quality: 'none' | 'poor' | 'good'
  maps_url: string
}

interface SearchHistoryItem {
  id: string
  city: string
  state: string
  niche: string
  results_count: number
  credits_used: number
  results_data: LeadData[] | null
  created_at: string
}

interface HistoricoClientProps {
  history: SearchHistoryItem[]
}

export function HistoricoClient({ history }: HistoricoClientProps) {
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({})
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null)

  const toggleExpand = (id: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }))
  }

  const copyPhone = (phone: string) => {
    navigator.clipboard.writeText(phone)
    setCopiedPhone(phone)
    toast.success('Telefone copiado!')
    setTimeout(() => setCopiedPhone(null), 2000)
  }

  // Agrupar por data
  const groupedHistory = history.reduce((acc, item) => {
    const date = new Date(item.created_at).toLocaleDateString('pt-BR')
    if (!acc[date]) {
      acc[date] = []
    }
    acc[date].push(item)
    return acc
  }, {} as Record<string, SearchHistoryItem[]>)

  const getQualityBadge = (quality: 'none' | 'poor' | 'good') => {
    switch (quality) {
      case 'none':
        return <Badge variant="destructive" className="text-xs">Sem site</Badge>
      case 'poor':
        return <Badge variant="secondary" className="text-xs bg-yellow-500/20 text-yellow-500">Site basico</Badge>
      case 'good':
        return <Badge variant="secondary" className="text-xs bg-green-500/20 text-green-500">Site profissional</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {Object.entries(groupedHistory).map(([date, items]) => (
        <div key={date}>
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-medium text-sm text-muted-foreground">
              {date}
            </h3>
          </div>
          
          <div className="space-y-3">
            {items.map((item) => (
              <Card key={item.id} className="overflow-hidden">
                <CardContent className="p-0">
                  {/* Header da busca - clicavel */}
                  <button
                    onClick={() => toggleExpand(item.id)}
                    className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <Search className="h-5 w-5 text-primary" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium">{item.niche}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.city}, {item.state}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <Badge variant="secondary">
                          {item.results_count} leads
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(item.created_at).toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                      {expandedItems[item.id] ? (
                        <ChevronUp className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  </button>

                  {/* Lista de leads expandivel */}
                  {expandedItems[item.id] && item.results_data && item.results_data.length > 0 && (
                    <div className="border-t">
                      <div className="p-4 bg-muted/30">
                        <p className="text-sm font-medium mb-3">
                          Leads encontrados ({item.results_data.length})
                        </p>
                        <div className="space-y-3">
                          {item.results_data.map((lead, index) => (
                            <div 
                              key={lead.id || index} 
                              className="p-4 bg-background rounded-lg border"
                            >
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-medium truncate">{lead.name}</h4>
                                    {getQualityBadge(lead.website_quality)}
                                  </div>
                                  
                                  <p className="text-sm text-muted-foreground mb-2 truncate">
                                    <MapPin className="h-3 w-3 inline mr-1" />
                                    {lead.address}
                                  </p>
                                  
                                  <div className="flex flex-wrap items-center gap-3 text-sm">
                                    {lead.phone && (
                                      <button
                                        onClick={() => copyPhone(lead.phone!)}
                                        className="flex items-center gap-1 text-primary hover:underline"
                                      >
                                        <Phone className="h-3 w-3" />
                                        {lead.phone}
                                        {copiedPhone === lead.phone ? (
                                          <Check className="h-3 w-3 text-green-500" />
                                        ) : (
                                          <Copy className="h-3 w-3" />
                                        )}
                                      </button>
                                    )}
                                    
                                    {lead.website && (
                                      <a
                                        href={lead.website}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1 text-blue-500 hover:underline"
                                      >
                                        <Globe className="h-3 w-3" />
                                        Ver site
                                        <ExternalLink className="h-3 w-3" />
                                      </a>
                                    )}
                                    
                                    {lead.rating && (
                                      <span className="flex items-center gap-1 text-muted-foreground">
                                        <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                                        {lead.rating} ({lead.reviews_count})
                                      </span>
                                    )}
                                  </div>
                                </div>
                                
                                <Button
                                  variant="outline"
                                  size="sm"
                                  asChild
                                >
                                  <a
                                    href={lead.maps_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    <MapPin className="h-4 w-4 mr-1" />
                                    Maps
                                  </a>
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Mensagem quando nao tem dados de leads */}
                  {expandedItems[item.id] && (!item.results_data || item.results_data.length === 0) && (
                    <div className="border-t p-6 text-center text-muted-foreground">
                      <p>Dados dos leads nao disponiveis para esta busca.</p>
                      <p className="text-xs mt-1">Buscas feitas antes da atualizacao nao tem os detalhes salvos.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
