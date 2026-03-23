
from pydantic import BaseModel
from typing import Any, Dict, List, Optional

class ValidationIssue(BaseModel):
    feature_index: Optional[int] = None
    path: str
    message: str

class GeoJSONValidationResult(BaseModel):
    is_valid: bool
    issues: List[ValidationIssue] = []
    
class ImportSummary(BaseModel):
    inserted: int
    skipped: int
    skipped_details: List[ValidationIssue]
    message: str

class ExportSummary(BaseModel):
    exported: int
    filters_applied: Dict[str, Any] = {}
