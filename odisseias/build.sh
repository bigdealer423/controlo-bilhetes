#!/bin/bash
set -e  # Termina se der erro

echo "🚧 A instalar Playwright via pip..."
pip install playwright

echo "🎯 A instalar browsers do Playwright..."
playwright install chromium

echo "✅ Instalação completa!"
