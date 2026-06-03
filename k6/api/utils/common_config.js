// configuração comum para os testes, como thresholds, timeout, etc.
// se não for satisfeita a condição do thresholds, será notificado.
export const commonOptions = {
    cloud: {
        name: 'Example - API REST'
    },
    setupTimeout: '600s',
    thresholds: {
        checks: [
            {
                threshold: 'rate > 0.99', // 99% dos checks devem passar
                abortOnFail: false
            }
        ],
    }
};
