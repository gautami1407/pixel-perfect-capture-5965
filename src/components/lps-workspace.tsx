import { Button } from "@/components/ui/button";
import { ApiError, imageFileUrl, setToken } from "@/services/api/client";
import { lpsApi } from "@/services/api/lps";
import type {
  Applicability,
  CaptureSide,
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
  ViewKey,
} from "@/types/lps";
import { useNavigate } from "@tanstack/react-router";
import {
  Activity,
  AlertCircle,
  ArrowRight,
  Bell,
  BookOpen,
  Box,
  CalendarDays,
  Check,
  ChevronDown,
  ClipboardCheck,
  FileBarChart,
  FileSearch,
  Filter,
  FolderOpen,
  Gauge,
  ImagePlus,
  Inbox,
  LayoutDashboard,
  Menu,
  MoreHorizontal,
  PackageCheck,
  PanelLeftClose,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Tags,
  Users,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

const SIDE_TO_API: Record<CaptureSide, string> = {
  Front: "FRONT",
  Back: "BACK",
  Left: "LEFT",
  Right: "RIGHT",
  Top: "TOP",
  Bottom: "BOTTOM",
};

const API_TO_SIDE: Record<string, CaptureSide> = {
  FRONT: "Front",
  BACK: "Back",
  LEFT: "Left",
  RIGHT: "Right",
  TOP: "Top",
  BOTTOM: "Bottom",
};

const FIELD_LABELS: Record<string, string> = {
  COMMON_GENERIC_NAME: "Common / generic name",
  MANUFACTURER_NAME: "Manufacturer",
  MANUFACTURER_ADDRESS: "Manufacturer address",
  PACKER_NAME: "Packer",
  PACKER_ADDRESS: "Packer address",
  IMPORTER_NAME: "Importer",
  IMPORTER_ADDRESS: "Importer address",
  COUNTRY_OF_ORIGIN: "Country of origin",
  NET_QUANTITY: "Net quantity",
  MRP: "MRP",
  RETAIL_SALE_PRICE: "Retail sale price",
  MANUFACTURE_DATE: "Manufacture date",
  PACKING_DATE: "Packing date",
  IMPORT_DATE: "Import date",
  BEST_BEFORE: "Best before",
  USE_BY: "Use by",
  CONSUMER_CARE: "Consumer care",
  UNIT_SALE_PRICE: "Unit sale price",
  DIMENSIONS: "Dimensions",
};

const steps = [
  "Inspection details",
  "Product",
  "Package capture",
  "Image quality",
  "Barcode",
  "OCR",
  "Declarations",
  "Evidence",
  "Rules",
  "Screening",
  "Review",
  "Report",
];

const captureSides: CaptureSide[] = ["Front", "Back", "Left", "Right", "Top", "Bottom"];

function resultLabel(state?: string | null) {
  switch (state) {
    case "AWAITING_EVIDENCE":
      return "Awaiting evidence";
    case "NOT_PROCESSED":
      return "Not processed";
    case "NOT_DETECTED_IN_SUBMITTED_EVIDENCE":
      return "Not detected in submitted evidence";
    case "INSUFFICIENT_EVIDENCE":
      return "Insufficient evidence";
    case "DETECTED":
      return "Detected";
    case "REVIEW_REQUIRED":
      return "Review required";
    default:
      return state || "--";
  }
}

function errText(error: unknown) {
  if (error instanceof ApiError) return error.detail;
  if (error instanceof Error) return error.message;
  return "Request failed";
}

const navGroups = [
  {
    label: "Workspace",
    items: [
      { key: "dashboard" as ViewKey, to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { key: "inspection" as ViewKey, to: "/inspections/new", label: "New inspection", icon: Plus },
      { key: "inspections" as ViewKey, to: "/inspections", label: "Inspections", icon: ClipboardCheck },
      { key: "products" as ViewKey, to: "/products", label: "Products", icon: PackageCheck },
      { key: "reviews" as ViewKey, to: "/reviews", label: "Reviews", icon: FileSearch },
    ],
  },
  {
    label: "Intelligence",
    items: [
      { key: "rules" as ViewKey, to: "/rules", label: "Rules & sources", icon: BookOpen },
      { key: "reports" as ViewKey, to: "/reports", label: "Reports", icon: FileBarChart },
      { key: "analytics" as ViewKey, to: "/analytics", label: "Analytics", icon: Activity },
    ],
  },
];

export function LpsWorkspace({
  initialView,
  inspectionId: routeInspectionId,
}: {
  initialView: ViewKey;
  inspectionId?: string;
}) {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [activeView, setActiveView] = useState<ViewKey>(initialView);
  const [activeStep, setActiveStep] = useState(0);
  const [selectedSide, setSelectedSide] = useState<CaptureSide | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [inspection, setInspection] = useState<Inspection | null>(null);
  const [images, setImages] = useState<PackageImage[]>([]);
  const [coverage, setCoverage] = useState<Coverage | null>(null);
  const [ocr, setOcr] = useState<OCRResult[]>([]);
  const [declarations, setDeclarations] = useState<Declaration[]>([]);
  const [selectedDeclaration, setSelectedDeclaration] = useState<Declaration | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [productStatus, setProductStatus] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [rules, setRules] = useState<RuleRow[]>([]);
  const [versions, setVersions] = useState<RuleVersion[]>([]);
  const [sources, setSources] = useState<SourceRow[]>([]);
  const [updates, setUpdates] = useState<DocumentRow[]>([]);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [checks, setChecks] = useState<Check[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [applicability, setApplicability] = useState<Applicability | null>(null);
  const [screeningOverall, setScreeningOverall] = useState<string | null>(null);
  const [explanation, setExplanation] = useState<string | null>(null);
  const creatingRef = useRef(false);

  const showNotice = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(null), 2800);
  };

  const loadInspectionBundle = async (id: string) => {
    const [insp, imgs, decls, ocrRows, cov, prod, cats] = await Promise.all([
      lpsApi.getInspection(id),
      lpsApi.listImages(id),
      lpsApi.declarations(id),
      lpsApi.getOcr(id).catch(() => []),
      lpsApi.coverage(id).catch(() => null),
      lpsApi.product(id).catch(() => null),
      lpsApi.categories().catch(() => []),
    ]);
    setInspection(insp);
    setImages(imgs);
    setDeclarations(decls);
    setOcr(ocrRows);
    setCoverage(cov);
    setProduct(prod);
    setCategories(cats);
    setFindings(await lpsApi.findings(id).catch(() => []));
    setChecks(await lpsApi.checks(id).catch(() => []));
    setReviews(await lpsApi.reviews(id).catch(() => []));
  };

  useEffect(() => {
    setActiveView(initialView);
  }, [initialView]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const me = await lpsApi.me();
        if (cancelled) return;
        setUser(me);
      } catch {
        navigate({ to: "/login" });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  useEffect(() => {
    if (!user) return;
    if (activeView === "dashboard") {
      lpsApi.dashboard().then(setSummary).catch((e) => setError(errText(e)));
      lpsApi.listInspections().then(setInspections).catch(() => setInspections([]));
      lpsApi.updates().then(setUpdates).catch(() => setUpdates([]));
    }
    if (activeView === "inspections" || activeView === "reviews" || activeView === "products" || activeView === "reports") {
      lpsApi.listInspections(searchText || undefined).then(setInspections).catch((e) => setError(errText(e)));
    }
    if (activeView === "rules" || activeView === "sources" || activeView === "updates") {
      Promise.all([lpsApi.rules(), lpsApi.versions(), lpsApi.sources(), lpsApi.updates()])
        .then(([r, v, s, u]) => {
          setRules(r);
          setVersions(v);
          setSources(s);
          setUpdates(u);
        })
        .catch((e) => setError(errText(e)));
    }
    if (activeView === "users" && user.role === "ADMIN") {
      lpsApi.users().then(setUsers).catch((e) => setError(errText(e)));
    }
  }, [activeView, user, searchText]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        if (routeInspectionId) {
          await loadInspectionBundle(routeInspectionId);
          return;
        }
        if (activeView === "inspection" && !creatingRef.current) {
          creatingRef.current = true;
          const created = await lpsApi.createInspection({});
          setInspection(created);
          navigate({ to: "/inspections/$inspectionId", params: { inspectionId: created.id } });
        }
      } catch (e) {
        setError(errText(e));
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, routeInspectionId, activeView]);

  const initials = useMemo(() => {
    const name = user?.display_name || "User";
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }, [user]);

  const go = (view: ViewKey, to: string) => {
    setActiveView(view);
    setSidebarOpen(false);
    navigate({ to });
  };

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError(errText(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="app-shell">
      <aside className={`app-sidebar ${sidebarOpen ? "is-open" : ""}`}>
        <div className="sidebar-brand">
          <div className="brand-mark" aria-hidden="true">
            <ShieldCheck size={20} strokeWidth={2.2} />
          </div>
          <div>
            <p className="brand-name">LPS</p>
            <p className="brand-subtitle">Compliance Intelligence</p>
          </div>
          <button className="sidebar-close" aria-label="Close navigation" onClick={() => setSidebarOpen(false)}>
            <PanelLeftClose size={17} />
          </button>
        </div>
        <div className="sidebar-rule" />
        <div className="sidebar-navigation">
          {navGroups.map((group) => (
            <div className="nav-group" key={group.label}>
              <p className="nav-group-label">{group.label}</p>
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = item.key === activeView;
                return (
                  <button className={`nav-item ${isActive ? "active" : ""}`} key={item.label} onClick={() => go(item.key, item.to)}>
                    <Icon size={17} strokeWidth={isActive ? 2.2 : 1.8} />
                    <span>{item.label}</span>
                    {item.label === "Reviews" && (
                      <span className="nav-count">{summary?.open_reviews ?? "--"}</span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
        <div className="sidebar-footer">
          <button className="nav-item" onClick={() => go("settings", "/settings")}>
            <Settings size={17} />
            <span>Settings</span>
          </button>
          {user?.role === "ADMIN" && (
            <button className="nav-item" onClick={() => go("users", "/users")}>
              <Users size={17} />
              <span>Users</span>
            </button>
          )}
          <div className="user-block">
            <div className="avatar">{initials}</div>
            <div className="user-details">
              <p>{user?.display_name || "Signed in"}</p>
              <span>{user?.role || "Role unavailable"}</span>
            </div>
            <ChevronDown size={15} className="user-chevron" />
          </div>
        </div>
      </aside>

      <main className="app-main">
        <header className="top-header">
          <div className="header-left">
            <Button variant="ghost" size="icon" className="mobile-menu" aria-label="Open navigation" onClick={() => setSidebarOpen(true)}>
              <Menu size={19} />
            </Button>
            <div className="header-context">
              <span className="context-eyebrow">LEGAL METROLOGY / OPERATIONS</span>
              <span className="context-divider" />
              <span className="context-page">{pageLabel(activeView)}</span>
            </div>
          </div>
          <div className="header-actions">
            <form
              className="global-search"
              onSubmit={(event) => {
                event.preventDefault();
                go("inspections", "/inspections");
              }}
            >
              <Search size={16} />
              <input
                placeholder="Search inspections, products, rules..."
                aria-label="Global search"
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
              />
              <kbd>⌘ K</kbd>
            </form>
            <Button variant="ghost" size="icon" className="header-icon" aria-label="Notifications" onClick={() => showNotice("No new notifications.")}>
              <Bell size={18} />
            </Button>
            <div className="header-profile">
              <div className="avatar avatar-small">{initials}</div>
              <div>
                <strong>{user?.display_name || "--"}</strong>
                <span>{user?.role || "Unauthorized"}</span>
              </div>
              <ChevronDown size={15} />
            </div>
          </div>
        </header>

        {error && <div className="page-container" style={{ paddingBottom: 0 }}><p className="login-error">{error}</p></div>}
        {busy && <div className="page-container" style={{ paddingTop: 12, paddingBottom: 0 }}><p className="page-description">Working…</p></div>}

        {activeView === "dashboard" && (
          <Dashboard
            summary={summary}
            inspections={inspections}
            updates={updates}
            onNavigate={(view) => go(view, view === "inspection" ? "/inspections/new" : `/${view}`)}
            onNotice={showNotice}
          />
        )}
        {(activeView === "inspection" || Boolean(routeInspectionId)) && activeView === "inspection" && (
          <InspectionWorkspace
            user={user}
            inspection={inspection}
            setInspection={setInspection}
            images={images}
            coverage={coverage}
            ocr={ocr}
            declarations={declarations}
            selectedDeclaration={selectedDeclaration}
            setSelectedDeclaration={setSelectedDeclaration}
            product={product}
            productStatus={productStatus}
            categories={categories}
            findings={findings}
            checks={checks}
            reviews={reviews}
            applicability={applicability}
            screeningOverall={screeningOverall}
            explanation={explanation}
            activeStep={activeStep}
            setActiveStep={setActiveStep}
            selectedSide={selectedSide}
            setSelectedSide={setSelectedSide}
            onOpenDrawer={() => setDrawerOpen(true)}
            onNotice={showNotice}
            onError={setError}
            run={run}
            reload={() => inspection && loadInspectionBundle(inspection.id)}
            setImages={setImages}
            setCoverage={setCoverage}
            setOcr={setOcr}
            setDeclarations={setDeclarations}
            setProduct={setProduct}
            setProductStatus={setProductStatus}
            setApplicability={setApplicability}
            setScreeningOverall={setScreeningOverall}
            setExplanation={setExplanation}
            setReviews={setReviews}
            setFindings={setFindings}
            setChecks={setChecks}
          />
        )}
        {activeView === "inspections" && (
          <RecordsPage
            title="Inspection records"
            kicker="INSPECTIONS"
            rows={inspections}
            empty="No inspection data connected yet"
            onOpen={(id) => navigate({ to: "/inspections/$inspectionId", params: { inspectionId: id } })}
            onCreate={() => go("inspection", "/inspections/new")}
          />
        )}
        {activeView === "products" && (
          <RecordsPage
            title="Products"
            kicker="PRODUCTS"
            rows={inspections.filter((row) => row.product_id || row.barcode)}
            empty="No product records are available yet."
            onOpen={(id) => navigate({ to: "/inspections/$inspectionId", params: { inspectionId: id } })}
            onCreate={() => go("inspection", "/inspections/new")}
          />
        )}
        {activeView === "reviews" && (
          <RecordsPage
            title="Review queue"
            kicker="REVIEWS"
            rows={inspections.filter((row) => ["REVIEW_REQUIRED", "UNDER_REVIEW"].includes(row.status))}
            empty="Assigned reviews will appear when inspections are submitted."
            onOpen={(id) => navigate({ to: "/inspections/$inspectionId", params: { inspectionId: id } })}
            onCreate={() => go("inspection", "/inspections/new")}
          />
        )}
        {activeView === "reports" && (
          <RecordsPage
            title="Reports"
            kicker="REPORTS"
            rows={inspections}
            empty="Generated inspection reports will appear here when evidence and review data are available."
            onOpen={(id) => navigate({ to: "/inspections/$inspectionId", params: { inspectionId: id } })}
            onCreate={() => go("inspection", "/inspections/new")}
          />
        )}
        {(activeView === "rules" || activeView === "sources") && (
          <RulesPage rules={rules} versions={versions} sources={sources} onIngest={(id) => run(async () => { await lpsApi.ingest(id); setSources(await lpsApi.sources()); })} admin={user?.role === "ADMIN"} />
        )}
        {activeView === "updates" && <UpdatesPage updates={updates} />}
        {activeView === "analytics" && (
          <EmptySection
            title="Analytics"
            text={inspections.length ? "Analytics use live inspection counts only. Detailed charts require more historical records." : "No sufficient historical data is connected yet."}
            onCreate={() => go("inspection", "/inspections/new")}
          />
        )}
        {activeView === "users" && <UsersPage users={users} />}
        {activeView === "settings" && (
          <SettingsPage
            user={user}
            onLogout={async () => {
              await lpsApi.logout().catch(() => undefined);
              setToken(null);
              navigate({ to: "/login" });
            }}
          />
        )}
      </main>

      {drawerOpen && <EvidenceDrawer declaration={selectedDeclaration} onClose={() => setDrawerOpen(false)} />}
      {notice && (
        <div className="toast-notice">
          <Check size={16} />
          {notice}
        </div>
      )}
    </div>
  );
}

function pageLabel(view: ViewKey) {
  return {
    dashboard: "Dashboard",
    inspection: "New inspection",
    inspections: "Inspections",
    products: "Products",
    reviews: "Reviews",
    rules: "Rules & sources",
    sources: "Rules & sources",
    updates: "Regulatory updates",
    reports: "Reports",
    analytics: "Analytics",
    users: "Users",
    settings: "Settings",
  }[view];
}

function Dashboard({
  summary,
  inspections,
  updates,
  onNavigate,
  onNotice,
}: {
  summary: DashboardSummary | null;
  inspections: Inspection[];
  updates: DocumentRow[];
  onNavigate: (view: ViewKey) => void;
  onNotice: (text: string) => void;
}) {
  const metric = (value: number | null | undefined) => (value == null ? "--" : String(value));
  return (
    <div className="page-container">
      <div className="page-heading-row">
        <div>
          <p className="section-kicker">INSPECTION CONTROL ROOM</p>
          <h1>Good morning, Inspector</h1>
          <p className="page-description">Review open work, inspect submitted evidence, and track screening activity.</p>
        </div>
        <Button className="primary-action" onClick={() => onNavigate("inspection")}>
          <Plus size={17} /> New inspection
        </Button>
      </div>
      <div className="principle-strip">
        <div className="principle-icon">
          <ShieldCheck size={19} />
        </div>
        <div>
          <strong>Evidence-first screening</strong>
          <span>AI reads. Rules check. Evidence supports. Humans decide.</span>
        </div>
        <div className="strip-status">
          <span className="status-dot" /> {summary?.backend_connected ? "Backend connected" : "Backend not connected"}
        </div>
      </div>
      <section className="metric-grid" aria-label="Inspection overview">
        <MetricCard label="Today's inspections" icon={ClipboardCheck} value={metric(summary?.todays_inspections)} detail={summary ? "Live records" : "No live records"} />
        <MetricCard label="Open reviews" icon={FileSearch} value={metric(summary?.open_reviews)} detail={summary ? "Live records" : "No live records"} />
        <MetricCard label="Potential issues" icon={AlertCircle} value={metric(summary?.potential_issues)} detail={summary ? "Live records" : "No live records"} />
        <MetricCard label="Evidence incomplete" icon={ImagePlus} value={metric(summary?.evidence_incomplete)} detail={summary ? "Live records" : "No live records"} />
      </section>
      <div className="dashboard-grid">
        <section className="panel recent-panel">
          <div className="panel-heading">
            <div>
              <h2>Recent inspections</h2>
              <p>Submitted inspection records will appear here.</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => onNavigate("inspections")}>
              View all <ArrowRight size={14} />
            </Button>
          </div>
          {inspections.length === 0 ? (
            <EmptyTableState icon={Inbox} title="No inspection data connected yet" text="Connect the backend to display live inspection records and review status." action="Start an inspection" onClick={() => onNavigate("inspection")} />
          ) : (
            inspections.slice(0, 6).map((row) => (
              <button className="table-row" key={row.id} onClick={() => onNavigate("inspections")}>
                <span>{row.id.slice(0, 8)}</span>
                <span>{row.status}</span>
                <span>{row.premises || "--"}</span>
                <span>{row.screening_status || "--"}</span>
                <span>{row.coverage_status}</span>
              </button>
            ))
          )}
        </section>
        <section className="panel queue-panel">
          <div className="panel-heading">
            <div>
              <h2>Review queue</h2>
              <p>Cases requiring authorized verification.</p>
            </div>
            <Button variant="ghost" size="icon" aria-label="Review queue options" onClick={() => onNotice("Queue uses live inspection status.")}>
              <MoreHorizontal size={18} />
            </Button>
          </div>
          {inspections.filter((row) => row.status === "REVIEW_REQUIRED" || row.status === "UNDER_REVIEW").length === 0 ? (
            <div className="queue-empty">
              <div className="empty-icon">
                <ClipboardCheck size={22} />
              </div>
              <strong>Queue is ready</strong>
              <span>Assigned reviews will appear when inspections are submitted.</span>
            </div>
          ) : (
            inspections
              .filter((row) => row.status === "REVIEW_REQUIRED" || row.status === "UNDER_REVIEW")
              .slice(0, 6)
              .map((row) => (
                <div className="table-row" key={row.id}>
                  <span>{row.id.slice(0, 8)}</span>
                  <span>{row.status}</span>
                </div>
              ))
          )}
        </section>
      </div>
      <div className="dashboard-grid lower-grid">
        <section className="panel chart-panel">
          <div className="panel-heading">
            <div>
              <h2>Screening activity</h2>
              <p>Inspection volume over time.</p>
            </div>
            <Button variant="ghost" size="icon" aria-label="Filter activity" onClick={() => onNotice("Activity uses live counts only.")}>
              <Filter size={16} />
            </Button>
          </div>
          <div className="chart-empty">
            <Activity size={25} />
            <span>{inspections.length ? `${inspections.length} inspection record(s) in PostgreSQL.` : "No inspection data available."}</span>
            <small>Charts will populate from verified inspection records.</small>
          </div>
        </section>
        <section className="panel updates-panel">
          <div className="panel-heading">
            <div>
              <h2>Regulatory updates</h2>
              <p>Keep track of source changes.</p>
            </div>
            <Button variant="ghost" size="icon" aria-label="Open regulatory updates" onClick={() => onNavigate("rules")}>
              <ArrowRight size={17} />
            </Button>
          </div>
          {updates.length === 0 ? (
            <div className="update-empty">
              <BookOpen size={23} />
              <div>
                <strong>No regulatory updates available</strong>
                <span>Approved sources will appear here when connected.</span>
              </div>
            </div>
          ) : (
            updates.slice(0, 5).map((item) => (
              <div className="table-row" key={item.id}>
                <span>{item.title}</span>
                <span>{item.review_status}</span>
              </div>
            ))
          )}
        </section>
      </div>
    </div>
  );
}

function MetricCard({ label, icon: Icon, value, detail }: { label: string; icon: typeof ClipboardCheck; value: string; detail: string }) {
  return (
    <div className="metric-card">
      <div className="metric-icon">
        <Icon size={18} />
      </div>
      <div className="metric-label">{label}</div>
      <div className="metric-value">{value}</div>
      <div className="metric-detail">{detail}</div>
    </div>
  );
}

function EmptyTableState({ icon: Icon, title, text, action, onClick }: { icon: typeof Inbox; title: string; text: string; action: string; onClick: () => void }) {
  return (
    <div className="empty-table">
      <div className="empty-icon">
        <Icon size={21} />
      </div>
      <strong>{title}</strong>
      <span>{text}</span>
      <Button variant="outline" size="sm" onClick={onClick}>
        {action}
        <ArrowRight size={14} />
      </Button>
    </div>
  );
}

type WorkspaceProps = {
  user: User | null;
  inspection: Inspection | null;
  setInspection: (value: Inspection) => void;
  images: PackageImage[];
  coverage: Coverage | null;
  ocr: OCRResult[];
  declarations: Declaration[];
  selectedDeclaration: Declaration | null;
  setSelectedDeclaration: (value: Declaration | null) => void;
  product: Product | null;
  productStatus: string | null;
  categories: Category[];
  findings: Finding[];
  checks: Check[];
  reviews: Review[];
  applicability: Applicability | null;
  screeningOverall: string | null;
  explanation: string | null;
  activeStep: number;
  setActiveStep: (step: number) => void;
  selectedSide: CaptureSide | null;
  setSelectedSide: (side: CaptureSide | null) => void;
  onOpenDrawer: () => void;
  onNotice: (text: string) => void;
  onError: (text: string | null) => void;
  run: (fn: () => Promise<void>) => Promise<void>;
  reload: () => Promise<void>;
  setImages: (value: PackageImage[]) => void;
  setCoverage: (value: Coverage | null) => void;
  setOcr: (value: OCRResult[]) => void;
  setDeclarations: (value: Declaration[]) => void;
  setProduct: (value: Product | null) => void;
  setProductStatus: (value: string | null) => void;
  setApplicability: (value: Applicability | null) => void;
  setScreeningOverall: (value: string | null) => void;
  setExplanation: (value: string | null) => void;
  setReviews: (value: Review[]) => void;
  setFindings: (value: Finding[]) => void;
  setChecks: (value: Check[]) => void;
};

function InspectionWorkspace(props: WorkspaceProps) {
  const { inspection, activeStep, setActiveStep } = props;
  return (
    <div className="page-container inspection-page">
      <div className="page-heading-row inspection-heading">
        <div>
          <p className="section-kicker">PRELIMINARY SCREENING / {inspection?.status || "DRAFT"}</p>
          <h1>New inspection</h1>
          <p className="page-description">Create an evidence record before screening begins.</p>
        </div>
        <div className="heading-actions">
          <Button variant="outline" onClick={() => props.run(async () => { await props.reload(); props.onNotice("Draft saved."); })}>
            Save draft
          </Button>
          <Button className="primary-action" onClick={() => setActiveStep(Math.min(activeStep + 1, steps.length - 1))}>
            Continue <ArrowRight size={16} />
          </Button>
        </div>
      </div>
      <div className="inspection-meta">
        <div>
          <span>Inspection ID</span>
          <strong>{inspection?.id || "Generated on save"}</strong>
        </div>
        <div>
          <span>Status</span>
          <StatusBadge label={inspection?.status || "Draft"} tone="neutral" />
        </div>
        <div>
          <span>Evidence</span>
          <strong>{imagesCaptured(props.images)}</strong>
        </div>
        <div>
          <span>Last updated</span>
          <strong>{inspection?.updated_at ? new Date(inspection.updated_at).toLocaleString() : "--"}</strong>
        </div>
      </div>
      <div className="stepper-wrap">
        <div className="stepper-label">
          <span>WORKFLOW</span>
          <strong>
            Step {activeStep + 1} of {steps.length}
          </strong>
        </div>
        <div className="stepper">
          {steps.map((step, index) => (
            <button key={step} className={`step ${index === activeStep ? "current" : ""} ${index < activeStep ? "complete" : ""}`} onClick={() => setActiveStep(index)}>
              <span className="step-number">{index < activeStep ? <Check size={13} /> : index + 1}</span>
              <span>{step}</span>
            </button>
          ))}
        </div>
      </div>
      {activeStep === 0 && <InspectionDetails {...props} />}
      {activeStep === 1 && <ProductStep {...props} />}
      {activeStep === 2 && <PackageCapture {...props} />}
      {activeStep === 3 && <QualityStep {...props} />}
      {activeStep === 4 && <BarcodeStep {...props} />}
      {activeStep === 5 && <OcrStep {...props} />}
      {activeStep === 6 && <DeclarationsStep {...props} />}
      {activeStep === 7 && <EvidenceStep {...props} />}
      {activeStep === 8 && <RulesStep {...props} />}
      {activeStep === 9 && <ScreeningStep {...props} />}
      {activeStep === 10 && <ReviewStep {...props} />}
      {activeStep === 11 && <ReportStep {...props} />}
    </div>
  );
}

function imagesCaptured(images: PackageImage[]) {
  if (!images.length) return "Not submitted";
  return `${images.length} image(s) stored`;
}

function StepShell({ eyebrow, title, description, children }: { eyebrow: string; title: string; description: string; children: React.ReactNode }) {
  return (
    <section className="workflow-panel">
      <div className="workflow-heading">
        <p className="section-kicker">{eyebrow}</p>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      {children}
    </section>
  );
}

function InspectionDetails(props: WorkspaceProps) {
  const [form, setForm] = useState({
    inspection_date: props.inspection?.inspection_date || "",
    premises: props.inspection?.premises || "",
    location: props.inspection?.location || "",
    inspection_type: props.inspection?.inspection_type || "",
    notes: props.inspection?.notes || "",
  });
  useEffect(() => {
    setForm({
      inspection_date: props.inspection?.inspection_date || "",
      premises: props.inspection?.premises || "",
      location: props.inspection?.location || "",
      inspection_type: props.inspection?.inspection_type || "",
      notes: props.inspection?.notes || "",
    });
  }, [props.inspection]);
  return (
    <StepShell eyebrow="STEP 01 / INSPECTION DETAILS" title="Start an inspection record" description="Record the inspection context before package evidence is submitted.">
      <div className="form-grid">
        <Field label="Inspection ID" placeholder="Generated on save" value={props.inspection?.id || ""} disabled />
        <Field label="Inspection date" placeholder="YYYY-MM-DD" icon={CalendarDays} value={form.inspection_date} onChange={(value) => setForm({ ...form, inspection_date: value })} />
        <Field label="Inspector" placeholder="Authorized user" value={props.user?.display_name || ""} disabled />
        <Field label="Premises / store" placeholder="Enter location" wide value={form.premises} onChange={(value) => setForm({ ...form, premises: value })} />
        <Field label="Inspection type" placeholder="Select inspection type" value={form.inspection_type} onChange={(value) => setForm({ ...form, inspection_type: value })} />
        <Field label="Location" placeholder="Optional location" wide value={form.location} onChange={(value) => setForm({ ...form, location: value })} />
        <div className="field wide">
          <label>Notes</label>
          <textarea placeholder="Add context for the inspection record..." rows={4} value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} />
        </div>
      </div>
      <div className="form-footer">
        <span>
          <ShieldCheck size={15} /> Data fields connect to the inspection service.
        </span>
        <Button
          className="primary-action"
          onClick={() =>
            props.run(async () => {
              if (!props.inspection) return;
              const updated = await lpsApi.patchInspection(props.inspection.id, {
                inspection_date: form.inspection_date || null,
                premises: form.premises || null,
                location: form.location || null,
                inspection_type: form.inspection_type || null,
                notes: form.notes || null,
              });
              props.setInspection(updated);
              props.onNotice("Inspection details saved.");
            })
          }
        >
          Save details <ArrowRight size={15} />
        </Button>
      </div>
    </StepShell>
  );
}

function ProductStep(props: WorkspaceProps) {
  const [barcode, setBarcode] = useState(props.inspection?.barcode || "");
  return (
    <StepShell eyebrow="STEP 02 / PRODUCT" title="Identify the product" description="Use a barcode, source, or manual record to establish product identity.">
      <div className="source-tabs">
        <button className="source-tab active">
          <Search size={16} /> Search product
        </button>
        <button className="source-tab">
          <Box size={16} /> Scan barcode
        </button>
        <button className="source-tab">
          <Tags size={16} /> Manual entry
        </button>
      </div>
      <div className="form-grid product-grid">
        <Field label="Barcode" placeholder="Awaiting barcode or manual entry" wide value={barcode} onChange={setBarcode} />
        <Field label="Brand" placeholder="Pending product data" value={props.product?.brand || ""} disabled />
        <Field label="Product name" placeholder="Pending product data" value={props.product?.name || ""} disabled />
        <div className="field">
          <label>Category</label>
          <div className="input-wrap">
            <select
              value={props.inspection?.category_id || ""}
              onChange={(event) =>
                props.run(async () => {
                  if (!props.inspection) return;
                  const updated = await lpsApi.patchInspection(props.inspection.id, {
                    category_id: event.target.value || null,
                    category_status: "USER_SELECTED",
                  });
                  props.setInspection(updated);
                })
              }
            >
              <option value="">Select category</option>
              {props.categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <Field label="Resolution" placeholder="Pending" value={props.product?.resolution_status || props.productStatus || ""} disabled />
        <Field label="Manufacturer / packer / importer" placeholder="Pending product data" wide value={props.product?.manufacturer || ""} disabled />
      </div>
      <div className="form-footer">
        <span>Open Food Facts is product information only. It is not legal authority.</span>
        <Button
          className="primary-action"
          onClick={() =>
            props.run(async () => {
              if (!props.inspection) return;
              if (barcode) await lpsApi.barcode(props.inspection.id, { barcode });
              const resolved = await lpsApi.resolveProduct(props.inspection.id);
              props.setProductStatus(resolved.status);
              props.setProduct(resolved.product ?? null);
              await props.reload();
              props.onNotice(resolved.status === "RESOLVED" ? "Product resolved from Open Food Facts." : resolved.detail || "Product unresolved.");
            })
          }
        >
          Resolve product
        </Button>
      </div>
      <div className="data-source-note">
        <SlidersHorizontal size={16} />
        <div>
          <strong>Source-aware fields</strong>
          <span>Values show whether they came from OCR, barcode, an official source, or human verification.</span>
        </div>
      </div>
    </StepShell>
  );
}

function PackageCapture(props: WorkspaceProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const imageBySide = new Map(props.images.map((image) => [API_TO_SIDE[image.side], image]));
  return (
    <StepShell eyebrow="STEP 03 / PACKAGE CAPTURE" title="Capture package evidence" description="Capture the complete declaration surfaces of the package. Not captured is not the same as missing.">
      <input
        ref={inputRef}
        className="hidden-file"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (!file || !props.inspection || !props.selectedSide) return;
          props.run(async () => {
            await lpsApi.uploadImage(props.inspection!.id, SIDE_TO_API[props.selectedSide!], file);
            props.setImages(await lpsApi.listImages(props.inspection!.id));
            props.setCoverage(await lpsApi.coverage(props.inspection!.id));
            props.onNotice(`${props.selectedSide} evidence stored.`);
          });
        }}
      />
      <div className="capture-layout">
        <div className="capture-grid">
          {captureSides.map((side) => {
            const image = imageBySide.get(side);
            return (
              <button className={`capture-card ${props.selectedSide === side ? "selected" : ""}`} key={side} onClick={() => props.setSelectedSide(side)}>
                <div className="capture-placeholder">
                  {image ? <img className="capture-thumb" src={imageFileUrl(image.id)} alt={`${side} package`} /> : <><ImagePlus size={21} /><span>Not captured</span></>}
                </div>
                <div className="capture-card-footer">
                  <div>
                    <strong>{side}</strong>
                    <span>{image ? "Captured" : "Evidence surface"}</span>
                  </div>
                  <MoreHorizontal size={17} />
                </div>
              </button>
            );
          })}
        </div>
        <aside className="coverage-card">
          <div className="coverage-heading">
            <div>
              <p className="section-kicker">PACKAGE EVIDENCE</p>
              <h3>Coverage</h3>
            </div>
            <StatusBadge label={props.coverage?.status || "NOT_ASSESSED"} tone={props.coverage?.status === "COMPLETE" ? "success" : "warning"} />
          </div>
          <div className="coverage-map">
            {captureSides.map((side) => {
              const captured = Boolean(imageBySide.get(side));
              return (
                <div key={side}>
                  <span className="coverage-side">{side}</span>
                  <span className={`coverage-state ${captured ? "" : "neutral"}`}>
                    <span />
                    {captured ? "Captured" : "Not captured"}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="coverage-note">
            <AlertCircle size={15} />
            <span>{props.coverage?.guidance || "Additional package views may be required to complete evidence coverage."}</span>
          </div>
          <Button className="primary-action full-width" onClick={() => (props.selectedSide ? inputRef.current?.click() : props.onNotice("Choose a package side first."))}>
            <ImagePlus size={16} /> Add image
          </Button>
        </aside>
      </div>
    </StepShell>
  );
}

function QualityStep(props: WorkspaceProps) {
  return (
    <StepShell eyebrow="STEP 04 / IMAGE QUALITY" title="Check image quality" description="Quality signals are supplied by the image service after capture.">
      <div className="form-footer" style={{ marginBottom: 16 }}>
        <span>Quality uses OpenCV on stored originals. Physical font size is not calibrated.</span>
        <Button onClick={() => props.run(async () => { if (!props.inspection) return; props.setImages(await lpsApi.quality(props.inspection.id)); })}>Refresh quality</Button>
      </div>
      <div className="quality-grid">
        {captureSides.slice(0, 4).map((side) => {
          const image = props.images.find((item) => API_TO_SIDE[item.side] === side);
          return (
            <div className="quality-card" key={side}>
              <div className="quality-top">
                <div className="quality-thumb">{image ? <img className="capture-thumb" src={imageFileUrl(image.id)} alt="" /> : <ImagePlus size={18} />}</div>
                <div>
                  <strong>{side} image</strong>
                  <span>{image ? image.original_filename : "Not submitted"}</span>
                </div>
                <StatusBadge label={image?.quality_status || "Pending"} tone="neutral" />
              </div>
              <div className="quality-lines">
                <div><span>Resolution</span><b>{image?.quality_metrics ? `${image.quality_metrics.width}×${image.quality_metrics.height}` : "--"}</b></div>
                <div><span>Blur</span><b>{image?.quality_metrics?.laplacian_variance ?? "--"}</b></div>
                <div><span>Brightness</span><b>{image?.quality_metrics?.mean_brightness ?? "--"}</b></div>
                <div><span>Visibility</span><b>{image?.quality_reasons?.[0] || "--"}</b></div>
              </div>
            </div>
          );
        })}
      </div>
    </StepShell>
  );
}

function BarcodeStep(props: WorkspaceProps) {
  const [value, setValue] = useState(props.inspection?.barcode || "");
  return (
    <StepShell eyebrow="STEP 05 / BARCODE" title="Resolve a barcode" description="Barcode results appear here once a scan or barcode image is submitted.">
      <div className="scanner-card">
        <div className="scanner-frame">
          <div className="scanner-corners" />
          <Box size={30} />
          <span>{props.inspection?.barcode || "Ready for barcode evidence"}</span>
        </div>
        <div className="scanner-copy">
          <p className="section-kicker">BARCODE RESULT</p>
          <h3>{props.product?.name || props.inspection?.barcode || "No barcode submitted"}</h3>
          <p>{props.productStatus === "UNRESOLVED" ? "Product could not be confidently resolved." : "Position the barcode inside the frame or enter the printed code. Product matching stays pending until a source returns a result."}</p>
          <Field label="Barcode value" placeholder="Enter barcode" value={value} onChange={setValue} />
          <div className="scanner-actions">
            <Button className="primary-action" onClick={() => props.run(async () => {
              if (!props.inspection) return;
              const result = await lpsApi.barcode(props.inspection.id, { barcode: value });
              const resolved = await lpsApi.resolveProduct(props.inspection.id);
              props.setProduct(resolved.product ?? null);
              props.setProductStatus(resolved.status);
              await props.reload();
              props.onNotice(`Barcode ${result.barcode}`);
            })}>
              <Box size={16} /> Submit barcode
            </Button>
            <Button variant="outline" onClick={() => props.run(async () => {
              if (!props.inspection) return;
              const image = props.images[0];
              if (!image) throw new Error("Upload a package image first.");
              const result = await lpsApi.barcode(props.inspection.id, { image_id: image.id });
              setValue(result.barcode);
              const resolved = await lpsApi.resolveProduct(props.inspection.id);
              props.setProduct(resolved.product ?? null);
              props.setProductStatus(resolved.status);
              await props.reload();
            })}>
              <ImagePlus size={16} /> Decode from first image
            </Button>
          </div>
        </div>
      </div>
    </StepShell>
  );
}

function OcrStep(props: WorkspaceProps) {
  const first = props.ocr[0];
  const image = props.images.find((item) => item.id === first?.image_id) || props.images[0];
  return (
    <StepShell eyebrow="STEP 06 / OCR" title="Read package declarations" description="Processing stages update as package images move through text extraction.">
      <div className="processing-panel">
        <div className="processing-header">
          <div>
            <h3>Evidence processing</h3>
            <p>{props.images.length ? `${props.images.length} image(s) stored.` : "Waiting for package images."}</p>
          </div>
          <StatusBadge label={first?.status || "Pending"} tone="neutral" />
        </div>
        <div className="processing-list">
          {["Image preparation", "Text detection", "OCR", "Declaration extraction"].map((item, index) => (
            <div className="processing-row" key={item}>
              <span className="processing-number">{index + 1}</span>
              <span>{item}</span>
              <span className="processing-state">{first ? (first.status === "FAILED" ? "Failed" : "Completed or available") : "Not started"}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="form-footer" style={{ margin: "16px 0" }}>
        <span>OCR runs on every submitted image. Failure is recorded; it is not treated as a missing declaration.</span>
        <Button className="primary-action" onClick={() => props.run(async () => {
          if (!props.inspection) return;
          const rows = await lpsApi.runOcr(props.inspection.id);
          props.setOcr(rows);
          const decls = await lpsApi.extract(props.inspection.id);
          props.setDeclarations(decls);
        })}>Run OCR on all images</Button>
      </div>
      <div className="ocr-split">
        <div className="ocr-image-placeholder">
          {image ? <img src={imageFileUrl(image.id, Boolean(image.processed_path))} alt="Processed package" /> : <><FileSearch size={24} /><span>Package image will appear here</span></>}
        </div>
        <div className="ocr-text-placeholder">
          <p className="section-kicker">DETECTED TEXT</p>
          <h3>{first?.raw_text ? "OCR output" : first?.error ? "OCR processing failed" : "No text extracted"}</h3>
          <p>{first?.error || "OCR output remains linked to the image side and confidence data that produced it."}</p>
        </div>
      </div>
      <div className="ocr-debug">
        {props.ocr.map((row) => (
          <div key={row.id}>
            <strong>{row.status}</strong>
            {row.error && <p className="inline-error">{row.error}</p>}
            <pre>{row.raw_text || "No raw OCR text stored for this image."}</pre>
          </div>
        ))}
      </div>
    </StepShell>
  );
}

function DeclarationsStep(props: WorkspaceProps) {
  return (
    <StepShell eyebrow="STEP 07 / DECLARATIONS" title="Review declarations" description="Each observed value remains linked to its submitted evidence and confidence.">
      <div className="declaration-table">
        <div className="declaration-head">
          <span>Declaration</span>
          <span>Observed value</span>
          <span>Evidence</span>
          <span>Confidence</span>
          <span>Status</span>
          <span />
        </div>
        {props.declarations.map((item) => (
          <button
            className="declaration-row"
            key={item.id}
            onClick={() => {
              props.setSelectedDeclaration(item);
              props.onOpenDrawer();
            }}
          >
            <span>
              <strong>{FIELD_LABELS[item.field_type] || item.field_type}</strong>
              <small>Applicability pending</small>
            </span>
            <span className="muted-value">{item.normalized_value || item.original_text || resultLabel(item.result_state)}</span>
            <span><SourceBadge label={item.source || "Pending"} /></span>
            <span className="muted-value">{item.ocr_confidence == null ? "--" : item.ocr_confidence.toFixed(2)}</span>
            <StatusBadge label={resultLabel(item.result_state)} tone={item.result_state === "DETECTED" ? "success" : "warning"} />
            <ArrowRight size={15} />
          </button>
        ))}
      </div>
      <div className="uncertainty-note">
        <AlertCircle size={16} />
        <div>
          <strong>Evidence-aware wording</strong>
          <span>“Not detected in submitted evidence” is used only after OCR has been attempted. It does not establish that a declaration is missing.</span>
        </div>
      </div>
    </StepShell>
  );
}

function EvidenceStep(props: WorkspaceProps) {
  const selected = props.selectedDeclaration;
  const image = props.images.find((item) => item.id === selected?.image_id) || props.images[0];
  const width = image?.quality_metrics?.width || 1;
  const height = image?.quality_metrics?.height || 1;
  return (
    <StepShell eyebrow="STEP 08 / EVIDENCE" title="Inspect evidence" description="Click a declaration to highlight its stored bounding box on the original image.">
      <div className="evidence-workspace">
        <div className="evidence-canvas">
          <div className="canvas-toolbar">
            <span>Package image / {image ? image.side : "Selected surface pending"}</span>
          </div>
          {image ? (
            <div className="bbox-stage">
              <img src={imageFileUrl(image.id)} alt="Original evidence" />
              <svg className="bbox-svg" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
                {props.declarations.filter((item) => item.image_id === image.id && item.bbox).map((item) => (
                  <rect
                    key={item.id}
                    className={`bbox-rect ${selected?.id === item.id ? "active" : ""}`}
                    x={item.bbox!.x1}
                    y={item.bbox!.y1}
                    width={item.bbox!.x2 - item.bbox!.x1}
                    height={item.bbox!.y2 - item.bbox!.y1}
                    onClick={() => props.setSelectedDeclaration(item)}
                  />
                ))}
              </svg>
            </div>
          ) : (
            <div className="canvas-empty">
              <div className="empty-icon"><FolderOpen size={22} /></div>
              <strong>Evidence workspace is empty</strong>
              <span>Upload package views to inspect declarations and evidence regions.</span>
            </div>
          )}
        </div>
        <aside className="evidence-panel">
          <div className="panel-heading">
            <div>
              <p className="section-kicker">EVIDENCE DETAILS</p>
              <h3>{selected ? FIELD_LABELS[selected.field_type] || selected.field_type : "Nothing selected"}</h3>
            </div>
          </div>
          <div className="evidence-fields">
            <EvidenceField label="Field" value={selected?.field_type || "--"} />
            <EvidenceField label="Observed text" value={selected?.original_text || "--"} />
            <EvidenceField label="Image side" value={selected ? (props.images.find((item) => item.id === selected.image_id)?.side || "--") : "--"} />
            <EvidenceField label="Bounding box" value={selected?.bbox ? `${Math.round(selected.bbox.x1)},${Math.round(selected.bbox.y1)}` : "Pending"} />
          </div>
          <div className="panel-divider" />
          <div className="evidence-next">
            <AlertCircle size={16} />
            <div>
              <strong>Recommended next action</strong>
              <span>{props.coverage?.guidance || "Capture additional surfaces when coverage is insufficient."}</span>
            </div>
          </div>
          <Button className="primary-action full-width" onClick={props.onOpenDrawer}>Open evidence details <ArrowRight size={15} /></Button>
        </aside>
      </div>
    </StepShell>
  );
}

function RulesStep(props: WorkspaceProps) {
  return (
    <StepShell eyebrow="STEP 09 / RULES" title="Review applicable rules" description="Only approved/active versions whose effective period covers the inspection date can be used.">
      <Button className="primary-action" onClick={() => props.run(async () => {
        if (!props.inspection) return;
        props.setApplicability(await lpsApi.applicability(props.inspection.id));
      })}>Check rule availability</Button>
      <div className="data-source-note" style={{ marginTop: 16 }}>
        <BookOpen size={16} />
        <div>
          <strong>{props.applicability?.status || "Not checked"}</strong>
          <span>{props.applicability?.note || "Approved applicable requirement is unavailable until verified regulatory versions exist."}</span>
        </div>
      </div>
      {(props.applicability?.selected_rule_versions || []).map((version) => (
        <div className="table-row" key={version.rule_version_id}>
          <span>{version.version_label}</span>
          <span>{version.status}</span>
          <span>{version.effective_from || "--"}</span>
        </div>
      ))}
    </StepShell>
  );
}

function ScreeningStep(props: WorkspaceProps) {
  return (
    <StepShell eyebrow="STEP 10 / SCREENING" title="Screening summary" description="Deterministic screening uses submitted evidence and approved configured requirements only.">
      <Button className="primary-action" onClick={() => props.run(async () => {
        if (!props.inspection) return;
        const result = await lpsApi.screen(props.inspection.id);
        props.setInspection(result.inspection);
        props.setScreeningOverall(result.overall);
        props.setExplanation(result.gemini_explanation);
        props.setFindings(await lpsApi.findings(props.inspection.id));
        props.setChecks(await lpsApi.checks(props.inspection.id));
      })}>Run screening</Button>
      <div className="inspection-meta" style={{ marginTop: 16 }}>
        <div><span>Overall</span><strong>{props.screeningOverall || props.inspection?.screening_status || "Not run"}</strong></div>
        <div><span>Coverage</span><strong>{props.coverage?.status || props.inspection?.coverage_status || "--"}</strong></div>
      </div>
      {props.checks.map((check) => (
        <div className="table-row" key={check.id}>
          <span>{check.check_type}</span>
          <span>{check.result}</span>
          <span>{check.reason}</span>
        </div>
      ))}
      {props.findings.map((finding) => (
        <div className="table-row" key={finding.id}>
          <span>{finding.field_type || "OVERALL"}</span>
          <span>{finding.result}</span>
          <span>{finding.observed || "--"}</span>
          <span>{finding.required || "--"}</span>
        </div>
      ))}
      {props.explanation && <pre>{props.explanation}</pre>}
    </StepShell>
  );
}

function ReviewStep(props: WorkspaceProps) {
  const [comment, setComment] = useState("");
  return (
    <StepShell eyebrow="STEP 11 / REVIEW" title="Human verification" description="Human review does not overwrite original system observations.">
      <div className="scanner-actions">
        {["CONFIRM", "REJECT", "REQUEST_EVIDENCE", "ESCALATE", "ADD_COMMENT"].map((action) => (
          <Button key={action} variant={action === "CONFIRM" ? "default" : "outline"} onClick={() => props.run(async () => {
            if (!props.inspection) return;
            await lpsApi.createReview(props.inspection.id, { action, comment, human_result: action });
            props.setReviews(await lpsApi.reviews(props.inspection.id));
            await props.reload();
          })}>{action}</Button>
        ))}
      </div>
      <div className="field wide" style={{ marginTop: 16 }}>
        <label>Review comment</label>
        <textarea rows={3} value={comment} onChange={(event) => setComment(event.target.value)} />
      </div>
      {props.reviews.map((review) => (
        <div className="table-row" key={review.id}>
          <span>{review.action}</span>
          <span>AI: {review.ai_result || "--"}</span>
          <span>Human: {review.human_result || "--"}</span>
          <span>{review.comment || review.reason || "--"}</span>
        </div>
      ))}
    </StepShell>
  );
}

function ReportStep(props: WorkspaceProps) {
  return (
    <StepShell eyebrow="STEP 12 / REPORT" title="Generate report" description="The report includes evidence, screening language, and the required disclaimer.">
      <Button className="primary-action" onClick={() => props.run(async () => {
        if (!props.inspection) return;
        await lpsApi.createReport(props.inspection.id);
        const blob = await lpsApi.reportPdf(props.inspection.id);
        const url = URL.createObjectURL(blob);
        window.open(url, "_blank");
      })}>Generate PDF</Button>
      <p className="page-description" style={{ marginTop: 16 }}>
        This report represents preliminary automated compliance screening based on the submitted evidence and approved configured regulatory requirements. It is not a final legal determination.
      </p>
    </StepShell>
  );
}

function EvidenceField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function SourceBadge({ label }: { label: string }) {
  return (
    <span className="source-badge">
      <span />
      {label}
    </span>
  );
}
function StatusBadge({ label, tone }: { label: string; tone: "neutral" | "warning" | "success" | "danger" }) {
  return (
    <span className={`status-badge ${tone}`}>
      <span />
      {label}
    </span>
  );
}
function Field({
  label,
  placeholder,
  icon: Icon,
  wide,
  disabled,
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  icon?: typeof ChevronDown;
  wide?: boolean;
  disabled?: boolean;
  value?: string;
  onChange?: (value: string) => void;
}) {
  return (
    <div className={`field ${wide ? "wide" : ""}`}>
      <label>{label}</label>
      <div className="input-wrap">
        <input placeholder={placeholder} disabled={disabled} value={value ?? ""} onChange={(event) => onChange?.(event.target.value)} />
        {Icon && <Icon size={16} />}
      </div>
    </div>
  );
}

function EvidenceDrawer({ declaration, onClose }: { declaration: Declaration | null; onClose: () => void }) {
  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <aside className="evidence-drawer" onClick={(event) => event.stopPropagation()}>
        <div className="drawer-header">
          <div>
            <p className="section-kicker">EVIDENCE DETAIL</p>
            <h2>{declaration ? FIELD_LABELS[declaration.field_type] || declaration.field_type : "Declaration record"}</h2>
          </div>
          <Button variant="ghost" size="icon" aria-label="Close evidence details" onClick={onClose}>
            <X size={18} />
          </Button>
        </div>
        {!declaration ? (
          <div className="drawer-empty">
            <div className="empty-icon"><FileSearch size={22} /></div>
            <strong>No declaration selected</strong>
            <span>Submitted evidence and extracted values will appear here together with their source and confidence.</span>
          </div>
        ) : (
          <div className="drawer-section">
            <p className="section-kicker">SOURCE PROVENANCE</p>
            <div className="drawer-field"><span>Original text</span><strong>{declaration.original_text || "--"}</strong></div>
            <div className="drawer-field"><span>Normalized</span><strong>{declaration.normalized_value || "--"}</strong></div>
            <div className="drawer-field"><span>AI value</span><strong>{declaration.ai_value || "--"}</strong></div>
            <div className="drawer-field"><span>Human value</span><strong>{declaration.human_value || "--"}</strong></div>
            <div className="drawer-field"><span>Source</span><strong>{declaration.source}</strong></div>
            <div className="drawer-field"><span>OCR confidence</span><strong>{declaration.ocr_confidence ?? "--"}</strong></div>
            <div className="drawer-field"><span>Result</span><strong>{resultLabel(declaration.result_state)}</strong></div>
          </div>
        )}
        <div className="drawer-footer">
          <Button variant="outline" onClick={onClose}>Close</Button>
        </div>
      </aside>
    </div>
  );
}

function RecordsPage({ title, kicker, rows, empty, onOpen, onCreate }: { title: string; kicker: string; rows: Inspection[]; empty: string; onOpen: (id: string) => void; onCreate: () => void }) {
  return (
    <div className="page-container">
      <div className="page-heading-row">
        <div>
          <p className="section-kicker">{kicker}</p>
          <h1>{title}</h1>
        </div>
        <Button className="primary-action" onClick={onCreate}><Plus size={17} /> New inspection</Button>
      </div>
      {rows.length === 0 ? (
        <EmptySection title={title} text={empty} onCreate={onCreate} />
      ) : (
        <div className="data-table">
          <div className="table-row"><span>ID</span><span>Status</span><span>Premises</span><span>Screening</span><span>Coverage</span></div>
          {rows.map((row) => (
            <button className="table-row" key={row.id} onClick={() => onOpen(row.id)}>
              <span>{row.id.slice(0, 8)}</span>
              <span>{row.status}</span>
              <span>{row.premises || "--"}</span>
              <span>{row.screening_status || "--"}</span>
              <span>{row.coverage_status}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function RulesPage({ rules, versions, sources, onIngest, admin }: { rules: RuleRow[]; versions: RuleVersion[]; sources: SourceRow[]; onIngest: (id: string) => void; admin: boolean }) {
  return (
    <div className="page-container">
      <p className="section-kicker">RULES & SOURCES</p>
      <h1>Rules & sources</h1>
      <p className="page-description">Approved requirements and regulatory sources appear here without fabricated rule content.</p>
      <h2>Allowlisted sources</h2>
      <div className="data-table">
        <div className="table-row"><span>Title</span><span>Authority</span><span>Status</span><span>Review</span><span /></div>
        {sources.map((source) => (
          <div className="table-row" key={source.id}>
            <span>{source.title}</span>
            <span>{source.authority}</span>
            <span>{source.status}</span>
            <span>{source.review_status}</span>
            <span>{admin ? <Button size="sm" variant="outline" onClick={() => onIngest(source.id)}>Ingest</Button> : null}</span>
          </div>
        ))}
      </div>
      <h2>Rules</h2>
      {rules.length === 0 ? <p>No approved rules are stored. Screening will return RULE_UNAVAILABLE / REVIEW_REQUIRED.</p> : rules.map((rule) => (
        <div className="table-row" key={rule.id}><span>{rule.internal_rule_code}</span><span>{rule.title}</span><span>{rule.status}</span></div>
      ))}
      <h2>Versions</h2>
      {versions.length === 0 ? <p>No rule versions stored.</p> : versions.map((version) => (
        <div className="table-row" key={version.id}><span>{version.version_label}</span><span>{version.legal_review_status}</span><span>{version.effective_from || "--"}</span></div>
      ))}
    </div>
  );
}

function UpdatesPage({ updates }: { updates: DocumentRow[] }) {
  return (
    <div className="page-container">
      <p className="section-kicker">REGULATORY UPDATES</p>
      <h1>Regulatory Change Radar</h1>
      {updates.length === 0 ? <p>No ingested documents yet. Ingested files remain DRAFT until admin approval.</p> : updates.map((item) => (
        <div className="table-row" key={item.id}>
          <span>{item.title}</span>
          <span>{item.document_type}</span>
          <span>{item.review_status}</span>
          <span>{item.publication_date || "--"}</span>
          <span>{item.effective_date || "--"}</span>
        </div>
      ))}
    </div>
  );
}

function UsersPage({ users }: { users: User[] }) {
  return (
    <div className="page-container">
      <p className="section-kicker">USERS</p>
      <h1>Users</h1>
      <div className="data-table">
        <div className="table-row"><span>Name</span><span>Email</span><span>Role</span><span>Active</span><span /></div>
        {users.map((user) => (
          <div className="table-row" key={user.id}>
            <span>{user.display_name}</span>
            <span>{user.email}</span>
            <span>{user.role}</span>
            <span>{user.is_active ? "yes" : "no"}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SettingsPage({ user, onLogout }: { user: User | null; onLogout: () => void }) {
  return (
    <div className="page-container">
      <p className="section-kicker">SETTINGS</p>
      <h1>Settings</h1>
      <p>Signed in as {user?.display_name} ({user?.role}).</p>
      <Button variant="outline" onClick={onLogout}>Log out</Button>
    </div>
  );
}

function EmptySection({ title, text, onCreate }: { title: string; text: string; onCreate: () => void }) {
  return (
    <div className="full-page-empty">
      <div className="large-empty-icon"><Gauge size={28} /></div>
      <h2>{title}</h2>
      <p>{text}</p>
      <Button variant="outline" onClick={onCreate}>Start an inspection <ArrowRight size={15} /></Button>
    </div>
  );
}
