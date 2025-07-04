import fs from 'fs-extra';
import path from 'path';

export const config = { api: { bodyParser: false } };
const pagesDir = path.join(process.cwd(), 'pages');

export default async function handler(req, res) {
  const { method, url } = req;

  if (method === 'GET' && url.includes('?cms=list')) {
    await fs.ensureDir(pagesDir);
    const files = await fs.readdir(pagesDir);
    const slugs = files
      .filter(f => f.endsWith('.html'))
      .map(f => f.replace(/\.html$/, ''));
    return res.status(200).json(slugs);
  }

  if (method === 'POST' && url.includes('?cms=save')) {
    let body = '';
    for await (const chunk of req) body += chunk;
    const { slug, content } = JSON.parse(body);
    if (!slug || !content) return res.status(400).json({ error: 'slug e content obrigatórios' });
    await fs.ensureDir(pagesDir);
    await fs.writeFile(path.join(pagesDir, `${slug}.html`), content, 'utf-8');
    return res.status(200).json({ ok: true });
  }

  return res.status(405).end();
}
