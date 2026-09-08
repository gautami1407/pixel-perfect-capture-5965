import type {
  Applicability,
  Category,
  Check,
  Coverage,
  DashboardSummary,
  Declaration,
  DocumentRow,
  Finding,
  Inspection,
  OCRResult,
  PackageImage,
  Product,
  Review,
  RuleRow,
  RuleVersion,
  SourceRow,
  User,
} from "@/types/lps";

import { apiBlob, apiFetch } from "./client";

export const lpsApi = {
  login: (email: string, password: string) =>
    apiFetch<{ access_token: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  me: () => apiFetch<User>("/auth/me"),
  logout: () => apiFetch<{ status: string }>("/auth/logout", { method: "POST" }),
  dashboard: () => apiFetch<DashboardSummary>("/dashboard/summary"),
  listInspections: (q?: string) =>
    apiFetch<Inspection[]>(`/inspections${q ? `?q=${encodeURIComponent(q)}` : ""}`),
  createInspection: (payload: Partial<Inspection> = {}) =>
    apiFetch<Inspection>("/inspections", { method: "POST", body: JSON.stringify(payload) }),
  getInspection: (id: string) => apiFetch<Inspection>(`/inspections/${id}`),
  patchInspection: (id: string, payload: Record<string, unknown>) =>
    apiFetch<Inspection>(`/inspections/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  uploadImage: (id: string, side: string, file: File) => {
    const data = new FormData();
    data.append("side", side);
    data.append("file", file);
    return apiFetch<PackageImage>(`/inspections/${id}/images`, { method: "POST", body: data });
  },
  listImages: (id: string) => apiFetch<PackageImage[]>(`/inspections/${id}/images`),
  quality: (id: string) => apiFetch<PackageImage[]>(`/inspections/${id}/quality`, { method: "POST" }),
  coverage: (id: string) => apiFetch<Coverage>(`/inspections/${id}/coverage`),
  runOcr: (id: string) => apiFetch<OCRResult[]>(`/inspections/${id}/ocr`, { method: "POST" }),
  getOcr: (id: string) => apiFetch<OCRResult[]>(`/inspections/${id}/ocr`),
  extract: (id: string) =>
    apiFetch<Declaration[]>(`/inspections/${id}/extract-declarations`, { method: "POST" }),
  declarations: (id: string) => apiFetch<Declaration[]>(`/inspections/${id}/declarations`),
  barcode: (id: string, payload: { barcode?: string; image_id?: string }) =>
    apiFetch<{ barcode: string; status: string }>(`/inspections/${id}/barcode`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  resolveProduct: (id: string) =>
    apiFetch<{ status: string; detail?: string; product?: Product; provenance?: Record<string, string> }>(
      `/products/resolve?inspection_id=${id}`,
      { method: "POST" },
    ),
  product: (id: string) => apiFetch<Product | null>(`/inspections/${id}/product`),
  categories: () => apiFetch<Category[]>("/categories"),
  applicability: (id: string) =>
    apiFetch<Applicability>(`/inspections/${id}/applicability`, { method: "POST" }),
  screen: (id: string) =>
    apiFetch<{ overall: string; gemini_explanation: string | null; semantic_assistance: string; inspection: Inspection }>(
      `/inspections/${id}/screen`,
      { method: "POST" },
    ),
  checks: (id: string) => apiFetch<Check[]>(`/inspections/${id}/checks`),
  findings: (id: string) => apiFetch<Finding[]>(`/inspections/${id}/findings`),
  createReview: (id: string, payload: Record<string, unknown>) =>
    apiFetch<Review>(`/inspections/${id}/review`, { method: "POST", body: JSON.stringify(payload) }),
  reviews: (id: string) => apiFetch<Review[]>(`/inspections/${id}/reviews`),
  createReport: (id: string) => apiFetch<{ id: string; disclaimer: string }>(`/reports/${id}`, { method: "POST" }),
  reportPdf: (id: string) => apiBlob(`/reports/${id}/pdf`),
  rules: () => apiFetch<RuleRow[]>("/rules"),
  versions: () => apiFetch<RuleVersion[]>("/rule-versions"),
  sources: () => apiFetch<SourceRow[]>("/sources"),
  updates: () => apiFetch<DocumentRow[]>("/regulatory/updates"),
  ingest: (sourceId: string) =>
    apiFetch<{ status: string; document_id: string | null }>(`/regulatory/ingest?source_id=${sourceId}`, {
      method: "POST",
    }),
  users: () => apiFetch<User[]>("/users"),
};
