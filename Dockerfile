# Usa imagem oficial com Python 3.10
FROM python:3.10-slim

# Evita input interativo
ENV PYTHONUNBUFFERED=1

# Define diretório de trabalho dentro do container
WORKDIR /app

# Instala apenas bibliotecas do sistema necessárias
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copia todos os ficheiros para dentro do container
COPY . .

# Instala dependências Python
RUN pip install --upgrade pip
RUN pip install -r requirements.txt

# Porta que o Render expõe
EXPOSE 8000

# Comando para arrancar a aplicação
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
