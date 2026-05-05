// inicialização
import { sleep } from "k6";
import http from 'k6/http';
import { generateReportAndNotify } from '/utils/notifications.js';
import { apiSleepOnWarmup, checkStatusResponse } from '/utils/k6_utils.js';
import { isNullOrEmpty } from '/utils/common_utils.js';
import { commonOptions } from "/utils/common_config.js";

// lib de apoio
import { describe } from "https://jslib.k6.io/expect/0.0.5/index.js";

import { pedidos_schema as example_test_schema } from './resources/example_test_schema.js';

// configuração
export const options = {
    stages: [
        { duration: '30s', target: 20 }, // Sobe de 0 para 20 usuários em 30 segundos
        { duration: '1m', target: 20 },  // Mantém 20 usuários por 1 minuto
        { duration: '30s', target: 0 },  // Desce para 0 usuários em 30 segundos
    ],
    thresholds: {
        // http_req_duration: ['p(95)<500'], // 95% das requisições devem ser < 500ms
        http_req_failed: ['rate<0.01'],   // Menos de 1% de erro
    },
};

export function setup() {
    warmupAPI()

    apiSleepOnWarmup();
};

export function warmupAPI() {
    return callAPI(true)
}

// requisição
export function callAPI(isWarmup) {

    const url = `${__ENV.API_BASE_URL}/posts/1`;

    const params = {
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
    }

    let response;

    if (isWarmup) {
        response = http.asyncRequest('GET', url, undefined, params)
    } else {
        response = http.get(url, params)
    }

    sleep(1);

    return response
}

// execuçao
export default function () {
    const response = callAPI(false);

    checkStatusResponse(response, 200);

    if (isNullOrEmpty(response.body)) {
        return;
    }

    let responseBody;

    try {
        responseBody = JSON.parse(response.body);
    } catch (error) {
        console.error("Error parsing JSON:", error, "Response Body:", response.body);
        return;
    }

    if (!isNullOrEmpty(responseBody.results)) {
        describe('Valida Schema', (t) => {

            let results = responseBody.results[0];

            t.expect(results).toMatchAPISchema(example_test_schema);
        });
    }
}

// desmontagem
export function handleSummary(data) {
    return generateReportAndNotify(data)
}