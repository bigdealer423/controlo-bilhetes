#!/bin/bash
set -e

echo "🚧 A instalar playwright..."
pip install --upgrade pip
pip install playwright

echo "🎯 A instalar os browsers..."
playwright install chromium

echo "✅ Playwright e browsers instalados com sucesso!"
