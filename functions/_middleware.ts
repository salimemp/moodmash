/**
 * Cloudflare Pages Middleware
 * Injects emergency UI fix script into HTML responses
 */

export async function onRequest(context: any) {
  const response = await context.next();
  const contentType = response.headers.get('content-type') || '';
  
  // Only inject into HTML responses
  if (!contentType.includes('text/html')) {
    return response;
  }

  // Read the response body
  let html = await response.text();
  
  // Inject emergency fix script before </head>
  const emergencyFixScript = `
    <!-- Emergency UI Fix -->
    <script src="/static/emergency-fix-v2.js" defer></script>
  `;
  
  html = html.replace('</head>', `${emergencyFixScript}</head>`);
  
  // Return modified response
  return new Response(html, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
}
