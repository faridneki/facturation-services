import app from '../server';

export default function handler(req: any, res: any) {
  try {
    const rawUrl = (req.headers['x-forwarded-uri'] as string) || (req.headers['x-rewrite-url'] as string) || req.url || '';
    let path = rawUrl;
    if (path.includes('?')) {
      path = path.split('?')[0];
    }

    if (!path.startsWith('/api')) {
      path = '/api' + (path.startsWith('/') ? path : '/' + path);
    }

    req.url = path;

    return app(req, res);
  } catch (err: any) {
    console.error('Vercel catch-all handler exception:', err);
    if (!res.headersSent) {
      return res.status(500).json({
        error: err?.message || 'Serverless execution error',
        details: String(err)
      });
    }
  }
}
