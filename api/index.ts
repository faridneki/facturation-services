import app from '../server';

export default function handler(req: any, res: any) {
  if (req.url) {
    if (req.url.includes('/api/index.ts')) {
      req.url = req.url.replace('/api/index.ts', '/api');
    }
    if (!req.url.startsWith('/api')) {
      req.url = '/api' + (req.url.startsWith('/') ? req.url : '/' + req.url);
    }
  }
  return app(req, res);
}
