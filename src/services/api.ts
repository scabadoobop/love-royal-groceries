const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

interface ApiResponse<T> {
  data?: T;
  error?: string;
  errors?: Array<{ msg?: string; message?: string; param?: string }>;
  message?: string;
}

class ApiService {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        console.error('API error response:', { status: response.status, statusText: response.statusText, data });
        // Handle validation errors
        if (data.errors && Array.isArray(data.errors)) {
          return { errors: data.errors, error: data.errors.map((e: any) => e.msg || e.message).join(', ') };
        }
        return { error: data.error || `Request failed: ${response.status} ${response.statusText}` };
      }

      return { data };
    } catch (error) {
      console.error('API request failed:', error);
      return { error: 'Network error' };
    }
  }

  // Authentication
  async validateKey(keyCode: string) {
    return this.request<{ valid: boolean; household: { id: string; name: string } }>('/auth/validate-key', {
      method: 'POST',
      body: JSON.stringify({ keyCode }),
    });
  }

  async register(userData: {
    username: string;
    email: string;
    password: string;
    householdKey?: string;
  }) {
    const response = await this.request<{
      token: string;
      user: {
        id: string;
        username: string;
        email: string;
        householdId: string;
        role: string;
      };
    }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });

    if (response.data) {
      this.token = response.data.token;
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }

    return response;
  }

  async login(credentials: { username: string; password: string }) {
    const response = await this.request<{
      token: string;
      user: {
        id: string;
        username: string;
        email: string;
        householdId: string;
        role: string;
      };
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    if (response.data) {
      this.token = response.data.token;
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }

    return response;
  }

  async forgotPassword(email: string) {
    return this.request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async resetPassword(token: string, password: string) {
    return this.request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    });
  }

  async getProfile() {
    return this.request<{ user: any }>('/auth/profile');
  }

  // Grocery Items
  async getGroceries() {
    return this.request<{ items: any[] }>('/groceries');
  }

  async addGrocery(item: {
    name: string;
    location: 'fridge' | 'pantry';
    quantity: number;
    lowThreshold: number;
    category?: string;
  }) {
    return this.request<{ item: any }>('/groceries', {
      method: 'POST',
      body: JSON.stringify(item),
    });
  }

  async updateGroceryQuantity(id: string, delta: number) {
    return this.request<{ item: any }>(`/groceries/${id}/quantity`, {
      method: 'PATCH',
      body: JSON.stringify({ delta }),
    });
  }

  async updateGrocery(id: string, item: {
    name: string;
    location: 'fridge' | 'pantry';
    quantity: number;
    lowThreshold: number;
    category?: string;
  }) {
    return this.request<{ item: any }>(`/groceries/${id}`, {
      method: 'PUT',
      body: JSON.stringify(item),
    });
  }

  async deleteGrocery(id: string) {
    return this.request(`/groceries/${id}`, {
      method: 'DELETE',
    });
  }

  async searchGroceries(query: string, location?: string) {
    const params = new URLSearchParams();
    if (query) params.append('q', query);
    if (location) params.append('location', location);
    
    return this.request<{ items: any[] }>(`/groceries/search?${params}`);
  }

  async getLowStockItems() {
    return this.request<{ items: any[] }>('/groceries/low-stock');
  }

  // Grocery Categories
  async listGroceryCategories() {
    return this.request<{ categories: any[] }>('/grocery-categories');
  }

  async createGroceryCategory(name: string) {
    return this.request<{ category: any }>('/grocery-categories', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  }

  async deleteGroceryCategory(id: string) {
    return this.request(`/grocery-categories/${id}`, { method: 'DELETE' });
  }

  // Notes
  async getNotes() {
    return this.request<{ notes: any[] }>('/notes');
  }

  async addNote(content: string, noteType: 'personal' | 'family') {
    return this.request<{ note: any }>('/notes', {
      method: 'POST',
      body: JSON.stringify({ content, noteType }),
    });
  }

  async deleteNote(id: string) {
    return this.request(`/notes/${id}`, {
      method: 'DELETE',
    });
  }

  // Doodles removed

  // Household
  async getHouseholdInfo() {
    return this.request<{ household: any }>('/households/info');
  }

  async getHouseholdMembers() {
    return this.request<{ members: any[] }>('/households/members');
  }

  async regenerateHouseholdKey() {
    return this.request<{ newKey: string }>('/households/regenerate-key', {
      method: 'POST',
    });
  }

  async updateHouseholdName(name: string) {
    return this.request<{ name: string }>('/households/name', {
      method: 'PUT',
      body: JSON.stringify({ name }),
    });
  }

  async updateMemberRole(memberId: string, role: 'admin' | 'member') {
    return this.request<{ member: any }>(`/households/members/${memberId}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    });
  }

  async removeMember(memberId: string) {
    return this.request(`/households/members/${memberId}`, {
      method: 'DELETE',
    });
  }

  // Forum
  async getForumCategories() {
    return this.request<{ categories: any[] }>('/forum/categories');
  }

  async getForumThreads(categoryId: string, page = 1, limit = 20) {
    return this.request<{ threads: any[] }>(`/forum/categories/${categoryId}/threads?page=${page}&limit=${limit}`);
  }

  async createThread(categoryId: string, title: string, content: string, expiresAt?: string) {
    return this.request<{ thread: any }>('/forum/threads', {
      method: 'POST',
      body: JSON.stringify({ categoryId, title, content, expiresAt }),
    });
  }

  async pinThread(threadId: string, isPinned: boolean) {
    return this.request<{ thread: any }>(`/forum/threads/${threadId}/pin`, {
      method: 'PATCH',
      body: JSON.stringify({ isPinned }),
    });
  }

  async getThread(threadId: string, page = 1, limit = 50) {
    return this.request<{ thread: any; posts: any[] }>(`/forum/threads/${threadId}?page=${page}&limit=${limit}`);
  }

  async addPost(threadId: string, content: string) {
    return this.request<{ post: any }>(`/forum/threads/${threadId}/posts`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  }

  // Quests
  async getQuests() {
    return this.request<{ quests: any[] }>('/quests');
  }

  async getMyQuestProgress() {
    return this.request<{ totalPoints: number; pointsSpent: number; availablePoints: number; todayCompletions: any[] }>('/quests/my-progress');
  }

  async getQuestLeaderboard() {
    return this.request<{ leaderboard: any[] }>('/quests/leaderboard');
  }

  async createQuest(data: { title: string; description?: string; pointsReward: number; frequency?: 'daily' | 'weekly' | 'monthly'; assignedTo?: string | null }) {
    return this.request<{ quest: any }>('/quests', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateQuest(questId: string, data: { title?: string; description?: string; pointsReward?: number; frequency?: 'daily' | 'weekly' | 'monthly'; assignedTo?: string | null; is_active?: boolean }) {
    return this.request<{ quest: any }>(`/quests/${questId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteQuest(questId: string) {
    return this.request(`/quests/${questId}`, {
      method: 'DELETE',
    });
  }

  async completeQuest(questId: string) {
    return this.request<{ completion: any; pointsEarned: number }>(`/quests/${questId}/complete`, {
      method: 'POST',
    });
  }

  // Rewards
  async getRewards() {
    return this.request<{ rewards: any[] }>('/rewards');
  }

  async getMyRedemptions() {
    return this.request<{ redemptions: any[] }>('/rewards/my-redemptions');
  }

  async createReward(name: string, description: string, points_cost: number, stock_quantity?: number) {
    return this.request<{ reward: any }>('/rewards', {
      method: 'POST',
      body: JSON.stringify({ name, description, points_cost, stock_quantity }),
    });
  }

  async updateReward(rewardId: string, data: { name?: string; description?: string; points_cost?: number; stock_quantity?: number; is_available?: boolean }) {
    return this.request<{ reward: any }>(`/rewards/${rewardId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteReward(rewardId: string) {
    return this.request(`/rewards/${rewardId}`, {
      method: 'DELETE',
    });
  }

  async redeemReward(rewardId: string) {
    return this.request<{ redemption: any; availablePoints: number }>(`/rewards/${rewardId}/redeem`, {
      method: 'POST',
    });
  }

  async getAllRedemptions() {
    return this.request<{ redemptions: any[] }>('/rewards/redemptions');
  }

  async updateRedemptionStatus(redemptionId: string, status: string) {
    return this.request<{ redemption: any }>(`/rewards/redemptions/${redemptionId}`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  // Utility methods
  setToken(token: string) {
    this.token = token;
    localStorage.setItem('token', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  isAuthenticated() {
    return !!this.token;
  }
}

export const apiService = new ApiService();
export default apiService;
