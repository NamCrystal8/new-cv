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
        
    # Use more space after items and between items for better readability
    latex = "\\begin{itemize}[leftmargin=*,itemsep=2pt,parsep=2pt,topsep=4pt]\n"
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
    default_order = ["header", "summary", "experience", "education", 
                     "skills", "projects", "leadership", "certifications", 
                     "languages", "publications", "research", "achievements"]
                      
    section_order = metadata.get("section_order", default_order)
    
    # Make sure section_order is valid
    if not isinstance(section_order, list) or not section_order: 
        section_order = default_order

    # --- LaTeX Preamble for Harvard Style CV ---
    latex_string = r"""
\documentclass[letterpaper,11pt]{article}

% Harvard Style CV Template
% Document formatting
\usepackage[top=0.75in, bottom=0.75in, left=0.75in, right=0.75in]{geometry}
\usepackage{graphicx}
\usepackage{enumitem}
\usepackage{hyperref}
\usepackage[utf8]{inputenc}
\usepackage[T1]{fontenc}
\usepackage{lmodern} % Load a font with all the characters
\usepackage{titlesec}
\usepackage{xcolor}

% Set font to Palatino, which is elegant and readable
\usepackage{palatino}

% Define Harvard colors
\definecolor{harvardcrimson}{RGB}{165,28,48}

% Customize section formatting
\titleformat{\section}
  {\normalfont\Large\bfseries}
  {}
  {0em}
  {\centering}[\titlerule]

\titlespacing*{\section}
  {0pt}
  {16pt}  % Space before section
  {10pt}  % Space after section

% Remove paragraph indentation
\setlength{\parindent}{0pt}

% Add paragraph spacing
\setlength{\parskip}{6pt}

% Customize hyperref settings
\hypersetup{
    colorlinks=true,
    linkcolor=harvardcrimson,
    filecolor=harvardcrimson,
    urlcolor=harvardcrimson,
    pdftitle={Harvard Style CV},
    pdfpagemode=FullScreen,
}

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

            # Harvard-style header with centered name and contact info
            section_latex += "\\begin{center}\n"
            section_latex += f"    {{\\Large\\textbf{{{name}}}}}\\\\[6pt]\n"
            if title:
                 section_latex += f"    {{\\normalsize\\textit{{{title}}}}}\\\\[6pt]\n"
            section_latex += "    \\hrulefill\n"
            section_latex += "\\end{center}\n"
            section_latex += "\\begin{center}\n"
            section_latex += "    " + " {\\large\\textbullet} ".join(contact_parts) + "\n"
            section_latex += "\\end{center}\n\n"
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
                 location = escape_latex(item.get("location", ""))
                 degree = escape_latex(item.get("degree", ""))
                 grad_date = escape_latex(item.get("graduation_date", ""))
                 dates_str = grad_date  # Use graduation date directly
                 if not dates_str and "dates" in item:
                     dates_str = format_dates(item.get("dates", {}))  # Fall back to dates object if needed
                 gpa = escape_latex(item.get("gpa", ""))
                 coursework = item.get("coursework", [])
                 honors = item.get("honors", [])

                 section_latex += f"\\textbf{{{institution}}} \\hfill {location}\n\n"
                 section_latex += f"{degree} \\hfill {dates_str}\n"
                 
                 if gpa:
                     section_latex += f"GPA: {gpa}\n"
                 
                 if coursework and isinstance(coursework, list) and len(coursework) > 0:
                     coursework_str = ", ".join([escape_latex(course) for course in coursework if course])
                     if coursework_str:
                         section_latex += f"\\textit{{Relevant Coursework:}} {coursework_str}\n"
                 
                 if honors and isinstance(honors, list) and len(honors) > 0:
                     section_latex += generate_latex_list(honors)
                     
                 # Add proper spacing between education entries
                 if i < len(items) - 1:
                     section_latex += "\\vspace{14pt}\n"        # --- Experience Section with Enhanced Formatting ---
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
                 section_latex += f"\\textit{{{title}}} \\hfill {dates_str}\n\n"  # Add extra newline for spacing
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
                     section_latex += "\\vspace{10pt}\n"  # Extra space between experience items

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
                     section_latex += "\\vspace{10pt}\n"  # Extra space between project items

        # --- Skills Section with Better Formatting ---
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
                        section_latex += f"\\textbf{{{cat_name}:}} {', '.join(escaped_items)}"
                        
                        # Add newline after each category except the last one
                        if i < len(categories) - 1:
                            section_latex += "\n\n"  # Double newline for clearer category separation
                        else:
                            section_latex += "\n"
                        
            # Handle interests if they exist
            interests = section_content.get("interests", [])
            if interests and isinstance(interests, list) and len(interests) > 0:
                interests_str = ", ".join([escape_latex(interest) for interest in interests if interest])
                if interests_str:
                    section_latex += f"\\textbf{{Interests:}} {interests_str}\n"

        # --- Leadership & Activities Section ---
        elif section_key == "leadership":
            items = section_content.get("items", [])
            if not isinstance(items, list): items = []
            for item in items:
                if not isinstance(item, dict): continue
                organization = escape_latex(item.get("organization", ""))
                location = escape_latex(item.get("location", ""))
                role = escape_latex(item.get("role", ""))
                dates_str = format_dates(item.get("dates", {}))
                descriptions = item.get("descriptions", [])

                section_latex += f"\\textbf{{{organization}}} \\hfill {location}\n\n"
                section_latex += f"\\textit{{{role}}} \\hfill {dates_str}\n"
                section_latex += generate_latex_list(descriptions)
                section_latex += "\\vspace{8pt}\n"

        # --- Languages Section ---
        elif section_key == "languages":
            items = section_content.get("items", [])
            if not isinstance(items, list): items = []
            lang_parts = []
            for item in items:
                if not isinstance(item, dict): continue
                name = escape_latex(item.get("name", ""))
                proficiency = escape_latex(item.get("proficiency", ""))
                if name:
                    lang_parts.append(f"{name} ({proficiency})" if proficiency else name)
            if lang_parts:
                section_latex += f"\\textbf{{Languages:}} {'; '.join(lang_parts)}\n\n"

        # --- Certifications Section ---
        elif section_key == "certifications":
            items = section_content.get("items", [])
            if not isinstance(items, list): items = []
            for item in items:
                if not isinstance(item, dict): continue
                title = escape_latex(item.get("title", ""))
                institution = escape_latex(item.get("institution", ""))
                date_str = ""
                date = item.get("date", {})
                if isinstance(date, dict):
                    date_str = format_dates(date)
                
                if title:
                    cert_line = f"\\textbf{{{title}}}"
                    if institution:
                        cert_line += f", {institution}"
                    if date_str:
                        cert_line += f" \\hfill {date_str}"
                    section_latex += cert_line + "\n\n"

        # --- Publications Section ---
        elif section_key == "publications":
            items = section_content.get("items", [])
            if not isinstance(items, list): items = []
            for item in items:
                if not isinstance(item, dict): continue
                title = escape_latex(item.get("title", ""))
                date = escape_latex(item.get("date", ""))
                
                if title:
                    pub_line = f"\\textit{{{title}}}"
                    if date:
                        pub_line += f" \\hfill {date}"
                    section_latex += pub_line + "\n\n"

        # --- Research Section ---
        elif section_key == "research":
            items = section_content.get("items", [])
            if not isinstance(items, list): items = []
            for item in items:
                if not isinstance(item, dict): continue
                title = escape_latex(item.get("title", ""))
                description = escape_latex(item.get("description", ""))
                date = escape_latex(item.get("date", ""))
                
                if title:
                    section_latex += f"\\textbf{{{title}}}"
                    if date:
                        section_latex += f" \\hfill {date}"
                    section_latex += "\n\n"
                    if description:
                        section_latex += f"{description}\n\n"

        # --- Achievements Section ---
        elif section_key == "achievements":
            items = section_content.get("items", [])
            if not isinstance(items, list): items = []
            for i, item in enumerate(items):
                if not isinstance(item, dict): continue
                organization = escape_latex(item.get("organization", ""))
                description = escape_latex(item.get("description", ""))
                date = escape_latex(item.get("date", ""))
                
                # Format achievement entry in Harvard style
                if organization:
                    section_latex += f"\\textbf{{{organization}}}"
                    if date:
                        section_latex += f" \\hfill {date}"
                    section_latex += "\n\n"
                
                if description:
                    section_latex += f"{description}\n\n"
                
                # Add proper spacing between achievement entries
                if i < len(items) - 1:
                    section_latex += "\\vspace{10pt}\n"

        if section_latex and section_key != "header":
             processed_sections.append(section_latex)

    # --- Join processed sections ---
    latex_string += "\n".join(processed_sections)

    # --- LaTeX Ending ---
    latex_string += r"""
\end{document}
"""

    return latex_string