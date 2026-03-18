// ==================== DEBUG LOGGING ====================
function kernelLog(tag, message) {
  const timestamp = new Date().toLocaleTimeString();
  const logMsg = `[${timestamp}] ${tag}: ${message}`;
  console.log(logMsg);
  
  // Push to global debug log if available
  if (window.__kernelDebugLogs) {
    window.__kernelDebugLogs.push(logMsg);
    if (window.__kernelDebugLogs.length > 100) window.__kernelDebugLogs.shift();
  }
}

window.__kernelDebugLogs = [];

// ==================== CONFIGURATION ====================
var CONFIG = window.__env || {}

var SUPABASE_URL = window.SUPABASE_URL || CONFIG.SUPABASE_URL || ''
var SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY || CONFIG.SUPABASE_ANON_KEY || ''
var SUPABASE_SERVICE_KEY = window.SUPABASE_SERVICE_KEY || CONFIG.SUPABASE_SERVICE_KEY || ''
var SUPABASE_PAT = window.SUPABASE_PAT || CONFIG.SUPABASE_PAT || ''

// ==================== SUPABASE INITIALIZATION ====================
var supabase = null
var createClient = window.supabase?.createClient

// PGlite will be imported as an ES module
// It will be available as window.PGlite or via import
var pglite = null

// Initialize PGlite for browser-based PostgreSQL access
async function initPGlite() {
  if (pglite) return pglite;
  
  // Check if PGlite is available from ES module import
  if (typeof PGlite !== 'undefined') {
    try {
      pglite = new PGlite();
      await pglite.waitReady;
      return pglite;
    } catch (e) {
      console.error('Failed to initialize PGlite:', e);
      return null;
    }
  }
  
  // Fallback: check if it's attached to window
  if (window.PGlite) {
    try {
      pglite = new window.PGlite();
      await pglite.waitReady;
      return pglite;
    } catch (e) {
      console.error('Failed to initialize PGlite from window:', e);
      return null;
    }
  }
  
  return null;
}

function initSupabase() {
  kernelLog('AUTH', 'initSupabase called');
  
  // Check if we already have a valid Supabase client instance
  if (supabase && typeof supabase.from === 'function') {
    kernelLog('AUTH', 'supabase already initialized');
    return supabase;
  }
  
  // Check if window.supabase is already a valid client instance (has .from method)
  if (window.supabase && typeof window.supabase.from === 'function') {
    kernelLog('AUTH', 'window.supabase is a client instance');
    supabase = window.supabase;
    window.supabase_ready = supabase;
    return supabase;
  }
  
  // The library exports object is at window.supabase
  // We need to call createClient from it
  if (typeof window.supabase === 'object' && window.supabase !== null && typeof window.supabase.createClient === 'function') {
    kernelLog('AUTH', 'window.supabase is a library object with createClient');
    createClient = window.supabase.createClient;
  } else {
    kernelLog('AUTH', `window.supabase is not a library object. Type: ${typeof window.supabase}, has createClient: ${typeof window.supabase?.createClient}`);
    return null;
  }
  
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    kernelLog('AUTH', 'Missing SUPABASE_URL or SUPABASE_ANON_KEY');
    return null;
  }
  
  kernelLog('AUTH', `Creating Supabase client with URL: ${SUPABASE_URL}`);
  
  try {
    const result = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    if (!result) {
      kernelLog('AUTH', 'createClient returned null');
      return null;
    }
    
    // Check if result is a valid client
    if (typeof result.from !== 'function') {
      kernelLog('AUTH', 'createClient result does not have .from method');
      // Try to find the actual client in the result
      if (result.client && typeof result.client.from === 'function') {
        kernelLog('AUTH', 'Found client in result.client');
        result = result.client;
      } else if (result.supabase && typeof result.supabase.from === 'function') {
        kernelLog('AUTH', 'Found client in result.supabase');
        result = result.supabase;
      } else {
        kernelLog('AUTH', 'Could not find valid client in result');
        return null;
      }
    } else {
      kernelLog('AUTH', 'createClient result has .from method');
    }
    
    supabase = result;
    window.supabase_ready = supabase;
    kernelLog('AUTH', 'Supabase client initialized successfully');
    return supabase;
  } catch (e) {
    kernelLog('AUTH', `createClient error: ${e.message}`);
    return null;
  }
}

// Initialize on load - but check if supabase is available first


// Create a promise that can be resolved when Supabase library loads
window.kernelInitPromise = {
  promise: null,
  resolve: null,
  reject: null
};

