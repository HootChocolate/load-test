// inicialização
import { group } from "k6";
import { generateReportAndNotify } from '/utils/notifications.js';
// bi
import { warmupAPI as warmup_bi } from './bi/index_bi.js';
import index_bi from './bi/index_bi.js';

//libs de apoio
import { describe } from "https://jslib.k6.io/expect/0.0.5/index.js";
import { commonOptions } from "/utils/common_config.js";
import { apiSleepOnWarmup } from '/utils/k6_utils.js';

// configuracao
export const options = commonOptions;

/**
 * setup só executa quando executa esse arquivo. no index tem um setup também, mas se executar o index e chamar esse arquivo, o setup daqui não será executado
 */
export function setup() {
    warmupAPI()

    apiSleepOnWarmup();
}

export function warmupAPI() {
    describe('Warmup index Cliente', async (t) => {
        warmup_bi();
        // demais testes do conjunto de teste
    });
}

// execucao
export default function () {
    group('BI tests', () => {
        index_bi()
    });
}

// desmontagem
export function handleSummary(data) {
    return generateReportAndNotify(data);
}

export function teardown() {
    console.log('teardown...');
}
