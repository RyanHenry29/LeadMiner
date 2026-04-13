import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { History, Search, MapPin, Calendar, Zap } from 'lucide-react'
import { HistoricoClient } from './historico-client'

interface SearchHistoryWithData {
  id: string
  user_id: string
  city: string
  state: string
  niche: string
  results_count: number
  credits_used: number
  results_data: Array<{
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
  }> | null
  created_at: string
}

async function getSearchHistory(userId: string): Promise<SearchHistoryWithData[]> {
  const supabase = await createClient()
  
  const { data } = await supabase
    .from('search_history')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50)
  
  return data || []
}

export default async function HistoricoPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth/login')
  }
  
  const history = await getSearchHistory(user.id)
  
  const totalSearches = history.length
  const totalLeadsFound = history.reduce((acc, h) => acc + h.results_count, 0)
  const totalCreditsUsed = history.reduce((acc, h) => acc + h.credits_used, 0)
  
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Historico de Buscas</h1>
        <p className="text-muted-foreground">
          Veja todas as suas buscas anteriores e os leads encontrados
        </p>
      </div>
      
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de Buscas</p>
                <p className="text-2xl font-bold">{totalSearches}</p>
              </div>
              <Search className="h-8 w-8 text-primary/50" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Leads Encontrados</p>
                <p className="text-2xl font-bold">{totalLeadsFound}</p>
              </div>
              <MapPin className="h-8 w-8 text-primary/50" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Creditos Usados</p>
                <p className="text-2xl font-bold">{totalCreditsUsed}</p>
              </div>
              <Zap className="h-8 w-8 text-primary/50" />
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* History List with Client Component */}
      {history.length > 0 ? (
        <HistoricoClient history={history} />
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <History className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhuma busca ainda</h3>
            <p className="text-muted-foreground text-center max-w-md">
              Seu historico de buscas aparecera aqui
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
