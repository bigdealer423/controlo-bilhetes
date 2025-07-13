#!/usr/bin/env bash
python -m playwright install chromium --target=/opt/render/project/.playwright
export PLAYWRIGHT_BROWSERS_PATH=/opt/render/project/.playwright
python main.py
