'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { createClient } from '@/lib/supabase/client'
import { Search, Loader2, MapPin, Phone, Globe, Star } from 'lucide-react'

interface Lead {
  id: string
  name: string
  phone: string | null
  email: string | null
  website: string | null
  address: string | null
  city: string
  state: string
  category: string
  rating: number | null
  website_quality: string | null
  has_social_media: boolean
  created_at: string
}

export default function AdminLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchLeads()
  }, [])

  const fetchLeads = async () => {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) {
      console.error(error)
      return
    }

    setLeads(data || [])
    setIsLoading(false)
  }

  const filteredLeads = leads.filter(lead => 
    lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.category.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getQualityBadge = (quality: string | null) => {
    switch (quality) {
      case 'good':
        return <Badge className="bg-green-100 text-green-700">Bom</Badge>
      case 'poor':
        return <Badge className="bg-yellow-100 text-yellow-700">Ruim</Badge>
      default:
        return <Badge variant="secondary">Sem site</Badge>
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Todos os Leads</h1>
        <p className="text-muted-foreground">
          Leads minerados por todos os usuarios da plataforma
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Leads</CardTitle>
              <CardDescription>
                {leads.length} leads no sistema (mostrando ultimos 100)
              </CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, cidade..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Localizacao</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Site</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeads.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{lead.name}</p>
                        {lead.phone && (
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {lead.phone}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <a 
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${lead.name} ${lead.address || ''} ${lead.city} ${lead.state}`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-sm hover:text-primary"
                      >
                        <MapPin className="h-3 w-3" />
                        {lead.city}, {lead.state}
                      </a>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{lead.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getQualityBadge(lead.website_quality)}
                        {lead.website && (
                          <a 
                            href={lead.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            <Globe className="h-4 w-4" />
                          </a>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {lead.rating && (
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          {lead.rating}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(lead.created_at).toLocaleDateString('pt-BR')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {!isLoading && filteredLeads.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum lead encontrado
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
