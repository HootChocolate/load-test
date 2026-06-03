// inicialização
import { group } from "k6";
import { generateReportAndNotify } from '@utils/notifications.js';
import { commonOptions } from "@utils/common_config.js";
import { apiSleepOnWarmup } from '@utils/k6_utils.js';

// importa os warmup
import { warmupAPI as warmup_example_test } from './conjunto_example/example_test/example_test.js';
// importa os testes
import test_example from './conjunto_example/example_test/example_test.js';


//libs de apoio
import { describe } from "https://jslib.k6.io/expect/0.0.5/index.js";
import { warmupAPI as warmup_another_example_test } from "./another_example/another_example_test/another_example_test.js";
import another_example_test from "./another_example/another_example_test/another_example_test.js";

// configuracao
export const options = commonOptions;

export function setup() {
    warmupAPI()

    apiSleepOnWarmup();
}

/**
 * Adicione aqui os warmup de testes
 */
export function warmupAPI() {
    describe('Warmup testes pasta Example', async (t) => {
        warmup_example_test();
        warmup_another_example_test();
    });
}

// execução
/**
 * Adicione aqui os testes individuais
 */
export default function () {
    group('Teste', () => {
        test_example();
    })

    group('Outro Teste', () => {
        test_example();
        another_example_test();
    })
}

// desmontagem
export function handleSummary(data) {
    return generateReportAndNotify(data);
}

export function teardown() {
    console.log('teardown...');
}
