import json


def escape_latex(text):
    """Escapes special LaTeX characters in a string."""
    if not isinstance(text, str):
        text = str(text)
    text = text.replace('\\', r'\textbackslash{}')
    text = text.replace('&', r'\&')
    text = text.replace('%', r'\%')
    text = text.replace('$', r'\$')
    text = text.replace('#', r'\#')
    text = text.replace('_', r'\_')
    text = text.replace('{', r'\{')
    text = text.replace('}', r'\}')
    text = text.replace('~', r'\textasciitilde{}')
    text = text.replace('^', r'\textasciicircum{}')
    return text

def format_dates(dates_obj):
    """Formats the start and end dates."""
    if not isinstance(dates_obj, dict):
        return ""
    start = dates_obj.get("start", "")
    end = dates_obj.get("end", "")
    is_current = dates_obj.get("is_current", False)

    if is_current or (isinstance(end, str) and end.lower() == 'present'):
        end = "Present"

    start_esc = escape_latex(start) if start else ""
    end_esc = escape_latex(end) if end else ""

    if start_esc and end_esc:
        return f"{start_esc} -- {end_esc}"
    elif start_esc:
        return start_esc
    elif end_esc:
        return end_esc
    else:
        return ""

def generate_latex_list(items):
    """Generates a LaTeX itemize list for achievements/contributions with proper spacing."""
    if not isinstance(items, list):
        return ""
    if not items:
        return ""
        
    # Harvard-style compact formatting
    latex = "\\begin{itemize}[noitemsep, topsep=0pt, partopsep=0pt, parsep=0pt]\n"
    for item in items:
        latex += f"    \\item {escape_latex(item)}\n"
    latex += "\\end{itemize}\n"
    return latex

