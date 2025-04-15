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
\documentclass[11pt]{article}
\usepackage{graphicx} % Required for inserting images
\setlength{\parindent}{0pt}
\usepackage{hyperref}
\usepackage{enumitem}
\usepackage[utf8]{inputenc} 
\usepackage[T1]{fontenc}
\usepackage[left=1.06cm,top=1.7cm,right=1.06cm,bottom=0.49cm]{geometry}

% --- Start Document ---
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
            contact_info = section_content.get("contact_info", {})
            if not isinstance(contact_info, dict): contact_info = {}

            email_info = contact_info.get("email", {})
            if not isinstance(email_info, dict): email_info = {}
            phone_info = contact_info.get("phone", {})
            if not isinstance(phone_info, dict): phone_info = {}
            location_info = contact_info.get("location", {})
            if not isinstance(location_info, dict): location_info = {}

            email_val = escape_latex(email_info.get("value", "youremail@college.harvard.edu"))
            phone_val = escape_latex(phone_info.get("value", "phone number"))
            location_val = escape_latex(location_info.get("value", "Home or Campus Street Address, City, State Zip"))

            # Harvard style format for header
            section_latex += "\\begin{center}\n"
            section_latex += f"    \\textbf{{{name}}}\\\\ \n"
            section_latex += "    \\hrulefill\n"
            section_latex += "\\end{center}\n\n"
            
            # Contact information line with bullets
            section_latex += "\\begin{center}\n"
            # Split location into address parts if comma separated
            if location_val and "," in location_val:
                loc_parts = location_val.split(",", 1)
                if len(loc_parts) > 1:
                    section_latex += f"    {loc_parts[0].strip()} \\textbullet{{}} {loc_parts[1].strip()}"
                else:
                    section_latex += f"    {location_val}"
            else:
                section_latex += f"    {location_val}"
                
            if email_val:
                section_latex += f" \\textbullet{{}} {email_val}"
            if phone_val:
                section_latex += f" \\textbullet{{}} {phone_val}"
                
            section_latex += "\n\\end{center}\n\n"
            section_latex += "\\vspace{0.5pt}\n\n"
            processed_sections.append(section_latex)
            continue

        # --- General Section Title ---
        section_title = escape_latex(section_content.get("section_title", section_key.capitalize()))
        section_latex += f"\\begin{{center}}\n    \\textbf{{{section_title}}}\n\\end{{center}}\n"
        section_latex += "\\vspace{0.5pt}\n\n"

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
                institution = escape_latex(item.get("institution", "Harvard University"))
                location = escape_latex(item.get("location", "Cambridge, MA"))
                degree = escape_latex(item.get("degree", "Degree, Concentration"))
                gpa = escape_latex(item.get("gpa", ""))
                thesis = escape_latex(item.get("thesis", ""))
                coursework = item.get("coursework", [])
                dates_str = escape_latex(item.get("graduation_date", "Graduation Date"))
                
                # Harvard style for institution and location
                section_latex += f"\\textbf{{{institution}}} \\hfill {location}\n\n"
                
                # Degree with optional GPA
                degree_line = degree
                if gpa:
                    degree_line += f". GPA {gpa}"
                section_latex += f"{degree_line} \\hfill {dates_str}\n"
                
                # Optional thesis
                if thesis:
                    section_latex += f"Thesis: {thesis}\n"
                
                # Optional relevant coursework
                if coursework and isinstance(coursework, list) and len(coursework) > 0:
                    coursework_str = ", ".join([escape_latex(course) for course in coursework if course])
                    if coursework_str:
                        section_latex += f"Relevant Coursework: {coursework_str}\n"
                
                section_latex += "\\vspace{12pt}\n"

        # --- Experience Section ---
        elif section_key == "experience":
            items = section_content.get("items", [])
            if not isinstance(items, list): items = []
            for item in items:
                if not isinstance(item, dict): continue
                company = escape_latex(item.get("company", "Organization"))
                location = escape_latex(item.get("location", "City, State (or Remote)"))
                title = escape_latex(item.get("title", "Position Title"))
                dates_str = format_dates(item.get("dates", {}))
                achievements = item.get("achievements", [])

                section_latex += f"\\textbf{{{company}}} \\hfill {location}\n\n"
                section_latex += f"\\textbf{{{title}}} \\hfill {dates_str}\n"
                section_latex += generate_latex_list(achievements)
                section_latex += "\\vspace{12pt}\n"

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

                 section_latex += f"\\textbf{{{title}}} \\hfill {dates_str}\n\n" # Removed extra newline
                 if description:
                     section_latex += f"{description}\n"
                 section_latex += generate_latex_list(contributions)
                 if technologies:
                      section_latex += f"\\textit{{Technologies:}} {escape_latex(', '.join(filter(None, map(str, technologies))))}\n" # Ensure string join
                 section_latex += "\\vspace{6pt}\n"

        # --- Leadership & Activities Section ---
        elif section_key == "leadership" or section_key == "activities":
            items = section_content.get("items", [])
            if not isinstance(items, list): items = []
            for item in items:
                if not isinstance(item, dict): continue
                organization = escape_latex(item.get("organization", "Organization"))
                location = escape_latex(item.get("location", "City, State"))
                role = escape_latex(item.get("role", "Role"))
                dates_str = format_dates(item.get("dates", {}))
                descriptions = item.get("descriptions", [])

                section_latex += f"\\textbf{{{organization}}} \\hfill {location}\n\n"
                section_latex += f"\\textbf{{{role}}} \\hfill {dates_str}\n"
                if descriptions:
                    section_latex += generate_latex_list(descriptions)
                section_latex += "\\vspace{12pt}\n"

        # --- Skills Section (updated for Harvard style) ---
        elif section_key == "skills":
            categories = section_content.get("categories", [])
            if not isinstance(categories, list): categories = []
            
            for category in categories:
                if not isinstance(category, dict): continue
                cat_name = escape_latex(category.get("name", "Technical"))
                items = category.get("items", [])
                if not isinstance(items, list): items = []
                if items:
                    escaped_items = [escape_latex(skill) for skill in items if isinstance(skill, str)]
                    if escaped_items:
                        section_latex += f"\\textbf{{{cat_name}:}} {', '.join(escaped_items)}\n\n"
            
            # Add interests section if available
            interests = section_content.get("interests", [])
            if isinstance(interests, list) and interests:
                interests_list = [escape_latex(interest) for interest in interests if interest]
                if interests_list:
                    section_latex += f"\\textbf{{Interests:}} {', '.join(interests_list)}\n\n"

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
                section_latex += f"\\textbf{{Language:}} {'; '.join(lang_parts)}\n\n"

        title_block_len = len(f"\\begin{{center}}\n    \\textbf{{{section_title}}}\n\\end{{center}}\n\\vspace{{0.5pt}}\n\n")
        if len(section_latex) > title_block_len:
             processed_sections.append(section_latex)

    # --- Join processed sections ---
    latex_string += "\n\\vspace{10pt}\n\n".join(processed_sections) # Adjusted spacing


    # --- LaTeX Ending ---
    latex_string += r"""

% Add Interests section manually if desired, as it's not in the JSON
% \begin{center}
%     \textbf{Interests [Note: Optional]}
% \end{center}
% \textbf{Interests:} List activities you enjoy...

\end{document}
"""

    return latex_string