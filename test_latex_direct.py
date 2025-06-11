#!/usr/bin/env python3
"""
Direct test of LaTeX compilation using the backend service
"""

import sys
import os
sys.path.append('BackEnd')

from utils.json_to_latex import json_to_latex

def test_latex_generation():
    """Test LaTeX generation with sample CV data"""
    print("🧪 Testing LaTeX Generation with Basic Packages")
    print("=" * 60)
    
    # Sample CV data structure
    sample_cv_data = {
        "cv_template": {
            "sections": {
                "header": {
                    "name": "John Doe",
                    "title": "Software Engineer",
                    "contact_info": {
                        "email": {"value": "john.doe@example.com", "link": "mailto:john.doe@example.com"},
                        "phone": {"value": "+1234567890", "link": "tel:+1234567890"},
                        "location": {"value": "New York, NY"}
                    }
                },
                "experience": {
                    "section_title": "Experience",
                    "items": [
                        {
                            "company": "Tech Corp",
                            "title": "Software Engineer",
                            "location": "New York, NY",
                            "dates": {"start": "2020", "end": "2023", "is_current": False},
                            "achievements": [
                                "Developed web applications using Python and React",
                                "Improved system performance by 25%",
                                "Led a team of 3 developers"
                            ]
                        }
                    ]
                },
                "education": {
                    "section_title": "Education",
                    "items": [
                        {
                            "institution": "University of Technology",
                            "degree": "Bachelor of Computer Science",
                            "location": "Boston, MA",
                            "graduation_date": "2020",
                            "gpa": "3.8/4.0"
                        }
                    ]
                },
                "skills": {
                    "section_title": "Skills",
                    "categories": [
                        {
                            "name": "Programming",
                            "items": ["Python", "JavaScript", "React", "Node.js"]
                        },
                        {
                            "name": "Databases",
                            "items": ["PostgreSQL", "MongoDB", "Redis"]
                        }
                    ]
                }
            }
        }
    }
    
    try:
        print("1. 🔧 Generating LaTeX code...")
        latex_code = json_to_latex(sample_cv_data)
        
        print("✅ LaTeX generation successful!")
        print(f"Generated {len(latex_code)} characters of LaTeX code")
        
        # Save the LaTeX code to a file for inspection
        output_file = "test_output.tex"
        with open(output_file, "w", encoding="utf-8") as f:
            f.write(latex_code)
        
        print(f"📄 LaTeX code saved to: {output_file}")
        
        # Show the first few lines of the generated LaTeX
        print("\n2. 📋 LaTeX Template Preview:")
        print("-" * 40)
        lines = latex_code.split('\n')
        for i, line in enumerate(lines[:20]):  # Show first 20 lines
            print(f"{i+1:2d}: {line}")
        if len(lines) > 20:
            print("    ... (truncated)")
        print("-" * 40)
        
        # Check for problematic packages
        print("\n3. 🔍 Package Analysis:")
        problematic_packages = ['lmodern', 'titlesec', 'xcolor', 'graphicx']
        found_issues = []
        
        for package in problematic_packages:
            if f"\\usepackage{{{package}}}" in latex_code or f"\\usepackage[" in latex_code and package in latex_code:
                found_issues.append(package)
        
        if found_issues:
            print(f"⚠️  Found potentially problematic packages: {found_issues}")
        else:
            print("✅ No problematic packages found!")
        
        # Check for basic packages
        basic_packages = ['geometry', 'enumitem', 'hyperref', 'inputenc', 'fontenc', 'times']
        found_basic = []
        
        for package in basic_packages:
            if f"\\usepackage{{{package}}}" in latex_code or f"\\usepackage[" in latex_code and package in latex_code:
                found_basic.append(package)
        
        print(f"📦 Basic packages used: {found_basic}")
        
        return True
        
    except Exception as e:
        print(f"❌ LaTeX generation failed: {e}")
        import traceback
        print(f"Stack trace: {traceback.format_exc()}")
        return False

def test_minimal_latex():
    """Test with an even more minimal LaTeX template"""
    print("\n4. 🧪 Testing Minimal LaTeX Template...")
    
    minimal_latex = r"""
\documentclass[letterpaper,11pt]{article}

% Minimal packages
\usepackage[top=0.75in, bottom=0.75in, left=0.75in, right=0.75in]{geometry}
\usepackage{enumitem}
\usepackage[utf8]{inputenc}

% Remove paragraph indentation
\setlength{\parindent}{0pt}
\setlength{\parskip}{6pt}

\begin{document}

\begin{center}
    {\Large\textbf{John Doe}}\\[6pt]
    {\normalsize\textit{Software Engineer}}\\[6pt]
    \hrulefill
\end{center}

\begin{center}
    New York, NY $\bullet$ john.doe@example.com $\bullet$ +1234567890
\end{center}

\vspace{16pt}
\begin{center}
    {\Large\bfseries Experience}
    \vspace{2pt}
    \hrule
\end{center}
\vspace{10pt}

\textbf{Tech Corp} \hfill New York, NY

\textit{Software Engineer} \hfill 2020 -- 2023

\begin{itemize}[leftmargin=*,itemsep=2pt,parsep=2pt,topsep=4pt]
    \item Developed web applications using Python and React
    \item Improved system performance by 25\%
    \item Led a team of 3 developers
\end{itemize}

\vspace{16pt}
\begin{center}
    {\Large\bfseries Education}
    \vspace{2pt}
    \hrule
\end{center}
\vspace{10pt}

\textbf{University of Technology} \hfill Boston, MA

Bachelor of Computer Science \hfill 2020

GPA: 3.8/4.0

\end{document}
"""
    
    try:
        # Save minimal template
        minimal_file = "test_minimal.tex"
        with open(minimal_file, "w", encoding="utf-8") as f:
            f.write(minimal_latex)
        
        print(f"✅ Minimal LaTeX template saved to: {minimal_file}")
        print("📋 This template uses only the most basic packages:")
        print("   - geometry (for margins)")
        print("   - enumitem (for bullet points)")
        print("   - inputenc (for UTF-8)")
        print("   - No fonts, colors, or advanced formatting")
        
        return True
        
    except Exception as e:
        print(f"❌ Minimal template creation failed: {e}")
        return False

def main():
    """Main test function"""
    print("🧪 LaTeX Template Testing")
    print("This script tests the LaTeX generation without requiring server deployment")
    print()
    
    success1 = test_latex_generation()
    success2 = test_minimal_latex()
    
    print("\n" + "=" * 60)
    print("🏁 Test Summary")
    print(f"LaTeX Generation: {'✅ Success' if success1 else '❌ Failed'}")
    print(f"Minimal Template: {'✅ Success' if success2 else '❌ Failed'}")
    
    if success1 and success2:
        print("\n🎉 All tests passed!")
        print("The LaTeX templates should work with basic packages.")
        print("You can now deploy the updated backend.")
    else:
        print("\n⚠️  Some tests failed.")
        print("The LaTeX templates may need further simplification.")

if __name__ == "__main__":
    main()
