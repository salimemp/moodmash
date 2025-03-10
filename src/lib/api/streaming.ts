/**
 * Custom API streaming implementation for Next.js 13.5.6
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Transforms stream data into the format required by Server-Sent Events (SSE)
 * 
 * @param data The data to be sent in the stream
 * @param event Optional event name
 * @returns Formatted SSE data
 */
export function formatSSEMessage(data: any, event?: string): string {
  const formattedData = typeof data === 'string' ? data : JSON.stringify(data);
  let message = `data: ${formattedData}\n\n`;
  
  if (event) {
    message = `event: ${event}\n${message}`;
  }
  
  return message;
}

/**
 * Options for the streaming response
 */
export interface StreamingOptions {
  /**
   * Headers to include in the response
   */
  headers?: Record<string, string>;
  
  /**
   * Whether to keep connection alive with periodic heartbeat
   */
  keepAlive?: boolean;
  
  /**
   * Interval for sending heartbeat messages (in ms)
   */
  heartbeatInterval?: number;
  
  /**
   * Whether to close the connection after all data is sent
   */
  closeOnComplete?: boolean;
}

const DEFAULT_STREAMING_OPTIONS: StreamingOptions = {
  keepAlive: true,
  heartbeatInterval: 15000, // 15 seconds
  closeOnComplete: false,
};

/**
 * Creates a streaming response
 * 
 * @param req NextApiRequest
 * @param res NextApiResponse
 * @param options Options for the streaming response
 * @returns Object with methods to send data through the stream
 */
export function createStreamingResponse(
  req: NextApiRequest,
  res: NextApiResponse,
  options: StreamingOptions = {}
) {
  const {
    headers = {},
    keepAlive = DEFAULT_STREAMING_OPTIONS.keepAlive,
    heartbeatInterval = DEFAULT_STREAMING_OPTIONS.heartbeatInterval,
    closeOnComplete = DEFAULT_STREAMING_OPTIONS.closeOnComplete,
  } = options;
  
  // Set up SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable buffering for Nginx
  
  // Set custom headers
  Object.entries(headers).forEach(([key, value]) => {
    res.setHeader(key, value);
  });
  
  // Initialize response
  res.status(200);
  res.flushHeaders();
  
  // Keep track of connection status
  let closed = false;
  
  // Set up heartbeat interval if required
  let heartbeatTimer: NodeJS.Timeout | null = null;
  
  if (keepAlive) {
    heartbeatTimer = setInterval(() => {
      if (!closed) {
        res.write(formatSSEMessage({ type: 'heartbeat', timestamp: Date.now() }, 'heartbeat'));
      }
    }, heartbeatInterval);
  }
  
  // Handle client disconnect
  req.on('close', () => {
    closed = true;
    
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer);
    }
  });
  
  // Return methods to manipulate the stream
  return {
    /**
     * Send data through the stream
     */
    send: (data: any, event?: string) => {
      if (!closed) {
        res.write(formatSSEMessage(data, event));
      }
    },
    
    /**
     * Send error through the stream
     */
    error: (error: Error | string) => {
      if (!closed) {
        const message = error instanceof Error ? error.message : error;
        res.write(formatSSEMessage({ error: message }, 'error'));
      }
    },
    
    /**
     * Check if connection is closed
     */
    isClosed: () => closed,
    
    /**
     * Close the stream
     */
    close: () => {
      if (!closed) {
        closed = true;
        
        if (heartbeatTimer) {
          clearInterval(heartbeatTimer);
        }
        
        res.end();
      }
    },
  };
}

/**
 * Creates a streaming response with async iterator
 * 
 * @param req NextApiRequest
 * @param res NextApiResponse
 * @param dataSource Async iterable source of data
 * @param options Options for the streaming response
 */
export async function streamAsyncIterable<T>(
  req: NextApiRequest,
  res: NextApiResponse,
  dataSource: AsyncIterable<T>,
  options?: StreamingOptions
) {
  const stream = createStreamingResponse(req, res, options);
  
  try {
    for await (const data of dataSource) {
      if (stream.isClosed()) break;
      stream.send(data);
    }
    
    if (options?.closeOnComplete) {
      stream.close();
    }
  } catch (error) {
    stream.error(error as Error);
    stream.close();
  }
}

/**
 * Custom hook for client-side usage of streaming endpoints
 */
export function useStreamingData<T>(
  url: string,
  options?: {
    onMessage?: (data: T) => void;
    onError?: (error: any) => void;
    onOpen?: () => void;
    onClose?: () => void;
    autoConnect?: boolean;
  }
) {
  const {
    onMessage,
    onError,
    onOpen,
    onClose,
    autoConnect = true,
  } = options || {};
  
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  
  const connect = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
    
    try {
      const eventSource = new EventSource(url);
      eventSourceRef.current = eventSource;
      
      eventSource.onopen = () => {
        setIsConnected(true);
        setError(null);
        if (onOpen) onOpen();
      };
      
      eventSource.onmessage = (event) => {
        try {
          const parsedData = JSON.parse(event.data) as T;
          setData(parsedData);
          if (onMessage) onMessage(parsedData);
        } catch (err) {
          const error = err instanceof Error 
            ? err 
            : new Error('Failed to parse streaming data');
          
          setError(error);
          if (onError) onError(error);
        }
      };
      
      eventSource.onerror = (event) => {
        const error = new Error('EventSource connection error');
        setError(error);
        setIsConnected(false);
        
        if (onError) onError(error);
        eventSource.close();
        eventSourceRef.current = null;
      };
      
      // Set up event handlers for custom events
      eventSource.addEventListener('error', (event) => {
        try {
          const parsedData = JSON.parse((event as MessageEvent).data);
          const error = new Error(parsedData.error || 'Unknown streaming error');
          
          setError(error);
          if (onError) onError(error);
        } catch (err) {
          const error = err instanceof Error 
            ? err 
            : new Error('Failed to parse error data');
          
          setError(error);
          if (onError) onError(error);
        }
      });
      
      // Don't update state for heartbeat events
      eventSource.addEventListener('heartbeat', () => {});
      
      return () => {
        eventSource.close();
        eventSourceRef.current = null;
        setIsConnected(false);
        if (onClose) onClose();
      };
    } catch (err) {
      const error = err instanceof Error 
        ? err 
        : new Error('Failed to connect to streaming endpoint');
      
      setError(error);
      setIsConnected(false);
      
      if (onError) onError(error);
      return undefined;
    }
  }, [url, onMessage, onError, onOpen, onClose]);
  
  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
      setIsConnected(false);
      if (onClose) onClose();
    }
  }, [onClose]);
  
  // Connect on mount if autoConnect is true
  useEffect(() => {
    if (autoConnect) {
      const cleanup = connect();
      return cleanup;
    }
    return undefined;
  }, [autoConnect, connect]);
  
  return {
    data,
    error,
    isConnected,
    connect,
    disconnect,
  };
} 