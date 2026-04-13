'use client'

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Target, ArrowRight, Check } from 'lucide-react'

const BENEFITS = [
  '5 leads grátis por dia',
  'CRM básico incluído',
  'Exportação CSV',
  'Sem cartão de crédito',
]

export default function SignUpPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [repeatPassword, setRepeatPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    if (password !== repeatPassword) {
      setError('As senhas não coincidem')
      setIsLoading(false)
      return
    }

    if (password.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres')
      setIsLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo:
            process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ??
            `${window.location.origin}/auth/callback`,
          data: {
            full_name: fullName,
          },
        },
      })
      if (error) throw error
      router.push('/auth/sign-up-success')
    } catch (error: unknown) {
      setError(
        error instanceof Error 
          ? error.message === 'User already registered'
            ? 'Este email já está cadastrado'
            : error.message
          : 'Ocorreu um erro ao criar a conta'
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-svh w-full">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary items-center justify-center p-12">
        <div className="max-w-md text-primary-foreground">
          <div className="flex items-center gap-3 mb-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-foreground/10">
              <Target className="h-7 w-7" />
            </div>
            <span className="text-2xl font-bold">LeadMiner</span>
          </div>
          <h1 className="text-4xl font-bold leading-tight mb-4 text-balance">
            Comece a capturar leads hoje mesmo
          </h1>
          <p className="text-lg text-primary-foreground/80 leading-relaxed mb-8">
            Crie sua conta gratuita e tenha acesso imediato à nossa plataforma de mineração de leads.
          </p>
          
          <div className="space-y-4">
            {BENEFITS.map((benefit) => (
              <div key={benefit} className="flex items-center gap-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-foreground/20">
                  <Check className="h-4 w-4" />
                </div>
                <span className="text-primary-foreground/90">{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right side - Sign up form */}
      <div className="flex w-full lg:w-1/2 items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center justify-center gap-2 mb-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <Target className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">LeadMiner</span>
          </div>

          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Criar conta</CardTitle>
              <CardDescription>
                Preencha os dados abaixo para começar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSignUp}>
                <div className="flex flex-col gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="fullName">Nome completo</Label>
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="Seu nome"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      autoComplete="name"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="password">Senha</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Mínimo 6 caracteres"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="new-password"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="repeat-password">Confirmar senha</Label>
                    <Input
                      id="repeat-password"
                      type="password"
                      placeholder="Digite a senha novamente"
                      required
                      value={repeatPassword}
                      onChange={(e) => setRepeatPassword(e.target.value)}
                      autoComplete="new-password"
                    />
                  </div>
                  
                  {error && (
                    <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                      {error}
                    </div>
                  )}
                  
                  <Button type="submit" className="w-full gap-2 mt-2" disabled={isLoading}>
                    {isLoading ? 'Criando conta...' : (
                      <>
                        Criar conta grátis
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
                
                <p className="mt-4 text-center text-xs text-muted-foreground">
                  Ao criar sua conta, você concorda com nossos{' '}
                  <Link href="/termos" className="underline underline-offset-4 hover:text-primary">
                    Termos de Uso
                  </Link>{' '}
                  e{' '}
                  <Link href="/privacidade" className="underline underline-offset-4 hover:text-primary">
                    Política de Privacidade
                  </Link>
                </p>
                
                <div className="mt-6 text-center text-sm">
                  Já tem uma conta?{' '}
                  <Link
                    href="/auth/login"
                    className="font-medium text-primary underline-offset-4 hover:underline"
                  >
                    Fazer login
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
