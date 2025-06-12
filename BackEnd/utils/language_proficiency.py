from enum import Enum


class LanguageProficiency(Enum):
    """Enum for standardized language proficiency levels"""
    
    NATIVE = "Native/Bilingual"
    FLUENT = "Fluent"
    ADVANCED = "Advanced"
    INTERMEDIATE = "Intermediate"
    BASIC = "Basic/Elementary"
    
    @classmethod
    def get_all_levels(cls):
        """Return all proficiency levels as a list"""
        return [level.value for level in cls]
    
    @classmethod
    def get_default(cls):
        """Return the default proficiency level"""
        return cls.INTERMEDIATE.value
    
    @classmethod
    def is_valid_level(cls, level: str) -> bool:
        """Check if a given level is valid"""
        return level in cls.get_all_levels()
    
    @classmethod
    def normalize_level(cls, level: str) -> str:
        """Normalize a proficiency level to match our enum values"""
        if not level:
            return cls.get_default()
        
        level_lower = level.lower().strip()
        
        # Common mappings
        mappings = {
            'native': cls.NATIVE.value,
            'bilingual': cls.NATIVE.value,
            'native speaker': cls.NATIVE.value,
            'mother tongue': cls.NATIVE.value,
            'fluent': cls.FLUENT.value,
            'advanced': cls.ADVANCED.value,
            'upper intermediate': cls.INTERMEDIATE.value,
            'intermediate': cls.INTERMEDIATE.value,
            'basic': cls.BASIC.value,
            'elementary': cls.BASIC.value,
            'beginner': cls.BASIC.value,
            'conversational': cls.INTERMEDIATE.value,
            'proficient': cls.ADVANCED.value,
        }
        
        # Check direct mappings
        if level_lower in mappings:
            return mappings[level_lower]
        
        # Check if it contains specific test scores or certifications
        if any(test in level_lower for test in ['toeic', 'toefl', 'ielts', 'jlpt', 'n1', 'n2', 'n3', 'n4', 'n5']):
            # Keep the original for test scores but default to Advanced
            return level if level else cls.ADVANCED.value
        
        # If no match found, return the original or default
        return level if level else cls.get_default()


# Convenience constants for easy import
LANGUAGE_PROFICIENCY_LEVELS = LanguageProficiency.get_all_levels()
DEFAULT_PROFICIENCY = LanguageProficiency.get_default()
