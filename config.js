window.__configDebugLogs = [];
configLog('CONFIG', 'config.js loading...');

// Try to load config from localStorage first
const savedConfig = localStorage.getItem('talcumos_config');
let envConfig = {};

if (savedConfig) {
    try {
        envConfig = JSON.parse(savedConfig);
        configLog('CONFIG', 'Loaded configuration from localStorage');
    } catch (e) {
        configLog('CONFIG', 'Failed to parse saved config, using defaults');
    }
}

// Merge with hard-coded defaults (only if not in localStorage)
window.__env = {
  SUPABASE_URL: envConfig.SUPABASE_URL || '',
  SUPABASE_ANON_KEY: envConfig.SUPABASE_ANON_KEY || '',
  SUPABASE_SERVICE_KEY: envConfig.SUPABASE_SERVICE_KEY || '',
  SUPABASE_PAT: envConfig.SUPABASE_PAT || ''
};

configLog('CONFIG', '✓ Supabase configuration loaded');
configLog('CONFIG', `SUPABASE_URL: ${window.__env.SUPABASE_URL ? '✓ Set' : '✗ Missing'}`);
configLog('CONFIG', `SUPABASE_ANON_KEY: ${window.__env.SUPABASE_ANON_KEY ? '✓ Set' : '✗ Missing'}`);
configLog('CONFIG', '✓ config.js fully loaded and ready');
