$ErrorActionPreference = "Stop"

# Test script to verify database connectivity with our fixes
Write-Host "PostgreSQL Driver Fix Test Script" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan

# Set up a test environment variable
$env:DATABASE_URL = "postgresql://fake_user:fake_password@fake_host:5432/fake_db"

# Run the database test in Python
Write-Host "`nTesting with PostgreSQL URL..." -ForegroundColor Yellow
python -c "
import asyncio
from core.database import get_async_db, DATABASE_URL
print(f'Database URL type: {DATABASE_URL.split(\"://\")[0]}')
print('Driver should be postgresql+asyncpg')
"

# Test with postgres:// format (Render format)
$env:DATABASE_URL = "postgres://fake_user:fake_password@fake_host:5432/fake_db"

Write-Host "`nTesting with postgres:// URL (Render format)..." -ForegroundColor Yellow
python -c "
import asyncio
from core.database import get_async_db, DATABASE_URL
print(f'Database URL type: {DATABASE_URL.split(\"://\")[0]}')
print('Driver should be postgresql+asyncpg')
"

# Test with SQLite
$env:DATABASE_URL = "sqlite:///test.db"

Write-Host "`nTesting with SQLite URL..." -ForegroundColor Yellow
python -c "
import asyncio
from core.database import get_async_db, DATABASE_URL
print(f'Database URL type: {DATABASE_URL.split(\"://\")[0] if \"://\" in DATABASE_URL else DATABASE_URL.split(\":\")[0]}')
print('Driver should be sqlite+aiosqlite')
"

Write-Host "`nChecking imports for database drivers..." -ForegroundColor Yellow
python -c "
try:
    import asyncpg
    print('✅ asyncpg is installed')
except ImportError:
    print('❌ asyncpg is NOT installed')

try:
    import aiosqlite
    print('✅ aiosqlite is installed')
except ImportError:
    print('❌ aiosqlite is NOT installed')

try:
    import sqlalchemy
    print(f'✅ SQLAlchemy is installed (version {sqlalchemy.__version__})')
except ImportError:
    print('❌ SQLAlchemy is NOT installed')
"

Write-Host "`nTest completed." -ForegroundColor Green
Write-Host "If any tests failed, make sure you've installed the required dependencies:"
Write-Host "pip install -r requirements.txt" -ForegroundColor Yellow
