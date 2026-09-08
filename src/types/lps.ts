export type UserRole = "INSPECTOR" | "SUPERVISOR" | "ADMIN";

export type ViewKey =
  | "dashboard"
  | "inspection"
  | "inspections"
  | "products"
  | "reviews"
  | "rules"
  | "sources"
  | "updates"
  | "reports"
  | "analytics"
  | "users"
  | "settings";

export type CaptureSide = "Front" | "Back" | "Left" | "Right" | "Top" | "Bottom";

export type User = {
  id: string;
  email: string;
  display_name: string;
  role: UserRole;
  is_active: boolean;
};

export type Inspection = {
  id: string;
  inspection_date: string | null;
  inspection_time: string | null;
  inspector_id: string;
  location: string | null;
  premises: string | null;
  inspection_type: string | null;
  notes: string | null;
  status: string;
  product_id: string | null;
  barcode: string | null;
  category_id: string | null;
  subcategory_id: string | null;
  category_status: string | null;
  coverage_status: string;
  screening_status: string | null;
  next_evidence_guidance: string | null;
  created_at: string;
  updated_at: string;
};

export type PackageImage = {
  id: string;
  inspection_id: string;
  side: string;
  original_filename: string;
  sha256: string;
  capture_time: string;
  source: string;
  status: string;
  quality_status: string;
  quality_reasons: string[] | null;
  quality_metrics: Record<string, number> | null;
  processed_path: string | null;
};

export type OCRRegion = {
  id: string;
  image_id: string;
  text: string;
  language: string | null;
  confidence: number | null;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
};

export type OCRResult = {
  id: string;
  inspection_id: string;
  image_id: string;
  status: string;
  engine: string;
  error: string | null;
  raw_text: string | null;
  regions: OCRRegion[];
};

export type Declaration = {
  id: string;
  inspection_id: string;
  field_type: string;
  original_text: string | null;
  normalized_value: string | null;
  unit: string | null;
  image_id: string | null;
  bbox: { x1: number; y1: number; x2: number; y2: number } | null;
  ocr_confidence: number | null;
  extraction_confidence: number | null;
  source: string;
  verification_status: string;
  result_state: string;
  ai_value: string | null;
  human_value: string | null;
};

export type Coverage = {
  status: string;
  captured_sides: string[];
  not_captured_sides: string[];
  recommended_next_surface: string | null;
  guidance: string | null;
};

export type Product = {
  id: string;
  barcode: string | null;
  brand: string | null;
  name: string | null;
  manufacturer: string | null;
  resolution_status: string;
};

export type Finding = {
  id: string;
  field_type: string | null;
  result: string;
  observed: string | null;
  required: string | null;
  uncertain: string | null;
  next_action: string | null;
  rule_id: string | null;
  rule_version_id: string | null;
};

export type Check = {
  id: string;
  check_type: string;
  field_type: string | null;
  result: string;
  reason: string;
  explanation: Record<string, unknown> | null;
};

export type Review = {
  id: string;
  inspection_id: string;
  reviewer_id: string;
  action: string;
  ai_result: string | null;
  human_result: string | null;
  reason: string | null;
  comment: string | null;
  created_at: string;
};

export type RuleRow = {
  id: string;
  internal_rule_code: string;
  title: string;
  status: string;
  legal_text: string | null;
  machine_interpretation: string | null;
};

export type RuleVersion = {
  id: string;
  rule_id: string;
  version_label: string;
  publication_date: string | null;
  effective_from: string | null;
  effective_to: string | null;
  legal_review_status: string;
  legal_text: string | null;
};

export type SourceRow = {
  id: string;
  authority: string;
  source_type: string;
  title: string;
  url: string;
  review_status: string;
  status: string;
  publication_date: string | null;
  effective_date: string | null;
};

export type DocumentRow = {
  id: string;
  source_id: string;
  document_type: string;
  title: string;
  publication_date: string | null;
  effective_date: string | null;
  review_status: string;
  processing_status: string;
  storage_path: string | null;
  url: string | null;
};

export type DashboardSummary = {
  todays_inspections: number | null;
  open_reviews: number | null;
  potential_issues: number | null;
  evidence_incomplete: number | null;
  verified: number | null;
  products_screened: number | null;
  backend_connected: boolean;
};

export type Category = {
  id: string;
  code: string;
  name: string;
  is_statutory: boolean;
  subcategories: { id: string; code: string; name: string }[];
};

export type Applicability = {
  inspection_date: string | null;
  selected_rule_versions: Array<{
    rule_id: string;
    rule_version_id: string;
    version_label: string;
    effective_from: string | null;
    status: string;
  }>;
  note: string;
  status: string;
};
