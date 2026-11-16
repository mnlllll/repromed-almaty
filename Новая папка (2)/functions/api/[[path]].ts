import { handleApiRequest, type CloudflareEnv } from '../../cloudflare/api';

interface PagesContext {
  request: Request;
  env: CloudflareEnv;
}

export async function onRequest(context: PagesContext): Promise<Response> {
  return handleApiRequest(context.request, context.env);
}
