-- Histórico de buscas (para controle de créditos)
CREATE TABLE IF NOT EXISTS search_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  query_city TEXT,
  query_state TEXT,
  query_niche TEXT,
  results_count INTEGER,
  credits_used INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE search_history ENABLE ROW LEVEL SECURITY;

-- Políticas: usuário só acessa seu próprio histórico
CREATE POLICY "search_history_select_own" ON search_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "search_history_insert_own" ON search_history FOR INSERT WITH CHECK (auth.uid() = user_id);
