import app from '../server';

export default async function handler(req: any, res: any) {
  try {
    const rawUrl = req.url || '';
    const matchedPath = (req.headers['x-matched-path'] as string) || '';
    const forwardedUri = (req.headers['x-forwarded-uri'] as string) || '';
    const rewriteUrl = (req.headers['x-rewrite-url'] as string) || '';

    let targetUrl = rawUrl;

    if (matchedPath && !matchedPath.includes('/api/index')) {
      targetUrl = matchedPath;
    } else if (forwardedUri && !forwardedUri.includes('/api/index')) {
      targetUrl = forwardedUri;
    } else if (rewriteUrl && !rewriteUrl.includes('/api/index')) {
      targetUrl = rewriteUrl;
    }

    if (targetUrl.includes('/api/index.ts')) {
      targetUrl = targetUrl.replace('/api/index.ts', '');
    } else if (targetUrl.includes('/api/index')) {
      targetUrl = targetUrl.replace('/api/index', '');
    }

    if (!targetUrl || targetUrl === '/' || targetUrl === '') {
      targetUrl = '/api';
    } else if (!targetUrl.startsWith('/api')) {
      targetUrl = '/api' + (targetUrl.startsWith('/') ? targetUrl : '/' + targetUrl);
    }

    req.url = targetUrl;

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

