export default async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  // Validate Supabase JWT
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const token = authHeader.slice(7);
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return new Response(JSON.stringify({ error: 'Server misconfigured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: {
      Authorization: `Bearer ${token}`,
      apikey: supabaseAnonKey,
    },
  });

  if (!userResponse.ok) {
    return new Response(JSON.stringify({ error: 'Invalid or expired token' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Parse and validate body
  let base64Image: string;
  try {
    const body = await req.json();
    base64Image = body.base64Image;
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!base64Image || typeof base64Image !== 'string') {
    return new Response(JSON.stringify({ error: 'Missing base64Image field' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (base64Image.length > 14_000_000) {
    return new Response(JSON.stringify({ error: 'Image too large (max ~10MB)' }), {
      status: 413,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Proxy to Google Cloud Vision
  const apiKey = process.env.GOOGLE_CLOUD_VISION_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'Vision API key not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const imageContent = base64Image.replace(/^data:image\/\w+;base64,/, '');

  const googleResponse = await fetch(
    `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requests: [
          {
            image: { content: imageContent },
            features: [{ type: 'DOCUMENT_TEXT_DETECTION' }],
          },
        ],
      }),
    }
  );

  const data = await googleResponse.json();

  if (!googleResponse.ok) {
    return new Response(
      JSON.stringify({ error: data.error?.message || 'Google Vision API error' }),
      { status: googleResponse.status, headers: { 'Content-Type': 'application/json' } }
    );
  }

  return new Response(JSON.stringify(data.responses?.[0] || {}), {
    headers: { 'Content-Type': 'application/json' },
  });
};
