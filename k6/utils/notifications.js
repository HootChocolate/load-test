import http from 'k6/http';
import { checkStatusResponse } from './k6_utils.js';
import { body_teams } from './resources/teams/body_to_teams_notification.js';
import { isNullOrEmpty, nvl } from './common_utils.js';
import { jUnit, textSummary } from 'https://jslib.k6.io/k6-summary/0.1.0/index.js';

/**
 * to = Switch. Ex: TELEGRAM, TEAMS
 * 
 * Pode ser passado o tipo desejado de formatação para a mensagem, ou não.
 * 
 * Exemplo de formatações:
 * yaml, json, markdown, css, bash, python, sql, xml
 * @param {string} to 
 * @param {string} message 
 * @param {string} format
 */
export function sendMessage(to, message, format) {

    if (!isNullOrEmpty(__ENV.SEND_NOTIFICATION) && __ENV.SEND_NOTIFICATION == 'true') {
        console.info(`Enviando mensagem para ${to}...`)

        const text = (format ? '```' + format + '\n' + message + '\n```' : message);

        switch (to) {
            case 'TELEGRAM':
                sendMessageTelegram(text)
                break;
            case 'TEAMS':
                sendMessageTeams(text);
                break;
            default:
                throw new Error(`Send Message: ${to} not defined`);
        }
    } else {
        console.warn(`Skip sendMessage __ENV.SEND_NOTIFICATION: ${__ENV.SEND_NOTIFICATION}`);
    }
}

function sendMessageTeams(message) {
    if (isNullOrEmpty(__ENV.TEAMS_SIG)) {
        throw new Error(`Deve ser informado o parâmetro 'TEAMS_SIG' do teams para notificação`);
    }

    if (isNullOrEmpty(__ENV.TEAMS_WORKFLOW)) {
        throw new Error(`Deve ser informado o parâmetro 'TEAMS_WORKFLOW' do teams para notificação`);
    }

    const url = `https://prod-21.brazilsouth.logic.azure.com:443/workflows/${__ENV.TEAMS_WORKFLOW}/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=${__ENV.TEAMS_SIG}`

    const params = {
        headers: {
            'Content-Type': 'application/json'
        },
    };

    let body = JSON.stringify(body_teams);    

    body = body.replace('${MESSAGE}', message);

    try {
        const response = http.post(url, body, params);
        const status = response.status;

        if (!checkStatusResponse(response, 202)) {
            let body = JSON.stringify(response.body);
            console.error(`Erro ao tentar enviar mensagem para o Teams\nStatus: ${status}\nBody: ${body}`)

            //notificando erro no Telegram
            sendMessage('TELEGRAM', `Erro ao tentar enviar mensagem para o Teams\nStatus: ${status}\nBody: ${body}`, 'json')
        } else {
            console.info('Mensagem enviada para o Teams')
        }
    } catch (erro) {
        throw new Error(`Erro ao tentar enviar mensagem para o Teams\n${erro}`);
    }
}

/**
 * Realiza o envio da mensagem para o Telegram;
 * Valida preenchimento de dados __ENV.;
 * Valida retorno.
 * 
 * @param {string} message 
 */
function sendMessageTelegram(message) {
    if (isNullOrEmpty(__ENV.TELEGRAM_BOT_ID) === undefined) {
        throw new Error(`TELEGRAM_BOT_ID not defined`);
    }

    if (isNullOrEmpty(__ENV.TELEGRAM_CHAT_ID) === undefined) {
        throw new Error(`TELEGRAM_CHAT_ID not defined`);
    }

    const url = `https://api.telegram.org/bot${__ENV.TELEGRAM_BOT_ID}/sendMessage`;

    const body = {
        'chat_id': __ENV.TELEGRAM_CHAT_ID,
        'parse_mode': 'MarkdownV2',
        'text': message
    }

    const payload = JSON.stringify(body)

    const params = {
        headers: {
            'Content-Type': 'application/json'
        }
    }

    const response = http.post(url, payload, params);

    if (checkStatusResponse(response, 200)) {
        console.info('Mensagem enviada para o Telegram')
    } else {
        const err = response.body

        if (err.includes('Bad Request: message is too long')) {
            sendMessage('TELEGRAM', `Erro no envio de mensagem para o Telegram\nBad Request: message is too long`, 'markdown')
        } else {
            console.error(`Erro no envio de mensagem para o Telegram\n${err}\n`);
        }
    }
}

/** Desmonatagem
 * Verificando se houveram erros críticos
 * @param {*} data 
 * @returns 
 */
