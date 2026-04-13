import { check, sleep } from "k6";
import { formatDate } from "./date_utils.js";
import { isNullOrEmpty } from "./common_utils.js";

/**
 * Classe destinada a métodos utilitários do k6
 */

/**
 * Compara status code esperado com status code retornado
 * @param {Response} response 
 * @param {int} status 
 * @returns 
 */
/**
 * Compara status code esperado com status code retornado
 * @param {Response} response 
 * @param {number} status 
 * @returns {boolean}
 */
export function checkStatusResponse(response, status) {
    if (!response) {
        throw new Error('checkStatusResponse: Response undefined');
    }
    if (!response.request) {
        throw new Error('checkStatusResponse: Request undefined');
    }

    let aux_log_err_message = '';
    let response_status_ok = response.status === status;

    if (!response_status_ok) {
        try { // tenta encontrar alguma informação para ajudar no log
            const body = JSON.parse(response.body);
            const body_message = body.message ? `\n${body.message}` : '';
            const body_err = body.error ? `\t${body.error}` : '';

            // Adiciona uma parte do log para auxiliar em logs
            // Da preferencia para montar a mensagem a partir do body.message não do boy.error
            aux_log_err_message = `${body_message}${body_err}`
                .replace(/\b\w+[.:]/g, '')
                .substring(0, 180); // limita quantidade de caracteres por conta de logs extensos
        } catch (error) {
            aux_log_err_message = '\nError parsing response body';
        }
    }

    if (response.status === 0) {
        console.warn('\nStatus code 0\n');
        console.log(response);
    }

    const message = `Status code esperado: ${status} - Status code retornado: ${response.status}${aux_log_err_message}`;

    return check(true, { [message]: response_status_ok });
}


/**
 * * Valida que os campos expected e returned sejam iguais;
 *  Caso seja informado no field [IGNORE] ou [WARNING] ou [WARN] ou [IGNORAR] ou [IGNORADO], o check será ignorado e colorido de amarelo
 * @param {*} field 
 * @param {*} expected 
 * @param {*} returned 
 * @returns 
 */
export function checkEquals(field, expected, returned) {
    let warning = field.includes('IGNORE') || field.includes('WARNING') || field.includes('WARN') || field.includes('IGNORAR') || field.includes('IGNORADO');

    if (!warning) {
        if (expected === undefined) {
            throw new Error('checkEquals: expected must be provided')
        }
        if (returned === undefined) {
            throw new Error('checkEquals: returned must be provided')
        }
    }

    let msg = warning ? '\x1b[33mCheckEquals\x1b[0m' : 'CheckEquals';

    if (warning) {
        return check(true, {
            [`${msg} ${field}`]: true
        });
    } else {
        let equal;

        if (typeof expected !== typeof returned) {
            throw new Error(`Comparação entre objetos diferentes [${field}: ${typeof expected} > ${typeof returned}]`);
        }
        if (typeof expected === 'number' && typeof returned === 'number') {
            if (Number.isFinite(expected) && Number.isFinite(returned)) {
                equal = Math.abs(expected - returned) < Number.EPSILON;// Comparação para floats com uma margem de erro mínima (epsilon)
            } else {
                equal = expected === returned; // números inteiros
            }
        } else if (typeof expected === 'boolean' && typeof returned === 'boolean') {
            equal = expected === returned;

        } else if (typeof expected === 'object' && typeof returned === 'object') {
            equal = JSON.stringify(expected) === JSON.stringify(returned);
        } else {
            equal = String(expected) === String(returned); // genérica
        }

        if (!equal) {
            return check(true, {
                [`${msg}: ${field}\tExpected: ${expected}\tReturned: ${returned}`]: equal
            });
        } else {
            return check(true, {
                [`${msg}: ${field}`]: equal
            });
        }
    }
}

/**
 * Valida que a seja maior que b
 * @param {String} field 
 * @param {*} a 
 * @param {*} b 
 * @returns 
 */