window.kernelInitPromise.promise = new Promise((resolve, reject) => {
  window.kernelInitPromise.resolve = resolve;
  window.kernelInitPromise.reject = reject;
});

// Check if Supabase library is already loaded
const isSupabaseLoaded = 
  (typeof window.supabase !== 'undefined' && window.supabase !== null) ||
  (typeof window.SupabaseClient !== 'undefined' && window.SupabaseClient !== null) ||
  (typeof window.SUPABASE !== 'undefined' && window.SUPABASE !== null);

if (isSupabaseLoaded) {
  window.supabase_ready = initSupabase();
  if (window.supabase_ready) {
    window.kernelInitPromise.resolve();
  } else {
    window.kernelInitPromise.reject(new Error('Supabase initialization failed'));
  }
} else {
  // Wait for the library to load (will be triggered by the script in lockscreen-v2.html)
  window.kernelInitPromise.promise.then(() => {
    window.supabase_ready = initSupabase();
    if (!window.supabase_ready) {
      window.kernelInitPromise.reject(new Error('Supabase initialization failed from promise'));
    }
  }).catch((e) => {
    // Error waiting for Supabase
  });
  
  // Also try when DOM is ready as a fallback
  document.addEventListener('DOMContentLoaded', () => {
    if (typeof window.supabase !== 'undefined' && window.supabase !== null) {
      window.supabase_ready = initSupabase();
      if (window.supabase_ready) {
        window.kernelInitPromise.resolve();
      } else {
        window.kernelInitPromise.reject(new Error('Supabase initialization failed from DOMContentLoaded'));
      }
    }
  });
}

// ==================== DATABASE INITIALIZATION ====================
var dbInitialized = false
var vfsInitialized = false

async function initDatabase() {
  if (dbInitialized) {
    return true;
  }
  
  // Use window.supabase_ready if available, otherwise try to initialize
  if (window.supabase_ready) {
    supabase = window.supabase_ready;
  } else {
    supabase = initSupabase();
  }
  
  if (!supabase) {
    throw new Error('SUPABASE_NOT_INITIALIZED');
  }
  
  // Verify Supabase client is working
  try {
    await supabase.auth.getUser();
  } catch (e) {
    // Ignore errors - might not be logged in
  }
  
  dbInitialized = true;
  return true;
}

// ==================== VFS INITIALIZATION ====================
async function initVFS() {
  if (vfsInitialized) {
    return window.VFS;
  }
  
  // Wait for Supabase to be ready
  await initDatabase();
  
  if (!supabase) {
    throw new Error('Supabase client not available for VFS initialization');
  }
  
  // Dynamically import SupabaseVFS (since vfs.js uses ES modules)
  try {
    // Check if SupabaseVFS is already available (loaded via script tag)
    if (typeof SupabaseVFS !== 'undefined') {
      window.VFS = new SupabaseVFS(supabase);
      vfsInitialized = true;
      kernelLog('VFS', '✓ SupabaseVFS initialized from global scope');
      return window.VFS;
    }
    
    // Try dynamic import
    const module = await import('./vfs.js');
    if (module.SupabaseVFS) {
      window.VFS = new module.SupabaseVFS(supabase);
      vfsInitialized = true;
      kernelLog('VFS', '✓ SupabaseVFS initialized via dynamic import');
      return window.VFS;
    }
    
    throw new Error('SupabaseVFS class not found');
  } catch (e) {
    kernelLog('VFS', `Failed to initialize VFS: ${e.message}`);
    throw e;
  }
}

// ==================== EMAIL/PASSWORD AUTHENTICATION ====================
// Using Supabase Auth with standard email/password authentication

async function checkAuthSetup() {
  try {
    await ensureSupabaseReady();
    // Defensive check: ensure supabase is not null
    if (!supabase) {
      return false;
    }
    const { data: { user } } = await supabase.auth.getUser();
    return user !== null;
  } catch (e) {
    return false;
  }
}

