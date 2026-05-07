FROM python:3.11-slim

# Install Node.js 20 + WeasyPrint system dependencies
RUN apt-get update && \
    apt-get install -y curl \
      libpango-1.0-0 libpangoft2-1.0-0 libpangocairo-1.0-0 \
      libharfbuzz0b libcairo2 libcairo-gobject2 \
      libgdk-pixbuf-xlib-2.0-0 libffi-dev libxml2 libxslt1.1 \
      shared-mime-info fontconfig fonts-urw-base35 && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Frontend: install and build
COPY web/package*.json ./web/
RUN cd web && npm ci

COPY web/ ./web/
RUN cd web && npm run build

# Application code
COPY . .

EXPOSE 8000
CMD ["sh", "-c", "uvicorn backend.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
