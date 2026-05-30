import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.K6_BASE_URL || 'http://localhost:3000';

export const options = {
  stages: [
    { duration: '30s', target: 50 },
    { duration: '1m30s', target: 50 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(50)<100', 'p(95)<500', 'p(99)<1000'],
    http_req_failed: ['rate<0.01'],
    http_reqs: ['rate>100'],
  },
};

export default function () {
  const health = http.get(`${BASE_URL}/`);
  check(health, {
    'GET / status 200': (r) => r.status === 200,
  });

  const swagger = http.get(`${BASE_URL}/api`);
  check(swagger, {
    'GET /api status 200': (r) => r.status === 200,
  });

  sleep(0.1);
}
