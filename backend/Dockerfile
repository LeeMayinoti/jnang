# Use official lightweight Python image
FROM python:3.12-slim

# Set working directory inside container
WORKDIR /app

# Prevent Python from writing pyc files to disc & buffering stdout/stderr
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/app

# Install system dependencies (including build tools if needed for pandas/xlrd)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first to leverage Docker layer caching
COPY backend/requirements.txt /app/backend/requirements.txt

# Install Python dependencies
RUN pip install --no-cache-dir -r /app/backend/requirements.txt

# Copy backend source code and context directory
COPY backend /app/backend
COPY context /app/context

# Expose port 8000 for FastAPI
EXPOSE 8000

# Run FastAPI using uvicorn
CMD ["uvicorn", "backend.app.main:app", "--host", "0.0.0.0", "--port", "8000"]
