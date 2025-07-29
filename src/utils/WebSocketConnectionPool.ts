interface ConnectionConfig {
  url: string;
  protocols?: string[];
  reconnectDelay?: number;
  maxReconnectAttempts?: number;
  heartbeatInterval?: number;
}

interface SubscriptionHandler {
  id: string;
  channel: string;
  callback: (data: any) => void;
  filter?: (data: any) => boolean;
}

class WebSocketConnection {
  private ws: WebSocket | null = null;
  private config: ConnectionConfig;
  private subscriptions = new Map<string, SubscriptionHandler>();
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private status: 'connecting' | 'connected' | 'disconnected' | 'error' = 'disconnected';
  private listeners = new Set<(status: string) => void>();

  constructor(config: ConnectionConfig) {
    this.config = {
      reconnectDelay: 1000,
      maxReconnectAttempts: 5,
      heartbeatInterval: 30000,
      ...config
    };
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.status = 'connecting';
        this.notifyStatusChange();

        this.ws = new WebSocket(this.config.url, this.config.protocols);
        
        this.ws.onopen = () => {
          console.log(`WebSocket connected to ${this.config.url}`);
          this.status = 'connected';
          this.reconnectAttempts = 0;
          this.startHeartbeat();
          this.notifyStatusChange();
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.handleMessage(data);
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        this.ws.onclose = (event) => {
          console.log(`WebSocket disconnected: ${event.code} ${event.reason}`);
          this.status = 'disconnected';
          this.stopHeartbeat();
          this.notifyStatusChange();
          this.attemptReconnect();
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.status = 'error';
          this.notifyStatusChange();
          reject(error);
        };

      } catch (error) {
        this.status = 'error';
        this.notifyStatusChange();
        reject(error);
      }
    });
  }

  disconnect(): void {
    this.stopHeartbeat();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
    
    this.status = 'disconnected';
    this.notifyStatusChange();
  }

  subscribe(handler: SubscriptionHandler): void {
    this.subscriptions.set(handler.id, handler);
    
    // Send subscription message if connected
    if (this.status === 'connected') {
      this.send({
        type: 'subscribe',
        channel: handler.channel,
        id: handler.id
      });
    }
  }

  unsubscribe(id: string): void {
    const handler = this.subscriptions.get(id);
    if (handler) {
      this.subscriptions.delete(id);
      
      // Send unsubscription message if connected
      if (this.status === 'connected') {
        this.send({
          type: 'unsubscribe',
          channel: handler.channel,
          id: id
        });
      }
    }
  }

  send(data: any): void {
    if (this.ws && this.status === 'connected') {
      this.ws.send(JSON.stringify(data));
    } else {
      console.warn('Cannot send message: WebSocket not connected');
    }
  }

  onStatusChange(listener: (status: string) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getStatus(): string {
    return this.status;
  }

  private handleMessage(data: any): void {
    // Handle heartbeat responses
    if (data.type === 'pong') {
      return;
    }

    // Route message to appropriate subscribers
    this.subscriptions.forEach(handler => {
      if (data.channel === handler.channel || !data.channel) {
        if (!handler.filter || handler.filter(data)) {
          try {
            handler.callback(data);
          } catch (error) {
            console.error(`Error in subscription handler ${handler.id}:`, error);
          }
        }
      }
    });
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= (this.config.maxReconnectAttempts || 5)) {
      console.log('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.config.reconnectDelay! * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`Attempting reconnection ${this.reconnectAttempts} in ${delay}ms`);
    
    this.reconnectTimer = setTimeout(() => {
      this.connect().catch(error => {
        console.error('Reconnection failed:', error);
      });
    }, delay);
  }

  private startHeartbeat(): void {
    if (this.config.heartbeatInterval) {
      this.heartbeatTimer = setInterval(() => {
        this.send({ type: 'ping' });
      }, this.config.heartbeatInterval);
    }
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private notifyStatusChange(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.status);
      } catch (error) {
        console.error('Error in status change listener:', error);
      }
    });
  }
}

export class WebSocketConnectionPool {
  private connections = new Map<string, WebSocketConnection>();
  private static instance: WebSocketConnectionPool;

  static getInstance(): WebSocketConnectionPool {
    if (!WebSocketConnectionPool.instance) {
      WebSocketConnectionPool.instance = new WebSocketConnectionPool();
    }
    return WebSocketConnectionPool.instance;
  }

  async getConnection(url: string, config?: Partial<ConnectionConfig>): Promise<WebSocketConnection> {
    if (!this.connections.has(url)) {
      const connection = new WebSocketConnection({ url, ...config });
      this.connections.set(url, connection);
      await connection.connect();
    }

    const connection = this.connections.get(url)!;
    
    // Reconnect if disconnected
    if (connection.getStatus() !== 'connected') {
      await connection.connect();
    }

    return connection;
  }

  closeConnection(url: string): void {
    const connection = this.connections.get(url);
    if (connection) {
      connection.disconnect();
      this.connections.delete(url);
    }
  }

  closeAllConnections(): void {
    this.connections.forEach((connection, url) => {
      connection.disconnect();
    });
    this.connections.clear();
  }

  getConnectionStatus(url: string): string {
    const connection = this.connections.get(url);
    return connection ? connection.getStatus() : 'disconnected';
  }

  getAllConnections(): { url: string; status: string }[] {
    return Array.from(this.connections.entries()).map(([url, connection]) => ({
      url,
      status: connection.getStatus()
    }));
  }
}

export { WebSocketConnection };
export type { ConnectionConfig, SubscriptionHandler };