async function ensureSupabaseReady() {
  if (!supabase) {
    kernelLog('AUTH', 'Supabase not ready, initializing...');
    if (window.kernelInitPromise && window.kernelInitPromise.promise) {
      try {
        await window.kernelInitPromise.promise;
        kernelLog('AUTH', 'Kernel init promise resolved');
      } catch (e) {
        kernelLog('AUTH', `Kernel init promise rejected: ${e.message}`);
        throw new Error(`Failed to initialize Supabase: ${e.message}`);
      }
    }
    if (!window.supabase_ready) {
      kernelLog('AUTH', 'window.supabase_ready is null');
      throw new Error('Supabase failed to initialize - window.supabase_ready is null');
    }
    
    // Verify window.supabase_ready has auth property
    if (typeof window.supabase_ready.auth !== 'object' || window.supabase_ready.auth === null) {
      kernelLog('AUTH', 'window.supabase_ready missing auth property');
      throw new Error('Supabase client is invalid - missing auth property');
    }
    
    kernelLog('AUTH', 'Supabase client ready');
    supabase = window.supabase_ready;
  }
}

async function signUp(email, password) {
  await ensureSupabaseReady();
  
  // Defensive check: ensure supabase is not null
  if (!supabase) {
    throw new Error('Supabase client is not available');
  }
  
  // Trim inputs
  const trimmedEmail = email.trim();
  const trimmedPassword = password.trim();

  if (!trimmedEmail || !trimmedPassword) {
    throw new Error('Email and password are required');
  }

  // Check if there's already a signed-in user
  const { data: { user: currentUser } } = await supabase.auth.getUser();
  
  if (currentUser) {
    throw new Error('An account already exists. Please sign in with your existing account.');
  }
  
  kernelLog('AUTH', `Attempting sign up for: ${trimmedEmail}`);

  // Try to sign up
  const { data, error } = await supabase.auth.signUp({
    email: trimmedEmail,
    password: trimmedPassword
  });
  
  if (error) {
    // If user already exists, prevent signup
    if (error.message.includes('already registered')) {
      throw new Error('An account already exists. Please sign in.');
    }
    throw new Error(`Failed to sign up: ${error.message}`);
  }
  
  kernelLog('AUTH', 'Sign up successful');
  
  // After successful signup, we need to verify it's the only user
  // This is enforced by a database trigger (see below)
  
  return data;
}

async function signIn(email, password) {
  await ensureSupabaseReady();
  
  // Defensive check: ensure supabase is not null
  if (!supabase) {
    throw new Error('Supabase client is not available');
  }

  // Trim inputs to avoid whitespace issues
  const trimmedEmail = email.trim();
  const trimmedPassword = password.trim();

  if (!trimmedEmail || !trimmedPassword) {
    throw new Error('Email and password are required');
  }

  kernelLog('AUTH', `Attempting sign in for: ${trimmedEmail}`);

  const { data, error } = await supabase.auth.signInWithPassword({
    email: trimmedEmail,
    password: trimmedPassword
  });

  if (error) {
    kernelLog('AUTH', `Sign in failed: ${error.message}`);
    kernelLog('AUTH', `Error status: ${error.status}`);
    kernelLog('AUTH', `Error code: ${error.code}`);
    throw new Error(`Failed to sign in: ${error.message}`);
  }

  kernelLog('AUTH', 'Sign in successful');
  return data;
}

async function signOut() {
  await ensureSupabaseReady();
  
  // Defensive check: ensure supabase is not null
  if (!supabase) {
    throw new Error('Supabase client is not available');
  }
  
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(`Failed to sign out: ${error.message}`);
  return true;
}

// ==================== DATABASE SETUP USING PAT + SUPABASE CLIENT ====================
async function setupDatabaseDirect() {
  throw new Error('MANUAL_SETUP_REQUIRED: Please create exec_sql function manually in Supabase Dashboard SQL Editor');
}

// ==================== ADMIN DATABASE SETUP ====================
async function setupDatabase() {
  // Wait for createClient to be available
  if (!createClient) {
    if (window.kernelInitPromise && window.kernelInitPromise.promise) {
      await window.kernelInitPromise.promise;
    }
    if (!createClient) {
      throw new Error('createClient is not available. Supabase library may not have loaded correctly.');
    }
  }
  
  // Initialize Supabase client
  if (SUPABASE_URL && SUPABASE_ANON_KEY) {
    try {
      supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      window.supabase_ready = supabase;
    } catch (e) {
      throw new Error(`Failed to initialize Supabase: ${e.message}`);
    }
  } else {
    throw new Error('SUPABASE_URL or SUPABASE_ANON_KEY is missing');
  }
  
  // Test auth
  await supabase.auth.getUser();
  
  dbInitialized = true;
  return true;
}

