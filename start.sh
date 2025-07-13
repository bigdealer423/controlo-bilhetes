#!/usr/bin/env bash
# Instala o Chromium diretamente na pasta do projeto
python -m playwright install chromium --target=/opt/render/project/.playwright

# Define a variável de ambiente para usar o caminho correto
export PLAYWRIGHT_BROWSERS_PATH=/opt/render/project/.playwright

# Corre a tua app
python main.py
