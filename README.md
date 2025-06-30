# CV Generator

A modern web application that helps users create professional CVs using AI-powered content generation and LaTeX-based PDF rendering.

## Project Structure

```
new-cv/
├── BackEnd/                     # FastAPI backend application
│   ├── deployment/              # Deployment configurations and scripts
│   │   ├── Dockerfile           # Production Docker configuration
│   │   ├── render.yaml          # Render.com deployment config
│   │   ├── build.sh             # Build script
│   │   ├── start_simple.sh      # Startup script
│   │   └── README.md            # Deployment documentation
│   ├── core/                    # Core application modules
│   ├── models/                  # Database models
│   ├── routes/                  # API route handlers
│   ├── services/                # Business logic services
│   ├── schemas/                 # Pydantic schemas
│   ├── utils/                   # Utility functions
│   ├── tests/                   # Unit tests
│   └── main.py                  # Application entry point
├── FrontEnd/                    # React frontend application
│   ├── src/                     # Source code
│   ├── public/                  # Static assets
│   └── package.json             # Dependencies
└── README.md                    # This file
```

## Features

- **AI-Powered Content Generation**: Uses Google Gemini API to enhance CV content
- **Professional PDF Generation**: LaTeX-based PDF rendering for high-quality output
- **User Authentication**: Secure user registration and login system
- **Admin Dashboard**: Administrative interface for user management
- **Cloud Storage**: Cloudinary integration for file uploads
- **Responsive Design**: Modern React frontend with Tailwind CSS

## Quick Start

### Prerequisites

- Python 3.10+
- Node.js 18+
- PostgreSQL database
- Docker (optional)

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd BackEnd
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Set up environment variables (see deployment/README.md for details)

4. Run the application:
   ```bash
   uvicorn main:app --reload
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd FrontEnd
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

## Deployment

All deployment-related files and documentation are located in the `BackEnd/deployment/` directory. See [BackEnd/deployment/README.md](BackEnd/deployment/README.md) for detailed deployment instructions.

### Quick Deploy to Render.com

```bash
# From project root
./deploy-to-render.sh
```

## API Documentation

Once the backend is running, visit:
- API Documentation: `http://localhost:8000/docs`
- Health Check: `http://localhost:8000/health`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