def json_to_latex(json_data):
    """Converts CV JSON data to a LaTeX string using the Harvard template."""

    if not isinstance(json_data, dict):
         raise TypeError("Input data must be a dictionary.")

    # Use .get chaining safely
    cv_data = json_data.get("cv_template", {})
    if not isinstance(cv_data, dict): cv_data = {}

    metadata = cv_data.get("metadata", {})
    if not isinstance(metadata, dict): metadata = {}

    sections = cv_data.get("sections", {})
    if not isinstance(sections, dict): sections = {}

    # Default section order if not specified
    default_order = ["header", "education", "experience", "projects",
                     "skills", "interests", "certifications"]
                      
    section_order = metadata.get("section_order", default_order)
    
    # Make sure section_order is valid
    if not isinstance(section_order, list) or not section_order: 
        section_order = default_order

    # --- LaTeX Preamble for Harvard Style CV ---
    latex_string = r"""
\documentclass[11pt]{article}

% Harvard Style CV Template - Compatible with basic LaTeX installations
\setlength{\parindent}{0pt}
\usepackage{hyperref}
\usepackage{enumitem}
\usepackage[utf8]{inputenc}
\usepackage[T1]{fontenc}
\usepackage[left=1.06cm,top=1.7cm,right=1.06cm,bottom=0.49cm]{geometry}

% Basic hyperref settings
\hypersetup{
    colorlinks=true,
    linkcolor=blue,
    filecolor=blue,
    urlcolor=blue,
    pdftitle={Harvard Style CV},
}

% Custom section formatting to match Harvard style
\makeatletter
\renewcommand{\section}[1]{%
  \vspace{12pt}%
  \begin{center}%
    \textbf{#1}%
  \end{center}%
  \vspace{0.5pt}%
}
\makeatother

\begin{document}
"""

    # --- Process Sections Based on Order ---
    processed_sections = []
    for section_key in section_order:
        section_content = sections.get(section_key)
        if not isinstance(section_content, dict):
            continue

        section_latex = ""

        # --- Header Section ---
        if section_key == "header":
            name = escape_latex(section_content.get("name", "Firstname Lastname"))
            title = escape_latex(section_content.get("title", ""))
            contact_info = section_content.get("contact_info", {})
            if not isinstance(contact_info, dict): contact_info = {}

            email_info = contact_info.get("email", {})
            if not isinstance(email_info, dict): email_info = {}
            phone_info = contact_info.get("phone", {})
            if not isinstance(phone_info, dict): phone_info = {}
            location_info = contact_info.get("location", {})
            if not isinstance(location_info, dict): location_info = {}

            email_val = escape_latex(email_info.get("value", ""))
            email_link_target = email_info.get("value", "")
            email_link = escape_latex(email_info.get("link", f"mailto:{email_link_target}" if isinstance(email_link_target, str) else ""))

            phone_val = escape_latex(phone_info.get("value", ""))
            phone_link_target = phone_info.get("value", "")
            phone_link = escape_latex(phone_info.get("link", f"tel:{phone_link_target}" if isinstance(phone_link_target, str) else ""))

            location_val = escape_latex(location_info.get("value", ""))

            contact_parts = []
            if location_val:
                contact_parts.append(location_val)
            if email_val and email_link:
                 contact_parts.append(f"\\href{{{email_link}}}{{{email_val}}}")
            if phone_val and phone_link:
                 contact_parts.append(f"\\href{{{phone_link}}}{{{phone_val}}}")

            # Harvard-style header with centered name and horizontal rule
            section_latex += "\\begin{center}\n"
            section_latex += f"    \\textbf{{{name}}}\\\\ \n"
            section_latex += "    \\hrulefill\n"
            section_latex += "\\end{center}\n\n"
            section_latex += "\\begin{center}\n"
            section_latex += "    " + " \\textbullet\\ ".join(contact_parts) + "\n"
            section_latex += "\\end{center}\n\n"
            section_latex += "\\vspace{0.5pt}\n\n"
            processed_sections.append(section_latex)
            continue

        # --- General Section Title with Harvard Style ---
        section_title = escape_latex(section_content.get("section_title", section_key.capitalize()))
        section_latex += f"\\section{{{section_title}}}\n"

        # --- Summary Section ---
        if section_key == "summary":
            content = escape_latex(section_content.get("content", ""))
            if content:
                section_latex += f"{content}\n\n"

        # --- Education Section ---
        elif section_key == "education":
            items = section_content.get("items", [])
            if not isinstance(items, list): items = []
            for i, item in enumerate(items):
                 if not isinstance(item, dict): continue
                 institution = escape_latex(item.get("institution", ""))
                 start_date = escape_latex(item.get("start_date", ""))
                 graduation_date = escape_latex(item.get("graduation_date", ""))
                 gpa = escape_latex(item.get("gpa", ""))

                 # Format date range
                 dates_str = ""
                 if start_date and graduation_date:
                     dates_str = f"{start_date} -- {graduation_date}"
                 elif graduation_date:
                     dates_str = graduation_date
                 elif start_date:
                     dates_str = start_date

                 # Harvard-style education entry - simplified format
                 section_latex += f"\\textbf{{{institution}}} \\hfill {dates_str}\n"

                 # Add GPA if available
                 if gpa:
                     section_latex += f"GPA: {gpa}\n"

                 section_latex += "\n"

                 # Add proper spacing between education entries
                 if i < len(items) - 1:
                     section_latex += "\\vspace{12pt}\n"        # --- Experience Section with Enhanced Formatting ---
        elif section_key == "experience":
            print(f"🔍 LATEX DEBUG: Processing experience section")
            items = section_content.get("items", [])
            print(f"🔍 LATEX DEBUG: Experience items: {items}")
            if not isinstance(items, list): items = []
            for i, item in enumerate(items):
                 if not isinstance(item, dict): continue
                 print(f"🔍 LATEX DEBUG: Processing experience item {i + 1}: {item}")
                 company = escape_latex(item.get("company", ""))
                 location = escape_latex(item.get("location", ""))
                 title = escape_latex(item.get("title", ""))
                 dates_str = format_dates(item.get("dates", {}))
                 achievements = item.get("achievements", [])
                 print(f"🔍 LATEX DEBUG: Item {i + 1} achievements: {achievements}")
                 technologies = item.get("technologies", [])
                 if not isinstance(technologies, list): technologies = []

                 # Harvard-style job entry
                 section_latex += f"\\textbf{{{company}}} \\hfill {location}\n\n"
                 section_latex += f"\\textbf{{{title}}} \\hfill {dates_str}\n"
                   # Properly formatted achievements list
                 if achievements:
                     print(f"🔍 LATEX DEBUG: Raw achievements type: {type(achievements)}")
                     print(f"🔍 LATEX DEBUG: Raw achievements value: {achievements}")
                     
                     # Handle both string and list formats
                     if isinstance(achievements, str):
                         # If it's a string, treat it as a single achievement
                         achievements_list = [achievements]
                         print(f"🔍 LATEX DEBUG: Converted string to list: {achievements_list}")
                     elif isinstance(achievements, list):
                         # If it's already a list, use it as is
                         achievements_list = achievements
                         print(f"🔍 LATEX DEBUG: Using existing list: {achievements_list}")
                     else:
                         # Fallback for other types
                         achievements_list = [str(achievements)]
                         print(f"🔍 LATEX DEBUG: Converted other type to list: {achievements_list}")
                     
                     print(f"🔍 LATEX DEBUG: Generating LaTeX list for {len(achievements_list)} achievements")
                     achievements_latex = generate_latex_list(achievements_list)
                     print(f"🔍 LATEX DEBUG: Generated achievements LaTeX: {achievements_latex}")
                     section_latex += achievements_latex
                 else:
                     print(f"🔍 LATEX DEBUG: No achievements found for item {i + 1}")
                 
                 # Add technologies if present
                 if technologies:
                      section_latex += f"\\textit{{Technologies:}} {escape_latex(', '.join(filter(None, map(str, technologies))))}\n"
                 
                 # Add clear spacing between job entries
                 if i < len(items) - 1:
                     section_latex += "\\vspace{12pt}\n"  # Harvard-style spacing between experience items

        # --- Projects Section with Enhanced Formatting ---
        elif section_key == "projects":
            items = section_content.get("items", [])
            if not isinstance(items, list): items = []
            for i, item in enumerate(items):
                 if not isinstance(item, dict): continue
                 title = escape_latex(item.get("title", ""))
                 description = escape_latex(item.get("description", ""))
                 
                 # Format dates properly
                 start_date = item.get("start_date", "")
                 end_date = item.get("end_date", "")
                 
                 # Use direct date fields if available, otherwise use dates object
                 if start_date or end_date:
                     if start_date and end_date:
                         dates_str = f"{escape_latex(start_date)} -- {escape_latex(end_date)}"
                     elif start_date:
                         dates_str = escape_latex(start_date)
                     else:
                         dates_str = escape_latex(end_date)
                 else:
                     dates_str = format_dates(item.get("dates", {}))
                     
                 # Handle both key_contributions and contributions fields
                 contributions = []
                 if "key_contributions" in item:
                     contributions = item.get("key_contributions", [])
                 elif "contributions" in item:
                     contributions = item.get("contributions", [])
                     
                 technologies = item.get("technologies", [])
                 if not isinstance(technologies, list): technologies = []

                 # Harvard-style project entry
                 section_latex += f"\\textbf{{{title}}} \\hfill {dates_str}\n\n"
                 
                 if description:
                     section_latex += f"{description}\n\n"  # Add extra newline for spacing
                     
                 # Add contributions as bullet points
                 if contributions:
                     section_latex += generate_latex_list(contributions)
                 
                 # Add technologies if present
                 if technologies:
                      section_latex += f"\\textit{{Technologies:}} {escape_latex(', '.join(filter(None, map(str, technologies))))}\n\n"  # Add extra newline here
                 
                 # Add clear spacing between project entries
                 if i < len(items) - 1:
                     section_latex += "\\vspace{12pt}\n"  # Harvard-style spacing between project items

        # --- Skills Section with Harvard Formatting (includes languages) ---
        elif section_key == "skills":
            categories = section_content.get("categories", [])
            if not isinstance(categories, list): categories = []

            for i, category in enumerate(categories):
                if not isinstance(category, dict): continue
                cat_name = escape_latex(category.get("name", "Skills"))
                items = category.get("items", [])
                if not isinstance(items, list): items = []
                if items:
                    escaped_items = [escape_latex(skill) for skill in items if isinstance(skill, str)]
                    if escaped_items:
                        section_latex += f"\\textbf{{{cat_name}:}} {', '.join(escaped_items)}\n\n"

        # --- Interests Section ---
        elif section_key == "interests":
            items = section_content.get("items", [])
            if not isinstance(items, list): items = []
            if items:
                interests_str = ", ".join([escape_latex(interest) for interest in items if interest])
                if interests_str:
                    section_latex += f"{interests_str}\n\n"

        # --- Certifications Section ---
        elif section_key == "certifications":
            items = section_content.get("items", [])
            if not isinstance(items, list): items = []
            for item in items:
                if not isinstance(item, dict): continue
                title = escape_latex(item.get("title", ""))
                institution = escape_latex(item.get("institution", ""))
                date = escape_latex(item.get("date", ""))

                if title:
                    cert_line = f"\\textbf{{{title}}}"
                    if institution:
                        cert_line += f", {institution}"
                    if date:
                        cert_line += f" \\hfill {date}"
                    section_latex += cert_line + "\n\n"



        # Only add sections that have content (skip empty sections)
        if section_latex.strip() and section_key != "header":
            # Check if section has actual content beyond just the title
            content_lines = [line.strip() for line in section_latex.split('\n') if line.strip()]
            # If we have more than just the section title, add it
            if len(content_lines) > 1 or (len(content_lines) == 1 and not content_lines[0].startswith('\\section{')):
                processed_sections.append(section_latex)

    # --- Join processed sections ---
    latex_string += "\n".join(processed_sections)

    # --- LaTeX Ending ---
    latex_string += r"""
\end{document}
"""

    return latex_string