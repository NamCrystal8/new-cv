FROM python:3.10-slim

WORKDIR /app

# Install system dependencies including LaTeX and PostgreSQL tools
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    netcat-openbsd \
    postgresql-client \
    curl \
    git \
    texlive-latex-base \
    texlive-fonts-recommended \
    texlive-latex-extra \
    texlive-fonts-extra \
    latexmk \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first to leverage Docker cache
COPY requirements.txt .
RUN pip install --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Ensure PostgreSQL drivers are installed
RUN pip install --no-cache-dir psycopg2-binary>=2.9.0 asyncpg>=0.27.0

# Make shell scripts executable
COPY build.sh start.sh test_database.sh run_migration.sh ./
RUN chmod +x build.sh start.sh test_database.sh run_migration.sh

# Copy the rest of the application
COPY . .

# Ensure all scripts are executable
RUN chmod +x ./build.sh ./start.sh ./test_database.sh ./run_migration.sh

# Create output directory for LaTeX files
RUN mkdir -p output_tex_files && chmod 777 output_tex_files

# Set environment variables for PostgreSQL optimization
ENV PORT=8000
ENV PYTHONUNBUFFERED=1
ENV ENVIRONMENT=production
ENV DATABASE_POOL_SIZE=5
ENV DATABASE_MAX_OVERFLOW=10

# Expose the port the app will run on
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Define the command to run when the container starts
CMD ["./start.sh"]