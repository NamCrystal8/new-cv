FROM python:3.10-slim

WORKDIR /app

# Install system dependencies including LaTeX
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    texlive-latex-base \
    texlive-fonts-recommended \
    texlive-latex-extra \
    texlive-fonts-extra \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first to leverage Docker cache
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Install PostgreSQL support for Render
RUN pip install --no-cache-dir psycopg2-binary asyncpg

# Copy the rest of the application
COPY . .

# Set environment variables
ENV PORT=8000

# Expose the port the app will run on
EXPOSE 8000

# Define the command to run when the container starts
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]