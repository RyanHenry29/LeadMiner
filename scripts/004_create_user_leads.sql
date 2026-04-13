-- Relacionamento usuário-lead com CRM
CREATE TABLE IF NOT EXISTS user_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'negotiating', 'refused', 'closed')),
  sale_value DECIMAL(10,2),
  monthly_value DECIMAL(10,2),
  notes TEXT,
  next_action TEXT,
  next_action_date TIMESTAMPTZ,
  contacted_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, lead_id)
);

-- Habilitar RLS
ALTER TABLE user_leads ENABLE ROW LEVEL SECURITY;

-- Políticas: usuário só acessa seus próprios leads
CREATE POLICY "user_leads_select_own" ON user_leads FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user_leads_insert_own" ON user_leads FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_leads_update_own" ON user_leads FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "user_leads_delete_own" ON user_leads FOR DELETE USING (auth.uid() = user_id);
