-- Adiciona coluna para armazenar a API Key do Gemini
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS gemini_api_key TEXT;

-- Comentario para documentacao
COMMENT ON COLUMN profiles.gemini_api_key IS 'API Key do Google Gemini para busca de leads';