export function isGreaterThan(field, a, b) {
    if (a === undefined) {
        throw new Error('isGreaterThan: a must be provided');
    }

    if (b === undefined) {
        throw new Error('isGreaterThan: b must be provided');
    }

    let a_clzz = a.constructor.name;
    let b_clzz = a.constructor.name;

    if (a_clzz !== b_clzz) {
        throw new Error(`isGreaterThan: objects must be equals [${a_clzz}][${b_clzz}]`);
    }

    let aux_a;
    let aux_b;

    switch (a_clzz) {
        case 'Date':
            aux_a = new Date(a);
            aux_b = new Date(b);
            aux_a = formatDate(aux_a, 'dd/MM/yyyy HH:mm');
            aux_b = formatDate(aux_b, 'dd/MM/yyyy HH:mm');
        case 'String':
            aux_a = a.length;
            aux_b = b.length;
        case 'Number':
            aux_a = a;
            aux_b = b;
    }

    return check(true, {
        [`IsGreaterThan: O valor [${aux_a}]  deve ser maior que [${aux_b}] para o campo [${field}]`]: (r) => aux_a > aux_b
    });
}

/**
 * Valida que os campos expected e returned sejam diferente
 * @param {*} field 
 * @param {*} expected 
 * @param {*} returned 
 * @returns 
 */
export function checkNotEquals(field, expected, returned) {
    if (expected === undefined) {
        throw new Error('checkNotEquals: expected must be provided')
    }
    if (returned === undefined) {
        throw new Error('checkNotEquals: returned must be provided')
    }
    if (typeof expected !== typeof returned) {
        throw new Error(`Comparação entre objetos diferentes [${typeof expected} > ${typeof returned}]`);
    }

    return check(true, {
        [`CheckNotEquals [${field}]\tExpected: ${expected}\tReturned: ${returned}`]: !checkEquals(field, expected, returned)
    });
}

/**
 * Verifica com um check se o objeto passado é diferente de null ou undefined
 * @param {*} field 
 * @param {String} message 
 * @returns 
 */
export function checkNotNull(field, message) {
    let msg = `checkNotNull${message !== undefined ? ': ' + message : ''}`;
    if (field === undefined) {
        return check(true, {
            [msg]: false
        });
    } else if (field === null) {
        return check(true, {
            [msg]: false
        });
    } else if (field === '') {
        return check(true, {
            [msg]: false
        });
    } else {
        return check(true, {
            [msg]: true
        });
    }
}

/**
 * Compara duração da requisição esperado com  o retorna
 * @param {Response} response 
 * @param {milleseconds} duration 
 * @returns 
 */
export function maxDurationResponse(response, duration) {
    return check(response, {
        ["Max Duration Esperado: " + duration + " - Max Duration retornado: " + response.timings.duration]: (r) => r.timings.duration < duration
    });
}

/**
 * Aguardará a resposta da API, para "aquecer" a api, o tempo de sleep é definido pela variável de ambiente API_WARMUP_IN_SECONDS.
 * A primeira vez que fizer a requisição  à API, pode dermorar a resposta, por conta de cache, conexões, etc. O objetivo é que as próximas requisições sejam mais rápidas e estáveis.
 */
export function apiSleepOnWarmup() {
    if (isNullOrEmpty(__ENV.API_WARMUP_IN_SECONDS)) {
        throw new Error(`API_WARMUP_IN_SECONDS is ${__ENV.API_WARMUP_IN_SECONDS}`);
    }

    console.info(`Waiting for API Warmup => ${__ENV.API_WARMUP_IN_SECONDS} seconds - ${formatDate(new Date(), 'dd/MM/yyyy HH:mm:ss')}`);

    sleep(__ENV.API_WARMUP_IN_SECONDS);

    console.info(`Done sleep for Warmup => ${__ENV.API_WARMUP_IN_SECONDS} seconds - ${formatDate(new Date(), 'dd/MM/yyyy HH:mm:ss')}`);
}

export default {
    checkStatusResponse,
    maxDurationResponse,
    apiSleepOnWarmup,
    checkEquals,
    checkNotEquals,
    isGreaterThan,
    checkNotNull
};
