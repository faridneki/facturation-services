import app from '../server';

export default async function handler(req: any, res: any) {
  try {
    let targetUrl = req.url || '';

    // If query path from Vercel catch-all route is present
    if (req.query && req.query.path) {
      const pathArray = Array.isArray(req.query.path) ? req.query.path : [req.query.path];
      targetUrl = '/api/' + pathArray.join('/');
    }

    // Clean up internal file artifacts
    targetUrl = targetUrl.replace('/api/index.ts', '').replace('/api/index', '');

    if (!targetUrl || targetUrl === '/' || targetUrl === '') {
      targetUrl = '/api';
    } else if (!targetUrl.startsWith('/api')) {
      targetUrl = '/api' + (targetUrl.startsWith('/') ? targetUrl : '/' + targetUrl);
    }

    req.url = targetUrl;
    req.originalUrl = targetUrl;

    return new Promise((resolve) => {
      let resolved = false;
      const done = () => {
        if (!resolved) {
          resolved = true;
          resolve(undefined);
        }
      };

      res.on('finish', done);
      res.on('close', done);
      res.on('error', done);

      app(req, res, (err?: any) => {
        if (err && !res.headersSent) {
          res.status(500).json({ error: err?.message || 'Express error', details: String(err) });
        }
        done();
      });
    });
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
