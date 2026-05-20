"use strict";
/**
 * Cloud Functions entrypoint for treetopgrowthstrategy.com
 *
 * Each handler in ./handlers/ exports `handle(request: Request): Promise<Response>`,
 * matching the Fetch API. We adapt Express req/res from Firebase to Fetch and back
 * so the existing Astro-style handlers work unchanged.
 *
 * Routes are exposed under /api/* via Firebase Hosting rewrites in firebase.json.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.stackCheckout = exports.ecofitDemoRequest = exports.ecofitAssessmentSubmit = exports.quizSubmit = exports.trainingInquiry = exports.leadCapture = void 0;
const https_1 = require("firebase-functions/v2/https");
const v2_1 = require("firebase-functions/v2");
const lead_capture_1 = require("./handlers/lead-capture");
const training_inquiry_1 = require("./handlers/training-inquiry");
const quiz_submit_1 = require("./handlers/quiz-submit");
const ecofit_assessment_submit_1 = require("./handlers/ecofit-assessment-submit");
const ecofit_demo_request_1 = require("./handlers/ecofit-demo-request");
const stack_checkout_1 = require("./handlers/stack-checkout");
// Region: us-central1 (default). Set memory low — these are tiny handlers.
(0, v2_1.setGlobalOptions)({
    region: 'us-central1',
    memory: '256MiB',
    maxInstances: 10,
});
// Secrets used by the handlers (read at runtime via process.env).
// GITHUB_TOKEN intentionally omitted — was for the old Vercel auto-deploy report flow;
// on Firebase the handlers skip the GitHub push gracefully when the token is absent.
// AIRTABLE_BASE_ID is a non-secret config with a default fallback in code, not declared here.
const SECRETS = [
    'RESEND_API_KEY',
    'AIRTABLE_API_KEY',
    'STRIPE_SECRET_KEY',
];
/**
 * Adapt an Express-style Firebase request into a Fetch API Request,
 * call the handler, then write the Fetch Response back to the Express response.
 */
function makeFn(handle) {
    return (0, https_1.onRequest)({ secrets: [...SECRETS], cors: true }, async (req, res) => {
        try {
            // Build a Fetch-API Request from the Express req
            const url = `https://${req.hostname}${req.originalUrl || req.url}`;
            const method = req.method.toUpperCase();
            const headers = new Headers();
            for (const [k, v] of Object.entries(req.headers)) {
                if (Array.isArray(v))
                    headers.set(k, v.join(', '));
                else if (typeof v === 'string')
                    headers.set(k, v);
            }
            let body;
            if (method !== 'GET' && method !== 'HEAD') {
                // Firebase parses JSON bodies into req.body; rawBody is a Buffer of the raw payload
                if (req.rawBody) {
                    body = req.rawBody.toString('utf8');
                }
                else if (req.body != null) {
                    body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
                }
            }
            const fetchReq = new Request(url, { method, headers, body });
            const fetchRes = await handle(fetchReq);
            // Write fetch Response back to Express response
            res.status(fetchRes.status);
            fetchRes.headers.forEach((value, key) => {
                // Skip transfer-encoding (Express manages it)
                if (key.toLowerCase() === 'transfer-encoding')
                    return;
                res.setHeader(key, value);
            });
            const text = await fetchRes.text();
            res.send(text);
        }
        catch (err) {
            console.error('Function adapter error:', err);
            res.status(500).json({ error: 'Internal server error' });
        }
    });
}
// Public HTTPS functions — names map to firebase.json rewrites
exports.leadCapture = makeFn(lead_capture_1.handle);
exports.trainingInquiry = makeFn(training_inquiry_1.handle);
exports.quizSubmit = makeFn(quiz_submit_1.handle);
exports.ecofitAssessmentSubmit = makeFn(ecofit_assessment_submit_1.handle);
exports.ecofitDemoRequest = makeFn(ecofit_demo_request_1.handle);
exports.stackCheckout = makeFn(stack_checkout_1.handle);
//# sourceMappingURL=index.js.map