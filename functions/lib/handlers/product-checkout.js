"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handle = handle;
const stripe_1 = __importDefault(require("stripe"));
// Lazy init — secrets only at runtime
let _stripe = null;
function getStripe() {
    if (!_stripe) {
        _stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY || '', {
            apiVersion: '2025-02-24.acacia',
        });
    }
    return _stripe;
}
const PRODUCTS = {
    'gym-startup-budget-workbook-pro': {
        name: 'Gym Startup Budget Workbook — PRO Edition',
        description: '12-sheet interactive XLSX with live formulas, scenario toggles, format presets, capital-stack builder, and sensitivity tables. Single-user license. By Bill Colbert at Treetop Growth Strategy.',
        amount: 9900, // $99
        download_path: '/downloads/_dl-630a982a9e840f3fb2e6155863d1c5f5/gym-startup-budget-workbook-pro-2026-v1.xlsx',
        thank_you_path: '/gym-startup-budget-workbook-pro/thank-you',
    },
};
async function handle(request) {
    try {
        const { product } = await request.json();
        if (!product || !PRODUCTS[product]) {
            return new Response(JSON.stringify({ error: 'Invalid product selected' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        }
        const selected = PRODUCTS[product];
        const origin = new URL(request.url).origin;
        const session = await getStripe().checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'payment', // one-time, not subscription
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: selected.name,
                            description: selected.description,
                        },
                        unit_amount: selected.amount,
                    },
                    quantity: 1,
                },
            ],
            // Collect email + name; Stripe will email a receipt with link to thank-you page
            customer_creation: 'always',
            billing_address_collection: 'auto',
            metadata: {
                product,
                source: 'treetop-products',
            },
            payment_intent_data: {
                metadata: {
                    product,
                    source: 'treetop-products',
                },
            },
            success_url: `${origin}${selected.thank_you_path}?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${origin}/gym-startup-budget-workbook-pro?checkout=cancelled`,
        });
        return new Response(JSON.stringify({ url: session.url }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    catch (err) {
        console.error('product-checkout error:', err);
        return new Response(JSON.stringify({ error: err.message || 'Failed to create checkout session' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
}
;
//# sourceMappingURL=product-checkout.js.map