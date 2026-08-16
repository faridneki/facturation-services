import app from '../server';

export default function handler(req: any, res: any) {
  return new Promise((resolve) => {
    // Safety timeout (8.5s) to guarantee response before Vercel 10s lambda termination
    const timer = setTimeout(() => {
      if (!res.headersSent) {
        console.error('Vercel handler timeout on URL:', req.url);
        res.status(504).json({
          error: 'Gateway Timeout',
          message: 'Le serveur backend n\'a pas répondu à temps.'
        });
      }
      resolve(false);
    }, 8500);

    const cleanupAndResolve = (val: boolean) => {
      clearTimeout(timer);
      resolve(val);
    };

    res.on('finish', () => cleanupAndResolve(true));
    res.on('close', () => cleanupAndResolve(true));
    res.on('error', (err: any) => {
      console.error('Vercel Express response error:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Internal Serverless Error', details: String(err) });
      }
      cleanupAndResolve(false);
    });

    try {
      let url = req.url || '';
      const forwardedUri = (req.headers['x-forwarded-uri'] as string) || (req.headers['x-rewrite-url'] as string) || (req.headers['x-matched-path'] as string) || '';

      if (forwardedUri && forwardedUri.startsWith('/api') && !forwardedUri.startsWith('/api/index')) {
        url = forwardedUri;
      } else if (url.startsWith('/api/index')) {
        url = url.replace('/api/index', '/api');
      }

      if (!url || url === '/') {
        url = '/api';
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
      cleanupAndResolve(false);
    }
  });
}
