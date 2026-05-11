## Documentação de Testes de API com k6
> Documento sobre testes de carga de API utilizando k6, organização de pastas, criação de novos testes, execução e estrutura do projeto.
___

### 1. Fluxo da Pipeline

- Execução completa, todos os testes:    
![Fluxo da Pipeline](/k6/utils/resources/images/k6-flow.png)

- Execução por pasta, ou teste específico:    
![Fluxo da Pipeline](/k6/utils/resources/images/k6-flow-2.png)

### 2. Pré-requisitos
- Node.js
- k6
- dotenv - Instalação: [dotenvx.com/docs/install](https://dotenvx.com/docs/install))

Para verificar se o k6 está instalado, execute:
```sh
k6 --version
```

___

### 3. Configuração do Ambiente

#### 3.1 Arquivo `.env`
Na raiz do projeto, há um arquivo `.env.example` com exemplos de variáveis de ambiente usadas nos testes.  
Crie um arquivo `.env` na raiz do projeto e ajuste conforme necessário.  

Credenciais e informações sensíveis devem ficar nesse arquivo, pois ele está listado no `.gitignore`.
___

### 4. Estrutura de Arquivos

#### 4.1 `index.js`
Os arquivos index.js são utilizados para executar:

- todos os testes;   
- conjuntos de testes;   
- ou um teste específico.

#### 4.2 `resources/`
Cada pasta de teste pode possuir uma pasta _/resources_ para arquivos auxiliares utilizados no respectivo teste, como schemas de validação, payloads, mocks, etc.

#### 4.4 `schema_validator`:
Pegue o JSON retornado pela API e gere um schema utilizando o site:  
https://transform.tools/json-to-json-schema

Depois, ajuste o schema conforme necessário.

Exemplo de schema:
```javascript
const anotherExampleTest = {
  "type": "array",
  "items": {
    "type": "object",
    "properties": {
      "postId": {
        "type": "number"
      },
      "id": {
        "type": "number"
      },
      "name": {
        "type": "string"
      },
      "email": {
        "type": "string"
      },
      "body": {
        "type": "string"
      }
    },
    "required": [
      "postId",
      "id",
      "name",
      "email",
      "body"
    ]
  }
}

export default anotherExampleTest
```

Uso:
```javascript
export default function () {
    const response = callAPI(false)

    checkStatusResponse(response, 200)

    checkSchema(response, anotherExampleTest, "Request /comments")
}
```

#### 4.5 `package.json`
Arquivo responsável pelos scripts de execução dos testes.

Os scripts podem apontar para:

- todos os testes;
- uma pasta específica;
- ou um único teste.

Exemplo:
```json
"scripts": {
  "test:index": "dotenv -e .env k6 run ./index.js",
  "test:index_pasta": "dotenv -e .env k6 run ./api/projeto/index_nome.js",
  "test:meu_test": "dotenv -e .env k6 run ./api/projeto/pasta/meu_test/test.js"
}
```

#### 4.8 `reports/`
Pasta utilizada para salvar relatórios e publicações dos resultados dos testes.   

#### 4.9 `common_config.js`
Arquivo com configurações gerais de métricas e thresholds.
Caso as métricas definidas não sejam atingidas, notificações podem ser enviadas.
Essa configuração é útil para a execução de teste por pastas, principalmente.

#### 4.8 `scripts/`
Pasta utilizada para armazenar scripts auxiliares.

Ao iniciar o projeto em uma máquina local, execute o arquivo `setup-k6-links.sh` para criar os links da pasta `/utils`.
___

### 5. Notificações
Os testes podem enviar notificações para Telegram ou Teams.   
Configurações:
- `_SEND_NOTIFICATION_`: Defina como `false` para desativar notificações.
- `_NOTIFY_ON_SUCCESS_`: Defina como `true` para notificar mesmo quando não houver falhas.
- `SEND_NOTIFICATION_TO`: `'TELEGRAM'` ou `'TEAMS'`

___

### 6. Estruturação

```
📁 projeto/
├── 📂 k6/
├──── 📂 api/
├────── 📂 report/
├────── 📂 project/
├─────── 📊 report.xml
├────── 🧪 index_example.js
├──────── 📂 conjunto_example/
├──────── 🧪 index_conjunto_example.js
├─────────── 📂 example/
│              ├── 📁 resources/
│               ├── 🧩 example_schema.js
│               ├── 📦 example_POST_payload.json
│               └── 📦 example_PUT_payload.json
│              └── 🧪 example_test.js
├─────────── 📂 outros/
│               ├── 📁 resources/
│               └── 🧪 outros_test.js
├── 📂 utils/
├──── 📁 resources/
├── 🧪 index.js
├── ⚙️ .env
├── 🧾 readme.md
└── 📦 package.json
```
  

### 7. Exemplo de notificação:   

  ![Fluxo da Pipeline](/k6/utils/resources/images/k6-flow-notify.png)