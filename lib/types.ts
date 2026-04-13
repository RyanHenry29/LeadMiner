// Tipos do banco de dados

export interface Plan {
  id: string
  name: string
  display_name: string
  credits_per_day: number
  price_monthly: number
  features: string[]
  created_at: string
}

export interface Profile {
  id: string
  email: string
  full_name: string | null
  role: 'admin' | 'client'
  plan_id: string | null
  credits_used_today: number
  credits_reset_at: string
  created_at: string
  updated_at: string
  plan?: Plan
}

export interface Lead {
  id: string
  google_place_id?: string | null
  name: string
  phone?: string | null
  email?: string | null
  website?: string | null
  address?: string | null
  city?: string | null
  state?: string | null
  niche?: string | null
  category?: string | null
  rating?: number | null
  reviews_count?: number
  has_website?: boolean
  website_quality?: 'none' | 'poor' | 'good' | null
  has_social_media?: boolean
  social_media?: {
    instagram?: string
    facebook?: string
    linkedin?: string
    twitter?: string
  }
  // Campos do Instagram
  instagram?: string | null
  bio?: string | null
  followers?: number | null
  following?: number | null
  posts?: number | null
  profile_url?: string | null
  // Campos do Maps
  maps_url?: string | null
  // Dados brutos
  raw_data?: Record<string, unknown> | null
  created_at?: string
  updated_at?: string
}

export type UserLeadStatus = 'new' | 'contacted' | 'negotiating' | 'refused' | 'closed'

export interface UserLead {
  id: string
  user_id: string
  lead_id: string
  status: UserLeadStatus
  notes: string | null
  sale_value: number | null
  monthly_recurrence: number | null
  contacted_at: string | null
  closed_at: string | null
  created_at: string
  updated_at: string
  lead?: Lead
}

export interface SearchHistory {
  id: string
  user_id: string
  city: string
  state: string
  niche: string
  results_count: number
  credits_used: number
  created_at: string
}

// Estados brasileiros
export const BRAZILIAN_STATES = [
  { value: 'AC', label: 'Acre' },
  { value: 'AL', label: 'Alagoas' },
  { value: 'AP', label: 'Amapá' },
  { value: 'AM', label: 'Amazonas' },
  { value: 'BA', label: 'Bahia' },
  { value: 'CE', label: 'Ceará' },
  { value: 'DF', label: 'Distrito Federal' },
  { value: 'ES', label: 'Espírito Santo' },
  { value: 'GO', label: 'Goiás' },
  { value: 'MA', label: 'Maranhão' },
  { value: 'MT', label: 'Mato Grosso' },
  { value: 'MS', label: 'Mato Grosso do Sul' },
  { value: 'MG', label: 'Minas Gerais' },
  { value: 'PA', label: 'Pará' },
  { value: 'PB', label: 'Paraíba' },
  { value: 'PR', label: 'Paraná' },
  { value: 'PE', label: 'Pernambuco' },
  { value: 'PI', label: 'Piauí' },
  { value: 'RJ', label: 'Rio de Janeiro' },
  { value: 'RN', label: 'Rio Grande do Norte' },
  { value: 'RS', label: 'Rio Grande do Sul' },
  { value: 'RO', label: 'Rondônia' },
  { value: 'RR', label: 'Roraima' },
  { value: 'SC', label: 'Santa Catarina' },
  { value: 'SP', label: 'São Paulo' },
  { value: 'SE', label: 'Sergipe' },
  { value: 'TO', label: 'Tocantins' },
] as const

// Status labels
export const STATUS_LABELS: Record<UserLeadStatus, string> = {
  new: 'Novo',
  contacted: 'Em Contato',
  negotiating: 'Negociando',
  refused: 'Recusado',
  closed: 'Fechado',
}

export const STATUS_COLORS: Record<UserLeadStatus, string> = {
  new: 'bg-blue-100 text-blue-800',
  contacted: 'bg-yellow-100 text-yellow-800',
  negotiating: 'bg-orange-100 text-orange-800',
  refused: 'bg-red-100 text-red-800',
  closed: 'bg-green-100 text-green-800',
}
