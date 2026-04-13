'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Phone, 
  Globe, 
  MapPin, 
  Star, 
  Plus, 
  Check, 
  Instagram,
  Users,
  ExternalLink,
  Copy
} from 'lucide-react'
import { toast } from 'sonner'
import type { Lead } from '@/lib/types'

interface LeadCardProps {
  lead: Lead
  isSaved: boolean
  isSaving: boolean
  onSave: (lead: Lead) => void
  source: 'instagram' | 'maps' | 'google-free' | string
}

export function LeadCard({ lead, isSaved, isSaving, onSave, source }: LeadCardProps) {
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} copiado!`)
  }

  const isInstagram = source === 'instagram'

  return (
    <Card className="hover:border-primary/50 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {/* Nome e Badges */}
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <h3 className="font-semibold truncate">{lead.name}</h3>
              
              {isInstagram && lead.instagram && (
                <Badge variant="outline" className="bg-pink-50 text-pink-700 border-pink-200">
                  <Instagram className="h-3 w-3 mr-1" />
                  @{lead.instagram.replace('@', '')}
                </Badge>
              )}
              
              {lead.rating && lead.rating > 0 && (
                <Badge variant="secondary" className="gap-1">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  {lead.rating.toFixed(1)}
                  {lead.reviews_count && <span className="text-muted-foreground">({lead.reviews_count})</span>}
                </Badge>
              )}
            </div>

            {/* Endereco */}
            {lead.address && (
              <p className="text-sm text-muted-foreground flex items-center gap-1 mb-2">
                <MapPin className="h-3 w-3 shrink-0" />
                <span className="truncate">{lead.address}</span>
              </p>
            )}

            {/* Bio do Instagram */}
            {isInstagram && lead.bio && (
              <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                {lead.bio}
              </p>
            )}

            {/* Informacoes */}
            <div className="flex flex-wrap items-center gap-3 mt-3">
              {/* Telefone */}
              {lead.phone ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-1 gap-1 text-sm"
                  onClick={() => copyToClipboard(lead.phone!, 'Telefone')}
                >
                  <Phone className="h-3 w-3 text-green-600" />
                  <span>{lead.phone}</span>
                  <Copy className="h-3 w-3 ml-1 text-muted-foreground" />
                </Button>
              ) : (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  Sem telefone
                </span>
              )}

              {/* Website */}
              {lead.website ? (
                <a
                  href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-sm text-primary hover:underline"
                >
                  <Globe className="h-3 w-3" />
                  Site
                  <ExternalLink className="h-3 w-3" />
                </a>
              ) : (
                <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50">
                  Sem site
                </Badge>
              )}

              {/* Instagram */}
              {lead.instagram && (
                <a
                  href={`https://instagram.com/${lead.instagram.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-sm text-pink-600 hover:underline"
                >
                  <Instagram className="h-3 w-3" />
                  Instagram
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}

              {/* Seguidores (Instagram) */}
              {isInstagram && lead.followers && (
                <Badge variant="secondary" className="gap-1">
                  <Users className="h-3 w-3" />
                  {lead.followers.toLocaleString()} seguidores
                </Badge>
              )}

              {/* Maps */}
              {lead.maps_url && (
                <a
                  href={lead.maps_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-sm text-primary hover:underline"
                >
                  <MapPin className="h-3 w-3" />
                  Maps
                </a>
              )}
            </div>
          </div>

          {/* Botao Salvar */}
          <div className="shrink-0">
            <Button
              variant={isSaved ? 'secondary' : 'default'}
              size="sm"
              disabled={isSaved || isSaving}
              onClick={() => onSave(lead)}
              className="gap-1"
            >
              {isSaved ? (
                <>
                  <Check className="h-4 w-4" />
                  Salvo
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Salvar no CRM
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
