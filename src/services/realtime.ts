"use client";

export interface RealtimeEvent {
  type: string;
  data: any;
  timestamp: number;
}

export interface RealtimeSubscription {
  id: string;
  callback: (event: RealtimeEvent) => void;
  filter?: (event: RealtimeEvent) => boolean;
}

class RealtimeService {
  private eventSource: EventSource | null = null;
  private subscriptions: Map<string, RealtimeSubscription> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second
  private isConnected = false;
  private connectionListeners: Set<(connected: boolean) => void> = new Set();

  constructor() {
    if (typeof window !== "undefined") {
      this.connect();
    }
  }

  private connect() {
    if (this.eventSource) {
      this.eventSource.close();
    }

    try {
      this.eventSource = new EventSource("/api/realtime/events");
      
      this.eventSource.onopen = () => {
        console.log("Realtime connection established");
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.reconnectDelay = 1000;
        this.notifyConnectionListeners(true);
      };

      this.eventSource.onmessage = (event) => {
        try {
          const realtimeEvent: RealtimeEvent = JSON.parse(event.data);
          this.handleEvent(realtimeEvent);
        } catch (error) {
          console.error("Failed to parse realtime event:", error);
        }
      };

      this.eventSource.onerror = (error) => {
        console.error("Realtime connection error:", error);
        this.isConnected = false;
        this.notifyConnectionListeners(false);
        this.handleReconnect();
      };
    } catch (error) {
      console.error("Failed to establish realtime connection:", error);
      this.handleReconnect();
    }
  }

  private handleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error("Max reconnection attempts reached");
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);
    
    setTimeout(() => {
      this.connect();
    }, delay);
  }

  private handleEvent(event: RealtimeEvent) {
    this.subscriptions.forEach((subscription) => {
      if (!subscription.filter || subscription.filter(event)) {
        try {
          subscription.callback(event);
        } catch (error) {
          console.error("Error in realtime event callback:", error);
        }
      }
    });
  }

  private notifyConnectionListeners(connected: boolean) {
    this.connectionListeners.forEach((listener) => {
      try {
        listener(connected);
      } catch (error) {
        console.error("Error in connection listener:", error);
      }
    });
  }

  public subscribe(
    id: string,
    callback: (event: RealtimeEvent) => void,
    filter?: (event: RealtimeEvent) => boolean
  ): () => void {
    const subscription: RealtimeSubscription = {
      id,
      callback,
      filter,
    };

    this.subscriptions.set(id, subscription);

    // Return unsubscribe function
    return () => {
      this.subscriptions.delete(id);
    };
  }

  public unsubscribe(id: string) {
    this.subscriptions.delete(id);
  }

  public onConnectionChange(listener: (connected: boolean) => void): () => void {
    this.connectionListeners.add(listener);
    
    // Immediately call with current status
    listener(this.isConnected);
    
    // Return cleanup function
    return () => {
      this.connectionListeners.delete(listener);
    };
  }

  public getConnectionStatus(): boolean {
    return this.isConnected;
  }

  public disconnect() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    this.isConnected = false;
    this.subscriptions.clear();
    this.connectionListeners.clear();
  }

  // Optimistic updates for better UX
  public optimisticUpdate(type: string, data: any) {
    const event: RealtimeEvent = {
      type: `optimistic:${type}`,
      data,
      timestamp: Date.now(),
    };
    
    this.handleEvent(event);
  }

  // Send events to server (for two-way communication)
  public async sendEvent(type: string, data: any): Promise<void> {
    try {
      const response = await fetch("/api/realtime/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ type, data }),
      });

      if (!response.ok) {
        throw new Error(`Failed to send event: ${response.statusText}`);
      }
    } catch (error) {
      console.error("Failed to send realtime event:", error);
      throw error;
    }
  }
}

// Singleton instance
export const realtimeService = new RealtimeService();

// React hook for using realtime service
import { useEffect, useState, useCallback } from "react";

export function useRealtimeConnection() {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const unsubscribe = realtimeService.onConnectionChange(setIsConnected);
    return unsubscribe;
  }, []);

  return isConnected;
}

export function useRealtimeSubscription(
  eventType: string,
  callback: (data: any) => void,
  dependencies: any[] = []
) {
  const memoizedCallback = useCallback(callback, dependencies);

  useEffect(() => {
    const subscriptionId = `${eventType}-${Date.now()}-${Math.random()}`;
    
    const unsubscribe = realtimeService.subscribe(
      subscriptionId,
      (event) => {
        if (event.type === eventType || event.type === `optimistic:${eventType}`) {
          memoizedCallback(event.data);
        }
      }
    );

    return unsubscribe;
  }, [eventType, memoizedCallback]);
}

// Specific hooks for common data types
export function useRealtimeKPIUpdates(callback: (kpis: any) => void) {
  useRealtimeSubscription("kpi-update", callback);
}

export function useRealtimeInventoryUpdates(callback: (inventory: any) => void) {
  useRealtimeSubscription("inventory-update", callback);
}

export function useRealtimeNotifications(callback: (notification: any) => void) {
  useRealtimeSubscription("notification", callback);
}

// Optimistic update helpers
export function useOptimisticUpdates() {
  const sendOptimisticUpdate = useCallback((type: string, data: any) => {
    realtimeService.optimisticUpdate(type, data);
  }, []);

  const sendEvent = useCallback(async (type: string, data: any) => {
    try {
      await realtimeService.sendEvent(type, data);
    } catch (error) {
      console.error("Failed to send event:", error);
      throw error;
    }
  }, []);

  return {
    sendOptimisticUpdate,
    sendEvent,
  };
}