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
import { Search, Loader2, Sparkles } from 'lucide-react'
import { BRAZILIAN_STATES } from '@/lib/types'

const POPULAR_NICHES = [
  'Restaurantes', 'Clinicas', 'Academias', 'Saloes de Beleza',
  'Imobiliarias', 'Escritorios de Advocacia', 'Contabilidade',
  'Pet Shops', 'Lojas de Roupas', 'Mecanicas'
]

interface SearchFormProps {
  onSearch: (params: { city: string; state: string; niche: string }) => void
  isLoading: boolean
  isAdmin: boolean
  hasApiKey: boolean
}

export function SearchForm({ onSearch, isLoading, isAdmin, hasApiKey }: SearchFormProps) {
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [niche, setNiche] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (city && state && niche) {
      onSearch({ city, state, niche })
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
          {/* Info sobre Gemini */}
          <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/30">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-purple-500" />
              <p className="text-sm text-purple-400 font-medium">Busca com Gemini AI</p>
            </div>
            <p className="text-xs text-purple-300/80 mt-1">
              Utiliza inteligencia artificial do Google para encontrar leads reais com nome, telefone, endereco e mais.
            </p>
            {!hasApiKey && !isAdmin && (
              <p className="text-xs text-amber-400 mt-2 font-medium">
                Configure sua API Key do Gemini em &quot;Configurar API&quot; para comecar a buscar.
              </p>
            )}
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
            <Button 
              type="submit" 
              disabled={isLoading || !city || !state || !niche || (!hasApiKey && !isAdmin)} 
              className="gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Buscando com Gemini...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Buscar Leads
                </>
              )}
            </Button>
            
            {isAdmin ? (
              <p className="text-sm text-green-500 font-medium">
                Creditos ilimitados (Admin)
              </p>
            ) : !hasApiKey ? (
              <p className="text-sm text-amber-500">
                Configure sua API Key primeiro
              </p>
            ) : null}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
