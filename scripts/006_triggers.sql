-- Trigger para criar perfil automaticamente no signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  free_plan_id UUID;
BEGIN
  SELECT id INTO free_plan_id FROM plans WHERE name = 'free' LIMIT 1;
  
  INSERT INTO profiles (id, full_name, plan_id, credits_remaining, credits_reset_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    free_plan_id,
    5,
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Function para reset diário de créditos
CREATE OR REPLACE FUNCTION reset_daily_credits()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE profiles p
  SET 
    credits_remaining = COALESCE(pl.credits_per_day, 5),
    credits_reset_at = NOW(),
    updated_at = NOW()
  FROM plans pl
  WHERE p.plan_id = pl.id
    AND p.credits_reset_at < CURRENT_DATE;
END;
$$;

-- Function para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Trigger para profiles
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger para user_leads
DROP TRIGGER IF EXISTS update_user_leads_updated_at ON user_leads;
CREATE TRIGGER update_user_leads_updated_at
  BEFORE UPDATE ON user_leads
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
