export default async function handler(req, res) {
  // Normalize base URL (strip any trailing slash)
  const rawUrl = process.env.ELASTIC_URL || 'http://45.77.225.119:9200/';
  const ELASTIC_URL = rawUrl.replace(/\/+$/, '');

  const { method, query, body } = req;
  const user     = query.user    || 'default';
  const id       = query.id      || '';
  const resource = query.resource || 'transactions';
  const index    = resource === 'watchlist'
    ? `watchlist-${user}`
    : `stocks-${user}`;

  // Elasticsearch fetch wrapper
  const fetchElastic = async (url, method = 'GET', data = null) => {
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: data ? JSON.stringify(data) : undefined,
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(`Elasticsearch error: ${response.status} ${JSON.stringify(error)}`);
    }
    return response.json();
  };

  // Ensure index exists with appropriate mappings
  const ensureIndex = async () => {
    const existsUrl = `${ELASTIC_URL}/${index}`;
    const existsRes = await fetch(existsUrl, { method: 'HEAD' });
    if (existsRes.status === 404) {
      const createUrl = `${ELASTIC_URL}/${index}`;
      const settings = {
        settings: { number_of_shards: 1, number_of_replicas: 1 },
        mappings: { properties: {
          symbol:    { type: 'keyword' },
          // common
          createdAt: { type: 'date'    },
          // watchlist-specific
          condition: { type: 'keyword' },
          target:    { type: 'float'   },
          // transactions-specific
          operation: { type: 'keyword' },
          amount:    { type: 'float'   },
          price:     { type: 'float'   },
          fee:       { type: 'float'   },
          date:      { type: 'date'    }
        }}
      };
      await fetchElastic(createUrl, 'PUT', settings);
    }
  };

  try {
    await ensureIndex();

    // Handle GET
    if (method === 'GET') {
      if (id) {
        const url = `${ELASTIC_URL}/${index}/_doc/${id}`;
        const result = await fetchElastic(url);
        return res.status(200).json(result._source || {});
      }
      const url = `${ELASTIC_URL}/${index}/_search`;
      const result = await fetchElastic(url, 'POST', {
        size: 1000,
        sort: [{ createdAt: { order: 'desc' }}],
        query: { match_all: {} }
      });
      const data = (result.hits?.hits || []).map(hit => ({ id: hit._id, ...hit._source }));
      return res.status(200).json(data);
    }

    // Handle POST (create)
    if (method === 'POST') {
      const payload = { ...body, createdAt: new Date().toISOString() };
      const url = `${ELASTIC_URL}/${index}/_doc`;
      const result = await fetchElastic(url, 'POST', payload);
      return res.status(201).json({ success: true, id: result._id });
    }

    // Handle PUT (update)
    if (method === 'PUT') {
      if (!id) {
        return res.status(400).json({ error: 'Missing id for update' });
      }
      const updateUrl = `${ELASTIC_URL}/${index}/_update/${id}`;
      const doc = { doc: body };
      const result = await fetchElastic(updateUrl, 'POST', doc);
      return res.status(200).json({ success: true, result });
    }

    // Handle DELETE
    if (method === 'DELETE') {
      if (!id) {
        return res.status(400).json({ error: 'Missing id for delete' });
      }
      const url = `${ELASTIC_URL}/${index}/_doc/${id}`;
      await fetchElastic(url, 'DELETE');
      return res.status(200).json({ success: true });
    }

    // Method not allowed
    res.setHeader('Allow', ['GET','POST','PUT','DELETE']);
    return res.status(405).end(`Method ${method} Not Allowed`);

  } catch (error) {
    console.error('API handler error:', error);
    return res.status(500).json({ error: error.message });
  }
}
