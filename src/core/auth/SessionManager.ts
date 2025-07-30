/**
 * Session Manager
 * Advanced session management with caching, sync, and security
 */

import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export interface SessionData {
  session: Session | null;
  user: User | null;
  expiresAt: number;
  refreshToken: string | null;
  lastActivity: number;
  deviceFingerprint: string;
}

export interface SessionConfig {
  autoRefreshBuffer: number; // 5 minutes before expiry
  maxInactivity: number; // 30 minutes
  enableMultiTab: boolean;
  enableOfflineMode: boolean;
}

const DEFAULT_CONFIG: SessionConfig = {
  autoRefreshBuffer: 5 * 60 * 1000, // 5 minutes
  maxInactivity: 30 * 60 * 1000, // 30 minutes
  enableMultiTab: true,
  enableOfflineMode: true,
};

export class SessionManager {
  private static instance: SessionManager;
  private sessionData: SessionData | null = null;
  private refreshTimer: NodeJS.Timeout | null = null;
  private activityTimer: NodeJS.Timeout | null = null;
  private broadcastChannel: BroadcastChannel | null = null;
  private config: SessionConfig;
  private eventListeners: Map<string, Function[]> = new Map();

  private constructor(config: SessionConfig = DEFAULT_CONFIG) {
    this.config = config;
    this.initializeBroadcastChannel();
    this.setupActivityTracking();
  }

  static getInstance(config?: SessionConfig): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager(config);
    }
    return SessionManager.instance;
  }

  private initializeBroadcastChannel() {
    if (this.config.enableMultiTab && typeof BroadcastChannel !== 'undefined') {
      this.broadcastChannel = new BroadcastChannel('auth-session');
      this.broadcastChannel.addEventListener('message', this.handleBroadcastMessage.bind(this));
    }
  }

  private handleBroadcastMessage(event: MessageEvent) {
    const { type, data } = event.data;
    
    switch (type) {
      case 'SESSION_UPDATE':
        this.sessionData = data;
        this.emit('session-synced', data);
        break;
      case 'SESSION_LOGOUT':
        this.clearSession();
        this.emit('session-logout');
        break;
    }
  }

  private setupActivityTracking() {
    if (typeof window !== 'undefined') {
      ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
        document.addEventListener(event, this.updateActivity.bind(this), true);
      });
    }
  }

  private updateActivity() {
    if (this.sessionData) {
      this.sessionData.lastActivity = Date.now();
      this.resetActivityTimer();
    }
  }

  private resetActivityTimer() {
    if (this.activityTimer) {
      clearTimeout(this.activityTimer);
    }
    
    this.activityTimer = setTimeout(() => {
      this.emit('session-inactive');
    }, this.config.maxInactivity);
  }

  private generateDeviceFingerprint(): string {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx?.fillText('fingerprint', 2, 2);
    
    return btoa(JSON.stringify({
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      screen: `${screen.width}x${screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      canvas: canvas.toDataURL()
    })).slice(0, 32);
  }

  async initializeSession(): Promise<SessionData | null> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Session initialization error:', error);
        return null;
      }

      if (session) {
        this.sessionData = {
          session,
          user: session.user,
          expiresAt: session.expires_at ? session.expires_at * 1000 : Date.now() + (24 * 60 * 60 * 1000),
          refreshToken: session.refresh_token,
          lastActivity: Date.now(),
          deviceFingerprint: this.generateDeviceFingerprint()
        };

        this.scheduleRefresh();
        this.resetActivityTimer();
        this.broadcastSessionUpdate();
        
        return this.sessionData;
      }

      return null;
    } catch (error) {
      console.error('Session initialization failed:', error);
      return null;
    }
  }

  private scheduleRefresh() {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }

    if (!this.sessionData) return;

    const timeToRefresh = this.sessionData.expiresAt - Date.now() - this.config.autoRefreshBuffer;
    
    if (timeToRefresh > 0) {
      this.refreshTimer = setTimeout(() => {
        this.refreshSession();
      }, timeToRefresh);
    }
  }

  async refreshSession(): Promise<boolean> {
    try {
      const { data: { session }, error } = await supabase.auth.refreshSession();
      
      if (error || !session) {
        console.error('Session refresh failed:', error);
        this.clearSession();
        return false;
      }

      this.sessionData = {
        ...this.sessionData!,
        session,
        user: session.user,
        expiresAt: session.expires_at ? session.expires_at * 1000 : Date.now() + (24 * 60 * 60 * 1000),
        refreshToken: session.refresh_token,
        lastActivity: Date.now()
      };

      this.scheduleRefresh();
      this.broadcastSessionUpdate();
      this.emit('session-refreshed', this.sessionData);
      
      return true;
    } catch (error) {
      console.error('Session refresh exception:', error);
      this.clearSession();
      return false;
    }
  }

  private broadcastSessionUpdate() {
    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage({
        type: 'SESSION_UPDATE',
        data: this.sessionData
      });
    }
  }

  getSession(): SessionData | null {
    return this.sessionData;
  }

  isSessionValid(): boolean {
    if (!this.sessionData) return false;
    
    const now = Date.now();
    const isNotExpired = now < this.sessionData.expiresAt;
    const isActive = (now - this.sessionData.lastActivity) < this.config.maxInactivity;
    
    return isNotExpired && isActive;
  }

  async logout(): Promise<void> {
    try {
      await supabase.auth.signOut();
      this.clearSession();
      
      if (this.broadcastChannel) {
        this.broadcastChannel.postMessage({
          type: 'SESSION_LOGOUT'
        });
      }
      
      this.emit('session-logout');
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  private clearSession() {
    this.sessionData = null;
    
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
    
    if (this.activityTimer) {
      clearTimeout(this.activityTimer);
      this.activityTimer = null;
    }
  }

  // Event system
  on(event: string, callback: Function) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  off(event: string, callback: Function) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emit(event: string, data?: any) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => callback(data));
    }
  }

  destroy() {
    this.clearSession();
    
    if (this.broadcastChannel) {
      this.broadcastChannel.close();
    }
    
    this.eventListeners.clear();
  }
}