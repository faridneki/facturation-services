import app from '../server';

export default function handler(req: any, res: any) {
  // Normalize URL for Express router matching if forwarded headers exist
  const forwardedUri = (req.headers['x-forwarded-uri'] as string) || (req.headers['x-rewrite-url'] as string) || '';
  if (forwardedUri && forwardedUri.startsWith('/api')) {
    req.url = forwardedUri;
  }
  return app(req, res);
}
