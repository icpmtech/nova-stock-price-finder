export default async function handler(req, res) {
  const ELASTIC_URL = 'http://45.77.225.119:9200/'; // ⚠️ Substituir pela tua URL real do Elasticsearch
  const { method, query, body } = req;
  const user = query.user || 'default';
  const id = query.id || '';
  const index = `stocks-${user}`;

  const fetchElastic = async (url, method = 'GET', data = null) => {
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: data ? JSON.stringify(data) : undefined,
    });
    return response.json();
  };

  if (method === 'GET') {
    if (id) {
      const url = `${ELASTIC_URL}/${index}/_doc/${id}`;
      const result = await fetchElastic(url);
      return res.status(200).json(result._source || {});
    } else {
      const url = `${ELASTIC_URL}/${index}/_search`;
      const result = await fetchElastic(url, 'POST', { size: 1000, query: { match_all: {} } });
      const data = result.hits?.hits.map(hit => ({ id: hit._id, ...hit._source })) || [];
      return res.status(200).json(data);
    }
  }

  if (method === 'POST') {
    const url = `${ELASTIC_URL}/${index}/_doc`;
    const result = await fetchElastic(url, 'POST', body);
    return res.status(201).json({ success: true, id: result._id });
  }

  if (method === 'PUT') {
    if (!id) return res.status(400).json({ error: 'Missing id for update' });
    const url = `${ELASTIC_URL}/${index}/_doc/${id}`;
    const result = await fetchElastic(url, 'PUT', body);
    return res.status(200).json({ success: true, result });
  }

  if (method === 'DELETE') {
    if (!id) return res.status(400).json({ error: 'Missing id for delete' });
    const url = `${ELASTIC_URL}/${index}/_doc/${id}`;
    const result = await fetchElastic(url, 'DELETE');
    return res.status(200).json({ success: true, result });
  }

  res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
  res.status(405).end(`Method ${method} Not Allowed`);
}
