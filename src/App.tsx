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

type InviteCode = {
  id: string
  code: string
  name: string
  createdAt: number
  isActive: boolean
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
  
  // Invite code system
  const [inviteCode, setInviteCode] = useLocalStorage<string>('inviteCode', '')
  const [isFriendMode, setIsFriendMode] = useState(false)
  const [inviteCodes, setInviteCodes] = useLocalStorage<InviteCode[]>('inviteCodes', [])
  const [newInviteCodeName, setNewInviteCodeName] = useState('')

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

  function generateInviteCode() {
    if (!newInviteCodeName.trim()) return
    const code = Math.random().toString(36).substring(2, 8).toUpperCase()
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`
    setInviteCodes([...inviteCodes, { id, code, name: newInviteCodeName.trim(), createdAt: Date.now(), isActive: true }])
    setNewInviteCodeName('')
  }

  function deactivateInviteCode(id: string) {
    setInviteCodes(inviteCodes.map(ic => ic.id === id ? { ...ic, isActive: false } : ic))
  }

  function activateInviteCode(id: string) {
    setInviteCodes(inviteCodes.map(ic => ic.id === id ? { ...ic, isActive: true } : ic))
  }

  function useInviteCode(code: string) {
    const foundCode = inviteCodes.find(ic => ic.code === code && ic.isActive)
    if (foundCode) {
      setInviteCode(code)
      setIsFriendMode(true)
      setHousehold('') // Clear household to start fresh
      return true
    }
    return false
  }

  function exitFriendMode() {
    setIsFriendMode(false)
    setInviteCode('')
    setHousehold('')
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
            {!isFriendMode ? (
              <>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <label style={{ fontSize: '11px', color: '#9d174d', marginBottom: '2px', fontWeight: 'bold' }}>
                    Select Household
                  </label>
                  <select
                    value={household}
                    onChange={(e) => setHousehold(e.target.value)}
                    style={{ padding: '8px 12px', borderRadius: 12, border: '2px solid #f9a8d4', width: 160, background: 'white' }}
                  >
                    <option value="">Choose your household</option>
                    <option value="House">🏠 House (Whole Family)</option>
                    <option value="Dream">💫 Dream</option>
                    <option value="Lala">🌟 Lala</option>
                    <option value="Jocelyn">✨ Jocelyn</option>
                    <option value="Angel">👼 Angel</option>
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <label style={{ fontSize: '11px', color: '#9d174d', marginBottom: '2px', fontWeight: 'bold' }}>
                    Invite Code
                  </label>
                  <input
                    placeholder="Enter friend's code"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    style={{ padding: '8px 12px', borderRadius: 12, border: '2px solid #f9a8d4', width: 140 }}
                  />
                </div>
                <button 
                  className="royal-button" 
                  onClick={() => useInviteCode(inviteCode)}
                  style={{ padding: '8px 12px', fontSize: '12px', marginTop: '18px' }}
                >
                  Use Code
                </button>
              </>
            ) : (
              <>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <label style={{ fontSize: '11px', color: '#9d174d', marginBottom: '2px', fontWeight: 'bold' }}>
                    Your Household Name
                  </label>
                  <input
                    placeholder="Enter your household name"
                    value={household}
                    onChange={(e) => setHousehold(e.target.value)}
                    style={{ padding: '8px 12px', borderRadius: 12, border: '2px solid #f9a8d4', width: 160, background: 'white' }}
                  />
                </div>
                <button 
                  className="royal-button" 
                  onClick={exitFriendMode}
                  style={{ padding: '8px 12px', fontSize: '12px', background: '#6b7280', marginTop: '18px' }}
                >
                  Exit Friend Mode
                </button>
              </>
            )}
          </div>
        </header>

        <div className="royal-card" style={{ padding: 16 }}>
          <div style={{ marginBottom: 16, padding: 12, background: '#fef3f2', border: '1px solid #fecaca', borderRadius: 12 }}>
            <h4 style={{ margin: '0 0 8px 0', color: '#9d174d', fontSize: '14px', display: 'flex', alignItems: 'center', gap: 6 }}>
              💡 <span>Quick Guide</span>
            </h4>
            <p style={{ margin: 0, fontSize: '12px', color: '#7f1d1d', lineHeight: '1.4' }}>
              Add items to track your groceries! Choose the location (fridge or pantry), set quantity, and add a low alert threshold. 
              Use the search and filter options below to find items quickly.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 160 }}>
              <label style={{ fontSize: '12px', color: '#9d174d', marginBottom: '4px', fontWeight: 'bold' }}>
                Item Name
              </label>
              <input
                placeholder="Add item name (e.g., Milk)"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                style={{ padding: '10px 12px', border: '2px solid #f9a8d4', borderRadius: 12 }}
              />
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <label style={{ fontSize: '12px', color: '#9d174d', marginBottom: '4px', fontWeight: 'bold' }}>
                Location
              </label>
              <select
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value as 'fridge' | 'pantry' })}
                style={{ padding: '10px 12px', border: '2px solid #f9a8d4', borderRadius: 12 }}
              >
                <option value="fridge">Fridge</option>
                <option value="pantry">Pantry</option>
              </select>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <label style={{ fontSize: '12px', color: '#9d174d', marginBottom: '4px', fontWeight: 'bold' }}>
                Quantity
              </label>
              <input
                type="number"
                min={0}
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })}
                style={{ width: 90, padding: '10px 12px', border: '2px solid #f9a8d4', borderRadius: 12 }}
                title="How many of this item do you have?"
              />
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <label style={{ fontSize: '12px', color: '#9d174d', marginBottom: '4px', fontWeight: 'bold' }}>
                Low Alert
              </label>
              <input
                type="number"
                min={0}
                value={form.lowThreshold}
                onChange={(e) => setForm({ ...form, lowThreshold: Number(e.target.value) })}
                style={{ width: 110, padding: '10px 12px', border: '2px solid #f9a8d4', borderRadius: 12 }}
                title="Alert when quantity drops to this number"
              />
            </div>
            
            <button 
              className="royal-button" 
              onClick={addItem}
              disabled={!form.name.trim()}
              style={{ 
                opacity: !form.name.trim() ? 0.6 : 1,
                cursor: !form.name.trim() ? 'not-allowed' : 'pointer'
              }}
              title={!form.name.trim() ? 'Please enter an item name first' : 'Add this item to your inventory'}
            >
              Add ❤
            </button>
          </div>
          <div style={{ marginTop: 16, display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 160 }}>
              <label style={{ fontSize: '12px', color: '#9d174d', marginBottom: '4px', fontWeight: 'bold' }}>
                Search Items
              </label>
              <input
                placeholder="Search by item name..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                style={{ padding: '10px 12px', border: '2px solid #f9a8d4', borderRadius: 12 }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <label style={{ fontSize: '12px', color: '#9d174d', marginBottom: '4px', fontWeight: 'bold' }}>
                Filter by Location
              </label>
              <div style={{ display: 'flex', gap: 6 }}>
                <button className="royal-button" onClick={() => setFilter('all')} style={{ opacity: filter === 'all' ? 1 : 0.6 }}>All</button>
                <button className="royal-button" onClick={() => setFilter('fridge')} style={{ opacity: filter === 'fridge' ? 1 : 0.6 }}>Fridge</button>
                <button className="royal-button" onClick={() => setFilter('pantry')} style={{ opacity: filter === 'pantry' ? 1 : 0.6 }}>Pantry</button>
              </div>
            </div>
          </div>
        </div>



        {/* Individual Notes Section - Only Visible to Selected Household */}
        {household && (
          <div className="royal-card" style={{ padding: 16, marginTop: 16 }}>
            <h3 style={{ margin: '0 0 12px 0', color: '#9d174d', display: 'flex', alignItems: 'center', gap: 8 }}>
              💭 <span>Personal Notes (Just for {household})</span>
            </h3>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: '12px', color: '#9d174d', marginBottom: '4px', fontWeight: 'bold', display: 'block' }}>
                Add Personal Note
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  placeholder={`Leave a personal note for ${household}...`}
                  value={newIndividualNote}
                  onChange={(e) => setNewIndividualNote(e.target.value)}
                  style={{ flex: 1, padding: '10px 12px', border: '2px solid #f9a8d4', borderRadius: 12 }}
                />
                <button 
                  className="royal-button" 
                  onClick={addIndividualNote}
                  disabled={!newIndividualNote.trim()}
                  style={{ 
                    opacity: !newIndividualNote.trim() ? 0.6 : 1,
                    cursor: !newIndividualNote.trim() ? 'not-allowed' : 'pointer'
                  }}
                  title={!newIndividualNote.trim() ? 'Please enter a note first' : 'Add this personal note'}
                >
                  Add Note
                </button>
              </div>
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
                <button 
                  className="royal-button" 
                  onClick={() => updateQty(it.id, -1)}
                  title="Decrease quantity by 1"
                  style={{ minWidth: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  -
                </button>
                <div 
                  className="pill" 
                  style={{ 
                    background: '#fce7f3', 
                    minWidth: 40, 
                    textAlign: 'center',
                    padding: '6px 8px',
                    fontWeight: 'bold',
                    color: '#9d174d'
                  }}
                  title={`Current quantity: ${it.quantity}`}
                >
                  {it.quantity}
                </div>
                <button 
                  className="royal-button" 
                  onClick={() => updateQty(it.id, +1)}
                  title="Increase quantity by 1"
                  style={{ minWidth: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  +
                </button>
                <button 
                  className="royal-button" 
                  onClick={() => removeItem(it.id)} 
                  style={{ background: '#ef4444' }}
                  title="Remove this item completely"
                >
                  Remove
                </button>
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

          {/* Family Notes & Invite Codes Sidebar */}
          <div style={{ position: 'sticky', top: 16, height: 'fit-content' }}>
            {/* Invite Code Management */}
            {!isFriendMode && (
              <div className="royal-card" style={{ padding: 16, marginBottom: 16 }}>
                <h3 style={{ 
                  margin: '0 0 16px 0', 
                  color: '#9d174d', 
                  fontSize: '18px',
                  textAlign: 'center'
                }}>
                  🔑 Invite Code Manager
                </h3>
                
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ fontSize: '12px', color: '#9d174d', marginBottom: '4px', fontWeight: 'bold', display: 'block' }}>
                    Create New Invite Code
                  </label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      placeholder="Enter friend's name"
                      value={newInviteCodeName}
                      onChange={(e) => setNewInviteCodeName(e.target.value)}
                      style={{ flex: 1, padding: '8px 12px', border: '2px solid #f9a8d4', borderRadius: '8px' }}
                    />
                    <button 
                      className="royal-button" 
                      onClick={generateInviteCode}
                      disabled={!newInviteCodeName.trim()}
                      style={{ 
                        padding: '8px 12px', 
                        fontSize: '12px',
                        opacity: !newInviteCodeName.trim() ? 0.6 : 1,
                        cursor: !newInviteCodeName.trim() ? 'not-allowed' : 'pointer'
                      }}
                      title={!newInviteCodeName.trim() ? 'Please enter a friend\'s name first' : 'Generate invite code for this friend'}
                    >
                      Generate
                    </button>
                  </div>
                </div>

                <div style={{ display: 'grid', gap: '8px' }}>
                  {inviteCodes.map((ic) => (
                    <div 
                      key={ic.id} 
                      style={{ 
                        padding: '10px',
                        background: ic.isActive ? '#f0f9ff' : '#f3f4f6',
                        border: `1px solid ${ic.isActive ? '#bae6fd' : '#d1d5db'}`,
                        borderRadius: '8px',
                        opacity: ic.isActive ? 1 : 0.6
                      }}
                    >
                      <div style={{ 
                        fontSize: '12px', 
                        color: '#0c4a6e', 
                        marginBottom: '4px',
                        fontWeight: 'bold'
                      }}>
                        {ic.name}
                      </div>
                      <div style={{ 
                        color: '#374151',
                        fontSize: '14px',
                        fontFamily: 'monospace',
                        fontWeight: 'bold',
                        marginBottom: '6px'
                      }}>
                        Code: {ic.code}
                      </div>
                      <div style={{ 
                        fontSize: '11px', 
                        color: '#6b7280'
                      }}>
                        Created: {new Date(ic.createdAt).toLocaleDateString()}
                      </div>
                      <div style={{ display: 'flex', gap: '4px', marginTop: '6px' }}>
                        {ic.isActive ? (
                          <button 
                            onClick={() => deactivateInviteCode(ic.id)}
                            style={{ 
                              background: '#f59e0b', 
                              color: 'white', 
                              border: 'none', 
                              padding: '4px 8px', 
                              borderRadius: '4px', 
                              fontSize: '10px',
                              cursor: 'pointer'
                            }}
                          >
                            Deactivate
                          </button>
                        ) : (
                          <button 
                            onClick={() => activateInviteCode(ic.id)}
                            style={{ 
                              background: '#10b981', 
                              color: 'white', 
                              border: 'none', 
                              padding: '4px 8px', 
                              borderRadius: '4px', 
                              fontSize: '10px',
                              cursor: 'pointer'
                            }}
                          >
                            Activate
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  {inviteCodes.length === 0 && (
                    <div style={{ 
                      textAlign: 'center', 
                      padding: '16px', 
                      color: '#6b7280', 
                      fontSize: '14px',
                      fontStyle: 'italic'
                    }}>
                      No invite codes yet. Generate one for a friend! 🔑
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Family Notes */}
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
                <label style={{ fontSize: '12px', color: '#9d174d', marginBottom: '4px', fontWeight: 'bold', display: 'block' }}>
                  Add Family Note
                </label>
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
                  disabled={!household || !newGlobalNote.trim()}
                  style={{ 
                    width: '100%', 
                    marginTop: '8px',
                    opacity: (!household || !newGlobalNote.trim()) ? 0.6 : 1,
                    cursor: (!household || !newGlobalNote.trim()) ? 'not-allowed' : 'pointer'
                  }}
                  title={!household ? 'Please select a household first' : !newGlobalNote.trim() ? 'Please enter a note first' : 'Add this family note'}
                >
                  Add Family Note
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
