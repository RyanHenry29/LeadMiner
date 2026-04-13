'use client'

import Link from 'next/link'
import { Target, CheckCircle, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function EmailConfirmedPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <Link href="/" className="flex items-center gap-2 mb-8">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary">
          <Target className="h-5 w-5 text-primary-foreground" />
        </div>
        <span className="text-xl font-bold">LeadMiner</span>
      </Link>

      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20">
            <CheckCircle className="h-10 w-10 text-green-500" />
          </div>
          <CardTitle className="text-2xl text-green-500">Email Confirmado!</CardTitle>
          <CardDescription>
            Sua conta foi verificada com sucesso
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-muted-foreground">
            Parabens! Seu email foi confirmado e sua conta esta pronta para uso. 
            Agora voce pode fazer login e comecar a minerar leads.
          </p>
          
          <div className="space-y-2">
            <Button asChild className="w-full" size="lg">
              <Link href="/auth/login">
                Fazer Login
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <p className="text-center text-xs text-muted-foreground pt-4">
            Se voce ja esta logado, pode acessar o{' '}
            <Link href="/dashboard" className="text-primary hover:underline">
              Dashboard
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
