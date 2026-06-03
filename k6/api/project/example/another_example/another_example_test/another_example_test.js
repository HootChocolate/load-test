// inicialização
import { sleep } from "k6";
import http from 'k6/http';
import { generateReportAndNotify } from '@utils/notifications.js';
import { apiSleepOnWarmup, checkSchema, checkStatusResponse, SECOND } from '@utils/k6_utils.js';
import { commonOptions } from "@utils/common_config.js";
import anotherExampleTest from "./resources/another_example_test_schema.js";

// configuração
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

export function setup() {
    warmupAPI()

    apiSleepOnWarmup();
};

export function warmupAPI() {
    return callAPI(true)
}

// requisição
export function callAPI(isWarmup) {

    const url = `${__ENV.API_BASE_URL}/comments`;

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
    const response = callAPI(false)

    checkStatusResponse(response, 200)

    checkSchema(response, anotherExampleTest, "Request /comments")
}

// desmontagem
export function handleSummary(data) {
    return generateReportAndNotify(data)
}