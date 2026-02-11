// API Client for Backend Services
const API_BASE_URL = 'http://localhost:8787/api';

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    subscriptionTier: string;
  };
}

interface Snapshot {
  id: string;
  organizationId: string;
  snapshotType: 'manual' | 'scheduled' | 'pre-change' | 'post-change';
  snapshotData: any;
  snapshotMetadata?: any;
  sizeBytes: number;
  createdBy?: string;
  createdAt: string;
  notes?: string;
}

interface SnapshotDiff {
  added: any[];
  modified: any[];
  removed: any[];
  summary: {
    totalChanges: number;
    devicesChanged: number;
    networksChanged: number;
  };
}

class ApiClient {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  constructor() {
    // Load tokens from localStorage
    this.accessToken = localStorage.getItem('accessToken');
    this.refreshToken = localStorage.getItem('refreshToken');
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
      });

      // Handle 401 - try to refresh token
      if (response.status === 401 && this.refreshToken) {
        const refreshed = await this.refreshAccessToken();
        if (refreshed) {
          // Retry the request with new token
          headers['Authorization'] = `Bearer ${this.accessToken}`;
          const retryResponse = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers,
          });
          return retryResponse;
        }
      }

      return response;
    } catch (error) {
      console.error('API request error:', error);
      throw error;
    }
  }

  // ============ Authentication ============

  async register(email: string, password: string, fullName?: string): Promise<AuthTokens> {
    const response = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, fullName }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Registration failed');
    }

    const tokens = await response.json();
    this.setTokens(tokens);
    return tokens;
  }

  async login(email: string, password: string): Promise<AuthTokens> {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Login failed');
    }

    const tokens = await response.json();
    this.setTokens(tokens);
    return tokens;
  }

  async refreshAccessToken(): Promise<boolean> {
    if (!this.refreshToken) return false;

    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: this.refreshToken }),
      });

      if (!response.ok) return false;

      const tokens = await response.json();
      this.setTokens(tokens);
      return true;
    } catch (error) {
      console.error('Token refresh error:', error);
      return false;
    }
  }

  async getCurrentUser() {
    const response = await this.request('/auth/me');

    if (!response.ok) {
      throw new Error('Failed to fetch user details');
    }

    return response.json();
  }

  async updateProfile(data: { fullName?: string; currentPassword?: string; newPassword?: string }) {
    const response = await this.request('/auth/profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update profile');
    }
    return response.json();
  }

  async updateSubscription(tier: string) {
    const response = await this.request('/auth/subscription', {
      method: 'PATCH',
      body: JSON.stringify({ tier }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update subscription');
    }
    const tokens = await response.json();
    // Persist the new tokens so the tier badge updates immediately
    this.setTokens(tokens);
    return tokens;
  }

  private setTokens(tokens: AuthTokens) {
    this.accessToken = tokens.accessToken;
    this.refreshToken = tokens.refreshToken;
    localStorage.setItem('accessToken', tokens.accessToken);
    localStorage.setItem('refreshToken', tokens.refreshToken);
    localStorage.setItem('user', JSON.stringify(tokens.user));
  }

  logout() {
    this.accessToken = null;
    this.refreshToken = null;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  }

  isAuthenticated(): boolean {
    return !!this.accessToken;
  }

  getUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  // ============ Organizations ============

  async createOrganization(data: {
    merakiOrgId: string;
    merakiOrgName: string;
    merakiApiKey: string;
    merakiRegion: 'com' | 'in';
  }) {
    const response = await this.request('/organizations', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create organization');
    }

    return response.json();
  }

  async listOrganizations() {
    const response = await this.request('/organizations');

    if (!response.ok) {
      throw new Error('Failed to fetch organizations');
    }

    return response.json();
  }

  async removeOrganization(orgId: string): Promise<void> {
    const response = await this.request(`/organizations/${orgId}`, { method: 'DELETE' });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to remove organization');
    }
  }

  // ============ Drift Detection ============

  async detectDrift(organizationId: string) {
    const response = await this.request(`/organizations/${organizationId}/drift`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to run drift detection');
    }
    return response.json();
  }

  // ============ Compliance ============

  async runComplianceCheck(organizationId: string, snapshotId?: string) {
    const params = snapshotId ? `?snapshotId=${snapshotId}` : '';
    const response = await this.request(`/organizations/${organizationId}/compliance${params}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to run compliance checks');
    }
    return response.json();
  }

  // ============ Bulk Operations ============

  async getBulkNetworks(organizationId: string) {
    const response = await this.request(`/organizations/${organizationId}/bulk/networks`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch networks');
    }
    return response.json();
  }

  async bulkApplyVlan(organizationId: string, networkIds: string[], vlanConfig: any) {
    const response = await this.request(`/organizations/${organizationId}/bulk/vlans`, {
      method: 'POST',
      body: JSON.stringify({ networkIds, vlanConfig }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Bulk VLAN operation failed');
    }
    return response.json();
  }

  async bulkApplyFirewall(organizationId: string, networkIds: string[], rules: any[]) {
    const response = await this.request(`/organizations/${organizationId}/bulk/firewall`, {
      method: 'POST',
      body: JSON.stringify({ networkIds, rules }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Bulk firewall operation failed');
    }
    return response.json();
  }

  async bulkApplyTags(organizationId: string, serials: string[], tags: string[]) {
    const response = await this.request(`/organizations/${organizationId}/bulk/tags`, {
      method: 'POST',
      body: JSON.stringify({ serials, tags }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Bulk tag operation failed');
    }
    return response.json();
  }

  // ============ Snapshots (Version Control) ============

  async createSnapshot(
    organizationId: string,
    type: 'manual' | 'scheduled' | 'pre-change' | 'post-change',
    notes?: string
  ): Promise<Snapshot> {
    const response = await this.request(`/organizations/${organizationId}/snapshots`, {
      method: 'POST',
      body: JSON.stringify({ type, notes }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create snapshot');
    }

    return response.json();
  }

  async listSnapshots(
    organizationId: string,
    filters?: {
      type?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<Snapshot[]> {
    const params = new URLSearchParams();
    if (filters?.type) params.append('type', filters.type);
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.offset) params.append('offset', filters.offset.toString());

    const queryString = params.toString();
    const endpoint = `/organizations/${organizationId}/snapshots${queryString ? `?${queryString}` : ''}`;

    const response = await this.request(endpoint);

    if (!response.ok) {
      throw new Error('Failed to fetch snapshots');
    }

    return response.json();
  }

  async getSnapshot(organizationId: string, snapshotId: string): Promise<Snapshot> {
    const response = await this.request(`/organizations/${organizationId}/snapshots/${snapshotId}`);

    if (!response.ok) {
      throw new Error('Failed to fetch snapshot');
    }

    return response.json();
  }

  async compareSnapshots(
    organizationId: string,
    snapshot1Id: string,
    snapshot2Id: string
  ): Promise<SnapshotDiff> {
    const response = await this.request(
      `/organizations/${organizationId}/snapshots/compare?snapshot1=${snapshot1Id}&snapshot2=${snapshot2Id}`
    );

    if (!response.ok) {
      throw new Error('Failed to compare snapshots');
    }

    return response.json();
  }

  async deleteSnapshot(organizationId: string, snapshotId: string): Promise<void> {
    const response = await this.request(`/organizations/${organizationId}/snapshots/${snapshotId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to delete snapshot');
    }
  }

  // ============ Analytics ============

  async getAnalyticsOverview() {
    const response = await this.request('/analytics/overview');
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch analytics');
    }
    return response.json();
  }

  async getOrgAnalytics(organizationId: string) {
    const response = await this.request(`/analytics/organizations/${organizationId}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch organization analytics');
    }
    return response.json();
  }

  // ============ Security Posture ============

  async getSecurityPosture(organizationId: string, snapshotId?: string) {
    const params = snapshotId ? `?snapshotId=${snapshotId}` : '';
    const response = await this.request(`/organizations/${organizationId}/security${params}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to run security analysis');
    }
    return response.json();
  }

  // ============ Change Management ============

  async listChanges(organizationId: string, status?: string) {
    const params = status ? `?status=${status}` : '';
    const response = await this.request(`/organizations/${organizationId}/changes${params}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch change requests');
    }
    return response.json();
  }

  async createChangeRequest(organizationId: string, data: {
    title: string;
    description: string;
    changeType: string;
    plannedAt?: string;
    affectedResources?: any;
  }) {
    const response = await this.request(`/organizations/${organizationId}/changes`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create change request');
    }
    return response.json();
  }

  async updateChangeRequest(organizationId: string, changeId: string, action: string, notes?: string) {
    const response = await this.request(`/organizations/${organizationId}/changes/${changeId}`, {
      method: 'PATCH',
      body: JSON.stringify({ action, notes }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update change request');
    }
    return response.json();
  }

  // ============ Documentation ============

  async generateDocumentation(organizationId: string, snapshotId?: string) {
    const params = snapshotId ? `?snapshotId=${snapshotId}` : '';
    const response = await this.request(`/organizations/${organizationId}/docs${params}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to generate documentation');
    }
    return response.json();
  }

  getDocumentationDownloadUrl(organizationId: string, format: 'html' | 'markdown', snapshotId?: string): string {
    const params = new URLSearchParams({ format });
    if (snapshotId) params.append('snapshotId', snapshotId);
    return `${API_BASE_URL}/organizations/${organizationId}/docs/download?${params.toString()}`;
  }

  // ============ Scheduled Snapshots ============

  async getSchedule(organizationId: string) {
    const response = await this.request(`/organizations/${organizationId}/schedule`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get schedule');
    }
    return response.json();
  }

  async setSchedule(organizationId: string, config: {
    enabled: boolean;
    frequency: 'hourly' | 'daily' | 'weekly';
    hour?: number;
    dayOfWeek?: number;
    retainCount?: number;
  }) {
    const response = await this.request(`/organizations/${organizationId}/schedule`, {
      method: 'PUT',
      body: JSON.stringify(config),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update schedule');
    }
    return response.json();
  }

  async deleteSchedule(organizationId: string): Promise<void> {
    const response = await this.request(`/organizations/${organizationId}/schedule`, { method: 'DELETE' });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete schedule');
    }
  }

  async triggerScheduledSnapshot(organizationId: string) {
    const response = await this.request(`/organizations/${organizationId}/schedule/trigger`, { method: 'POST' });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to trigger snapshot');
    }
    return response.json();
  }

  // ============ Cross-Region Sync ============

  async listCrossRegionOrgs() {
    const response = await this.request('/cross-region/organizations');
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to list organizations');
    }
    return response.json();
  }

  async compareOrgs(sourceOrgId: string, targetOrgId: string) {
    const params = new URLSearchParams({ sourceOrgId, targetOrgId });
    const response = await this.request(`/cross-region/compare?${params.toString()}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Cross-region comparison failed');
    }
    return response.json();
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
