// inicialização
import { group } from 'k6';
import { generateReportAndNotify } from '/utils/notifications.js'

// um import para warmUp e um para executar a default function
import { warmupAPI as warmupAPI_example_project } from './api/project/index_example.js';

import index_example_project from './api/project/index_example.js';


import { commonOptions } from '/utils/common_config.js';
import { apiSleepOnWarmup } from '/utils/k6_utils.js';

// configuração
export const options = commonOptions;

// inicialização
/**
 * setup só executa quando executa o arquivo index que for chamado, um setup não sobreescreve outro.
 * 
 * Todos os setup precisam tem a chamada warmup e o sleepOnWarmup.
 */
export function setup() {

    warmupAPI_example_project();

    apiSleepOnWarmup();
}

// execução
export default function () {
    group('Example project', () => {
        index_example_project();
    });
    // demais grupos do conjunto de teste
}

// desmonatagem
export function handleSummary(data) {
    return generateReportAndNotify(data);
}

export function teardown() {
    console.log('teardown...');
}