// inicialização
import { group } from "k6";
import { generateReportAndNotify } from '/utils/notifications.js';
import { commonOptions } from "/utils/common_config.js";
import { apiSleepOnWarmup } from '/utils/k6_utils.js';

// importa os warmup
import { warmupAPI as warmup_pedidos } from './analise_dados/pedidos/pedidos_test.js';
// importa os testes
import test_pedidos from './analise_dados/pedidos/pedidos_test.js';


//libs de apoio
import { describe } from "https://jslib.k6.io/expect/0.0.5/index.js";

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
    describe('Warmup testes pasta BI', async (t) => {
        warmup_pedidos();
    });
}

// execução
/**
 * Adicione aqui os testes individuais
 */
export default function () {
    group('Pedidos', () => {
        test_pedidos();
    })
}

// desmontagem
export function handleSummary(data) {
    return generateReportAndNotify(data);
}

export function teardown() {
    console.log('teardown...');
}
