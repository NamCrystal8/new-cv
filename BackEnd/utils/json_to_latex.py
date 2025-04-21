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
    """Generates a LaTeX itemize list for achievements/contributions."""
    if not isinstance(items, list):
        return ""
    if not items:
        return ""
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

    section_order = metadata.get("section_order", [])
    if not isinstance(section_order, list): section_order = []

    # --- LaTeX Preamble ---
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
  {12pt}
  {8pt}

% Remove paragraph indentation
\setlength{\parindent}{0pt}

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

            section_latex += "\\begin{center}\n"
            section_latex += f"    {{\\Large\\textbf{{{name}}}}}\\\\[4pt]\n"  # Larger name, more space
            if title:
                 section_latex += f"    {{\\normalsize\\textit{{{title}}}}}\\\\[4pt]\n"
            section_latex += "    \\hrulefill\n"
            section_latex += "\\end{center}\n"
            section_latex += "\\begin{center}\n"
            section_latex += "    " + " {\\large\\textbullet} ".join(contact_parts) + "\n"
            section_latex += "\\end{center}\n\n"
            processed_sections.append(section_latex)
            continue

        # --- General Section Title ---
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
            for item in items:
                 if not isinstance(item, dict): continue
                 institution = escape_latex(item.get("institution", ""))
                 location = escape_latex(item.get("location", ""))
                 degree = escape_latex(item.get("degree", ""))
                 dates_str = format_dates(item.get("dates", {}))
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
                     
                 section_latex += "\\vspace{8pt}\n"

        # --- Experience Section ---
        elif section_key == "experience":
            items = section_content.get("items", [])
            if not isinstance(items, list): items = []
            for item in items:
                 if not isinstance(item, dict): continue
                 company = escape_latex(item.get("company", ""))
                 location = escape_latex(item.get("location", ""))
                 title = escape_latex(item.get("title", ""))
                 dates_str = format_dates(item.get("dates", {}))
                 achievements = item.get("achievements", [])
                 technologies = item.get("technologies", [])
                 if not isinstance(technologies, list): technologies = [] # Ensure list

                 section_latex += f"\\textbf{{{company}}} \\hfill {location}\n\n"
                 section_latex += f"\\textit{{{title}}} \\hfill {dates_str}\n"
                 section_latex += generate_latex_list(achievements)
                 if technologies:
                      section_latex += f"\\textit{{Technologies:}} {escape_latex(', '.join(filter(None, map(str, technologies))))}\n"
                 section_latex += "\\vspace{8pt}\n"

        # --- Projects Section ---
        elif section_key == "projects":
            items = section_content.get("items", [])
            if not isinstance(items, list): items = []
            for item in items:
                 if not isinstance(item, dict): continue
                 title = escape_latex(item.get("title", ""))
                 description = escape_latex(item.get("description", ""))
                 dates_str = format_dates(item.get("dates", {}))
                 contributions = item.get("key_contributions", [])
                 technologies = item.get("technologies", [])
                 if not isinstance(technologies, list): technologies = []

                 section_latex += f"\\textbf{{{title}}} \\hfill {dates_str}\n\n"
                 if description:
                     section_latex += f"{description}\n"
                 section_latex += generate_latex_list(contributions)
                 if technologies:
                      section_latex += f"\\textit{{Technologies:}} {escape_latex(', '.join(filter(None, map(str, technologies))))}\n"
                 section_latex += "\\vspace{8pt}\n"

        # --- Skills Section ---
        elif section_key == "skills":
            categories = section_content.get("categories", [])
            if not isinstance(categories, list): categories = []
            
            for category in categories:
                if not isinstance(category, dict): continue
                cat_name = escape_latex(category.get("name", "Skills"))
                items = category.get("items", [])
                if not isinstance(items, list): items = []
                if items:
                    escaped_items = [escape_latex(skill) for skill in items if isinstance(skill, str)]
                    if escaped_items:
                        section_latex += f"\\textbf{{{cat_name}:}} {', '.join(escaped_items)}\n\n"
                        
            # Handle interests if they exist
            interests = section_content.get("interests", [])
            if interests and isinstance(interests, list) and len(interests) > 0:
                interests_str = ", ".join([escape_latex(interest) for interest in interests if interest])
                if interests_str:
                    section_latex += f"\\textbf{{Interests:}} {interests_str}\n\n"

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

        if section_latex and section_key != "header":
             processed_sections.append(section_latex)

    # --- Join processed sections ---
    latex_string += "\n".join(processed_sections)


    # --- LaTeX Ending ---
    latex_string += r"""
\end{document}
"""

    return latex_string