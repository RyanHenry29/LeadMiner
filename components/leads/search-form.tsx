'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Search, Loader2, MapPin } from 'lucide-react'
import { BRAZILIAN_STATES } from '@/lib/types'

// Nichos populares
const POPULAR_NICHES = [
  'Restaurantes', 'Clinicas', 'Academias', 'Saloes de Beleza',
  'Imobiliarias', 'Escritorios de Advocacia', 'Contabilidade',
  'Pet Shops', 'Lojas de Roupas', 'Mecanicas'
]

interface SearchFormProps {
  onSearch: (params: { city: string; state: string; niche: string; source: 'maps' }) => void
  isLoading: boolean
  isAdmin: boolean
}

export function SearchForm({ onSearch, isLoading, isAdmin }: SearchFormProps) {
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [niche, setNiche] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (city && state && niche) {
      onSearch({ city, state, niche, source: 'maps' })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Filtros de Busca</CardTitle>
        <CardDescription>
          Preencha os campos abaixo para encontrar leads qualificados
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Selecao de Fonte de Busca */}
          <div className="space-y-2">
            <Label>Fonte de Busca</Label>
            <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
              <p className="text-sm text-blue-800 font-medium">Google Maps</p>
              <p className="text-xs text-blue-700 mt-1">
                Busca empresas verificadas no Google Maps com telefone, endereco, site e avaliacoes.
              </p>
              {!isAdmin && (
                <p className="text-xs text-blue-600 mt-2">
                  Requer API Key do Google Cloud Console (gratuito com $200/mes de creditos)
                </p>
              )}
            </div>
          </div>
                  {isAdmin ? (
                    <span className="text-green-600 font-medium"> Gratuito para Admin.</span>
                  ) : (
                    <span className="text-amber-600"> Requer configuracao da API Key.</span>
                  )}
                </p>
              </TabsContent>
            </Tabs>
          </div>

          {/* Campos de Busca */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">Cidade</Label>
              <Input
                id="city"
                placeholder="Ex: Guarulhos"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="state">Estado</Label>
              <Select value={state} onValueChange={setState} required>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {BRAZILIAN_STATES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="niche">Nicho</Label>
              <Input
                id="niche"
                placeholder="Ex: Lojas de Roupas"
                value={niche}
                onChange={(e) => setNiche(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Nichos Populares */}
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Nichos Populares</Label>
            <div className="flex flex-wrap gap-2">
              {POPULAR_NICHES.map((n) => (
                <Badge
                  key={n}
                  variant={niche === n ? 'default' : 'outline'}
                  className="cursor-pointer hover:bg-primary/10"
                  onClick={() => setNiche(n)}
                >
                  {n}
                </Badge>
              ))}
            </div>
          </div>

          {/* Botao de Busca */}
          <div className="flex items-center gap-4">
            <Button type="submit" disabled={isLoading || !city || !state || !niche} className="gap-2">
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Buscando...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  Buscar Leads
                </>
              )}
            </Button>
            
            {isAdmin && (
              <p className="text-sm text-green-600 font-medium">
                Creditos ilimitados (Admin)
              </p>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
