import app from '../server';

export default function handler(req: any, res: any) {
  return new Promise((resolve) => {
    // Force Vercel Serverless Function to wait until Express finishes sending the HTTP response
    res.on('finish', () => resolve(true));
    res.on('close', () => resolve(true));
    res.on('error', (err: any) => {
      console.error('Vercel Express response error:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Internal Serverless Error', details: String(err) });
      }
      resolve(false);
    });

    try {
      let url = req.url || '';
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

      app(req, res);
    } catch (err: any) {
      console.error('Vercel API handler exception:', err);
      if (!res.headersSent) {
        res.status(500).json({
          error: err?.message || 'Serverless execution exception',
          details: String(err)
        });
      }
      resolve(false);
    }
  });
}
