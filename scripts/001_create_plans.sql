-- Tabela de planos com limites de créditos
CREATE TABLE IF NOT EXISTS plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  credits_per_day INTEGER NOT NULL,
  price_monthly DECIMAL(10,2) NOT NULL,
  features JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;

-- Política: todos podem ler planos
CREATE POLICY "plans_select_all" ON plans FOR SELECT USING (true);
