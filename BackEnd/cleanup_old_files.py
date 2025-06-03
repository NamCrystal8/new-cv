"""
Cleanup script to identify and remove old model/schema files
"""
import os
import sys
import shutil

def check_file_usage(target_file):
    """Check if a file is still being imported anywhere"""
    # Get the basename without extension for import checks
    basename = os.path.splitext(os.path.basename(target_file))[0]
    
    # Find all Python files in the project
    python_files = []
    for root, dirs, files in os.walk('.'):
        if 'venv' in root or '.venv' in root or '__pycache__' in root:
            continue
        for file in files:
            if file.endswith('.py') and file != os.path.basename(target_file):
                python_files.append(os.path.join(root, file))
    
    # Check each Python file for imports of the target file
    usages = []
    for py_file in python_files:
        try:
            with open(py_file, 'r', encoding='utf-8') as f:
                content = f.read()
                # Check for import statements
                if f"import {basename}" in content or f"from {basename}" in content:
                    usages.append(py_file)
        except Exception as e:
            print(f"Error reading {py_file}: {e}")
    
    return usages

def backup_file(filepath):
    """Create a backup of a file before removing it"""
    if not os.path.exists('backups'):
        os.makedirs('backups')
    
    backup_path = os.path.join('backups', os.path.basename(filepath))
    shutil.copy2(filepath, backup_path)
    print(f"Created backup at {backup_path}")
    
def main(remove=False):
    """Main function to check and report on old files"""
    old_files = [
        'models.py',
        'subscription_models.py',
        'subscription_schemas.py',
        'role_models.py',
        'role_schemas.py'
    ]
    
    print("Checking for old files and their usage:")
    print("-" * 50)
    
    for old_file in old_files:
        if os.path.exists(old_file):
            usages = check_file_usage(old_file)
            if usages:
                print(f"❌ {old_file} is still used in:")
                for usage in usages:
                    print(f"   - {usage}")
                if remove:
                    print(f"⚠️ Cannot remove {old_file}, still in use")
            else:
                print(f"✅ {old_file} exists but is not imported anywhere")
                if remove:
                    backup_file(old_file)
                    os.remove(old_file)
                    print(f"✅ Removed {old_file}")
        else:
            print(f"✅ {old_file} doesn't exist")
    
    print("\nTo remove files that are not used, run with --remove")
    
    return [file for file in old_files if os.path.exists(file) and not check_file_usage(file)]


def update_imports():
    """Update imports in all Python files to use the new directory structure"""
    replacements = {
        "from models.subscription import": "from models.subscription import",
        "from schemas.subscription import": "from schemas.subscription import",
        "from models.user import User": "from models.user import User",
        "from models.role import Role": "from models.role import Role",
        "from models.user import CV": "from models.user import CV",
        "from models.subscription import (SubscriptionPlan": "from models.subscription import (SubscriptionPlan",
        "import models.subscription": "import models.subscription",
        "import schemas.subscription": "import schemas.subscription"
    }
    
    files_updated = 0
    
    # Find all Python files in the project
    python_files = []
    for root, dirs, files in os.walk('.'):
        if 'venv' in root or '.venv' in root or '__pycache__' in root or 'backups' in root:
            continue
        for file in files:
            if file.endswith('.py'):
                python_files.append(os.path.join(root, file))
    
    for py_file in python_files:
        try:
            with open(py_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Check if any replacement needed
            original_content = content
            for old_import, new_import in replacements.items():
                content = content.replace(old_import, new_import)
            
            # Save file if changed
            if content != original_content:
                with open(py_file, 'w', encoding='utf-8') as f:
                    f.write(content)
                print(f"Updated imports in {py_file}")
                files_updated += 1
        except Exception as e:
            print(f"Error updating {py_file}: {e}")
    
    return files_updated


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--remove":
        print("Running in removal mode")
        removable_files = main(remove=True)
        print(f"\n{len(removable_files)} files were safely removed")
        
        print("\nUpdating imports across codebase...")
        files_updated = update_imports()
        print(f"Updated imports in {files_updated} files")
    else:
        main(False)
