#!/usr/bin/env bash

# Força a instalação de Python 3.10
pyenv install 3.10.13
pyenv global 3.10.13

# Garante que o pip está atualizado
pip install --upgrade pip

# Instala as dependências
pip install -r requirements.txt

# Instala os browsers do Playwright no local correto
python -m playwright install chromium --target=/opt/render/project/.playwright
