import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'

// Email do admin único
export const ADMIN_EMAIL = 'ryanhenry.gomes@gmail.com'

// Verifica se o usuário atual é o admin
export async function isAdmin(): Promise<boolean> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user?.email === ADMIN_EMAIL
}

// Verifica se o usuário está autenticado
export async function requireAuth() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    throw new Error('Não autorizado')
  }
  
  return user
}

// Verifica se o usuário é admin, caso contrário lança erro
export async function requireAdmin() {
  const user = await requireAuth()
  
  if (user.email !== ADMIN_EMAIL) {
    throw new Error('Acesso negado - apenas administradores')
  }
  
  return user
}

// Obtém o IP do cliente
export async function getClientIP(): Promise<string> {
  const headersList = await headers()
  const forwardedFor = headersList.get('x-forwarded-for')
  const realIP = headersList.get('x-real-ip')
  
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim()
  }
  
  if (realIP) {
    return realIP
  }
  
  return 'unknown'
}

// Obtém o User-Agent do cliente
export async function getUserAgent(): Promise<string> {
  const headersList = await headers()
  return headersList.get('user-agent') || 'unknown'
}

// Sanitiza input para prevenir XSS
export function sanitizeInput(input: string): string {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
}

// Valida email
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Valida telefone brasileiro
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^\(?[1-9]{2}\)?\s?9?[0-9]{4}-?[0-9]{4}$/
  return phoneRegex.test(phone.replace(/\s/g, ''))
}

// Rate limiting simples em memória (para desenvolvimento)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

export function checkRateLimit(
  identifier: string,
  maxRequests: number = 100,
  windowMs: number = 60000
): boolean {
  const now = Date.now()
  const record = rateLimitStore.get(identifier)
  
  if (!record || now > record.resetTime) {
    rateLimitStore.set(identifier, { count: 1, resetTime: now + windowMs })
    return true
  }
  
  if (record.count >= maxRequests) {
    return false
  }
  
  record.count++
  return true
}

// Gera token seguro
export function generateSecureToken(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  const randomValues = new Uint32Array(length)
  crypto.getRandomValues(randomValues)
  
  for (let i = 0; i < length; i++) {
    result += chars[randomValues[i] % chars.length]
  }
  
  return result
}

// Log de auditoria
export async function logAuditAction(
  action: string,
  tableName?: string,
  recordId?: string,
  oldData?: Record<string, unknown>,
  newData?: Record<string, unknown>
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const ip = await getClientIP()
    const userAgent = await getUserAgent()
    
    await supabase.from('audit_logs').insert({
      user_id: user?.id,
      action,
      table_name: tableName,
      record_id: recordId,
      old_data: oldData,
      new_data: newData,
      ip_address: ip,
      user_agent: userAgent
    })
  } catch (error) {
    console.error('Erro ao registrar log de auditoria:', error)
  }
}
