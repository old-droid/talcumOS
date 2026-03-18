# TalcumOS

A web-based operating system interface built with Supabase authentication and a virtual file system.

## Current State

### Implemented Features
1. **Authentication System**
   - Email/password authentication via Supabase
   - Sign in and sign up functionality
   - One user enforcement mechanism

2. **File Manager**
   - Directory navigation
   - File creation and deletion
   - File operations (rename, copy, delete)
   - File type detection and viewers for text, images, and videos

3. **Applications**
   - Notes app with state persistence
   - Calculator
   - Camera (simulated)
   - Weather (simulated)
   - Music player
   - Settings
   - Calendar
   - Messages

4. **Virtual File System**
   - Browser-based file storage
   - Directory structure management
   - File metadata tracking

### Issues and Limitations

#### Authentication Issues
1. **Supabase Regional Problems**
   - Authentication fails when Supabase project is in different region (e.g., Tokyo vs AP-1)
   - Error: "Invalid login credentials" even with correct credentials
   - Resolution: Wait for Supabase regional sync or use matching region

2. **Email Verification**
   - If email verification is required, sign-in may fail with misleading error
   - No explicit error message for unverified emails

3. **One User Enforcement**
   - Database trigger may not be properly configured
   - Requires manual setup via Management API

#### Database Issues
1. **Missing Tables**
   - `public.app_state` table not created
   - `public.files` table not created
   - Requires manual setup via setup page

2. **CORS Issues**
   - Loading ES modules from `file://` protocol causes CORS errors
   - Requires HTTP server (localhost:8000) for proper functioning

#### Performance Issues
1. **Springboard Lag**
   - Setup container integration caused lag in main interface
   - Resolved by separating setup into dedicated page

2. **Module Loading**
   - PGlite module import fails due to export format changes
   - Workaround: Commented out PGlite import

### Security Considerations

#### Credential Storage
- **Current**: Credentials stored in `config.js` (hard-coded) and localStorage
- **Risk**: Hard-coded credentials in config.js are visible in source code
- **Improvement**: Setup page now loads from localStorage, hiding credentials by default
- **Toggle**: Visibility toggle added for each credential field

#### Service Key Exposure
- Service key is required for database setup operations
- Should not be exposed in client-side code in production
- Recommendation: Use server-side API for sensitive operations

### Proposed Features

#### 1. Enhanced File Operations
- Add file upload functionality
- Implement drag-and-drop for files
- Add file preview without opening
- Implement search functionality

#### 2. Improved Authentication
- Add password reset functionality
- Implement magic link authentication
- Add session persistence
- Implement biometric authentication (WebAuthn)

#### 3. Application Improvements
- Add text editor with syntax highlighting
- Implement image editor
- Add file compression utility
- Implement system settings (theme, wallpaper)

#### 4. Performance Optimizations
- Implement lazy loading for applications
- Add caching for file operations
- Optimize database queries
- Implement virtual scrolling for large directories

#### 5. User Experience
- Add notification system
- Implement window management (minimize, maximize, arrange)
- Add keyboard shortcuts
- Implement system-wide search

### Technical Issues

#### 1. PGlite Module Import
**Issue**: The PGlite library import fails with "doesn't provide an export named: 'PGlite'"
**Current Workaround**: Commented out PGlite import in springboard.html
**Proposed Solution**: Use correct import path or remove PGlite dependency

#### 2. ES Module Loading
**Issue**: ES modules loaded via script tags may not be available when main script runs
**Current Solution**: Using dynamic imports and waiting for modules to load
**Proposed Improvement**: Use proper module bundling (e.g., Webpack, Vite)

#### 3. Database Table Creation
**Issue**: Database tables must be created manually via Management API
**Current Solution**: Setup page provides buttons to create tables
**Proposed Improvement**: Auto-detect missing tables and prompt for creation

### Setup Instructions

1. **Start HTTP Server**
   ```bash
   cd "C:\Users\maeja\Documents\talcumOS1"
   python -m http.server 8000
   ```

2. **Access Setup Page**
   - URL: `http://localhost:8000/setup.html`
   - Configure Supabase credentials
   - Click "Save Configuration"
   - Setup database tables

3. **Access TalcumOS**
   - URL: `http://localhost:8000/springboard.html`
   - Swipe to unlock
   - Sign in with your credentials

### Files Structure

```
talcumOS1/
├── springboard.html      # Main OS interface
├── setup.html            # Configuration page
├── config.js             # Supabase configuration (loads from localStorage)
├── kernel.js             # Core functionality and auth
├── apps.js               # Application definitions
├── vfs.js                # Virtual file system
├── state-manager.js      # State persistence
├── springboard.css       # Main styles
└── lockscreen-wallpaper.png
```

### Known Bugs

1. **VFS Table Missing**: Files app shows error until VFS database is setup
2. **State Table Missing**: Notes app and layout persistence fail until state database is setup
3. **PGlite Error**: Console shows PGlite import error (non-critical)
4. **Network Errors**: May occur if HTTP server is not running or files are accessed via file:// protocol

### Recommendations

1. **For Development**: Use the setup page for all configuration
2. **For Production**: Move sensitive operations to server-side API
3. **For Security**: Regularly rotate Supabase keys and use environment variables
4. **For Performance**: Consider using a proper build system for JavaScript modules
