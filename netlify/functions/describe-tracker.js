// Netlify Function — Reformulate tracker titles via Claude API
// Title-only, no summary — deterministic, constrained output

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  };

  let titre = '';
  try {
    const body = JSON.parse(event.body);
    titre = body.titre || '';
    const source = body.source || '';
    // summary intentionally ignored — only title is used

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 80,
        temperature: 0,
        system: `Tu reformules des titres d'articles réglementaires en français.

Règles strictes :
- Reformule UNIQUEMENT ce qui est dans le titre fourni
- N'ajoute AUCUNE information absente du titre
- Si le titre est déjà en français et clair, retourne-le tel quel
- Maximum 20 mots
- Pas de point final
- Pas de guillemets`,
        messages: [{
          role: 'user',
          content: `Source : ${source}\nTitre : ${titre}\n\nReformule en français.`
        }]
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Anthropic error:', data);
      // Fallback: return raw title
      return { statusCode: 200, headers, body: JSON.stringify({ description: titre }) };
    }

    const description = data.content[0].text.trim();
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ description })
    };
  } catch (err) {
    console.error(err);
    // Fallback: return raw title
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ description: titre })
    };
  }
};
