import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import type { UserLeadStatus } from '@/lib/types'

export async function GET() {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    
    const { data: userLeads, error } = await supabase
      .from('user_leads')
      .select('*, leads(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Erro ao buscar leads:', error)
      return NextResponse.json({ error: 'Erro ao buscar leads' }, { status: 500 })
    }
    
    return NextResponse.json({ user_leads: userLeads })
    
  } catch (error) {
    console.error('Erro:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    
    const body = await request.json()
    const { id, status, notes, sale_value, monthly_recurrence } = body
    
    if (!id) {
      return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 })
    }
    
    const updateData: Record<string, unknown> = {}
    
    if (status) {
      const validStatuses: UserLeadStatus[] = ['new', 'contacted', 'negotiating', 'refused', 'closed']
      if (!validStatuses.includes(status)) {
        return NextResponse.json({ error: 'Status inválido' }, { status: 400 })
      }
      updateData.status = status
      
      if (status === 'contacted' && !body.contacted_at) {
        updateData.contacted_at = new Date().toISOString()
      }
      if (status === 'closed' && !body.closed_at) {
        updateData.closed_at = new Date().toISOString()
      }
    }
    
    if (notes !== undefined) updateData.notes = notes
    if (sale_value !== undefined) updateData.sale_value = sale_value
    if (monthly_recurrence !== undefined) updateData.monthly_recurrence = monthly_recurrence
    
    const { data: userLead, error } = await supabase
      .from('user_leads')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select('*, leads(*)')
      .single()
    
    if (error) {
      console.error('Erro ao atualizar lead:', error)
      return NextResponse.json({ error: 'Erro ao atualizar lead' }, { status: 500 })
    }
    
    return NextResponse.json({ user_lead: userLead })
    
  } catch (error) {
    console.error('Erro:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 })
    }
    
    const { error } = await supabase
      .from('user_leads')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)
    
    if (error) {
      console.error('Erro ao remover lead:', error)
      return NextResponse.json({ error: 'Erro ao remover lead' }, { status: 500 })
    }
    
    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('Erro:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
