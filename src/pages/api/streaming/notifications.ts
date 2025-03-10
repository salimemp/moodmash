import { NextApiRequest, NextApiResponse } from 'next';
import { createApiHandler } from '@/lib/api/handlers';
import { createStreamingResponse } from '@/lib/api/streaming';
import { db } from '@/lib/db/prisma';

// Mock notification type since we don't have the model
interface Notification {
  id: string;
  userId: string;
  type: string;
  message: string;
  read: boolean;
  createdAt: Date;
  data: string | null;
}

// In-memory notifier map to manage active streaming connections
let activeStreams: Map<string, Set<(data: any) => void>> = new Map();

/**
 * Send notification to all active streams for a user
 */
export function notifyUser(userId: string, data: any) {
  const listeners = activeStreams.get(userId);
  
  if (listeners && listeners.size > 0) {
    listeners.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('Error sending notification:', error);
      }
    });
    return true;
  }
  
  return false;
}

export default createApiHandler(
  {
    methods: ['GET'],
    requireAuth: true,
    rateLimitType: 'general',
  },
  async (req, res, { userId }) => {
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    // Create streaming response
    const stream = createStreamingResponse(req, res, {
      keepAlive: true,
      heartbeatInterval: 30000, // 30 seconds
    });
    
    // Send initial connection notification
    stream.send({ 
      type: 'connected', 
      message: 'Connected to notification stream', 
      timestamp: new Date().toISOString()
    });
    
    // Register this stream for the user
    if (!activeStreams.has(userId)) {
      activeStreams.set(userId, new Set());
    }
    
    // Create callback function for this connection
    const streamCallback = (data: any) => {
      stream.send(data);
    };
    
    // Add callback to the set of listeners for this user
    activeStreams.get(userId)?.add(streamCallback);
    
    // Handle client disconnection
    req.on('close', () => {
      const listeners = activeStreams.get(userId);
      
      if (listeners) {
        listeners.delete(streamCallback);
        
        // Clean up user entry if no listeners remain
        if (listeners.size === 0) {
          activeStreams.delete(userId);
        }
      }
    });
    
    // Send a test notification after 5 seconds
    setTimeout(() => {
      if (!stream.isClosed()) {
        stream.send({ 
          type: 'notification', 
          message: 'This is a test notification', 
          timestamp: new Date().toISOString() 
        });
      }
    }, 5000);
  }
);

// Helper to generate a notification for a user - commented out as we don't have the model
/*
export async function createNotification(
  userId: string,
  type: string,
  message: string,
  data?: any
) {
  try {
    // Store notification in database - assuming we have a notifications table
    // You'll need to add this model to your Prisma schema
    
    const notification: Notification = {
      id: `notification-${Date.now()}`,
      userId,
      type,
      message,
      data: data ? JSON.stringify(data) : null,
      read: false,
      createdAt: new Date()
    };
    
    // Send real-time notification
    notifyUser(userId, {
      type: 'notification',
      notificationId: notification.id,
      message,
      notificationType: type,
      timestamp: notification.createdAt.toISOString(),
      data,
    });
    
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
}
*/ 