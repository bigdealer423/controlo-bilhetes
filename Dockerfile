# Usa imagem oficial com Python 3.10
FROM python:3.10-slim

ENV PYTHONUNBUFFERED=1
WORKDIR /app

# Instala apenas bibliotecas mínimas necessárias (sem Chromium)
RUN apt-get update && apt-get install -y \
    curl \
    gnupg \
    && rm -rf /var/lib/apt/lists/*

# Copia dependências Python
COPY requirements.txt .
RUN pip install --upgrade pip
RUN pip install -r requirements.txt

# Copia o código da app
COPY . .

# Porta usada pelo Render
EXPOSE 8000

# Comando para iniciar a aplicação
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
