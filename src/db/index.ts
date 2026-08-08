import app from '../server';

export default async function handler(req: any, res: any) {
  try {
    if (req.url) {
      if (req.url.includes('/api/index.ts')) {
        req.url = req.url.replace('/api/index.ts', '/api');
      }
      if (!req.url.startsWith('/api')) {
        req.url = '/api' + (req.url.startsWith('/') ? req.url : '/' + req.url);
      }
    }
    return app(req, res);
  } catch (err: any) {
    console.error('Vercel API handler exception:', err);
    return res.status(500).json({ error: err?.message || 'Serverless execution error' });
  }
}
