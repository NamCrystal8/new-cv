FROM python:3.10-slim

WORKDIR /app

# Install system dependencies including LaTeX
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
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first to leverage Docker cache
COPY requirements.txt .
RUN pip install --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Make shell scripts executable
COPY build.sh start.sh test_database.sh run_migration.sh ./
RUN chmod +x build.sh start.sh test_database.sh run_migration.sh

# Ensure scripts remain executable after copying other files
RUN chmod +x ./build.sh ./start.sh ./test_database.sh ./run_migration.sh

# Copy the rest of the application
COPY . .

# Create output directory for LaTeX files
RUN mkdir -p output_tex_files && chmod 777 output_tex_files

# Set environment variables
ENV PORT=8000
ENV PYTHONUNBUFFERED=1

# Expose the port the app will run on
EXPOSE 8000

# Define the command to run when the container starts
CMD ["./start.sh"]