// inicialização
import { sleep } from "k6";
import http from 'k6/http';
import { generateReportAndNotify } from '@utils/notifications.js';
import { apiSleepOnWarmup, checkSchema, checkStatusResponse, k6Log, SECOND } from '@utils/k6_utils.js';
import { commonOptions } from "@utils/common_config.js";

// lib de apoio
import { describe } from "https://jslib.k6.io/expect/0.0.5/index.js";

import exampleTestSchema from './resources/example_test_schema.js';

// configuração
/// stages controla usuários
export const options = {
    stages: [
        { target: 2 , duration: '5s' },
        { target: 5 , duration: '10s' },
        { target: 0 , duration: '5s' }
    ],
    thresholds: {
        checks: ['rate>0.99'],          // 99% dos checks devem passar
    },
};

// Para descobrir ponto de quebra:
// Para testes EXTREMOS use constant-arrival-rate
// export const options = {
//     scenarios: {
//         stress: {
//             executor: 'ramping-arrival-rate',

//             startRate: 10,
//             timeUnit: '1s',

//             preAllocatedVUs: 100,
//             maxVUs: 5000,

//             stages: [
//                 { target: 100, duration: '30s' },
//                 { target: 500, duration: '30s' },
//                 { target: 1000, duration: '30s' },
//             ],
//         },
//     },
// };

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

    return response
}

// execuçao
export default function () {
    const response = callAPI(false);

    checkStatusResponse(response, 200);
    
    checkSchema(response, exampleTestSchema, "Request /posts")
}

// desmontagem
export function handleSummary(data) {
    return generateReportAndNotify(data)
}