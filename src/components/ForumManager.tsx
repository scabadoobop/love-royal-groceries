import { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import './ForumManager.css';

interface Category {
  id: string;
  name: string;
  description: string;
  thread_count: number;
  last_activity: string;
}

interface Thread {
  id: string;
  title: string;
  author_name: string;
  created_at: string;
  post_count: number;
  last_post_at: string;
  is_pinned: boolean;
}

interface Post {
  id: string;
  content: string;
  author_name: string;
  created_at: string;
}

export default function ForumManager() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [selectedThread, setSelectedThread] = useState<Thread | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showNewThread, setShowNewThread] = useState(false);
  const [newThread, setNewThread] = useState({ title: '', content: '' });
  const [newPost, setNewPost] = useState('');

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const response = await apiService.getForumCategories();
      if (response.data) {
        setCategories(response.data.categories);
      } else {
        setError(response.error || 'Failed to load categories');
      }
    } catch (err) {
      setError('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const loadThreads = async (categoryId: string) => {
    try {
      setLoading(true);
      const response = await apiService.getForumThreads(categoryId);
      if (response.data) {
        setThreads(response.data.threads);
      } else {
        setError(response.error || 'Failed to load threads');
      }
    } catch (err) {
      setError('Failed to load threads');
    } finally {
      setLoading(false);
    }
  };

  const loadPosts = async (threadId: string) => {
    try {
      setLoading(true);
      const response = await apiService.getThread(threadId);
      if (response.data) {
        setPosts(response.data.posts);
      } else {
        setError(response.error || 'Failed to load posts');
      }
    } catch (err) {
      setError('Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  const createThread = async () => {
    if (!selectedCategory || !newThread.title.trim() || !newThread.content.trim()) return;

    try {
      const response = await apiService.createThread(
        selectedCategory.id,
        newThread.title.trim(),
        newThread.content.trim()
      );
      if (response.data) {
        setNewThread({ title: '', content: '' });
        setShowNewThread(false);
        loadThreads(selectedCategory.id);
      } else {
        setError(response.error || 'Failed to create thread');
      }
    } catch (err) {
      setError('Failed to create thread');
    }
  };

  const addPost = async () => {
    if (!selectedThread || !newPost.trim()) return;

    try {
      const response = await apiService.addPost(selectedThread.id, newPost.trim());
      if (response.data) {
        setNewPost('');
        loadPosts(selectedThread.id);
      } else {
        setError(response.error || 'Failed to add post');
      }
    } catch (err) {
      setError('Failed to add post');
    }
  };

  const handleCategorySelect = (category: Category) => {
    setSelectedCategory(category);
    setSelectedThread(null);
    setPosts([]);
    loadThreads(category.id);
  };

  const handleThreadSelect = (thread: Thread) => {
    setSelectedThread(thread);
    loadPosts(thread.id);
  };

  const goBack = () => {
    if (selectedThread) {
      setSelectedThread(null);
      setPosts([]);
    } else if (selectedCategory) {
      setSelectedCategory(null);
      setThreads([]);
    }
  };

  if (loading && !selectedCategory) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading forum...</p>
      </div>
    );
  }

  return (
    <div className="forum-manager">
      <div className="forum-header">
        <h2>Household Forum</h2>
        {selectedCategory && !selectedThread && (
          <button 
            className="royal-button primary"
            onClick={() => setShowNewThread(true)}
          >
            New Thread
          </button>
        )}
      </div>

      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError('')} className="error-close">×</button>
        </div>
      )}

      {!selectedCategory ? (
        <div className="categories-view">
          <h3>Choose a Discussion Category</h3>
          <div className="categories-grid">
            {categories.map(category => (
              <div 
                key={category.id} 
                className="category-card"
                onClick={() => handleCategorySelect(category)}
              >
                <h4>{category.name}</h4>
                <p>{category.description}</p>
                <div className="category-stats">
                  <span>{category.thread_count} threads</span>
                  {category.last_activity && (
                    <span>Last activity: {new Date(category.last_activity).toLocaleDateString()}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : !selectedThread ? (
        <div className="threads-view">
          <div className="threads-header">
            <button onClick={goBack} className="back-button">← Back to Categories</button>
            <h3>{selectedCategory.name}</h3>
          </div>

          {showNewThread && (
            <div className="new-thread-form">
              <h4>Create New Thread</h4>
              <div className="form-group">
                <label>Thread Title</label>
                <input
                  type="text"
                  value={newThread.title}
                  onChange={(e) => setNewThread({...newThread, title: e.target.value})}
                  placeholder="Enter thread title..."
                  className="royal-input"
                />
              </div>
              <div className="form-group">
                <label>Content</label>
                <textarea
                  value={newThread.content}
                  onChange={(e) => setNewThread({...newThread, content: e.target.value})}
                  placeholder="Start the discussion..."
                  className="royal-textarea"
                  rows={4}
                />
              </div>
              <div className="form-actions">
                <button 
                  className="royal-button primary"
                  onClick={createThread}
                  disabled={!newThread.title.trim() || !newThread.content.trim()}
                >
                  Create Thread
                </button>
                <button 
                  className="royal-button secondary"
                  onClick={() => setShowNewThread(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="threads-list">
            {threads.length === 0 ? (
              <div className="empty-state">
                <p>No threads yet. Be the first to start a discussion!</p>
              </div>
            ) : (
              threads.map(thread => (
                <div 
                  key={thread.id} 
                  className={`thread-card ${thread.is_pinned ? 'pinned' : ''}`}
                  onClick={() => handleThreadSelect(thread)}
                >
                  <div className="thread-content">
                    <h4>{thread.title}</h4>
                    <div className="thread-meta">
                      <span>By {thread.author_name}</span>
                      <span>{thread.post_count} posts</span>
                      <span>{new Date(thread.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  {thread.is_pinned && <span className="pinned-badge">📌</span>}
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        <div className="posts-view">
          <div className="posts-header">
            <button onClick={goBack} className="back-button">← Back to Threads</button>
            <h3>{selectedThread.title}</h3>
          </div>

          <div className="posts-list">
            {posts.map(post => (
              <div key={post.id} className="post-card">
                <div className="post-content">
                  <p>{post.content}</p>
                </div>
                <div className="post-meta">
                  <span className="post-author">By {post.author_name}</span>
                  <span className="post-date">
                    {new Date(post.created_at).toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="new-post-form">
            <h4>Add a Reply</h4>
            <div className="form-group">
              <textarea
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
                placeholder="Write your reply..."
                className="royal-textarea"
                rows={3}
              />
            </div>
            <button 
              className="royal-button primary"
              onClick={addPost}
              disabled={!newPost.trim()}
            >
              Post Reply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
