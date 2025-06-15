CV_STRUCTURE = '''{
        "cv_template": {
            "metadata": {
              "section_order": [
                "header", "education", "experience", "projects", "skills", "interests", "certifications"
              ]
            },
            "sections": {
              "header": {
                "name": "Firstname Lastname",
                "contact_info": {
                  "email": {"value": "youremail@college.harvard.edu", "link": "mailto:youremail@college.harvard.edu"},
                  "phone": {"value": "phone number", "link": "tel:phonenumber"},
                  "location": {"value": "Home or Campus Street Address, City, State Zip"}
                }
              },
              "education": {
                "section_title": "Education",
                "items": [
                  {
                    "institution": "Harvard University",
                    "start_date": "Start Date",
                    "graduation_date": "Graduation Date",
                    "gpa": "GPA (Optional)"
                  }
                ]
              },
              "experience": {
                "section_title": "Experience",
                "items": [
                  {
                    "type": "job",
                    "title": "Position Title",
                    "company": "Organization",
                    "url": "Company URL",
                    "location": "City, State (or Remote)",
                    "dates": {"start": "Month Year", "end": "Month Year", "is_current": false},
                    "achievements": [
                      "Begin each bullet with an action verb and include details that will help the reader understand your accomplishments",
                      "Quantify where possible",
                      "Do not use personal pronouns; each line should be a phrase rather than a full sentence"
                    ]
                  }
                ]
              },
              "skills": {
                "section_title": "Skills",
                "categories": [
                  {
                    "name": "Technical",
                    "items": ["Software 1", "Software 2", "Programming Language 1", "Programming Language 2"]
                  },
                  {
                    "name": "Languages",
                    "items": ["English (Fluent)", "Spanish (Intermediate)", "French (Basic)"]
                  }
                ]
              },
              "projects": {
                "section_title": "Projects",
                "items": [
                  {
                    "title": "Project Title",
                    "url": "Project URL",
                    "description": "Project Description",
                    "dates": {"start": "Start Date", "end": "End Date"},
                    "technologies": ["Technology 1", "Technology 2"],
                    "key_contributions": ["Contribution 1", "Contribution 2"]
                  }
                ]
              },
              "interests": {
                "section_title": "Interests",
                "items": ["Interest 1", "Interest 2", "Interest 3"]
              },
              "certifications": {
                "section_title": "Certifications",
                "items": [
                  {
                    "title": "Certification Name",
                    "institution": "Issuing Institution",
                    "date": "Issue Date"
                  }
                ]
              }
            },
            "rendering_rules": {
              "date_format": "MMM YYYY",
              "hide_empty_sections": true,
              "max_items_per_section": "No limit for now",
              "truncate_descriptions_at": 600
            }
          }
        }'''
