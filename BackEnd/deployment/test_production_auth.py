#!/usr/bin/env python3
"""
Test authentication in production mode
"""
import os
os.environ["ENVIRONMENT"] = "production"

from dotenv import load_dotenv
load_dotenv()

print("Testing production authentication configuration...")

# Import after setting environment
import core.security

print("✅ Production authentication configuration loaded successfully")
print(f"Production mode: {core.security.is_production}")
print(f"Auth backends order: {[backend.name for backend in core.security.auth_backends]}")
