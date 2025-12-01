# Stage 1: Build Frontend
FROM node:18-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Stage 2: Backend Builder
FROM python:3.12-slim AS backend-build
WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

# Create virtual environment
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Install dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Stage 3: Final Runtime
FROM python:3.12-slim
WORKDIR /app/backend

# Copy virtual environment from builder
COPY --from=backend-build /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Copy backend code
COPY backend /app/backend

# Copy built frontend from Stage 1
COPY --from=frontend-build /app/frontend/dist /app/frontend/dist

# Set environment variables
ENV PORT=8080
ENV PYTHONUNBUFFERED=1

# Expose port
EXPOSE 8080

# Run command
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
