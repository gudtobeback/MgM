/**
 * Cloudflare Worker for Meraki API Proxy
 * This worker acts as a secure proxy for the Meraki Dashboard API.
 */

export interface Env {
  // Environment variables can be configured in the Cloudflare dashboard or wrangler.toml
}

// Define CORS headers. In production, restrict the origin to your frontend's domain.
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Allow any origin
  'Access-Control-Allow-Methods': 'POST, OPTIONS', // Allow POST and preflight OPTIONS
  'Access-Control-Allow-Headers': 'Content-Type', // Allow Content-Type header
};

const MERAKI_BASE_URL_COM = 'https://api.meraki.com/api/v1';
const MERAKI_BASE_URL_IN = 'https://api.meraki.in/api/v1';
const getBaseUrl = (region: 'com' | 'in') => region === 'in' ? MERAKI_BASE_URL_IN : MERAKI_BASE_URL_COM;

export default {
  // FIX: Removed unused `ctx: ExecutionContext` parameter to resolve missing type error.
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // This worker only responds to requests on the `/api/proxy` path.
    if (url.pathname !== '/api/proxy') {
        return new Response('Not Found', { status: 404 });
    }

    // Handle CORS preflight requests sent by the browser.
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Only allow POST requests for the actual proxy logic.
    if (request.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405, headers: corsHeaders });
    }

    try {
      // FIX: Removed generic type argument from `.json()` as it is not supported by the Request type.
      const { apiKey, region, endpoint, method, body } = await request.json();

      if (!apiKey || !region || !endpoint || !method) {
        return new Response(JSON.stringify({ error: 'Missing required parameters in proxy request' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const baseUrl = getBaseUrl(region);
      const merakiUrl = `${baseUrl}${endpoint}`;

      const merakiRequestHeaders: HeadersInit = {
        'X-Cisco-Meraki-API-Key': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      };

      const merakiRequestOptions: RequestInit = {
        method: method,
        headers: merakiRequestHeaders,
      };

      if (body && Object.keys(body).length > 0) {
        merakiRequestOptions.body = JSON.stringify(body);
      }

      const merakiResponse = await fetch(merakiUrl, merakiRequestOptions);

      // Create a new response, adding our CORS headers to the Meraki response.
      const response = new Response(merakiResponse.body, {
        status: merakiResponse.status,
        statusText: merakiResponse.statusText,
        headers: {
          ...corsHeaders,
          'Content-Type': merakiResponse.headers.get('Content-Type') || 'application/json',
        }
      });
      
      // Forward important headers like 'Retry-After' for rate limiting.
      if (merakiResponse.headers.has('Retry-After')) {
          response.headers.set('Retry-After', merakiResponse.headers.get('Retry-After')!);
      }

      return response;

    } catch (error) {
      console.error('Error in proxy worker:', error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      return new Response(JSON.stringify({ error: `An internal server error occurred: ${errorMessage}` }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  },
};
