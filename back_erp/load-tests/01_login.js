/**
 * 🔥 Load Test — Login Endpoint
 *
 * الاستخدام:
 *   k6 run load-tests/01_login.js
 *   k6 run --vus 50 --duration 60s load-tests/01_login.js
 *
 * التثبيت:
 *   https://k6.io/docs/get-started/installation/
 *   brew install k6  (Mac)
 *   choco install k6  (Windows)
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// ── Custom Metrics ────────────────────────────────────────────────────────
const errorRate  = new Rate('error_rate');
const loginTrend = new Trend('login_duration', true);

// ── Config ────────────────────────────────────────────────────────────────
const BASE_URL = __ENV.BASE_URL || 'http://localhost:8000';

// ── Test Scenarios ────────────────────────────────────────────────────────
export const options = {
    scenarios: {
        // سيناريو 1: ramp up تدريجي
        ramp_up: {
            executor: 'ramping-vus',
            startVUs: 0,
            stages: [
                { duration: '30s', target: 10  },  // Warm up
                { duration: '1m',  target: 50  },  // النص الأول
                { duration: '1m',  target: 100 },  // الحمل الكامل
                { duration: '30s', target: 0   },  // Cool down
            ],
        },
    },
    thresholds: {
        // الـ API لازم تفضل سريعة تحت الضغط
        'http_req_duration': ['p(95)<2000', 'p(99)<5000'],
        'error_rate':        ['rate<0.05'],   // error أقل من 5%
        'login_duration':    ['p(95)<1500'],  // login أقل من 1.5 ثانية
    },
};

// ── Test Data ─────────────────────────────────────────────────────────────
// غيّر دي ببيانات حقيقية
const TEST_USERS = [
    { email: 'admin@company1.com', password: 'password123' },
    { email: 'admin@company2.com', password: 'password123' },
    { email: 'admin@company3.com', password: 'password123' },
];

// ── Main Test Function ────────────────────────────────────────────────────
export default function () {
    const user = TEST_USERS[Math.floor(Math.random() * TEST_USERS.length)];

    const payload = JSON.stringify({
        email:    user.email,
        password: user.password,
    });

    const params = {
        headers: {
            'Content-Type': 'application/json',
            'Accept':       'application/json',
        },
    };

    const startTime = Date.now();
    const res       = http.post(`${BASE_URL}/api/auth/login`, payload, params);
    const duration  = Date.now() - startTime;

    loginTrend.add(duration);

    const success = check(res, {
        'status is 200':          (r) => r.status === 200,
        'has token':              (r) => {
            try {
                const body = JSON.parse(r.body);
                return body.token !== undefined;
            } catch { return false; }
        },
        'response time < 2000ms': (r) => r.timings.duration < 2000,
    });

    errorRate.add(!success);

    if (!success) {
        console.log(`❌ Login فشل: status=${res.status} | body=${res.body.substring(0, 200)}`);
    }

    sleep(1); // انتظر ثانية بين الـ requests — realistic behavior
}

// ── Summary ───────────────────────────────────────────────────────────────
export function handleSummary(data) {
    return {
        'load-tests/results/login_results.json': JSON.stringify(data, null, 2),
        stdout: formatSummary(data),
    };
}

function formatSummary(data) {
    const metrics = data.metrics;
    const p95     = metrics.http_req_duration?.values?.['p(95)'] || 0;
    const p99     = metrics.http_req_duration?.values?.['p(99)'] || 0;
    const errors  = (metrics.error_rate?.values?.rate || 0) * 100;
    const reqs    = metrics.http_reqs?.values?.count || 0;

    return `
╔══════════════════════════════════════╗
║        نتائج Login Load Test         ║
╠══════════════════════════════════════╣
║  Total Requests : ${String(reqs).padEnd(18)}║
║  p95 Duration   : ${String(Math.round(p95) + 'ms').padEnd(18)}║
║  p99 Duration   : ${String(Math.round(p99) + 'ms').padEnd(18)}║
║  Error Rate     : ${String(errors.toFixed(2) + '%').padEnd(18)}║
╚══════════════════════════════════════╝
    `;
}
