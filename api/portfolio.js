// /api/portfolio.js
export default async function handler(req, res) {
  const esUrl = 'http://45.77.225.119:9200/user-id-f29384c9-3ae6-4d2a-a9d5-4ba4f30046cf-portfolio/_search';

  try {
    const esRes = await fetch(esUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        size: 100,
        query: { match_all: {} }
      })
    });

    const data = await esRes.json();
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao consultar Elasticsearch', details: err.toString() });
  }
}
