'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { Search, Bot, MessageCircle, ChevronDown, ArrowRight, ArrowDown, Check } from 'lucide-react'

// Hook para animação de reveal no scroll
function useReveal() {
  const ref = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.1 }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [])

  return { ref, isVisible }
}

// Componente para seções com reveal
function RevealSection({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const { ref, isVisible } = useReveal()
  
  return (
    <div 
      ref={ref} 
      className={`reveal ${isVisible ? 'visible' : ''} ${className}`}
      style={{ transitionDelay: `${delay}s` }}
    >
      {children}
    </div>
  )
}

// Navbar com scroll effect
function Navbar() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 px-6 py-5 transition-all duration-300 ${
      scrolled ? 'bg-[#0a0a0a]/92 border-b border-white/[0.08] backdrop-blur-xl' : 'border-b border-transparent'
    }`}>
      <div className="max-w-[1120px] mx-auto flex items-center justify-between">
        <Link href="/" className="font-display text-[22px] font-extrabold tracking-tight text-[#f0ede8]">
          Lead<span className="text-primary">Miner</span>
        </Link>
        
        <div className="hidden md:flex items-center gap-8">
          <a href="#como-funciona" className="text-muted-foreground text-sm hover:text-foreground transition-colors">Como funciona</a>
          <a href="#funcionalidades" className="text-muted-foreground text-sm hover:text-foreground transition-colors">Funcionalidades</a>
          <a href="#planos" className="text-muted-foreground text-sm hover:text-foreground transition-colors">Planos</a>
          <a href="#faq" className="text-muted-foreground text-sm hover:text-foreground transition-colors">FAQ</a>
        </div>

        <Link 
          href="/auth/sign-up" 
          className="bg-primary text-primary-foreground text-[13px] font-medium px-5 py-2.5 rounded-full hover:bg-[#c8e83a] transition-all hover:-translate-y-0.5"
        >
          {"Começar grátis →"}
        </Link>
      </div>
    </nav>
  )
}

// Hero Section
function HeroSection() {
  return (
    <section className="min-h-screen flex flex-col justify-center pt-[120px] pb-20 relative">
      <div className="hero-glow" />
      
      <div className="max-w-[1120px] mx-auto px-6 relative z-10">
        <div className="mb-7">
          <span className="inline-flex items-center gap-1.5 bg-primary/10 border border-primary/25 text-primary text-xs font-medium tracking-wider uppercase px-3.5 py-1.5 rounded-full">
            <span className="text-[8px]">●</span>
            Prospecção inteligente para agências
          </span>
        </div>

        <h1 className="font-display text-[clamp(52px,8vw,96px)] font-extrabold leading-none tracking-tighter mb-7">
          Encontre empresas<br />
          que precisam de <em className="not-italic text-primary">você</em>
        </h1>

        <p className="text-lg text-muted-foreground max-w-[520px] leading-relaxed font-light mb-11">
          Busque negócios sem site ou com site ruim na sua cidade, gere uma mensagem de vendas com IA e abra o WhatsApp em um clique.
        </p>

        <div className="flex items-center gap-4 flex-wrap">
          <Link 
            href="/auth/sign-up" 
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground text-[15px] font-medium px-7 py-3.5 rounded-full hover:bg-[#c8e83a] transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(212,242,68,0.2)]"
          >
            {"Começar grátis — 5 leads/dia"}
            <ArrowRight className="w-4 h-4" />
          </Link>
          
          <a 
            href="#como-funciona" 
            className="inline-flex items-center gap-2 text-muted-foreground text-[15px] px-0 py-3.5 hover:text-foreground transition-colors"
          >
            Ver como funciona
            <ArrowDown className="w-3.5 h-3.5" />
          </a>
        </div>

        <div className="flex gap-10 mt-[72px] pt-10 border-t border-white/[0.08] flex-wrap">
          <div>
            <div className="font-display text-4xl font-extrabold tracking-tight">+12k</div>
            <div className="text-[13px] text-muted-foreground mt-1">Empresas mapeadas</div>
          </div>
          <div>
            <div className="font-display text-4xl font-extrabold tracking-tight">87%</div>
            <div className="text-[13px] text-muted-foreground mt-1">Dos negócios locais sem site profissional</div>
          </div>
          <div>
            <div className="font-display text-4xl font-extrabold tracking-tight">{"<2min"}</div>
            <div className="text-[13px] text-muted-foreground mt-1">Da busca ao WhatsApp aberto</div>
          </div>
        </div>
      </div>
    </section>
  )
}

// Marquee Section
function MarqueeSection() {
  const items = [
    'Restaurantes sem site',
    'Clínicas sem Instagram',
    'Salões com site ruim',
    'Academias sem CRM',
    'Consultórios sem Google',
    'Oficinas sem presença digital',
    'Lojas sem e-commerce',
  ]

  return (
    <div className="overflow-hidden border-y border-white/[0.08] py-4 bg-[#111111]">
      <div className="flex gap-12 w-max animate-marquee">
        {[...items, ...items].map((item, i) => (
          <span key={i} className="flex items-center gap-3 text-[13px] text-muted-foreground whitespace-nowrap">
            <span className="text-primary text-[10px]">●</span>
            {item}
          </span>
        ))}
      </div>
    </div>
  )
}

// Como Funciona Section
function HowItWorksSection() {
  const steps = [
    {
      num: '01',
      icon: <Search className="w-5 h-5" />,
      title: 'Busque por cidade e nicho',
      desc: 'Digite a cidade, o estado e o tipo de negócio. O LeadMiner rastreia o Google Maps e filtra empresas sem site ou com presença digital fraca — são seus melhores leads.'
    },
    {
      num: '02',
      icon: <Bot className="w-5 h-5" />,
      title: 'Gere um script com IA',
      desc: 'Com um clique, nossa IA cria uma mensagem de venda personalizada com o nome da empresa, nicho e o problema identificado. Pronta pra enviar, sem edição.'
    },
    {
      num: '03',
      icon: <MessageCircle className="w-5 h-5" />,
      title: 'Abra o WhatsApp direto',
      desc: 'Clique em "Enviar pelo WhatsApp" — a mensagem já vai preenchida no celular. O lead vai pro seu CRM automático e você acompanha até fechar o contrato.'
    }
  ]

  return (
    <section className="py-[120px]" id="como-funciona">
      <div className="max-w-[1120px] mx-auto px-6">
        <RevealSection>
          <div className="mb-4">
            <span className="inline-flex items-center gap-1.5 bg-primary/10 border border-primary/25 text-primary text-xs font-medium tracking-wider uppercase px-3.5 py-1.5 rounded-full">
              <span className="text-[8px]">●</span>
              Simples assim
            </span>
          </div>
          <h2 className="font-display text-[clamp(36px,5vw,60px)] font-extrabold tracking-tight leading-none mb-6">
            Três passos para<br />o seu próximo cliente
          </h2>
          <p className="text-[17px] text-muted-foreground max-w-[480px] font-light leading-relaxed">
            Sem planilhas. Sem pesquisa manual. Você busca, aborda e fecha tudo no mesmo lugar.
          </p>
        </RevealSection>

        <RevealSection delay={0.15}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-white/[0.08] border border-white/[0.08] rounded-[20px] overflow-hidden mt-16">
            {steps.map((step, i) => (
              <div key={i} className="bg-[#111111] p-10 relative group hover:bg-[#181818] transition-colors">
                <div className="font-display text-[72px] font-extrabold text-white/[0.04] leading-none absolute top-5 right-6 tracking-tighter select-none">
                  {step.num}
                </div>
                <div className="w-11 h-11 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-center text-primary mb-6">
                  {step.icon}
                </div>
                <h3 className="font-display text-xl font-bold tracking-tight mb-3">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </RevealSection>
      </div>
    </section>
  )
}

// Features Section
function FeaturesSection() {
  return (
    <section className="pb-[120px]" id="funcionalidades">
      <div className="max-w-[1120px] mx-auto px-6">
        <RevealSection>
          <div className="mb-4">
            <span className="inline-flex items-center gap-1.5 bg-primary/10 border border-primary/25 text-primary text-xs font-medium tracking-wider uppercase px-3.5 py-1.5 rounded-full">
              <span className="text-[8px]">●</span>
              O sistema completo
            </span>
          </div>
          <h2 className="font-display text-[clamp(36px,5vw,60px)] font-extrabold tracking-tight leading-none">
            Tudo que você precisa<br />numa plataforma só
          </h2>
        </RevealSection>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-white/[0.08] border border-white/[0.08] rounded-[20px] overflow-hidden mt-16">
          {/* Featured Card - CRM */}
          <RevealSection delay={0.1} className="md:col-span-2">
            <div className="bg-[#111111] p-10 hover:bg-[#181818] transition-colors grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div>
                <span className="inline-block bg-primary/12 text-primary text-[11px] font-medium tracking-wider uppercase px-2.5 py-1 rounded mb-4">
                  CRM Integrado
                </span>
                <h3 className="font-display text-2xl font-bold tracking-tight mb-3">
                  Kanban de vendas com controle de receita
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Arraste os leads entre os status: Novo, Em contato, Recusado e Fechado. Registre o valor da mensalidade, veja seu lucro acumulado e receba lembretes para cobrar renovações.
                </p>
              </div>
              <div className="bg-[#181818] border border-white/[0.08] rounded-xl p-6 text-sm">
                <div className="flex items-center gap-2.5 py-2 border-b border-white/[0.08]">
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-primary/15 text-primary">NOVO</span>
                  <span className="text-foreground">Barbearia do João</span>
                  <span className="text-muted-foreground text-[11px] ml-auto">São Paulo, SP</span>
                </div>
                <div className="flex items-center gap-2.5 py-2 border-b border-white/[0.08]">
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-[#ff4d4d]/15 text-[#ff4d4d]">HOT</span>
                  <span className="text-foreground">Studio Pilates</span>
                  <span className="text-muted-foreground text-[11px] ml-auto">R$ 1.200/mês</span>
                </div>
                <div className="flex items-center gap-2.5 py-2 border-b border-white/[0.08]">
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-[#6696ff]/15 text-[#6696ff]">CONTATO</span>
                  <span className="text-foreground">Clínica Odonto</span>
                  <span className="text-muted-foreground text-[11px] ml-auto">Aguardando</span>
                </div>
                <div className="flex items-center gap-2.5 py-2">
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-[#6bcb6b]/15 text-[#6bcb6b]">FECHADO</span>
                  <span className="text-foreground">Academia FitLife</span>
                  <span className="text-muted-foreground text-[11px] ml-auto">R$ 2.500/mês</span>
                </div>
              </div>
            </div>
          </RevealSection>

          {/* Feature Cards */}
          <RevealSection delay={0.2}>
            <div className="bg-[#111111] p-10 hover:bg-[#181818] transition-colors h-full">
              <span className="inline-block bg-primary/12 text-primary text-[11px] font-medium tracking-wider uppercase px-2.5 py-1 rounded mb-4">
                Mineração
              </span>
              <h3 className="font-display text-2xl font-bold tracking-tight mb-3">
                Leads qualificados do Google Maps
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Busque por cidade, estado e nicho. O sistema analisa cada empresa e identifica quem não tem site, tem site ruim, ou não tem redes sociais — seus melhores alvos.
              </p>
            </div>
          </RevealSection>

          <RevealSection delay={0.25}>
            <div className="bg-[#111111] p-10 hover:bg-[#181818] transition-colors h-full">
              <span className="inline-block bg-primary/12 text-primary text-[11px] font-medium tracking-wider uppercase px-2.5 py-1 rounded mb-4">
                Automação
              </span>
              <h3 className="font-display text-2xl font-bold tracking-tight mb-3">
                WhatsApp em um clique
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Gere uma mensagem personalizada com IA e abra o WhatsApp já com o texto pronto. É só enviar e começar a conversa de vendas.
              </p>
            </div>
          </RevealSection>
        </div>
      </div>
    </section>
  )
}

// Pricing Section
function PricingSection() {
  const plans = [
    {
      name: 'Gratuito',
      credits: '5 leads por dia',
      price: 0,
      features: ['5 leads por dia', 'Busca básica', 'Exportar CSV'],
      dimFeatures: ['CRM básico', 'Automação WhatsApp'],
      highlight: false
    },
    {
      name: 'Básico',
      credits: '50 leads por dia',
      price: 89.90,
      features: ['50 leads por dia', 'Busca avançada', 'CRM básico', 'Exportar CSV', 'Suporte por email'],
      dimFeatures: [],
      highlight: false
    },
    {
      name: 'Intermediário',
      credits: '200 leads por dia',
      price: 179.90,
      features: ['200 leads por dia', 'Busca avançada', 'CRM completo', 'Automação WhatsApp', 'Exportar CSV/Excel', 'Suporte prioritário'],
      dimFeatures: [],
      highlight: true
    },
    {
      name: 'Profissional',
      credits: 'Leads ilimitados',
      price: 449.90,
      features: ['Leads ilimitados', 'Busca avançada', 'CRM completo', 'Automação WhatsApp', 'API de integração', 'Suporte VIP'],
      dimFeatures: [],
      highlight: false
    }
  ]

  return (
    <section className="py-[120px]" id="planos">
      <div className="max-w-[1120px] mx-auto px-6">
        <RevealSection>
          <div className="mb-4">
            <span className="inline-flex items-center gap-1.5 bg-primary/10 border border-primary/25 text-primary text-xs font-medium tracking-wider uppercase px-3.5 py-1.5 rounded-full">
              <span className="text-[8px]">●</span>
              Planos
            </span>
          </div>
          <h2 className="font-display text-[clamp(36px,5vw,60px)] font-extrabold tracking-tight leading-none mb-6">
            Escolha o plano ideal<br />para o seu negócio
          </h2>
          <p className="text-[17px] text-muted-foreground max-w-[480px] font-light leading-relaxed">
            Comece grátis e escale conforme sua demanda cresce. Todos os planos incluem acesso ao sistema completo.
          </p>
        </RevealSection>

        <RevealSection delay={0.15}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-16">
            {plans.map((plan, i) => (
              <div 
                key={i} 
                className={`bg-[#111111] border rounded-[20px] p-8 flex flex-col transition-all hover:-translate-y-1 relative ${
                  plan.highlight 
                    ? 'border-primary bg-primary/[0.03]' 
                    : 'border-white/[0.08] hover:border-white/[0.15]'
                }`}
              >
                {plan.highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[11px] font-semibold px-3.5 py-1 rounded-full whitespace-nowrap">
                    Mais popular
                  </span>
                )}
                
                <h3 className="font-display text-lg font-bold tracking-tight mb-2">{plan.name}</h3>
                <p className="text-[13px] text-muted-foreground mb-7 pb-7 border-b border-white/[0.08]">{plan.credits}</p>
                
                <div className="mb-7">
                  <span className="text-lg text-muted-foreground align-top leading-8">R$</span>
                  <span className="font-display text-5xl font-extrabold tracking-tighter">
                    {plan.price === 0 ? '0' : plan.price.toFixed(2).replace('.', ',')}
                  </span>
                  <span className="text-[13px] text-muted-foreground">/mês</span>
                </div>

                <ul className="flex-1 mb-7 space-y-1.5">
                  {plan.features.map((feature, j) => (
                    <li key={j} className="flex items-center gap-2.5 text-[13px] text-muted-foreground py-1.5">
                      <Check className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                  {plan.dimFeatures.map((feature, j) => (
                    <li key={j} className="flex items-center gap-2.5 text-[13px] text-muted-foreground/50 py-1.5">
                      <span className="w-3.5 text-center text-white/15">–</span>
                      {feature}
                    </li>
                  ))}
                </ul>

                <Link 
                  href="/auth/sign-up" 
                  className={`w-full py-3 rounded-xl text-sm font-medium text-center transition-all ${
                    plan.highlight 
                      ? 'bg-primary text-primary-foreground hover:bg-[#c8e83a]' 
                      : 'border border-white/[0.15] text-foreground hover:bg-[#181818] hover:border-muted-foreground'
                  }`}
                >
                  {plan.price === 0 ? 'Começar grátis' : 'Assinar agora'}
                </Link>
              </div>
            ))}
          </div>
        </RevealSection>
      </div>
    </section>
  )
}

// FAQ Section
function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const faqs = [
    {
      q: 'Como funciona a busca de leads?',
      a: 'O LeadMiner acessa dados públicos do Google Maps e analisa empresas com base nos critérios que você definir. Identificamos negócios sem site, com site desatualizado ou sem presença nas redes sociais — que são os leads mais qualificados para agências de marketing e desenvolvimento web.'
    },
    {
      q: 'Quantos créditos eu ganho por dia?',
      a: 'Depende do seu plano: Gratuito (5 leads/dia), Básico (50 leads/dia), Intermediário (200 leads/dia) e Profissional (ilimitado). Os créditos são resetados todos os dias à meia-noite.'
    },
    {
      q: 'Posso cancelar a qualquer momento?',
      a: 'Sim! Não há fidelidade. Você pode cancelar sua assinatura a qualquer momento pelo painel de configurações e continua com acesso até o fim do período pago.'
    },
    {
      q: 'Como funciona a automação de WhatsApp?',
      a: 'Você clica no botão "Enviar pelo WhatsApp" e o sistema abre o WhatsApp Web ou o app do celular com a mensagem já preenchida. É só enviar. Não usamos APIs não oficiais nem automatizamos o envio em massa — garantindo que sua conta não seja banida.'
    },
    {
      q: 'Preciso configurar alguma API para usar?',
      a: 'Sim, para buscar leads você precisa criar uma API Key gratuita no Google Cloud Console. É simples e leva menos de 5 minutos. Oferecemos um tutorial em vídeo passo a passo na página de configuração. O Google oferece $200 de créditos gratuitos por mês, o que é suficiente para aproximadamente 10.000 buscas.'
    }
  ]

  return (
    <section className="py-[120px]" id="faq">
      <div className="max-w-[1120px] mx-auto px-6">
        <RevealSection>
          <div className="mb-4">
            <span className="inline-flex items-center gap-1.5 bg-primary/10 border border-primary/25 text-primary text-xs font-medium tracking-wider uppercase px-3.5 py-1.5 rounded-full">
              <span className="text-[8px]">●</span>
              FAQ
            </span>
          </div>
          <h2 className="font-display text-[clamp(36px,5vw,60px)] font-extrabold tracking-tight leading-none">
            Perguntas frequentes
          </h2>
        </RevealSection>

        <RevealSection delay={0.1}>
          <div className="mt-16 border-t border-white/[0.08]">
            {faqs.map((faq, i) => (
              <div key={i} className="border-b border-white/[0.08]">
                <button 
                  onClick={() => setOpenIndex(openIndex === i ? null : i)}
                  className="w-full flex items-center justify-between py-6 text-left font-display text-lg font-bold tracking-tight hover:text-primary transition-colors"
                >
                  {faq.q}
                  <ChevronDown className={`w-5 h-5 text-muted-foreground flex-shrink-0 transition-transform duration-300 ${openIndex === i ? 'rotate-180 text-primary' : ''}`} />
                </button>
                <div className={`overflow-hidden transition-all duration-300 ${openIndex === i ? 'max-h-[200px]' : 'max-h-0'}`}>
                  <p className="text-muted-foreground text-[15px] leading-relaxed font-light pb-6">
                    {faq.a}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </RevealSection>
      </div>
    </section>
  )
}

// CTA Section
function CTASection() {
  return (
    <section className="py-[120px] text-center relative">
      <div className="cta-glow" />
      
      <div className="max-w-[1120px] mx-auto px-6 relative z-10">
        <RevealSection>
          <div className="mb-4 flex justify-center">
            <span className="inline-flex items-center gap-1.5 bg-primary/10 border border-primary/25 text-primary text-xs font-medium tracking-wider uppercase px-3.5 py-1.5 rounded-full">
              <span className="text-[8px]">●</span>
              Comece agora
            </span>
          </div>
          <h2 className="font-display text-[clamp(36px,5vw,60px)] font-extrabold tracking-tight leading-none max-w-[700px] mx-auto mb-6">
            Pronto para encontrar<br />seus próximos clientes?
          </h2>
          <p className="text-[17px] text-muted-foreground max-w-[480px] mx-auto font-light leading-relaxed mb-11">
            Crie sua conta grátis em 30 segundos. Sem cartão de crédito. Cancele quando quiser.
          </p>
          <Link 
            href="/auth/sign-up" 
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground text-[15px] font-medium px-7 py-3.5 rounded-full hover:bg-[#c8e83a] transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(212,242,68,0.2)]"
          >
            {"Começar grátis — 5 leads/dia"}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </RevealSection>
      </div>
    </section>
  )
}

// Footer
function Footer() {
  return (
    <footer className="border-t border-white/[0.08] py-12">
      <div className="max-w-[1120px] mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="text-[13px] text-muted-foreground">
          © 2026 LeadMiner. Todos os direitos reservados.
        </p>
        <div className="flex gap-6">
          <Link href="/termos" className="text-[13px] text-muted-foreground hover:text-foreground transition-colors">
            Termos de uso
          </Link>
          <Link href="/privacidade" className="text-[13px] text-muted-foreground hover:text-foreground transition-colors">
            Privacidade
          </Link>
          <a href="mailto:suporte@leadminer.app" className="text-[13px] text-muted-foreground hover:text-foreground transition-colors">
            Contato
          </a>
        </div>
      </div>
    </footer>
  )
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <Navbar />
      <HeroSection />
      <MarqueeSection />
      <HowItWorksSection />
      <FeaturesSection />
      <PricingSection />
      <FAQSection />
      <CTASection />
      <Footer />
    </div>
  )
}
