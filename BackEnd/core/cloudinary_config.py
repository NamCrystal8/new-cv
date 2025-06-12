import os
import cloudinary
import cloudinary.uploader

# Configure Cloudinary
def setup_cloudinary():
    """
    Set up the Cloudinary configuration using environment variables.
    This should be called once during application startup.
    """
    cloudinary.config(
        cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
        api_key=os.getenv("CLOUDINARY_API_KEY"),
        api_secret=os.getenv("CLOUDINARY_API_SECRET")
    )

def upload_file_to_cloudinary(file_path, public_id=None, folder="cv-pdfs"):
    """
    Upload a file to Cloudinary.
    
    Args:
        file_path (str): Path to the file to upload
        public_id (str, optional): The public ID to assign to the uploaded file
        folder (str, optional): The folder in Cloudinary to store the file
        
    Returns:
        dict: The Cloudinary upload response containing the URL and other metadata
    """
    try:
        upload_options = {
            "resource_type": "auto",  # Auto-detect the file type
            "folder": folder,
        }
        
        if public_id:
            upload_options["public_id"] = public_id
        
        # Upload the file to Cloudinary
        upload_result = cloudinary.uploader.upload(file_path, **upload_options)
        
        return {
            "success": True,
            "url": upload_result.get("secure_url"),
            "public_id": upload_result.get("public_id"),
            "resource_type": upload_result.get("resource_type"),
            "metadata": upload_result
        }
    except Exception as e:
        print(f"Error uploading to Cloudinary: {str(e)}")
        return {
            "success": False,
            "error": str(e)
        }