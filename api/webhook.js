import { put, list } from '@vercel/blob';

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  const { method, url } = req;

  if (method === 'GET' && url.includes('?cms=list')) {
    const { blobs } = await list({ prefix: 'pages/' });
    const slugs = blobs.map(blob => blob.pathname.replace('pages/', '').replace('.html', ''));
    return res.status(200).json(slugs);
  }

  if (method === 'POST' && url.includes('?cms=save')) {
    let body = '';
    for await (const chunk of req) body += chunk;

    const { slug, content } = JSON.parse(body);
    if (!slug || !content) {
      return res.status(400).json({ error: 'slug e content obrigatórios' });
    }

    const blob = await put(`pages/${slug}.html`, content, {
      access: 'public',
      contentType: 'text/html',
    });

    return res.status(200).json({ ok: true, url: blob.url });
  }

  return res.status(405).end();
}