// ==================== ONE USER ENFORCEMENT ====================
// This function sets up a database trigger to enforce one user only
// It requires SUPABASE_SERVICE_KEY to be set in config.js
async function setupOneUserEnforcement() {
  if (!SUPABASE_SERVICE_KEY) {
    throw new Error('SUPABASE_SERVICE_KEY is required to setup one user enforcement');
  }
  
  // Create a Supabase client with service key
  const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  
  // Create a trigger function that prevents more than one user
  const triggerSQL = `
    CREATE OR REPLACE FUNCTION enforce_single_user()
    RETURNS TRIGGER AS $$
    DECLARE
      user_count INTEGER;
    BEGIN
      -- Count existing users
      SELECT COUNT(*) INTO user_count FROM auth.users;
      
      -- If there's already a user, prevent new signup
      IF user_count >= 1 THEN
        RAISE EXCEPTION 'Only one user account is allowed per system';
      END IF;
      
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
    
    -- Drop existing trigger if any
    DROP TRIGGER IF EXISTS single_user_trigger ON auth.users;
    
    -- Create trigger on users table
    CREATE TRIGGER single_user_trigger
    BEFORE INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION enforce_single_user();
  `;
  
  try {
    // Execute the SQL using the Management API
    const response = await fetch(`https://api.supabase.com/v1/projects/${getWindowProjectId()}/database/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_PAT}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: triggerSQL }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to setup one user enforcement: ${error.message || response.statusText}`);
    }
    
    return await response.json();
  } catch (e) {
    throw new Error(`Failed to setup one user enforcement: ${e.message}`);
  }
}

function getWindowProjectId() {
  // Extract project ID from SUPABASE_URL
  // URL format: https://xyzcompany.supabase.co
  const match = SUPABASE_URL.match(/https:\/\/([^\.]+)\./);
  return match ? match[1] : null;
}

// ==================== MANAGEMENT API USING PAT ====================
// Use Supabase Management API directly with PAT for client-side management operations

async function managementApiRequest(endpoint, method = 'GET', body = null) {
  if (!SUPABASE_PAT) {
    throw new Error('SUPABASE_PAT is required for management API operations');
  }
  
  const url = `https://api.supabase.com/v1${endpoint}`;
  const options = {
    method,
    headers: {
      'Authorization': `Bearer ${SUPABASE_PAT}`,
      'Content-Type': 'application/json',
    },
  };
  
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  const response = await fetch(url, options);
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(`Management API error: ${response.status} - ${JSON.stringify(data)}`);
  }
  
  return data;
}

async function getProjects() {
  return managementApiRequest('/projects');
}

async function getProject(projectId) {
  return managementApiRequest(`/projects/${projectId}`);
}

async function getProjectUrl(projectId) {
  const project = await getProject(projectId);
  return project?.db?.host || null;
}

// ==================== STATE MANAGEMENT (Supabase-based) ====================

