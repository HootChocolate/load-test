import http from 'k6/http';
import { checkStatusResponse, k6Log } from './k6_utils.js';
import { body_teams } from './resources/teams/body_to_teams_notification.js';
import { isNullOrEmpty, nvl } from './common_utils.js';
import { jUnit, textSummary } from 'https://jslib.k6.io/k6-summary/0.1.0/index.js';
import { toSentenceCase } from './string_utils.js';
import date_utils from './date_utils.js';

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
        console.info(`💬 [${toSentenceCase(to)}] Enviando mensagem...`)

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
        console.info(`Skip sendMessage __ENV.SEND_NOTIFICATION: ${__ENV.SEND_NOTIFICATION}`);
    }
}

function sendMessageTeams(message) {
    const url = __ENV.TEAMS_URL;
    const params = {
        headers: {
            'Content-Type': 'application/json'
        },
    };
    const title = "K6 - Monitoramento de API frontend";

    let body = JSON.stringify(body_teams);    

    body = body.replace('${TITLE}', title);
    body = body.replace('${MESSAGE}', message);
    body = body.replace('${REALM}', nvl(`${__ENV.REALM}`, 'Not defined on -e REALM=${}'));
    body = body.replace('${TEST_CONTEXT}', nvl(`${__ENV.TEST_CONTEXT}`), 'Not defined on -e TEST_CONTEXT=${}');    

    try {
        const response = http.post(url, body, params);
        const status = response.status;

        if (!checkStatusResponse(response, 202)) {
            let body = JSON.stringify(response.body);
            console.error(`[TEAMS] Erro ao tentar enviar mensagem para o Teams\nStatus: ${status}\nBody: ${body}`)

            //notificando erro no Telegram
            sendMessage('TELEGRAM', `Erro ao tentar enviar mensagem para o Teams\nStatus: ${status}\nBody: ${body}`, 'json')
        } else {
            console.info('[TEAMS] Mensagem enviada com sucesso!')
        }
    } catch (erro) {
        throw new Error(`[TEAMS] ERRO => Envio de mensagem: \n${erro}`);
    }
}

function escapeMarkdownV2(text) {
    return String(text).replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&');
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

    const url = `https://api.telegram.org/${__ENV.TELEGRAM_BOT_ID}/sendMessage`;
    const parseMode = 'MarkdownV2';

    let text = "";
    if (__ENV.API_BASE_URL) {
        text += `📡 API Base URL: ${escapeMarkdownV2(__ENV.API_BASE_URL)}\n\n`;
    }
    if (__ENV.PIPELINE_TEST) {
        text += `🔁 Pipeline Test: ${escapeMarkdownV2(__ENV.PIPELINE_TEST)}\n\n`;
    }
    if (__ENV.DASHBOARD_TESTS_RESULT) {
        text += `[📈 Test Results Dashboard](${__ENV.DASHBOARD_TESTS_RESULT})\n\n`;
    }
    if (__ENV.GRAFANA_DASHBOARD) {
        text += `[📊 Grafana Dashboard](${__ENV.GRAFANA_DASHBOARD})\n\n`;
    }
    
    const now = date_utils.formatDate(new Date(), 'dd/MM/yyyy HH:mm:ss');

    text += `📅 Executado em: ${escapeMarkdownV2(now)}\n\n`
    text += `\`\`\`yaml\n${message}\n\`\`\``

    const body = {
        'chat_id': __ENV.TELEGRAM_CHAT_ID,
        'parse_mode': parseMode,
        'text': text
    }

    const payload = JSON.stringify(body)

    const params = {
        headers: {
            'Content-Type': 'application/json'
        }
    }

    const response = http.post(url, payload, params);

    const ok = checkStatusResponse(response, 200, "Telegram");

    if (ok) {
        console.info('[TELEGRAM] Mensagem enviada com sucesso!')
    } else {
        const err = response.body

        console.info('[TELEGRAM] Erro no envio da mensagem!')
        console.info(err)
        
        if (err.includes('Bad Request: message is too long')) {
            sendMessageTelegram('Erro no envio de mensagem para o Telegram\nBad Request: message is too long')
        } else {
            const dot = "--------------------------------------------------------------------------------------------"
            throw new Error(`[TELEGRAM] ERRO => Envio de mensagem: \n${dot}\n${JSON.stringify(JSON.parse(err))}\n${dot}`);
        }
    }
}

/** Desmonatagem
 * Verificando se houveram erros críticos da API do HUB p/ notificar
 * @param {*} data 
 * @returns 
 */
export function generateReportAndNotify(data) {
    const text_report = textSummary(data, { indent: ' ', enableColors: true })
    const jUnit_report = jUnit(data);

    const reportName = __ENV.REPORT_NAME || 'k6-default-report';

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

    const hasError = critical_err.length > 0
    const message = generateFilteredReport(text_report, hasError);

    if (__ENV.SEND_NOTIFICATION === 'true') {
        if (isNullOrEmpty(__ENV.SEND_NOTIFICATION_TO)) {
            throw new Error("[NOTIFY] SEND_NOTIFICATION_TO must be provided when SEND_NOTIFICATION is true. Expected: TELEGRAM or TEAMS");
        }

        const to = __ENV.SEND_NOTIFICATION_TO;

        if (hasError) { // notificação de erro
            const headerMessage = `\t❌ Atenção: Testes executados com erros!\n\n`;

            sendMessage(to, `${headerMessage}${message}`);
        }

        // caso necessário notificar quando os testes rodaram sem falhas, informar NOTIFY_ON_SUCCESS=true no .env
        if (!hasError && __ENV.NOTIFY_ON_SUCCESS) {
            const headerMessage = `\t✅ Testes executados com sucesso\n\n`;

            sendMessage(to, `${headerMessage}${message}`);

        } else {
            console.info(`[NOTIFY] Não será notificado. NOTIFY_ON_SUCCESS:${__ENV.NOTIFY_ON_SUCCESS}`);
        }
    } else {
        console.info(`[NOTIFY] Não será notificado. SEND_NOTIFICATION:${__ENV.SEND_NOTIFICATION}`);
    }
    
    return {
        stdout: text_report, // imprime log do k6 no console
        [`./api/reports/${reportName}.xml`]: jUnit_report
    };
}

/**
 * Trata a mensagem de erro para que sejam enviadas apenas as verificações que falharam
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