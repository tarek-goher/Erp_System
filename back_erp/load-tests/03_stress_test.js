/**
 * 💥 Stress Test — 150 Concurrent Users
 *
 * ده التست الأهم — بيحدد الـ breaking point
 * شغّله بعد ما تتأكد إن الـ normal tests بتنجح
 *
 * الاستخدام:
 *   k6 run load-tests/03_stress_test.js
 *
 * ⚠️ تحذير: التست ده ممكن يأثر على الـ database
 *    شغّله على staging مش production
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('error_rate');
const BASE_URL  = __ENV.BASE_URL || 'http://localhost:8000';

export const options = {
    scenarios: {
        stress: {
            executor: 'ramping-vus',
            startVUs: 0,
            stages: [
                { duration: '2m',  target: 50  },  // هنا نشوف: 50 user
                { duration: '3m',  target: 50  },  // ثبّت الحمل
                { duration: '2m',  target: 100 },  // ارفع لـ 100
                { duration: '3m',  target: 100 },  // ثبّت تاني
                { duration: '2m',  target: 150 },  // اضغط أكتر
                { duration: '3m',  target: 150 },  // 150 concurrent user
                { duration: '3m',  target: 0   },  // Recovery
            ],
        },
    },
    thresholds: {
        // في الـ stress test — نقبل performance أبطأ شوية
        'http_req_duration': ['p(95)<5000'],  // 5 ثوان max
        'error_rate':        ['rate<0.10'],   // max 10% errors under stress
    },
};

export function setup() {
    const res = http.post(
        `${BASE_URL}/api/auth/login`,
        JSON.stringify({ email: 'admin@company1.com', password: 'password123' }),
        { headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' } }
    );

    if (res.status !== 200) {
        console.error('Setup فشل');
        return { token: null };
    }

    return { token: JSON.parse(res.body).token };
}

export default function (data) {
    if (!data.token) return;

    const headers = {
        'Authorization': `Bearer ${data.token}`,
        'Accept':        'application/json',
        'Content-Type':  'application/json',
    };

    // خليط من الـ endpoints الأكتر استخداماً
    const endpoints = [
        { method: 'GET', url: '/api/sales?per_page=15' },
        { method: 'GET', url: '/api/products?per_page=15' },
        { method: 'GET', url: '/api/customers?per_page=15' },
        { method: 'GET', url: '/api/employees?per_page=15' },
        { method: 'GET', url: '/api/reports/dashboard' },
        { method: 'GET', url: '/api/accounts' },
    ];

    // اختار endpoint عشوائي
    const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
    const res      = http.get(`${BASE_URL}${endpoint.url}`, { headers });

    const ok = check(res, {
        'status not 500': (r) => r.status !== 500,
        'status not 429': (r) => r.status !== 429, // Rate limit
        'responded':      (r) => r.status < 600,
    });

    errorRate.add(!ok);

    if (res.status === 429) {
        console.log('⚠️  Rate limit hit — السيرفر بيحمي نفسه');
        sleep(2);
    } else if (res.status >= 500) {
        console.log(`❌ Server Error: ${res.status} on ${endpoint.url}`);
    }

    sleep(Math.random() * 2 + 0.5); // 0.5 - 2.5 seconds random
}

export function handleSummary(data) {
    const p95    = data.metrics.http_req_duration?.values?.['p(95)'] || 0;
    const errors = (data.metrics.error_rate?.values?.rate || 0) * 100;
    const reqs   = data.metrics.http_reqs?.values?.count || 0;

    let verdict = '✅ الـ server اتحمّل الضغط';
    if (errors > 10)   verdict = '❌ في مشاكل تحت الضغط — راجع الـ logs';
    else if (p95 > 5000) verdict = '⚠️  بطيء تحت الضغط — ممكن تحتاج optimization';

    console.log(`
╔══════════════════════════════════════════╗
║        نتائج Stress Test (150 VU)        ║
╠══════════════════════════════════════════╣
║  Total Requests : ${String(reqs).padEnd(22)}║
║  p95 Duration   : ${String(Math.round(p95) + 'ms').padEnd(22)}║
║  Error Rate     : ${String(errors.toFixed(2) + '%').padEnd(22)}║
╠══════════════════════════════════════════╣
║  الحكم: ${verdict.padEnd(33)}║
╚══════════════════════════════════════════╝
    `);

    return {
        'load-tests/results/stress_test_results.json': JSON.stringify(data, null, 2),
    };
}
