/**
 * 🔥 Load Test — Sales & Invoice Flow
 *
 * بيختبر:
 *  1. Login
 *  2. Create Sale
 *  3. Fetch Sales List
 *  4. Fetch Dashboard Stats (Report)
 *
 * الاستخدام:
 *   k6 run load-tests/02_sales_flow.js
 *   k6 run --vus 30 --duration 2m load-tests/02_sales_flow.js
 *   BASE_URL=https://your-server.com k6 run load-tests/02_sales_flow.js
 */

import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// ── Custom Metrics ────────────────────────────────────────────────────────
const errorRate       = new Rate('error_rate');
const salesCreated    = new Counter('sales_created');
const apiCallDuration = new Trend('api_call_duration', true);

// ── Config ────────────────────────────────────────────────────────────────
const BASE_URL = __ENV.BASE_URL || 'http://localhost:8000';

export const options = {
    scenarios: {
        normal_load: {
            executor: 'ramping-vus',
            startVUs: 0,
            stages: [
                { duration: '20s', target: 10 },   // Warm up
                { duration: '1m',  target: 30 },   // Normal load
                { duration: '30s', target: 50 },   // Peak
                { duration: '30s', target: 0  },   // Down
            ],
        },
    },
    thresholds: {
        'http_req_duration': ['p(95)<3000'],
        'error_rate':        ['rate<0.05'],
        'api_call_duration': ['p(95)<2500'],
    },
};

// ── Setup: Login مرة واحدة واحفظ الـ token ──────────────────────────────
export function setup() {
    const loginRes = http.post(
        `${BASE_URL}/api/auth/login`,
        JSON.stringify({ email: 'admin@company1.com', password: 'password123' }),
        { headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' } }
    );

    if (loginRes.status !== 200) {
        console.error('❌ Setup login فشل — تأكد من بيانات الـ test user');
        return { token: null };
    }

    const body = JSON.parse(loginRes.body);
    console.log('✅ Setup: Login نجح');
    return { token: body.token };
}

// ── Main Test ────────────────────────────────────────────────────────────
export default function (data) {
    if (!data.token) {
        console.error('❌ مفيش token — التست هيفشل');
        return;
    }

    const headers = {
        'Content-Type':  'application/json',
        'Accept':        'application/json',
        'Authorization': `Bearer ${data.token}`,
    };

    // ── Group 1: Fetch Data ──────────────────────────────────────────────
    group('Fetch Sales List', function () {
        const start = Date.now();
        const res   = http.get(`${BASE_URL}/api/sales?page=1&per_page=15`, { headers });
        apiCallDuration.add(Date.now() - start);

        const ok = check(res, {
            'sales list 200': (r) => r.status === 200,
            'has data key':   (r) => {
                try { return JSON.parse(r.body).data !== undefined; }
                catch { return false; }
            },
        });
        errorRate.add(!ok);
    });

    sleep(0.5);

    // ── Group 2: Create Sale ─────────────────────────────────────────────
    group('Create Sale', function () {
        const salePayload = JSON.stringify({
            customer_id:    1,
            date:           new Date().toISOString().split('T')[0],
            payment_method: 'cash',
            notes:          'Load test sale',
            items: [
                { product_id: 1, quantity: 2, unit_price: 100, tax_rate: 14 },
                { product_id: 2, quantity: 1, unit_price: 250, tax_rate: 14 },
            ],
        });

        const start = Date.now();
        const res   = http.post(`${BASE_URL}/api/sales`, salePayload, { headers });
        apiCallDuration.add(Date.now() - start);

        const ok = check(res, {
            'sale created 201': (r) => r.status === 201,
            'has sale id':      (r) => {
                try { return JSON.parse(r.body).data?.id !== undefined; }
                catch { return false; }
            },
        });

        errorRate.add(!ok);
        if (ok) salesCreated.add(1);
    });

    sleep(0.5);

    // ── Group 3: Dashboard Report ────────────────────────────────────────
    group('Fetch Dashboard Stats', function () {
        const start = Date.now();
        const res   = http.get(`${BASE_URL}/api/reports/dashboard`, { headers });
        apiCallDuration.add(Date.now() - start);

        const ok = check(res, {
            'dashboard 200': (r) => r.status === 200,
        });
        errorRate.add(!ok);
    });

    sleep(1);
}

// ── Teardown ──────────────────────────────────────────────────────────────
export function teardown(data) {
    if (data.token) {
        http.post(
            `${BASE_URL}/api/auth/logout`,
            null,
            { headers: { 'Authorization': `Bearer ${data.token}`, 'Accept': 'application/json' } }
        );
        console.log('✅ Teardown: Logout نجح');
    }
}

export function handleSummary(data) {
    return {
        'load-tests/results/sales_flow_results.json': JSON.stringify(data, null, 2),
    };
}
