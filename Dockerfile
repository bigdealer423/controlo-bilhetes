# Usa imagem oficial com Python 3.10
FROM python:3.10-slim

ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Instala libs do sistema
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

# Instala Python deps
RUN pip install --upgrade pip
RUN pip install -r requirements.txt

# ⚠ Instala Chromium forçando o caminho
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
RUN playwright install --with-deps chromium

# Porta do Render
EXPOSE 8000

# Define variável de ambiente também no runtime
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright

# Arranque da app
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
