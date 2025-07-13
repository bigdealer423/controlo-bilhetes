# Usa imagem oficial com Python 3.10
FROM python:3.10-slim

# Evita input interativo
ENV PYTHONUNBUFFERED=1

# Define diretório de trabalho dentro do container
WORKDIR /app

# Instala bibliotecas do sistema necessárias para o Playwright + Chromium
RUN apt-get update && apt-get install -y \
    wget \
    curl \
    gnupg \
    libnss3 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libxcomposite1 \
    libxrandr2 \
    libxdamage1 \
    libxkbcommon0 \
    libx11-xcb1 \
    libxcb1 \
    libxext6 \
    libxfixes3 \
    libglib2.0-0 \
    libgtk-3-0 \
    libasound2 \
    libgbm1 \
    libnss3 \
    fonts-liberation \
    libappindicator3-1 \
    libxss1 \
    lsb-release \
    xdg-utils \
    && rm -rf /var/lib/apt/lists/*

# Copia dependências Python
COPY requirements.txt .
RUN pip install --upgrade pip
RUN pip install -r requirements.txt

# Instala Playwright e os browsers
RUN pip install playwright
RUN playwright install --with-deps

# Copia o código da app
COPY . .

# Porta usada pelo Render
EXPOSE 8000

# Comando para iniciar a aplicação
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