export function generateReportAndNotify(data) {
    const text_report = textSummary(data, { indent: ' ', enableColors: true })
    const jUnit_report = jUnit(data);
    
    const jUnit_report_alterado = tratarXmlAlterandoTotalizadorDeTeste(data);

    const to = 'TEAMS';

    const critical_err = []

    for (const [metric, value] of Object.entries(data.metrics)) {
        // considera que se não passou na validação de check é um erro crítico        
        if (metric !== 'checks') {
            continue;
        } else {
            const check_obj = value;
            const values = check_obj.values;

            if (values.fails > 0) {
                critical_err.push(values.fails)
            }
        }
    }

    let mensagem = '';

    if (critical_err.length > 0) { // houve métricas falhadas

        mensagem = generateFilteredReport(text_report, true);

        sendMessage(to, mensagem);
    } else {

        // caso necessário notificar quando os testes rodaram sem falhas, informar NOTIFY_ON_SUCCESS=true no .env
        if (!isNullOrEmpty(__ENV.NOTIFY_ON_SUCCESS) && __ENV.NOTIFY_ON_SUCCESS == 'true') {
            mensagem = generateFilteredReport(text_report, false);

            sendMessage(to, `\tTestes executados com sucesso\n\n${mensagem}`);
        } else {
            console.info(`Não será notificado teste de sucesso. NOTIFY_ON_SUCCESS=${__ENV.NOTIFY_ON_SUCCESS}`);
        }
    }
    
    
    return {
        stdout: text_report, // imeprime log do k6 no console
        "./api/reports/k6-test_results-junit.xml": jUnit_report_alterado
    };
}

function tratarXmlAlterandoTotalizadorDeTeste(data) {

    const checks = data.metrics.checks;
    const passes = checks.values.passes;
    const fails = checks.values.fails
    
    const xmlOriginal =  jUnit(data);

    const aux_tests = 'tests="';
    const aux_failures = 'failures="';

    const tests = parseInt(xmlOriginal.split(aux_tests)[0].split('"')[1]);
    const failures = parseInt(xmlOriginal.split(aux_failures)[0].split('"')[1]);

    return xmlOriginal
        .replace(` ${aux_tests}${tests}" `, ` ${aux_tests}${passes}" `)
        .replace(` ${aux_failures}${failures}" `, ` ${aux_failures}${fails}" `);
}

/**
 * Trata a mensagem de erro para que sejam enviadas apenas as verificações que falharam, e com cores
 * @param {string} mensagem
 * @param {boolean} houve_erro
 * @returns {string} mensagem_filtrada
 */
function generateFilteredReport(mensagem, houve_erro) {

    let mensagem_filtrada = "";

    if (houve_erro) {
        // Quebrar a mensagem por linhas
        const linhas = mensagem.split('\n');
        const mensagem_montada = [];

        // itera nas linhas de log
        for (let i = 0; i < linhas.length; i++) {

            let linha = linhas[i];

            if (!isNullOrEmpty(linha.trim())) {
                if (linha.trim().includes('✗')) {     // linha com erro

                    mensagem_montada.unshift(`${linha.trimEnd()}`); // adiciona linha de erro a bloco de erros, na cor vermelha

                } else if (!linha.includes('✓')) {    // Ignorar linhas que contenham sucesso (✓)

                    mensagem_montada.unshift(linha.trimEnd());    // adiciona linha de log
                }
            }
        }

        // constroi mensagem de retorno de erros    
        for (let i = mensagem_montada.length - 1; i >= 0; i--) {
            mensagem_filtrada = mensagem_filtrada + mensagem_montada[i] + '\n';
        }
    } else {
        // Trata mensagem de sucesso para remover linhas em branco, são muitas e o log fica grande
        // Quebrar a mensagem por linhas
        const linhas = mensagem.split('\n');

        const mensagem_montada = [];

        // itera nas linhas de log de sucesso
        for (let i = 0; i < linhas.length; i++) {

            let linha = linhas[i];

            if (!isNullOrEmpty(linha.trim())) {
                if (linha.trim().includes('█') && !linha.trim().includes('✓')) {    // linha com nome do teste
                    mensagem_montada.unshift(linha.trimEnd());

                } else if (!linha.includes('✗') && !linha.includes('✓')) { // linha de metricas
                    mensagem_montada.unshift(linha.trimEnd());

                } else if (linha.includes('█')) {   // linha com nome de teste
                    mensagem_montada.unshift(linha.trimEnd());

                } else if (linha.includes('✓') && linha.includes('checks')) {  //linha do resultado dos checks

                    mensagem_montada.unshift(linha.trimEnd());

                } else {
                    
                    // Linha com nome do check que passou
                    // Já desconsiderando linha de checks tratado acima, e demais linhas de checks como http_req_duration
                    if (linha.includes('✓') && !linha.includes('✗')) {
                        mensagem_montada.unshift(`${linha.trimEnd()}`); // cor verde
                    } else {
                        continue;
                    }
                }
            }

        }

        // constroi mensagem de retorno
        for (let i = mensagem_montada.length - 1; i >= 0; i--) {
            let m = mensagem_montada[i];
            if (!isNullOrEmpty(m)) {
                mensagem_filtrada += mensagem_montada[i] + '\n'
            }
        }
    }

    // remove caracteres ASCI de cores de logs
    const ansiRegex = /[\u001b\u009b][[()#;?]*(?:(\d{1,4}(?:;\d{0,4})*)?[\dA-PR-TZcf-ntqry=><~])/g;
    mensagem_filtrada = mensagem_filtrada.replace(ansiRegex, '');

    return mensagem_filtrada;
}

export default {
    sendMessage,
    generateReportAndNotify
};