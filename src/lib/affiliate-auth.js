export function getCorsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, x-api-key, Authorization',
  };
}

export function handleOptions() {
  return new Response(null, {
    status: 204,
    headers: getCorsHeaders(),
  });
}

export function validateApiKey(request) {
  const apiKey = request.headers.get('x-api-key');
  const validKey = process.env.AFFILIATE_API_KEY || 'aff_live_partnerverse_2026_sec_key_9f8a';
  
  if (!apiKey || apiKey !== validKey) {
    return {
      isValid: false,
      response: Response.json(
        { error: 'No autorizado: x-api-key invalida o ausente' },
        { status: 401, headers: getCorsHeaders() }
      ),
    };
  }
  return { isValid: true };
}
