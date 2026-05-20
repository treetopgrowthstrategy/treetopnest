"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handle = handle;
const stripe_1 = __importDefault(require("stripe"));
// Lazy init — secrets are only injected when the function runs, not at module load
let _stripe = null;
function getStripe() {
    if (!_stripe) {
        _stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY || '', {
            apiVersion: '2025-02-24.acacia',
        });
    }
    return _stripe;
}
const PLANS = {
    starter: {
        name: 'Managed Stack — Starter',
        amount: 39900,
        description: 'Hosting, domain/SSL, transactional email, form→CRM routing, analytics, uptime monitoring, 2hrs updates/mo',
    },
    growth: {
        name: 'Managed Stack — Growth',
        amount: 59900,
        description: 'Everything in Starter + 4hrs updates/mo, landing pages, lead funnels, GA4/GSC, monthly strategy call',
    },
    scale: {
        name: 'Managed Stack — Scale',
        amount: 79900,
        description: 'Everything in Growth + 8hrs updates/mo, SEO content, email campaigns, bi-weekly calls, dedicated Slack',
    },
};
async function handle(request) {
    try {
        const { plan } = await request.json();
        if (!plan || !PLANS[plan]) {
            return new Response(JSON.stringify({ error: 'Invalid plan selected' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        }
        const selected = PLANS[plan];
        const origin = new URL(request.url).origin;
        const session = await getStripe().checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'subscription',
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: selected.name,
                            description: selected.description,
                        },
                        unit_amount: selected.amount,
                        recurring: { interval: 'month' },
                    },
                    quantity: 1,
                },
            ],
            metadata: {
                plan,
                source: 'treetop-managed-stack',
            },
            subscription_data: {
                metadata: {
                    plan,
                    source: 'treetop-managed-stack',
                },
            },
            success_url: `${origin}/stack?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${origin}/stack?checkout=cancelled`,
        });
        return new Response(JSON.stringify({ url: session.url }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    catch (err) {
        console.error('stack-checkout error:', err);
        return new Response(JSON.stringify({ error: err.message || 'Failed to create checkout session' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
}
;
//# sourceMappingURL=stack-checkout.js.map