async function setupStateDatabase() {
  // Setup Supabase state tables via Management API
  if (!SUPABASE_PAT || !SUPABASE_URL) {
    throw new Error('SUPABASE_PAT and SUPABASE_URL are required for state database setup');
  }
  
  try {
    const projectId = getWindowProjectId();
    if (!projectId) {
      throw new Error('Could not determine Supabase project ID');
    }
    
    const sql = `
      CREATE TABLE IF NOT EXISTS app_state (
        id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
        key TEXT NOT NULL,
        value TEXT,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(user_id, key)
      );
      
      CREATE TABLE IF NOT EXISTS app_layout (
        id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
        layout TEXT,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      
      -- Enable Row Level Security
      ALTER TABLE app_state ENABLE ROW LEVEL SECURITY;
      ALTER TABLE app_layout ENABLE ROW LEVEL SECURITY;
      
      -- Create policies
      CREATE POLICY "Users can manage their own app_state" ON app_state
        FOR ALL USING (auth.uid() = user_id);
        
      CREATE POLICY "Users can manage their own app_layout" ON app_layout
        FOR ALL USING (auth.uid() = user_id);
    `;
    
    const response = await fetch(`https://api.supabase.com/v1/projects/${projectId}/database/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_PAT}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: sql }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || response.statusText);
    }
    
    kernelLog('STATE', '✓ Supabase state tables created via Management API');
    return await response.json();
  } catch (e) {
    kernelLog('STATE', `Supabase state table setup failed: ${e.message}`);
    throw e;
  }
}

async function checkStateDatabase() {
  // Check if state tables exist (basic check)
  if (!SUPABASE_URL) {
    return false;
  }
  
  try {
    // Try to query the tables - if they don't exist, Supabase will return an error
    // We can't easily check existence without Management API, so we just try to use them
    // The StateManager will handle errors gracefully
    return true;
  } catch (e) {
    return false;
  }
}

// ==================== VFS DATABASE SETUP ====================
async function setupVFSDatabase() {
  // Setup Supabase VFS tables via Management API
  if (!SUPABASE_PAT || !SUPABASE_URL) {
    throw new Error('SUPABASE_PAT and SUPABASE_URL are required for VFS database setup');
  }

  try {
    const projectId = getWindowProjectId();
    if (!projectId) {
      throw new Error('Could not determine Supabase project ID');
    }

    const sql = `
      CREATE TABLE IF NOT EXISTS files (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
        parent_id UUID REFERENCES files(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        path TEXT NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('file', 'directory', 'symlink')),
        mime_type TEXT,
        storage_path TEXT,
        size BIGINT DEFAULT 0,
        permissions JSONB DEFAULT '{"read": true, "write": true, "execute": false}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(user_id, parent_id, name)
      );

      CREATE TABLE IF NOT EXISTS file_versions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        file_id UUID REFERENCES files(id) ON DELETE CASCADE NOT NULL,
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
        version INT NOT NULL,
        storage_path TEXT NOT NULL,
        size BIGINT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Enable Row Level Security
      ALTER TABLE files ENABLE ROW LEVEL SECURITY;
      ALTER TABLE file_versions ENABLE ROW LEVEL SECURITY;

      -- Create policies
      CREATE POLICY "Users can manage their own files" ON files
        FOR ALL USING (auth.uid() = user_id);

      CREATE POLICY "Users can manage their own file_versions" ON file_versions
        FOR ALL USING (auth.uid() = user_id);
      
      -- Create indexes
      CREATE INDEX IF NOT EXISTS idx_files_user_id ON files(user_id);
      CREATE INDEX IF NOT EXISTS idx_files_parent_id ON files(parent_id);
      CREATE INDEX IF NOT EXISTS idx_files_path ON files(path);
    `;

    const response = await fetch(`https://api.supabase.com/v1/projects/${projectId}/database/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_PAT}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: sql }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || response.statusText);
    }

    kernelLog('VFS', '✓ Supabase VFS tables created via Management API');
    return await response.json();
  } catch (e) {
    kernelLog('VFS', `Supabase VFS table setup failed: ${e.message}`);
    throw e;
  }
}

async function createVFSBucket() {
  // Create storage bucket for VFS files
  if (!SUPABASE_PAT || !SUPABASE_URL) {
    throw new Error('SUPABASE_PAT and SUPABASE_URL are required for VFS bucket creation');
  }

  try {
    const projectId = getWindowProjectId();
    if (!projectId) {
      throw new Error('Could not determine Supabase project ID');
    }

    // Check if bucket exists first
    try {
      const checkResponse = await fetch(`https://api.supabase.com/v1/storage/buckets/vfs-files`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${SUPABASE_PAT}`,
        },
      });

      if (checkResponse.ok) {
        kernelLog('VFS', '✓ VFS storage bucket already exists');
        return { message: 'Bucket already exists' };
      }
    } catch (e) {
      // Bucket doesn't exist, continue to create
    }

    // Create the bucket
    const response = await fetch(`https://api.supabase.com/v1/storage/buckets`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_PAT}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'vfs-files',
        public: false,
        file_size_limit: 52428800, // 50MB limit
        allowed_mime_types: ['*/*']
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || response.statusText);
    }

    kernelLog('VFS', '✓ VFS storage bucket created');
    return await response.json();
  } catch (e) {
    kernelLog('VFS', `VFS bucket creation failed: ${e.message}`);
    throw e;
  }
}

// ==================== EXPORTS ====================

window.DB = { 
  checkAuthSetup,
  signUp,
  signIn,
  signOut,
  setupDatabase, 
  setupOneUserEnforcement,
  supabase,
  // PGlite for browser-based PostgreSQL access
  pglite,
  initPGlite,
  // Supabase initialization
  initSupabase,
  // State management
  setupStateDatabase,
  checkStateDatabase,
  // VFS management
  setupVFSDatabase,
  createVFSBucket,
  initVFS,
  // Management API functions
  managementApiRequest,
  getProjects,
  getProject,
  getProjectUrl,
  // Debug utilities
  getDebugLogs: () => window.__kernelDebugLogs,
  clearDebugLogs: () => { window.__kernelDebugLogs = []; }
};
