/**
 * Cloud Functions entrypoint for treetopgrowthstrategy.com
 *
 * Each handler in ./handlers/ exports `handle(request: Request): Promise<Response>`,
 * matching the Fetch API. We adapt Express req/res from Firebase to Fetch and back
 * so the existing Astro-style handlers work unchanged.
 *
 * Routes are exposed under /api/* via Firebase Hosting rewrites in firebase.json.
 */

import { onRequest, Request as FbRequest } from 'firebase-functions/v2/https';
import type { Response as ExpressResponse } from 'firebase-functions/v1';
import { setGlobalOptions } from 'firebase-functions/v2';

import { handle as leadCaptureHandle } from './handlers/lead-capture';
import { handle as trainingInquiryHandle } from './handlers/training-inquiry';
import { handle as quizSubmitHandle } from './handlers/quiz-submit';
import { handle as ecofitAssessmentSubmitHandle } from './handlers/ecofit-assessment-submit';
import { handle as ecofitDemoRequestHandle } from './handlers/ecofit-demo-request';
import { handle as stackCheckoutHandle } from './handlers/stack-checkout';

// Region: us-central1 (default). Set memory low — these are tiny handlers.
setGlobalOptions({
  region: 'us-central1',
  memory: '256MiB',
  maxInstances: 10,
});

// Secrets used by the handlers (read at runtime via process.env)
const SECRETS = [
  'RESEND_API_KEY',
  'AIRTABLE_API_KEY',
  'AIRTABLE_BASE_ID',
  'STRIPE_SECRET_KEY',
  'GITHUB_TOKEN',
] as const;

/**
 * Adapt an Express-style Firebase request into a Fetch API Request,
 * call the handler, then write the Fetch Response back to the Express response.
 */
function makeFn(handle: (req: Request) => Promise<Response>) {
  return onRequest({ secrets: [...SECRETS], cors: true }, async (req: FbRequest, res: ExpressResponse) => {
    try {
      // Build a Fetch-API Request from the Express req
      const url = `https://${req.hostname}${req.originalUrl || req.url}`;
      const method = req.method.toUpperCase();
      const headers = new Headers();
      for (const [k, v] of Object.entries(req.headers)) {
        if (Array.isArray(v)) headers.set(k, v.join(', '));
        else if (typeof v === 'string') headers.set(k, v);
      }

      let body: string | undefined;
      if (method !== 'GET' && method !== 'HEAD') {
        // Firebase parses JSON bodies into req.body; rawBody is a Buffer of the raw payload
        if ((req as any).rawBody) {
          body = (req as any).rawBody.toString('utf8');
        } else if (req.body != null) {
          body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
        }
      }

      const fetchReq = new Request(url, { method, headers, body });
      const fetchRes = await handle(fetchReq);

      // Write fetch Response back to Express response
      res.status(fetchRes.status);
      fetchRes.headers.forEach((value, key) => {
        // Skip transfer-encoding (Express manages it)
        if (key.toLowerCase() === 'transfer-encoding') return;
        res.setHeader(key, value);
      });
      const text = await fetchRes.text();
      res.send(text);
    } catch (err) {
      console.error('Function adapter error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
}

// Public HTTPS functions — names map to firebase.json rewrites
export const leadCapture           = makeFn(leadCaptureHandle);
export const trainingInquiry       = makeFn(trainingInquiryHandle);
export const quizSubmit            = makeFn(quizSubmitHandle);
export const ecofitAssessmentSubmit = makeFn(ecofitAssessmentSubmitHandle);
export const ecofitDemoRequest     = makeFn(ecofitDemoRequestHandle);
export const stackCheckout         = makeFn(stackCheckoutHandle);
