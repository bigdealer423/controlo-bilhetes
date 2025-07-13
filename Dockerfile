# Usa imagem oficial com Python 3.10
FROM python:3.10-slim

# Evita input interativo
ENV PYTHONUNBUFFERED=1

# Define diretório de trabalho dentro do container
WORKDIR /app

# Instala bibliotecas do sistema necessárias para psycopg2 e playwright
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    curl \
    wget \
    unzip \
    libnss3 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    libgbm1 \
    libgtk-3-0 \
    libasound2 \
    libxss1 \
    libxtst6 \
    libxshmfence1 \
    && rm -rf /var/lib/apt/lists/*

# Copia os ficheiros
COPY . .

# Instala dependências do Python
RUN pip install --upgrade pip
RUN pip install -r requirements.txt

# ⚠️ Instala o Chromium do Playwright no caminho correto para Render
ENV PLAYWRIGHT_BROWSERS_PATH=0
RUN playwright install chromium

# Porta que o Render expõe
EXPOSE 8000

# Comando para arrancar a aplicação
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
