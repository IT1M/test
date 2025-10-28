import { NextRequest } from "next/server";
import { auth } from "@/services/auth";

// Store active connections
const connections = new Set<ReadableStreamDefaultController>();

// Broadcast event to all connected clients
export function broadcastEvent(type: string, data: any) {
  const event = {
    type,
    data,
    timestamp: Date.now(),
  };

  const eventData = `data: ${JSON.stringify(event)}\n\n`;
  
  connections.forEach((controller) => {
    try {
      controller.enqueue(new TextEncoder().encode(eventData));
    } catch (error) {
      // Remove dead connections
      connections.delete(controller);
    }
  });
}

export async function GET(request: NextRequest) {
  // Check authentication
  const session = await auth();
  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Create Server-Sent Events stream
  const stream = new ReadableStream({
    start(controller) {
      // Add connection to active connections
      connections.add(controller);

      // Send initial connection event
      const welcomeEvent = {
        type: "connection",
        data: { message: "Connected to realtime updates" },
        timestamp: Date.now(),
      };
      
      controller.enqueue(
        new TextEncoder().encode(`data: ${JSON.stringify(welcomeEvent)}\n\n`)
      );

      // Send periodic heartbeat to keep connection alive
      const heartbeatInterval = setInterval(() => {
        try {
          const heartbeat = {
            type: "heartbeat",
            data: { timestamp: Date.now() },
            timestamp: Date.now(),
          };
          controller.enqueue(
            new TextEncoder().encode(`data: ${JSON.stringify(heartbeat)}\n\n`)
          );
        } catch (error) {
          clearInterval(heartbeatInterval);
          connections.delete(controller);
        }
      }, 30000); // 30 seconds

      // Cleanup on close
      request.signal.addEventListener("abort", () => {
        clearInterval(heartbeatInterval);
        connections.delete(controller);
        try {
          controller.close();
        } catch (error) {
          // Connection already closed
        }
      });
    },
    
    cancel() {
      connections.delete(controller);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Cache-Control",
    },
  });
}

// Utility function to trigger KPI updates
export async function triggerKPIUpdate() {
  try {
    // Fetch latest KPI data
    const response = await fetch(`${process.env.NEXTAUTH_URL}/api/analytics/summary`, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      const result = await response.json();
      if (result.success) {
        broadcastEvent("kpi-update", result.data.kpis);
      }
    }
  } catch (error) {
    console.error("Failed to trigger KPI update:", error);
  }
}

// Utility function to trigger inventory updates
export async function triggerInventoryUpdate(inventoryItem?: any) {
  broadcastEvent("inventory-update", {
    type: inventoryItem ? "item-created" : "list-updated",
    item: inventoryItem,
    timestamp: Date.now(),
  });
  
  // Also trigger KPI update since inventory affects KPIs
  await triggerKPIUpdate();
}