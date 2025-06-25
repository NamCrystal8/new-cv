# CV Generator Backend

This is the backend service for the CV Generator application. It handles CV generation, PDF creation with LaTeX, and user authentication.

## Features

- CV template management and generation
- PDF creation using LaTeX templates
- User authentication and authorization
- Cloudinary integration for file storage
- AI-powered CV suggestions and improvements

## Setup for Local Development

### Prerequisites

- Python 3.10+
- MySQL Server
- LaTeX installation (TeX Live/MikTeX)
- Cloudinary account

### Environment Variables

Copy the `.env.example` file to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

Required variables:
- `CLOUDINARY_CLOUD_NAME`: Your Cloudinary cloud name
- `CLOUDINARY_API_KEY`: Your Cloudinary API key
- `CLOUDINARY_API_SECRET`: Your Cloudinary API secret
- `JWT_SECRET`: Secret key for JWT token generation
- `GOOGLE_GEMINI_API_KEY`: For AI-powered CV improvements

### Installation

1. Create a virtual environment:
```bash
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Start the application:
```bash
uvicorn main:app --reload
```

## Docker Setup

You can also run the application with Docker:

```bash
# Build the Docker image
docker build -t cv-generator-backend .

# Run the container
docker run -p 8000:8000 -e DATABASE_URL=mysql+asyncmy://root:password@host.docker.internal:3306/new_cv cv-generator-backend
```

## Deployment

For deployment instructions, see the `RENDER_DEPLOYMENT.md` file in the root directory.

- Python > Analysis > **Type Checking Mode** : `basic`
- Python > Analysis > Inlay Hints: **Function Return Types** : `enable`
- Python > Analysis > Inlay Hints: **Variable Types** : `enable`

## Running the sample
- Open the template folder in VS Code (**File** > **Open Folder...**)
- Open the Command Palette in VS Code (**View > Command Palette...**) and run the **Dev Container: Reopen in Container** command.
- Run the app using the Run and Debug view or by pressing `F5`
- `Ctrl + click` on the URL that shows up on the terminal to open the running application 
- Test the API functionality by navigating to `/docs` URL to view the Swagger UI
- Configure your Python test in the Test Panel or by triggering the **Python: Configure Tests** command from the Command Palette
- Run tests in the Test Panel or by clicking the Play Button next to the individual tests in the `test_main.py` file
