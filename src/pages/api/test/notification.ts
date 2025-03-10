import { createApiHandler, ApiError } from '@/lib/api/handlers';
import { notifyUser } from '@/pages/api/streaming/notifications';

export default createApiHandler(
  {
    methods: ['POST'],
    requireAuth: true,
    rateLimitType: 'general',
  },
  async (req, res, { userId }) => {
    try {
      if (!userId) {
        throw ApiError.unauthorized();
      }
      
      const { message } = req.body;
      
      if (!message) {
        return res.status(400).json({ message: 'Message is required' });
      }
      
      // Create test notification payload
      const notification = {
        type: 'notification',
        message: message || 'Test notification',
        timestamp: new Date().toISOString(),
      };
      
      // Notify the user via streaming connection
      const delivered = notifyUser(userId, notification);
      
      return res.status(200).json({
        success: true,
        delivered, // Was notification delivered to any active connections
        notification,
      });
    } catch (error) {
      console.error('Error sending test notification:', error);
      if (error instanceof ApiError) {
        return res.status(error.statusCode).json({ message: error.message });
      }
      return res.status(500).json({ message: 'Internal server error' });
    }
  }
); 