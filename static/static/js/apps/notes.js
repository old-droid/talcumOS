// Notes JavaScript
document.addEventListener('DOMContentLoaded', function() {
    const notesList = document.getElementById('notes-list');
    const newNoteBtn = document.getElementById('new-note-btn');
    const noteEditor = document.getElementById('note-editor');
    const noteContent = document.getElementById('note-content');
    const noteIdInput = document.getElementById('note-id');
    const cancelEditBtn = document.getElementById('cancel-edit-btn');
    const saveNoteBtn = document.getElementById('save-note-btn');
    
    let editingNoteId = null;
    
    // Load notes on startup
    loadNotes();
    
    // Event listeners
    newNoteBtn.addEventListener('click', () => {
        showNoteEditor('', null);
    });
    
    cancelEditBtn.addEventListener('click', hideNoteEditor);
    
    saveNoteBtn.addEventListener('click', saveNote);
    
    // Load notes from server
    function loadNotes() {
        fetch('/api/notes')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to load notes');
                }
                return response.json();
            })
            .then(notes => {
                renderNotes(notes);
            })
            .catch(error => {
                console.error('Error loading notes:', error);
                notesList.innerHTML = '<div class="empty-state"><div class="empty-state-icon">Note</div><div class="empty-state-title">Unable to load notes</div><div class="empty-state-description">Please try again later.</div></div>';
            });
    }
    
    // Render notes list
    function renderNotes(notes) {
        if (notes.length === 0) {
            notesList.innerHTML = '<div class="empty-state"><div class="empty-state-icon">Note</div><div class="empty-state-title">No notes yet</div><div class="empty-state-description">Tap the + button to create your first note.</div></div>';
            return;
        }
        
        notesList.innerHTML = '';
        
        notes.forEach(note => {
            const noteItem = document.createElement('div');
            noteItem.className = 'note-item';
            
            // Format date
            const date = new Date(parseInt(note.id));
            const formattedDate = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) + ' ' + date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
            
            noteItem.innerHTML = `
                <div class="note-header">
                    <div class="note-title">${escapeHtml(note.content.substring(0, 50))}${note.content.length > 50 ? '...' : ''}</div>
                    <div class="note-date">${formattedDate}</div>
                </div>
                <div class="note-content">${escapeHtml(note.content)}</div>
                <div class="note-footer">
                    <button class="note-action-btn edit" data-id="${note.id}">Edit</button>
                    <button class="note-action-btn delete" data-id="${note.id}">Delete</button>
                </div>
            `;
            
            notesList.appendChild(noteItem);
        });
        
        // Add event listeners to edit/delete buttons
        document.querySelectorAll('.note-action-btn.edit').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.dataset.id;
                editNote(id);
            });
        });
        
        document.querySelectorAll('.note-action-btn.delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.dataset.id;
                deleteNote(id);
            });
        });
    }
    
    // Show note editor
    function showNoteEditor(content, id) {
        noteContent.value = content || '';
        noteIdInput.value = id || '';
        editingNoteId = id || null;
        noteEditor.style.display = 'block';
        noteContent.focus();
    }
    
    // Hide note editor
    function hideNoteEditor() {
        noteEditor.style.display = 'none';
        noteContent.value = '';
        noteIdInput.value = '';
        editingNoteId = null;
    }
    
    // Save note
    function saveNote() {
        const content = noteContent.value.trim();
        if (content === '') {
            alert('Note cannot be empty');
            return;
        }
        
        const noteData = { content: content };
        
        if (editingNoteId) {
            // Update existing note
            fetch(`/api/notes/${editingNoteId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(noteData)
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to update note');
                }
                return response.json();
            })
            .then(() => {
                hideNoteEditor();
                loadNotes();
            })
            .catch(error => {
                console.error('Error updating note:', error);
                alert('Failed to update note');
            });
        } else {
            // Create new note
            fetch('/api/notes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(noteData)
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to create note');
                }
                return response.json();
            })
            .then(() => {
                hideNoteEditor();
                loadNotes();
            })
            .catch(error => {
                console.error('Error creating note:', error);
                alert('Failed to create note');
            });
        }
    }
    
    // Edit note
    function editNote(id) {
        // In a real app, we would fetch the note content first
        // For simplicity, we'll just show the editor and let user retype
        // A better implementation would fetch the note via GET /api/notes/{id}
        showNoteEditor('', id);
    }
    
    // Delete note
    function deleteNote(id) {
        if (!confirm('Are you sure you want to delete this note?')) {
            return;
        }
        
        fetch(`/api/notes/${id}`, {
            method: 'DELETE'
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to delete note');
            }
            return response.json();
        })
        .then(() => {
            loadNotes();
        })
        .catch(error => {
            console.error('Error deleting note:', error);
            alert('Failed to delete note');
        });
    }
    
    // Escape HTML to prevent XSS
    function escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        
        return text.replace(/[&<>"']/g, m => map[m]);
    }
});