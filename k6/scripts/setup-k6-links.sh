#!/bin/bash
# Para execução local, é necessário criar os links simbolicos, por conta dos imports
# Os imports deve funcionar tanto na execução local, como em uma máquina virtual.
# Os imports não devem ter "/../../.." e o K6 não suporta anotações como "@utils" ou "@root", 
# por isso, o link simbolico é necessário para criar um caminho absoluto a partir da raiz do projeto.
# Na máquina virtual, o K6 se vira, não precisa do link

# Adicione novos links conforme necessário
echo "Criando links simbólicos para k6..."

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

sudo ln -sf "$PROJECT_DIR/utils" /utils

echo "Links criados."