# TalcumOS - PURE JS + SUPABASE - NO PYTHON!

## STEP 1: Run SQL in Supabase (SQL Editor)

```sql
-- Enable UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Settings (passcode, terminal, mail config)
CREATE TABLE IF NOT EXISTS settings (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), key TEXT UNIQUE NOT NULL, value TEXT, user_id TEXT DEFAULT 'default_user', created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW());

-- Custom Apps
CREATE TABLE IF NOT EXISTS custom_apps (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, name TEXT NOT NULL, custom_url TEXT NOT NULL, url TEXT NOT NULL, created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW());

-- Chat Messages
CREATE TABLE IF NOT EXISTS chat_messages (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), room_id TEXT NOT NULL, sender TEXT NOT NULL, content TEXT NOT NULL, user_id TEXT DEFAULT 'default_user', time TEXT, created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW());

-- RLS - Allow all
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_apps ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "settings_all" ON settings FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "apps_all" ON custom_apps FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "chat_all" ON chat_messages FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Storage
INSERT INTO storage.buckets (id, name, public) VALUES ('talcumos-files', 'talcumos-files', true) ON CONFLICT (id) DO NOTHING;
CREATE POLICY "storage_all" ON storage.objects FOR ALL TO anon, authenticated USING (bucket_id = 'talcumos-files') WITH CHECK (true);
```

## STEP 2: Deploy to Netlify (Static!)

1. **Edit `index.html`** - Replace `{{SUPABASE_URL}}` and `{{SUPABASE_KEY}}` with your actual values:
   - Line ~265: Replace `{{SUPABASE_URL}}` with `https://xxxxx.supabase.co`
   - Line ~265: Replace `{{SUPABASE_KEY}}` with your anon key

2. Push to GitHub

3. Netlify > Add site from Git
   - Build: (none)
   - Publish: `.`

4. **DONE!** No Python, no build, pure static!

## Features

- ✅ Passcode (saves to Supabase)
- ✅ Home Screen with dock & grid
- ✅ Browser (iframe)
- ✅ Terminal (saves to Supabase)
- ✅ TMail (saves config to Supabase)  
- ✅ TChat (messages in Supabase)
- ✅ Talumstore (add custom web apps)
- ✅ Settings

## All data in Supabase:
- Passcode
- Terminal history
- Custom apps
- Chat messages
- Mail config

## That's IT! Pure JS, pure static, no Python!
