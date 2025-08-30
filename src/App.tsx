import { useEffect, useMemo, useState } from 'react'
import './index.css'

type Item = {
  id: string
  name: string
  location: 'fridge' | 'pantry'
  quantity: number
  lowThreshold: number
}

type Note = {
  id: string
  text: string
  timestamp: number
  author: string
}

function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key)
      return raw ? (JSON.parse(raw) as T) : initialValue
    } catch {
      return initialValue
    }
  })
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {}
  }, [key, value])
  return [value, setValue] as const
}

function HeartDivider() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '16px 0' }}>
      <span style={{ flex: 1, height: 1, background: '#f9a8d4' }} />
      <span style={{ fontSize: 18, color: '#ec4899' }}>❤</span>
      <span style={{ flex: 1, height: 1, background: '#f9a8d4' }} />
    </div>
  )
}

function App() {
  const [household, setHousehold] = useLocalStorage<string>('household', '')
  const [items, setItems] = useLocalStorage<Item[]>(`items:${household || 'default'}`, [])
  const [filter, setFilter] = useState<'all' | 'fridge' | 'pantry'>('all')
  const [query, setQuery] = useState('')

  const [form, setForm] = useState({ name: '', location: 'fridge' as 'fridge' | 'pantry', quantity: 1, lowThreshold: 1 })
  
  // Notes state
  const [globalNotes, setGlobalNotes] = useLocalStorage<Note[]>('globalNotes', [])
  const [individualNotes, setIndividualNotes] = useLocalStorage<Note[]>(`notes:${household || 'default'}`, [])
  const [newGlobalNote, setNewGlobalNote] = useState('')
  const [newIndividualNote, setNewIndividualNote] = useState('')

  useEffect(() => {
    // Reset items binding when household changes
    setItems([])
  }, [household])

  const filtered = useMemo(() => {
    return items
      .filter((it) => (filter === 'all' ? true : it.location === filter))
      .filter((it) => it.name.toLowerCase().includes(query.toLowerCase()))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [items, filter, query])

  function addItem() {
    if (!form.name.trim()) return
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`
    setItems([
      ...items,
      { id, name: form.name.trim(), location: form.location, quantity: Math.max(0, form.quantity), lowThreshold: Math.max(0, form.lowThreshold) },
    ])
    setForm({ name: '', location: form.location, quantity: 1, lowThreshold: form.lowThreshold })
  }

  function updateQty(id: string, delta: number) {
    setItems(items.map((it) => (it.id === id ? { ...it, quantity: Math.max(0, it.quantity + delta) } : it)))
  }

  function removeItem(id: string) {
    setItems(items.filter((it) => it.id !== id))
  }

  function addGlobalNote() {
    if (!newGlobalNote.trim() || !household) return
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`
    setGlobalNotes([...globalNotes, { id, text: newGlobalNote.trim(), timestamp: Date.now(), author: household }])
    setNewGlobalNote('')
  }

  function addIndividualNote() {
    if (!newIndividualNote.trim() || !household) return
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`
    setIndividualNotes([...individualNotes, { id, text: newIndividualNote.trim(), timestamp: Date.now(), author: household }])
    setNewIndividualNote('')
  }

  function removeGlobalNote(id: string) {
    setGlobalNotes(globalNotes.filter(note => note.id !== id))
  }

  function removeIndividualNote(id: string) {
    setIndividualNotes(individualNotes.filter(note => note.id !== id))
  }

  function badge(it: Item) {
    if (it.quantity === 0) return <span className="pill badge-red">Out</span>
    if (it.quantity <= it.lowThreshold) return <span className="pill badge-yellow">Low</span>
    return <span className="pill badge-green">OK</span>
  }

  return (
    <div className="royal-bg" style={{ minHeight: '100%' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24 }}>
          {/* Main Content */}
          <div>
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '12px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="crown" style={{ fontSize: 28 }}>👑</span>
            <h1 className="royal-title" style={{ margin: 0 }}>Royal Pantry & Fridge</h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <select
              value={household}
              onChange={(e) => setHousehold(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: 12, border: '2px solid #f9a8d4', width: 160, background: 'white' }}
            >
              <option value="">Select Household</option>
              <option value="House">🏠 House (Whole Family)</option>
              <option value="Dream">💫 Dream</option>
              <option value="Lala">🌟 Lala</option>
              <option value="Jocelyn">✨ Jocelyn</option>
              <option value="Angel">👼 Angel</option>
            </select>
          </div>
        </header>

        <div className="royal-card" style={{ padding: 16 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <input
              placeholder="Add item name (e.g., Milk)"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              style={{ flex: 1, minWidth: 160, padding: '10px 12px', border: '2px solid #f9a8d4', borderRadius: 12 }}
            />
            <select
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value as 'fridge' | 'pantry' })}
              style={{ padding: '10px 12px', border: '2px solid #f9a8d4', borderRadius: 12 }}
            >
              <option value="fridge">Fridge</option>
              <option value="pantry">Pantry</option>
            </select>
            <input
              type="number"
              min={0}
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })}
              style={{ width: 90, padding: '10px 12px', border: '2px solid #f9a8d4', borderRadius: 12 }}
            />
            <input
              type="number"
              min={0}
              value={form.lowThreshold}
              onChange={(e) => setForm({ ...form, lowThreshold: Number(e.target.value) })}
              style={{ width: 110, padding: '10px 12px', border: '2px solid #f9a8d4', borderRadius: 12 }}
            />
            <button className="royal-button" onClick={addItem}>Add ❤</button>
          </div>
          <div style={{ marginTop: 12, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <input
              placeholder="Search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{ flex: 1, minWidth: 160, padding: '10px 12px', border: '2px solid #f9a8d4', borderRadius: 12 }}
            />
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="royal-button" onClick={() => setFilter('all')} style={{ opacity: filter === 'all' ? 1 : 0.6 }}>All</button>
              <button className="royal-button" onClick={() => setFilter('fridge')} style={{ opacity: filter === 'fridge' ? 1 : 0.6 }}>Fridge</button>
              <button className="royal-button" onClick={() => setFilter('pantry')} style={{ opacity: filter === 'pantry' ? 1 : 0.6 }}>Pantry</button>
            </div>
          </div>
        </div>



        {/* Individual Notes Section - Only Visible to Selected Household */}
        {household && (
          <div className="royal-card" style={{ padding: 16, marginTop: 16 }}>
            <h3 style={{ margin: '0 0 12px 0', color: '#9d174d', display: 'flex', alignItems: 'center', gap: 8 }}>
              💭 <span>Personal Notes (Just for {household})</span>
            </h3>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <input
                placeholder={`Leave a personal note for ${household}...`}
                value={newIndividualNote}
                onChange={(e) => setNewIndividualNote(e.target.value)}
                style={{ flex: 1, padding: '10px 12px', border: '2px solid #f9a8d4', borderRadius: 12 }}
              />
              <button className="royal-button" onClick={addIndividualNote}>Add Note</button>
            </div>
            <div style={{ display: 'grid', gap: 8 }}>
              {individualNotes.map((note) => (
                <div key={note.id} className="royal-card" style={{ padding: 12, background: '#f0f9ff', border: '1px solid #bae6fd' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, color: '#0c4a6e', marginBottom: 4 }}>From: {note.author}</div>
                      <div style={{ color: '#374151' }}>{note.text}</div>
                      <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
                        {new Date(note.timestamp).toLocaleString()}
                      </div>
                    </div>
                    <button 
                      onClick={() => removeIndividualNote(note.id)}
                      style={{ background: '#ef4444', color: 'white', border: 'none', padding: '4px 8px', borderRadius: 6, fontSize: 12 }}
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
              {individualNotes.length === 0 && (
                <div style={{ textAlign: 'center', padding: 16, color: '#6b7280', fontSize: 14 }}>
                  No personal notes yet. Leave the first one! 💭
                </div>
                )}
            </div>
          </div>
        )}

        <HeartDivider />

        <div style={{ display: 'grid', gap: 12 }}>
          {filtered.map((it) => (
            <div key={it.id} className="royal-card" style={{ padding: 12, display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 20 }}>👑</span>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <strong style={{ color: '#9d174d' }}>{it.name}</strong>
                    {badge(it)}
                  </div>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>{it.location === 'fridge' ? 'Fridge' : 'Pantry'}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button className="royal-button" onClick={() => updateQty(it.id, -1)}>-</button>
                <div className="pill" style={{ background: '#fce7f3', minWidth: 40, textAlign: 'center' }}>{it.quantity}</div>
                <button className="royal-button" onClick={() => updateQty(it.id, +1)}>+</button>
                <button className="royal-button" onClick={() => removeItem(it.id)} style={{ background: '#ef4444' }}>Remove</button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="royal-card" style={{ padding: 16, textAlign: 'center' }}>
              <span>No items yet. Add your first royal grocery 👑❤</span>
            </div>
          )}
        </div>

        <footer style={{ textAlign: 'center', padding: 16, color: '#9d174d' }}>Made with ❤ for the royal household</footer>
          </div>

          {/* Family Notes Sidebar */}
          <div style={{ position: 'sticky', top: 16, height: 'fit-content' }}>
            <div className="royal-card" style={{ padding: 16, minHeight: '400px' }}>
              <h3 style={{ 
                margin: '0 0 16px 0', 
                color: '#9d174d', 
                fontSize: '18px',
                textAlign: 'center'
              }}>
                📢 Family Notes (Everyone Sees)
              </h3>
              
              <div style={{ marginBottom: '16px' }}>
                <textarea
                  placeholder="Leave a note for the whole family..."
                  value={newGlobalNote}
                  onChange={(e) => setNewGlobalNote(e.target.value)}
                  style={{
                    width: '100%',
                    minHeight: '80px',
                    padding: '12px',
                    border: '2px solid #f9a8d4',
                    borderRadius: '12px',
                    background: 'white',
                    fontSize: '14px',
                    resize: 'vertical'
                  }}
                />
                <button 
                  className="royal-button" 
                  onClick={addGlobalNote} 
                  disabled={!household}
                  style={{ 
                    width: '100%', 
                    marginTop: '8px'
                  }}
                >
                  Add Note
                </button>
              </div>

              <div style={{ display: 'grid', gap: '12px' }}>
                {globalNotes.map((note) => (
                  <div 
                    key={note.id} 
                    style={{ 
                      padding: '12px',
                      background: '#fef3f2',
                      border: '1px solid #fecaca',
                      borderRadius: '12px'
                    }}
                  >
                    <div style={{ 
                      fontSize: '12px', 
                      color: '#7f1d1d', 
                      marginBottom: '4px',
                      fontWeight: 'bold'
                    }}>
                      From: {note.author}
                    </div>
                    <div style={{ 
                      color: '#374151',
                      fontSize: '13px',
                      lineHeight: '1.4',
                      marginBottom: '6px'
                    }}>
                      {note.text}
                    </div>
                    <div style={{ 
                      fontSize: '11px', 
                      color: '#6b7280',
                      fontStyle: 'italic'
                    }}>
                      {new Date(note.timestamp).toLocaleString()}
                    </div>
                    <button 
                      onClick={() => removeGlobalNote(note.id)}
                      style={{ 
                        background: '#ef4444', 
                        color: 'white', 
                        border: 'none', 
                        padding: '4px 8px', 
                        borderRadius: '6px', 
                        fontSize: '11px',
                        marginTop: '6px',
                        cursor: 'pointer'
                      }}
                    >
                      Remove
                    </button>
                  </div>
                ))}
                {globalNotes.length === 0 && (
                  <div style={{ 
                    textAlign: 'center', 
                    padding: '20px', 
                    color: '#6b7280', 
                    fontSize: '14px',
                    fontStyle: 'italic'
                  }}>
                    No family notes yet. Leave the first one! 📝
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
