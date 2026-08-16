import { handleApiRequest } from '../src/apiHandler';

export default async function handler(req: any, res: any) {
  try {
    await handleApiRequest(req, res);
  } catch (err: any) {
    console.error('Fatal Serverless Error:', err);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({
        error: err?.message || 'Serverless Exception',
        details: String(err)
      }));
    }
  }
}
