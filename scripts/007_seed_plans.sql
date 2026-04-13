-- Seed dos planos
INSERT INTO plans (name, display_name, credits_per_day, price_monthly, features) VALUES
  ('free', 'Gratuito', 5, 0, '["5 buscas por dia", "CRM básico", "WhatsApp direto"]'),
  ('basic', 'Básico', 50, 89.90, '["50 buscas por dia", "CRM completo", "WhatsApp direto", "Histórico de buscas"]'),
  ('intermediate', 'Intermediário', 200, 179.90, '["200 buscas por dia", "CRM completo", "WhatsApp direto", "Histórico de buscas", "Mensagens personalizadas"]'),
  ('pro', 'Profissional', 999999, 449.90, '["Buscas ilimitadas", "CRM completo", "WhatsApp direto", "Histórico de buscas", "Mensagens personalizadas", "Suporte prioritário"]')
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  credits_per_day = EXCLUDED.credits_per_day,
  price_monthly = EXCLUDED.price_monthly,
  features = EXCLUDED.features;
