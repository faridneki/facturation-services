import app from '../server';

export default function handler(req: any, res: any) {
  try {
    let url = req.url || '';
    
    // Support forwarded or rewritten URLs if present
    const forwardedUri = (req.headers['x-forwarded-uri'] as string) || (req.headers['x-rewrite-url'] as string) || '';
    if (forwardedUri && forwardedUri.startsWith('/api')) {
      url = forwardedUri;
    }

    if (!url || url === '/' || url === '/api/index.ts' || url === '/api/index') {
      url = '/api';
    } else if (!url.startsWith('/api')) {
      url = '/api' + (url.startsWith('/') ? url : '/' + url);
    }

    req.url = url;

    return app(req, res);
  } catch (err: any) {
    console.error('Vercel API handler exception:', err);
    if (!res.headersSent) {
      return res.status(500).json({
        error: err?.message || 'Serverless execution error',
        details: String(err)
      });
    }
  }
}
