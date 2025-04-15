CV_STRUCTURE = '''{
        "cv_template": {
            "metadata": {
              "section_order": [
                "header", "education", "experience", "leadership", "skills", "projects", "languages", "certifications", "courses", "publications", "research", "interests"
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
                    "degree": "Degree, Concentration",
                    "institution": "Harvard University",
                    "url": "Institution URL",
                    "location": "Cambridge, MA",
                    "graduation_date": "Graduation Date",
                    "gpa": "GPA (Optional)",
                    "thesis": "Thesis (Optional)",
                    "coursework": ["Relevant Course 1", "Relevant Course 2", "Relevant Course 3"],
                    "honors": ["Honor or Award (Optional)"]
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
              "leadership": {
                "section_title": "Leadership & Activities",
                "items": [
                  {
                    "organization": "Organization",
                    "location": "City, State",
                    "role": "Role",
                    "dates": {"start": "Month Year", "end": "Month Year"},
                    "descriptions": [
                      "Description of your role and impact",
                      "Begin with action verbs and quantify results where possible"
                    ]
                  }
                ]
              },
              "skills": {
                "section_title": "Skills & Interests",
                "categories": [
                  {
                    "name": "Technical",
                    "items": ["Software 1", "Software 2", "Programming Language 1", "Programming Language 2"]
                  },
                  {
                    "name": "Language",
                    "items": ["Language 1 (Proficiency)", "Language 2 (Proficiency)"]
                  },
                  {
                    "name": "Laboratory",
                    "items": ["Lab Technique 1", "Lab Technique 2"]
                  }
                ],
                "interests": ["Interest 1", "Interest 2", "Interest 3"]
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
              "certifications": {
                "section_title": "Certifications",
                "items": [
                  {
                    "title": "Certification Name",
                    "institution": "Issuing Institution",
                    "url": "Certification URL",
                    "date": {"start": "Start Date", "end": "End Date"}
                  }
                ]
              },
              "courses": {
                "section_title": "Courses",
                "items": [
                  {
                    "title": "Course Name",
                    "institution": "Issuing Institution",
                    "url": "Course URL",
                    "date": {"start": "Start Date", "end": "End Date"}
                  }
                ]
              },
              "languages": {
                "section_title": "Languages",
                "items": [
                  {"name": "Language", "proficiency": "Proficiency Level"}
                ]
              },
              "volunteer": {
                "section_title": "Volunteer Experience",
                "items": [
                  {
                    "title": "Volunteer Role",
                    "organization": "Organization Name",
                    "location": "City, Country",
                    "dates": {"start": "Start Date", "end": "End Date"},
                    "achievements": ["Achievement 1"]
                  }
                ]
              },
              "achievements": {
                "section_title": "Awards & Achievements",
                "items": [
                  {
                    "organization": "Example Organization",
                    "description": "Achievement description",
                    "date": "2023-01-01"
                  }
                ]
              },
              "publications": {
                "section_title": "Publications",
                "items": [
                  {
                    "title": "Publication Title",
                    "url": "Publication URL",
                    "date": "Publication Date"
                  }
                ]
              },
              "interests": {
                "section_title": "Interests",
                "items": ["Interest 1", "Interest 2"]
              },
              "references": {
                "section_title": "References",
                "items": [
                  {
                    "name": "Reference Name",
                    "title": "Title",
                    "company": "Company Name",
                    "email": "Email",
                    "phone": "Phone Number"
                  }
                ]
              },
              "patents": {
                "section_title": "Patents",
                "items": [
                  {
                    "title": "Patent Title",
                    "number": "Patent Number",
                    "url": "Patent URL",
                    "date": "2023-01-01"
                  }
                ]
              },
              "research": {
                "section_title": "Research",
                "items": [
                  {
                    "title": "Research Title",
                    "description": "Research Description",
                    "url": "Research URL",
                    "date": "2023-01-01"
                  }
                ]
              },
              "custom": {
                "section_title": "Custom Section",
                "items": [
                  {
                    "title": "Custom Item Title",
                    "description": "Custom Item Description",
                    "url": "Custom Item URL",
                    "date": "2023-01-01"
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
