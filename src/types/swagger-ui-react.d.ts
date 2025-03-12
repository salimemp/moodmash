declare module 'swagger-ui-react' {
  import { ComponentType } from 'react';

  // Define types for OpenAPI/Swagger spec
  type OpenAPISpec = Record<string, unknown>;
  
  // Define request and response types
  interface SwaggerRequest {
    url: string;
    method: string;
    headers: Record<string, string>;
    body?: unknown;
    [key: string]: unknown;
  }
  
  interface SwaggerResponse {
    status: number;
    statusText: string;
    headers: Record<string, string>;
    data?: unknown;
    [key: string]: unknown;
  }

  interface SwaggerUIProps {
    spec: OpenAPISpec;
    url?: string;
    docExpansion?: 'list' | 'full' | 'none';
    defaultModelExpandDepth?: number;
    defaultModelsExpandDepth?: number;
    deepLinking?: boolean;
    requestInterceptor?: (req: SwaggerRequest) => SwaggerRequest;
    responseInterceptor?: (res: SwaggerResponse) => SwaggerResponse;
    // Allow additional properties with unknown type
    [key: string]: unknown;
  }

  const SwaggerUI: ComponentType<SwaggerUIProps>;
  export default SwaggerUI;
}
