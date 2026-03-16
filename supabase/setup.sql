-- =====================================================
-- TALCUMSOS SUPABASE SETUP - RUN THIS IN SQL EDITOR
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLES
-- =====================================================

-- Settings table
CREATE TABLE IF NOT EXISTS settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key TEXT UNIQUE NOT NULL,
    value TEXT,
    user_id TEXT DEFAULT 'default_user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notes table
CREATE TABLE IF NOT EXISTS notes (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    content TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Files table
CREATE TABLE IF NOT EXISTS files (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    parent_path TEXT DEFAULT '',
    type TEXT CHECK (type IN ('file', 'folder')),
    content TEXT DEFAULT '',
    size INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Custom apps
CREATE TABLE IF NOT EXISTS custom_apps (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    custom_url TEXT NOT NULL,
    url TEXT NOT NULL,
    icon TEXT DEFAULT 'custom.png',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat messages
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id TEXT NOT NULL,
    sender TEXT NOT NULL,
    content TEXT NOT NULL,
    user_id TEXT DEFAULT 'default_user',
    time TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- OS State (for saving complete OS state)
CREATE TABLE IF NOT EXISTS os_state (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL,
    state_key TEXT NOT NULL,
    state_value JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, state_key)
);

-- =====================================================
-- ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_apps ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE os_state ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES (Allow all for anon + authenticated)
-- =====================================================

-- Settings policies
DROP POLICY IF EXISTS "Allow all on settings" ON settings;
CREATE POLICY "Allow all on settings" ON settings FOR ALL 
    TO anon, authenticated 
    USING (true) 
    WITH CHECK (true);

-- Notes policies
DROP POLICY IF EXISTS "Allow all on notes" ON notes;
CREATE POLICY "Allow all on notes" ON notes FOR ALL 
    TO anon, authenticated 
    USING (true) 
    WITH CHECK (true);

-- Files policies  
DROP POLICY IF EXISTS "Allow all on files" ON files;
CREATE POLICY "Allow all on files" ON files FOR ALL 
    TO anon, authenticated 
    USING (true) 
    WITH CHECK (true);

-- Custom apps policies
DROP POLICY IF EXISTS "Allow all on custom_apps" ON custom_apps;
CREATE POLICY "Allow all on custom_apps" ON custom_apps FOR ALL 
    TO anon, authenticated 
    USING (true) 
    WITH CHECK (true);

-- Chat messages policies
DROP POLICY IF EXISTS "Allow all on chat_messages" ON chat_messages;
CREATE POLICY "Allow all on chat_messages" ON chat_messages FOR ALL 
    TO anon, authenticated 
    USING (true) 
    WITH CHECK (true);

-- OS State policies
DROP POLICY IF EXISTS "Allow all on os_state" ON os_state;
CREATE POLICY "Allow all on os_state" ON os_state FOR ALL 
    TO anon, authenticated 
    USING (true) 
    WITH CHECK (true);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);
CREATE INDEX IF NOT EXISTS idx_files_user_id ON files(user_id);
CREATE INDEX IF NOT EXISTS idx_files_parent_path ON files(user_id, parent_path);
CREATE INDEX IF NOT EXISTS idx_custom_apps_user_id ON custom_apps(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_room_id ON chat_messages(room_id);
CREATE INDEX IF NOT EXISTS idx_os_state_user_id ON os_state(user_id);

-- =====================================================
-- STORAGE BUCKET (for files)
-- =====================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_extensions)
VALUES ('talcumos-files', 'talcumos-files', true, 104857600, NULL)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
DROP POLICY IF EXISTS "Public access on talcumos-files" ON storage.objects;
CREATE POLICY "Public access on talcumos-files" ON storage.objects 
    FOR ALL TO anon, authenticated USING (bucket_id = 'talcumos-files') WITH CHECK (true);

-- =====================================================
-- SETUP COMPLETE
-- =====================================================

SELECT 'TalcumOS setup complete!' as status;
