FROM python:3.11-slim

WORKDIR /app

# Install system dependencies needed for compiling certs/build
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt && pip install --no-cache-dir psycopg2-binary==2.9.7

COPY . .

EXPOSE 5000

CMD ["python", "run.py"]
