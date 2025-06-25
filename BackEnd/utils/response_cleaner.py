import re
def response_cleaner(response: str) -> str:
    cleaned_response = response
    cleaned_response = re.sub(r'```json\n?', '', cleaned_response)
    cleaned_response = re.sub(r'```\n?', '', cleaned_response)
    cleaned_response = cleaned_response.strip()
    return cleaned_response
