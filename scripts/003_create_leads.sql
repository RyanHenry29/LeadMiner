-- Leads minerados
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  google_place_id TEXT UNIQUE,
  name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  niche TEXT,
  website TEXT,
  website_quality TEXT CHECK (website_quality IN ('none', 'poor', 'good')),
  has_instagram BOOLEAN DEFAULT FALSE,
  has_facebook BOOLEAN DEFAULT FALSE,
  rating DECIMAL(2,1),
  total_ratings INTEGER,
  raw_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Política: usuários autenticados podem ler leads (dados públicos)
CREATE POLICY "leads_select_authenticated" ON leads FOR SELECT TO authenticated USING (true);

-- Política: inserção via service role apenas (será feita pelo backend)
CREATE POLICY "leads_insert_service" ON leads FOR INSERT WITH CHECK (true);
