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

interface Doodle {
  id: string;
  image_data: string;
  note_type: 'personal' | 'family';
  author_name: string;
  created_at: string;
}

export default function NotesManager() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [doodles, setDoodles] = useState<Doodle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newNote, setNewNote] = useState('');
  const [noteType, setNoteType] = useState<'personal' | 'family'>('personal');
  const [doodleType, setDoodleType] = useState<'personal' | 'family'>('personal');
  const [isDrawing, setIsDrawing] = useState(false);
  const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null);
  let canvasRef: HTMLCanvasElement | null = null;

  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    try {
      setLoading(true);
      const [notesRes, doodlesRes] = await Promise.all([
        apiService.getNotes(),
        apiService.listDoodles()
      ]);
      if (notesRes.data) {
        setNotes(notesRes.data.notes);
      } else {
        setError(notesRes.error || 'Failed to load notes');
      }
      if (doodlesRes.data) setDoodles(doodlesRes.data.doodles);
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

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!ctx) return;
    setIsDrawing(true);
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !ctx) return;
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => setIsDrawing(false);

  const clearCanvas = () => {
    if (!canvasRef || !ctx) return;
    ctx.clearRect(0, 0, canvasRef.width, canvasRef.height);
  };

  const saveDoodle = async () => {
    if (!canvasRef) return;
    const dataUrl = canvasRef.toDataURL('image/png');
    try {
      const res = await apiService.createDoodle(dataUrl, doodleType);
      if (res.data) {
        // Reload doodles list
        const list = await apiService.listDoodles();
        if (list.data) setDoodles(list.data.doodles);
        clearCanvas();
      } else if (res.error) {
        setError(res.error);
      }
    } catch (err) {
      setError('Failed to save doodle');
    }
  };

  const deleteDoodle = async (id: string) => {
    if (!confirm('Delete this doodle?')) return;
    const res = await apiService.deleteDoodle(id);
    if (!res.error) setDoodles(doodles.filter(d => d.id !== id));
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

      <div className="doodle-section">
        <h3>Add Doodle</h3>
        <div className="note-form">
          <div className="form-group">
            <label>Doodle Type</label>
            <select
              value={doodleType}
              onChange={(e) => setDoodleType(e.target.value as 'personal' | 'family')}
              className="royal-input"
            >
              <option value="personal">Personal</option>
              <option value="family">Family (Everyone sees)</option>
            </select>
          </div>
          <div className="doodle-pad">
            <canvas
              ref={(el) => {
                canvasRef = el;
                if (el && !ctx) {
                  const c = el.getContext('2d');
                  if (c) {
                    c.lineWidth = 2;
                    c.lineCap = 'round';
                    setCtx(c);
                  }
                }
              }}
              width={600}
              height={300}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
            />
          </div>
          <div className="doodle-actions">
            <button className="royal-button secondary" onClick={clearCanvas}>Clear</button>
            <button className="royal-button primary" onClick={saveDoodle}>Save Doodle</button>
          </div>
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
        <div className="notes-section">
          <h3>✏️ Doodles</h3>
          {doodles.length === 0 ? (
            <div className="empty-notes">
              <p>No doodles yet. Draw one above!</p>
            </div>
          ) : (
            <div className="doodles-list">
              {doodles.map(d => (
                <div key={d.id} className={`doodle-card ${d.note_type}`}>
                  <img src={d.image_data} alt="doodle" />
                  <div className="note-meta">
                    <span className="note-author">By {d.author_name}</span>
                    <span className="note-date">{new Date(d.created_at).toLocaleString()}</span>
                    <button className="delete-note-btn" onClick={() => deleteDoodle(d.id)} title="Delete doodle">×</button>
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
