import { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import './GroceryManager.css';

interface GroceryItem {
  id: string;
  name: string;
  location: 'fridge' | 'pantry';
  quantity: number;
  low_threshold: number;
  created_by_name?: string;
  created_at: string;
  updated_at: string;
}

export default function GroceryManager() {
  const [items, setItems] = useState<GroceryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'fridge' | 'pantry'>('all');
  const [query, setQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState({
    name: '',
    location: 'fridge' as 'fridge' | 'pantry',
    quantity: 1,
    lowThreshold: 1
  });

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      setLoading(true);
      const response = await apiService.getGroceries();
      if (response.data) {
        setItems(response.data.items);
      } else {
        setError(response.error || 'Failed to load items');
      }
    } catch (err) {
      setError('Failed to load items');
    } finally {
      setLoading(false);
    }
  };

  const addItem = async () => {
    if (!form.name.trim()) return;

    try {
      const response = await apiService.addGrocery({
        name: form.name.trim(),
        location: form.location,
        quantity: Math.max(0, form.quantity),
        lowThreshold: Math.max(0, form.lowThreshold)
      });

      if (response.data) {
        setItems([...items, response.data.item]);
        setForm({ name: '', location: form.location, quantity: 1, lowThreshold: form.lowThreshold });
        setShowAddForm(false);
      } else {
        setError(response.error || 'Failed to add item');
      }
    } catch (err) {
      setError('Failed to add item');
    }
  };

  const updateQuantity = async (id: string, delta: number) => {
    try {
      const response = await apiService.updateGroceryQuantity(id, delta);
      if (response.data) {
        setItems(items.map(item => 
          item.id === id ? response.data!.item : item
        ));
      } else {
        setError(response.error || 'Failed to update quantity');
      }
    } catch (err) {
      setError('Failed to update quantity');
    }
  };

  const deleteItem = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      const response = await apiService.deleteGrocery(id);
      if (response.data || !response.error) {
        setItems(items.filter(item => item.id !== id));
      } else {
        setError(response.error || 'Failed to delete item');
      }
    } catch (err) {
      setError('Failed to delete item');
    }
  };

  const filteredItems = items
    .filter(item => filter === 'all' ? true : item.location === filter)
    .filter(item => item.name.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name));

  const getBadge = (item: GroceryItem) => {
    if (item.quantity === 0) return <span className="badge badge-red">Out</span>;
    if (item.quantity <= item.low_threshold) return <span className="badge badge-yellow">Low</span>;
    return <span className="badge badge-green">OK</span>;
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading groceries...</p>
      </div>
    );
  }

  return (
    <div className="grocery-manager">
      <div className="grocery-header">
        <h2>Grocery Inventory</h2>
        <button 
          className="royal-button primary"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? 'Cancel' : 'Add Item'}
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError('')} className="error-close">×</button>
        </div>
      )}

      {showAddForm && (
        <div className="add-form">
          <h3>Add New Item</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Item Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({...form, name: e.target.value})}
                placeholder="e.g., Milk, Bread, Apples"
                className="royal-input"
              />
            </div>
            
            <div className="form-group">
              <label>Location</label>
              <select
                value={form.location}
                onChange={(e) => setForm({...form, location: e.target.value as 'fridge' | 'pantry'})}
                className="royal-input"
              >
                <option value="fridge">Fridge</option>
                <option value="pantry">Pantry</option>
              </select>
            </div>
            
            <div className="form-group">
              <label>Quantity</label>
              <input
                type="number"
                min="0"
                value={form.quantity}
                onChange={(e) => setForm({...form, quantity: Number(e.target.value)})}
                className="royal-input"
              />
            </div>
            
            <div className="form-group">
              <label>Low Alert</label>
              <input
                type="number"
                min="0"
                value={form.lowThreshold}
                onChange={(e) => setForm({...form, lowThreshold: Number(e.target.value)})}
                className="royal-input"
                title="Alert when quantity drops to this number"
              />
            </div>
          </div>
          
          <button 
            className="royal-button primary"
            onClick={addItem}
            disabled={!form.name.trim()}
          >
            Add Item
          </button>
        </div>
      )}

      <div className="search-filters">
        <div className="search-group">
          <label>Search Items</label>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name..."
            className="royal-input"
          />
        </div>
        
        <div className="filter-group">
          <label>Filter by Location</label>
          <div className="filter-buttons">
            <button 
              className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All
            </button>
            <button 
              className={`filter-btn ${filter === 'fridge' ? 'active' : ''}`}
              onClick={() => setFilter('fridge')}
            >
              Fridge
            </button>
            <button 
              className={`filter-btn ${filter === 'pantry' ? 'active' : ''}`}
              onClick={() => setFilter('pantry')}
            >
              Pantry
            </button>
          </div>
        </div>
      </div>

      <div className="items-list">
        {filteredItems.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">🛒</span>
            <h3>No items found</h3>
            <p>
              {query ? 'Try adjusting your search terms' : 'Add your first grocery item to get started'}
            </p>
          </div>
        ) : (
          filteredItems.map(item => (
            <div key={item.id} className="item-card">
              <div className="item-info">
                <div className="item-header">
                  <h4 className="item-name">{item.name}</h4>
                  {getBadge(item)}
                </div>
                <p className="item-location">
                  {item.location === 'fridge' ? 'Fridge' : 'Pantry'}
                </p>
                {item.created_by_name && (
                  <p className="item-author">Added by {item.created_by_name}</p>
                )}
              </div>
              
              <div className="item-controls">
                <div className="quantity-controls">
                  <button 
                    className="qty-btn"
                    onClick={() => updateQuantity(item.id, -1)}
                    title="Decrease quantity"
                  >
                    -
                  </button>
                  <span className="quantity">{item.quantity}</span>
                  <button 
                    className="qty-btn"
                    onClick={() => updateQuantity(item.id, 1)}
                    title="Increase quantity"
                  >
                    +
                  </button>
                </div>
                
                <button 
                  className="delete-btn"
                  onClick={() => deleteItem(item.id)}
                  title="Remove item"
                >
                  Remove
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
