import { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import './NotesManager.css';

interface Note {
  id: string;
  content: string;
  note_type: 'personal' | 'family';
  author_name: string;
  created_at: string;
}

export default function NotesManager() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newNote, setNewNote] = useState('');
  const [noteType, setNoteType] = useState<'personal' | 'family'>('personal');

  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    try {
      setLoading(true);
      const response = await apiService.getNotes();
      if (response.data) {
        setNotes(response.data.notes);
      } else {
        setError(response.error || 'Failed to load notes');
      }
    } catch (err) {
      setError('Failed to load notes');
    } finally {
      setLoading(false);
    }
  };

  const addNote = async () => {
    if (!newNote.trim()) return;

    try {
      const response = await apiService.addNote(newNote.trim(), noteType);
      if (response.data) {
        setNotes([response.data.note, ...notes]);
        setNewNote('');
      } else {
        setError(response.error || 'Failed to add note');
      }
    } catch (err) {
      setError('Failed to add note');
    }
  };

  const deleteNote = async (id: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return;

    try {
      const response = await apiService.deleteNote(id);
      if (response.data || !response.error) {
        setNotes(notes.filter(note => note.id !== id));
      } else {
        setError(response.error || 'Failed to delete note');
      }
    } catch (err) {
      setError('Failed to delete note');
    }
  };

  const personalNotes = notes.filter(note => note.note_type === 'personal');
  const familyNotes = notes.filter(note => note.note_type === 'family');

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading notes...</p>
      </div>
    );
  }

  return (
    <div className="notes-manager">
      <div className="notes-header">
        <h2>Household Notes</h2>
      </div>

      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError('')} className="error-close">×</button>
        </div>
      )}

      <div className="add-note-section">
        <h3>Add New Note</h3>
        <div className="note-form">
          <div className="form-group">
            <label>Note Type</label>
            <select
              value={noteType}
              onChange={(e) => setNoteType(e.target.value as 'personal' | 'family')}
              className="royal-input"
            >
              <option value="personal">Personal Note</option>
              <option value="family">Family Note (Everyone sees)</option>
            </select>
          </div>
          
          <div className="form-group">
            <label>Note Content</label>
            <textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder={`Leave a ${noteType} note...`}
              className="royal-textarea"
              rows={3}
            />
          </div>
          
          <button 
            className="royal-button primary"
            onClick={addNote}
            disabled={!newNote.trim()}
          >
            Add Note
          </button>
        </div>
      </div>

      <div className="notes-sections">
        <div className="notes-section">
          <h3>💭 Personal Notes</h3>
          {personalNotes.length === 0 ? (
            <div className="empty-notes">
              <p>No personal notes yet. Add one above!</p>
            </div>
          ) : (
            <div className="notes-list">
              {personalNotes.map(note => (
                <div key={note.id} className="note-card personal">
                  <div className="note-content">
                    <p>{note.content}</p>
                  </div>
                  <div className="note-meta">
                    <span className="note-author">By {note.author_name}</span>
                    <span className="note-date">
                      {new Date(note.created_at).toLocaleString()}
                    </span>
                    <button 
                      className="delete-note-btn"
                      onClick={() => deleteNote(note.id)}
                      title="Delete note"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="notes-section">
          <h3>📢 Family Notes</h3>
          {familyNotes.length === 0 ? (
            <div className="empty-notes">
              <p>No family notes yet. Add one above!</p>
            </div>
          ) : (
            <div className="notes-list">
              {familyNotes.map(note => (
                <div key={note.id} className="note-card family">
                  <div className="note-content">
                    <p>{note.content}</p>
                  </div>
                  <div className="note-meta">
                    <span className="note-author">By {note.author_name}</span>
                    <span className="note-date">
                      {new Date(note.created_at).toLocaleString()}
                    </span>
                    <button 
                      className="delete-note-btn"
                      onClick={() => deleteNote(note.id)}
                      title="Delete note"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
