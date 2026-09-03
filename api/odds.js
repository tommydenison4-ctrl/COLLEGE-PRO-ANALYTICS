const CACHE_TTL_MS = 60 * 1000;
let cache = { at: 0, events: null };

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    return res.status(204).end();
  }
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.ODDS_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: 'ODDS_API_KEY is not configured',
      detail: 'Add ODDS_API_KEY in Vercel Project Settings → Environment Variables, then redeploy.'
    });
  }

  const force = String(req.query?.refresh || '') === '1';
  if (!force && cache.events && Date.now() - cache.at < CACHE_TTL_MS) {
    return res.status(200).json({
      events: cache.events,
      source: 'The Odds API',
      mode: 'cached direct sportsbook feed',
      cached: true,
      fetched_at: new Date(cache.at).toISOString()
    });
  }

  const base = 'https://api.the-odds-api.com/v4/sports/americanfootball_ncaaf/odds/';
  const params = new URLSearchParams({
    apiKey,
    regions: 'us',
    markets: 'h2h,spreads,totals',
    oddsFormat: 'american',
    dateFormat: 'iso'
  });

  // Keep the response useful even if one preferred book is unavailable.
  // GRIDLOCK sorts/labels FanDuel, BetRivers and bet365 itself on the client.
  const url = `${base}?${params.toString()}`;

  try {
    const upstream = await fetch(url, { headers: { accept: 'application/json' } });
    const text = await upstream.text();
    let data;
    try { data = JSON.parse(text); } catch { data = null; }

    if (!upstream.ok) {
      return res.status(upstream.status).json({
        error: 'The Odds API request failed',
        detail: data?.message || data?.error || text.slice(0, 500) || `HTTP ${upstream.status}`
      });
    }

    const events = Array.isArray(data) ? data : [];
    cache = { at: Date.now(), events };

    return res.status(200).json({
      events,
      source: 'The Odds API',
      mode: 'direct sportsbook feed',
      cached: false,
      fetched_at: new Date(cache.at).toISOString(),
      requests_remaining: upstream.headers.get('x-requests-remaining'),
      requests_used: upstream.headers.get('x-requests-used')
    });
  } catch (err) {
    return res.status(502).json({
      error: 'Unable to reach The Odds API',
      detail: err?.message || String(err)
    });
  }
};
