from utils.cv_structure import CV_STRUCTURE


def latex_prompt(extracted_text: str) -> str:
    """Generate the ATS-optimized prompt based on extracted text."""
    return f"""As a senior HR data analyst specializing in ATS optimization, transform the following CV text into a highly optimized, ATS-friendly format with emphasis on quantifiable achievements and industry-specific keywords:

    {extracted_text}

    CRITICAL ATS OPTIMIZATION INSTRUCTIONS:
    1. KEYWORD TARGETING: Embed industry-specific keywords at 3-5% density in summary and experience sections.
    2. QUANTIFY RESULTS: Transform all achievements into metrics (↑35% revenue, $500K savings, 12 team members).
    3. POWER VERBS: Lead each bullet with strong action verbs (Spearheaded, Orchestrated, Implemented).
    4. ATS-COMPATIBLE FORMAT: Eliminate tables, columns, special characters, and complex formatting.
    5. TECHNICAL SPECIFICITY: List precise versions of tools, technologies, and methodologies with proficiency levels.
    6. COMPELLING SUMMARY: Craft a 3-line summary with years of experience, expertise, and unique value proposition.
    7. STRATEGIC STRUCTURE: Use consistent formatting with logical progression and appropriate white space.
    8. INDUSTRY TERMINOLOGY: Replace generic language with precise industry terms that match ATS algorithms.
    9. REVERSE CHRONOLOGY: Present most recent experience first with standardized date formats (MMM YYYY).
    10. VERIFICATION DATA: Include certification IDs, license numbers, and other verifiable credentials.
    
    Return a structured CV in this format:
    {CV_STRUCTURE}
    
    MOST IMPORTANT INSTRUCTIONS TO FOLLOW:
    1. Extract and categorize all sections from input text and utilize all the provided data.
    2. Match links to corresponding sections/items.
    3. Consume all the provided data in the structured CV. Do not respond with placeholders like "rest of the data...".
    4. Ensure all content is ATS-friendly by avoiding excessive formatting, symbols, or images. Use clear, keyword-optimized descriptions relevant to the job industry.
    5. Integrate numeric analytics wherever applicable (e.g., "Increased efficiency by 30%", "Managed a budget of $50K", "Led a team of 10 developers").
    6. Do not include additional CV sections outside the ones defined in the sections object. If data exists for an undefined section, integrate it into the closest relevant category.
    7. Ensure all dates follow the "MMM YYYY" format.
    8. Preserve all URLs and links in their respective fields.
    9. If descriptions are vague, enhance them while keeping the original meaning intact.
    10. Utilize all provided data comprehensively while maintaining a professional, structured format.
    11. KEYWORD OPTIMIZATION: For each achievement, identify and incorporate at least one industry-specific keyword.
    12. ACTION VERB VARIETY: Use diverse, impactful action verbs at the beginning of each achievement bullet (e.g., "Spearheaded," "Implemented," "Orchestrated").
    13. ACHIEVEMENT-FOCUSED: Transform responsibility statements into achievement statements with measurable outcomes.
    14. TECHNICAL SPECIFICATION: Include specific versions, methodologies, and frameworks where applicable.
    15. Just return the structured CV data in the specified format. Do not include any additional text or instructions.
    """
