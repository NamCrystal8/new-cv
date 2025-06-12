FROM python:3.10-slim

WORKDIR /app

# Install system dependencies for PostgreSQL and LaTeX
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    netcat-openbsd \
    postgresql-client \
    curl \
    texlive-latex-base \
    texlive-fonts-recommended \
    texlive-latex-extra \
    texlive-fonts-extra \
    latexmk \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy essential scripts for fresh deployment
COPY deployment/build.sh deployment/start.sh deployment/start_simple.sh ./
RUN chmod +x build.sh start.sh start_simple.sh

# Copy application code
COPY . .

# Create output directory for LaTeX files
RUN mkdir -p output_tex_files && chmod 755 output_tex_files

# Set environment variables
ENV PORT=8000
ENV PYTHONUNBUFFERED=1
ENV ENVIRONMENT=production

# Expose port
EXPOSE 8000

# Health check for Render
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Create output directory
RUN mkdir -p output_tex_files && chmod 755 output_tex_files

# Expose port
EXPOSE 8000

# Start the application directly with environment port
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}