import { createFileRoute } from "@tanstack/react-router";
import {
  Activity,
  AlertCircle,
  Archive,
  ArrowRight,
  Bell,
  BookOpen,
  Box,
  CalendarDays,
  Check,
  ChevronDown,
  ClipboardCheck,
  Clock3,
  FileBarChart,
  FileSearch,
  Filter,
  FolderOpen,
  Gauge,
  Grid2X2,
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
import { useState } from "react";

import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "LPS Compliance Intelligence | Inspection Workspace" },
      {
        name: "description",
        content:
          "Evidence-first preliminary Legal Metrology compliance screening for inspection teams.",
      },
      { property: "og:title", content: "LPS Compliance Intelligence" },
      {
        property: "og:description",
        content: "Evidence-first preliminary Legal Metrology compliance screening.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Workspace,
});

type ViewKey = "dashboard" | "inspection" | "inspections" | "rules" | "reports" | "analytics";
type CaptureSide = "Front" | "Back" | "Left" | "Right" | "Top" | "Bottom";

const navGroups = [
  {
    label: "Workspace",
    items: [
      { key: "dashboard" as ViewKey, label: "Dashboard", icon: LayoutDashboard },
      { key: "inspection" as ViewKey, label: "New inspection", icon: Plus },
      { key: "inspections" as ViewKey, label: "Inspections", icon: ClipboardCheck },
      { key: "inspections" as ViewKey, label: "Products", icon: PackageCheck },
      { key: "inspections" as ViewKey, label: "Reviews", icon: FileSearch },
    ],
  },
  {
    label: "Intelligence",
    items: [
      { key: "rules" as ViewKey, label: "Rules & sources", icon: BookOpen },
      { key: "reports" as ViewKey, label: "Reports", icon: FileBarChart },
      { key: "analytics" as ViewKey, label: "Analytics", icon: Activity },
    ],
  },
];

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

function Workspace() {
  const [activeView, setActiveView] = useState<ViewKey>("dashboard");
  const [activeStep, setActiveStep] = useState(0);
  const [selectedSide, setSelectedSide] = useState<CaptureSide | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigate = (view: ViewKey) => {
    setActiveView(view);
    setSidebarOpen(false);
  };

  const showNotice = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(null), 2800);
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
          <button
            className="sidebar-close"
            aria-label="Close navigation"
            onClick={() => setSidebarOpen(false)}
          >
            <PanelLeftClose size={17} />
          </button>
        </div>

        <div className="sidebar-rule" />
        <div className="sidebar-navigation">
          {navGroups.map((group) => (
            <div className="nav-group" key={group.label}>
              <p className="nav-group-label">{group.label}</p>
              {group.items.map((item, index) => {
                const Icon = item.icon;
                const isActive =
                  item.key === activeView &&
                  !(activeView === "inspections" && index === 3);
                return (
                  <button
                    className={`nav-item ${isActive ? "active" : ""}`}
                    key={`${group.label}-${item.label}`}
                    onClick={() => navigate(item.key)}
                  >
                    <Icon size={17} strokeWidth={isActive ? 2.2 : 1.8} />
                    <span>{item.label}</span>
                    {item.label === "Reviews" && <span className="nav-count">--</span>}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        <div className="sidebar-footer">
          <button className="nav-item" onClick={() => showNotice("Settings will be available with connected access.")}>
            <Settings size={17} />
            <span>Settings</span>
          </button>
          <div className="user-block">
            <div className="avatar">IN</div>
            <div className="user-details">
              <p>Inspector account</p>
              <span>Authorized user</span>
            </div>
            <ChevronDown size={15} className="user-chevron" />
          </div>
        </div>
      </aside>

      <main className="app-main">
        <header className="top-header">
          <div className="header-left">
            <Button
              variant="ghost"
              size="icon"
              className="mobile-menu"
              aria-label="Open navigation"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={19} />
            </Button>
            <div className="header-context">
              <span className="context-eyebrow">LEGAL METROLOGY / OPERATIONS</span>
              <span className="context-divider" />
              <span className="context-page">{pageLabel(activeView)}</span>
            </div>
          </div>
          <div className="header-actions">
            <label className="global-search">
              <Search size={16} />
              <input placeholder="Search inspections, products, rules..." aria-label="Global search" />
              <kbd>⌘ K</kbd>
            </label>
            <Button variant="ghost" size="icon" className="header-icon" aria-label="Notifications" onClick={() => showNotice("No new notifications.")}>
              <Bell size={18} />
              <span className="notification-dot" />
            </Button>
            <div className="header-profile">
              <div className="avatar avatar-small">IN</div>
              <div>
                <strong>Inspector</strong>
                <span>Field operations</span>
              </div>
              <ChevronDown size={15} />
            </div>
          </div>
        </header>

        {activeView === "dashboard" && <Dashboard onNavigate={navigate} onNotice={showNotice} />}
        {activeView === "inspection" && (
          <InspectionWorkspace
            activeStep={activeStep}
            setActiveStep={setActiveStep}
            selectedSide={selectedSide}
            setSelectedSide={setSelectedSide}
            onOpenDrawer={() => setDrawerOpen(true)}
            onNotice={showNotice}
          />
        )}
        {activeView !== "dashboard" && activeView !== "inspection" && (
          <EmptySection view={activeView} onNavigate={navigate} />
        )}
      </main>

      {drawerOpen && <EvidenceDrawer onClose={() => setDrawerOpen(false)} />}
      {notice && <div className="toast-notice"><Check size={16} />{notice}</div>}
    </div>
  );
}

function pageLabel(view: ViewKey) {
  return {
    dashboard: "Dashboard",
    inspection: "New inspection",
    inspections: "Inspections",
    rules: "Rules & sources",
    reports: "Reports",
    analytics: "Analytics",
  }[view];
}

function Dashboard({ onNavigate, onNotice }: { onNavigate: (view: ViewKey) => void; onNotice: (text: string) => void }) {
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
        <div className="principle-icon"><ShieldCheck size={19} /></div>
        <div>
          <strong>Evidence-first screening</strong>
          <span>AI reads. Rules check. Evidence supports. Humans decide.</span>
        </div>
        <div className="strip-status"><span className="status-dot neutral" /> Backend not connected</div>
      </div>

      <section className="metric-grid" aria-label="Inspection overview">
        <MetricCard label="Today's inspections" icon={ClipboardCheck} value="--" detail="No live records" />
        <MetricCard label="Open reviews" icon={FileSearch} value="--" detail="No live records" />
        <MetricCard label="Potential issues" icon={AlertCircle} value="--" detail="No live records" />
        <MetricCard label="Evidence incomplete" icon={ImagePlus} value="--" detail="No live records" />
      </section>

      <div className="dashboard-grid">
        <section className="panel recent-panel">
          <div className="panel-heading">
            <div>
              <h2>Recent inspections</h2>
              <p>Submitted inspection records will appear here.</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => onNavigate("inspections")}>View all <ArrowRight size={14} /></Button>
          </div>
          <EmptyTableState icon={Inbox} title="No inspection data connected yet" text="Connect the backend to display live inspection records and review status." action="Start an inspection" onClick={() => onNavigate("inspection")} />
        </section>

        <section className="panel queue-panel">
          <div className="panel-heading">
            <div>
              <h2>Review queue</h2>
              <p>Cases requiring authorized verification.</p>
            </div>
            <Button variant="ghost" size="icon" aria-label="Review queue options" onClick={() => onNotice("Queue filters will be available with connected data.")}><MoreHorizontal size={18} /></Button>
          </div>
          <div className="queue-empty">
            <div className="empty-icon"><ClipboardCheck size={22} /></div>
            <strong>Queue is ready</strong>
            <span>Assigned reviews will appear when inspections are submitted.</span>
          </div>
        </section>
      </div>

      <div className="dashboard-grid lower-grid">
        <section className="panel chart-panel">
          <div className="panel-heading"><div><h2>Screening activity</h2><p>Inspection volume over time.</p></div><Button variant="ghost" size="icon" aria-label="Filter activity" onClick={() => onNotice("Activity filters will be available with connected data.")}><Filter size={16} /></Button></div>
          <div className="chart-empty"><Activity size={25} /><span>No inspection data available.</span><small>Charts will populate from verified inspection records.</small></div>
        </section>
        <section className="panel updates-panel">
          <div className="panel-heading"><div><h2>Regulatory updates</h2><p>Keep track of source changes.</p></div><Button variant="ghost" size="icon" aria-label="Open regulatory updates" onClick={() => onNavigate("rules")}><ArrowRight size={17} /></Button></div>
          <div className="update-empty"><BookOpen size={23} /><div><strong>No regulatory updates available</strong><span>Approved sources will appear here when connected.</span></div></div>
        </section>
      </div>
    </div>
  );
}

function MetricCard({ label, icon: Icon, value, detail }: { label: string; icon: typeof ClipboardCheck; value: string; detail: string }) {
  return <div className="metric-card"><div className="metric-icon"><Icon size={18} /></div><div className="metric-label">{label}</div><div className="metric-value">{value}</div><div className="metric-detail">{detail}</div></div>;
}

function EmptyTableState({ icon: Icon, title, text, action, onClick }: { icon: typeof Inbox; title: string; text: string; action: string; onClick: () => void }) {
  return <div className="empty-table"><div className="empty-icon"><Icon size={21} /></div><strong>{title}</strong><span>{text}</span><Button variant="outline" size="sm" onClick={onClick}>{action}<ArrowRight size={14} /></Button></div>;
}

function InspectionWorkspace({ activeStep, setActiveStep, selectedSide, setSelectedSide, onOpenDrawer, onNotice }: { activeStep: number; setActiveStep: (step: number) => void; selectedSide: CaptureSide | null; setSelectedSide: (side: CaptureSide | null) => void; onOpenDrawer: () => void; onNotice: (text: string) => void }) {
  return (
    <div className="page-container inspection-page">
      <div className="page-heading-row inspection-heading">
        <div><p className="section-kicker">PRELIMINARY SCREENING / DRAFT</p><h1>New inspection</h1><p className="page-description">Create an evidence record before screening begins.</p></div>
        <div className="heading-actions"><Button variant="outline" onClick={() => onNotice("Draft saving will be available with connected data.")}>Save draft</Button><Button className="primary-action" onClick={() => setActiveStep(Math.min(activeStep + 1, steps.length - 1))}>Continue <ArrowRight size={16} /></Button></div>
      </div>

      <div className="inspection-meta"><div><span>Inspection ID</span><strong>Generated on save</strong></div><div><span>Status</span><StatusBadge label="Draft" tone="neutral" /></div><div><span>Evidence</span><strong>Not submitted</strong></div><div><span>Last updated</span><strong>--</strong></div></div>

      <div className="stepper-wrap">
        <div className="stepper-label"><span>WORKFLOW</span><strong>Step {activeStep + 1} of {steps.length}</strong></div>
        <div className="stepper">
          {steps.map((step, index) => <button key={step} className={`step ${index === activeStep ? "current" : ""} ${index < activeStep ? "complete" : ""}`} onClick={() => setActiveStep(index)}><span className="step-number">{index < activeStep ? <Check size={13} /> : index + 1}</span><span>{step}</span></button>)}
        </div>
      </div>

      {activeStep === 0 && <InspectionDetails onNotice={onNotice} />}
      {activeStep === 1 && <ProductStep onNotice={onNotice} />}
      {activeStep === 2 && <PackageCapture selectedSide={selectedSide} setSelectedSide={setSelectedSide} onNotice={onNotice} />}
      {activeStep === 3 && <QualityStep />}
      {activeStep === 4 && <BarcodeStep onNotice={onNotice} />}
      {activeStep === 5 && <OcrStep />}
      {activeStep === 6 && <DeclarationsStep onOpenDrawer={onOpenDrawer} />}
      {activeStep >= 7 && <EvidenceStep activeStep={activeStep} onOpenDrawer={onOpenDrawer} onNotice={onNotice} />}
    </div>
  );
}

function StepShell({ eyebrow, title, description, children }: { eyebrow: string; title: string; description: string; children: React.ReactNode }) {
  return <section className="workflow-panel"><div className="workflow-heading"><p className="section-kicker">{eyebrow}</p><h2>{title}</h2><p>{description}</p></div>{children}</section>;
}

function InspectionDetails({ onNotice }: { onNotice: (text: string) => void }) {
  return <StepShell eyebrow="STEP 01 / INSPECTION DETAILS" title="Start an inspection record" description="Record the inspection context before package evidence is submitted."><div className="form-grid"><Field label="Inspection ID" placeholder="Generated on save" disabled /><Field label="Inspection date" placeholder="Select date" icon={CalendarDays} /><Field label="Inspector" placeholder="Authorized user" /><Field label="Premises / store" placeholder="Enter location" wide /><Field label="Inspection type" placeholder="Select inspection type" icon={ChevronDown} /><Field label="Reference / case note" placeholder="Optional reference" wide /><div className="field wide"><label>Notes</label><textarea placeholder="Add context for the inspection record..." rows={4} /></div></div><div className="form-footer"><span><ShieldCheck size={15} /> Data fields will connect to your inspection service.</span><Button className="primary-action" onClick={() => onNotice("Inspection details are ready for backend connection.")}>Save details <ArrowRight size={15} /></Button></div></StepShell>;
}

function ProductStep({ onNotice }: { onNotice: (text: string) => void }) {
  return <StepShell eyebrow="STEP 02 / PRODUCT" title="Identify the product" description="Use a future barcode, source, or manual record to establish product identity."><div className="source-tabs"><button className="source-tab active"><Search size={16} /> Search product</button><button className="source-tab" onClick={() => onNotice("Barcode scanning will be enabled when the service is connected.")}><Box size={16} /> Scan barcode</button><button className="source-tab"><Tags size={16} /> Manual entry</button></div><div className="form-grid product-grid"><Field label="Barcode" placeholder="Awaiting barcode or manual entry" wide /><Field label="Brand" placeholder="Pending product data" /><Field label="Product name" placeholder="Pending product data" /><Field label="Category" placeholder="Select category" icon={ChevronDown} /><Field label="Subcategory" placeholder="Select subcategory" icon={ChevronDown} /><Field label="Manufacturer / packer / importer" placeholder="Pending product data" wide /></div><div className="data-source-note"><SlidersHorizontal size={16} /><div><strong>Source-aware fields</strong><span>Values will show whether they came from OCR, barcode, an official source, or human verification.</span></div></div></StepShell>;
}

function PackageCapture({ selectedSide, setSelectedSide, onNotice }: { selectedSide: CaptureSide | null; setSelectedSide: (side: CaptureSide | null) => void; onNotice: (text: string) => void }) {
  return <StepShell eyebrow="STEP 03 / PACKAGE CAPTURE" title="Capture package evidence" description="Capture the complete declaration surfaces of the package. Not captured is not the same as missing."><div className="capture-layout"><div className="capture-grid">{captureSides.map((side) => <button className={`capture-card ${selectedSide === side ? "selected" : ""}`} key={side} onClick={() => setSelectedSide(side)}><div className="capture-placeholder"><ImagePlus size={21} /><span>Not captured</span></div><div className="capture-card-footer"><div><strong>{side}</strong><span>Evidence surface</span></div><MoreHorizontal size={17} /></div></button>)}</div><aside className="coverage-card"><div className="coverage-heading"><div><p className="section-kicker">PACKAGE EVIDENCE</p><h3>Coverage</h3></div><StatusBadge label="Partial" tone="warning" /></div><div className="coverage-map">{captureSides.map((side) => <div key={side}><span className="coverage-side">{side}</span><span className="coverage-state neutral"><span />Not captured</span></div>)}</div><div className="coverage-note"><AlertCircle size={15} /><span>Additional package views may be required to complete evidence coverage.</span></div><Button className="primary-action full-width" onClick={() => onNotice(selectedSide ? `Ready to add ${selectedSide.toLowerCase()} evidence.` : "Choose a package side first.")}><ImagePlus size={16} /> Add image</Button></aside></div><div className="guidance-bar"><div className="guidance-icon"><ShieldCheck size={18} /></div><div><strong>Capture guidance</strong><span>Keep the full declaration surface in frame and avoid glare over text.</span></div><span className="guidance-status">{selectedSide ? `${selectedSide} selected` : "Select a surface to begin"}</span></div></StepShell>;
}

function QualityStep() { return <StepShell eyebrow="STEP 04 / IMAGE QUALITY" title="Check image quality" description="Quality signals will be supplied by the image service after capture."><div className="quality-grid">{captureSides.slice(0, 4).map((side) => <div className="quality-card" key={side}><div className="quality-top"><div className="quality-thumb"><ImagePlus size={18} /></div><div><strong>{side} image</strong><span>Not submitted</span></div><StatusBadge label="Pending" tone="neutral" /></div><div className="quality-lines"><div><span>Resolution</span><b>--</b></div><div><span>Blur</span><b>--</b></div><div><span>Glare</span><b>--</b></div><div><span>Visibility</span><b>--</b></div></div></div>)}</div></StepShell>; }

function BarcodeStep({ onNotice }: { onNotice: (text: string) => void }) { return <StepShell eyebrow="STEP 05 / BARCODE" title="Resolve a barcode" description="Barcode results will appear here once a scan or barcode image is submitted."><div className="scanner-card"><div className="scanner-frame"><div className="scanner-corners" /><Box size={30} /><span>Ready for barcode evidence</span></div><div className="scanner-copy"><p className="section-kicker">BARCODE RESULT</p><h3>No barcode submitted</h3><p>Position the barcode inside the frame or upload a barcode image. Product matching stays pending until a source returns a result.</p><div className="scanner-actions"><Button className="primary-action" onClick={() => onNotice("Scanner is ready for backend connection.")}><Box size={16} /> Start scanner</Button><Button variant="outline" onClick={() => onNotice("Image upload will be available with connected storage.")}><ImagePlus size={16} /> Upload image</Button></div></div></div></StepShell>; }

function OcrStep() { return <StepShell eyebrow="STEP 06 / OCR" title="Read package declarations" description="Processing stages will update as package images move through text extraction."><div className="processing-panel"><div className="processing-header"><div><h3>Evidence processing</h3><p>Waiting for package images.</p></div><StatusBadge label="Pending" tone="neutral" /></div><div className="processing-list">{["Image preparation", "Text detection", "OCR", "Declaration extraction"].map((item, index) => <div className="processing-row" key={item}><span className="processing-number">{index + 1}</span><span>{item}</span><span className="processing-state">Not started</span></div>)}</div></div><div className="ocr-split"><div className="ocr-image-placeholder"><FileSearch size={24} /><span>Package image will appear here</span></div><div className="ocr-text-placeholder"><p className="section-kicker">DETECTED TEXT</p><h3>No text extracted</h3><p>OCR output will remain linked to the image side and confidence data that produced it.</p></div></div></StepShell>; }

function DeclarationsStep({ onOpenDrawer }: { onOpenDrawer: () => void }) { return <StepShell eyebrow="STEP 07 / DECLARATIONS" title="Review declarations" description="Each observed value will remain linked to its submitted evidence and confidence."><div className="declaration-table"><div className="declaration-head"><span>Declaration</span><span>Observed value</span><span>Evidence</span><span>Confidence</span><span>Status</span><span /></div>{["Common / generic name", "Manufacturer", "Net quantity", "MRP", "Country of origin", "Consumer care"].map((item) => <button className="declaration-row" key={item} onClick={onOpenDrawer}><span><strong>{item}</strong><small>Applicability pending</small></span><span className="muted-value">Not detected in submitted evidence</span><span><SourceBadge label="Pending" /></span><span className="muted-value">--</span><StatusBadge label="Review required" tone="warning" /><ArrowRight size={15} /></button>)}</div><div className="uncertainty-note"><AlertCircle size={16} /><div><strong>Evidence-aware wording</strong><span>“Not detected in submitted evidence” means the current package views are insufficient. It does not establish that a declaration is missing.</span></div></div></StepShell>; }

function EvidenceStep({ activeStep, onOpenDrawer, onNotice }: { activeStep: number; onOpenDrawer: () => void; onNotice: (text: string) => void }) { const title = activeStep === 7 ? "Inspect evidence" : activeStep === 8 ? "Review applicable rules" : activeStep === 9 ? "Screening summary" : activeStep === 10 ? "Human verification" : "Generate report"; const currentStep = steps[activeStep] ?? "Inspection details"; return <StepShell eyebrow={`STEP ${String(activeStep + 1).padStart(2, "0")} / ${currentStep.toUpperCase()}`} title={title} description="This workspace is ready to receive connected evidence, rules, screening, and review results."><div className="evidence-workspace"><div className="evidence-canvas"><div className="canvas-toolbar"><span>Package image / {"Selected surface pending"}</span><div><Button variant="ghost" size="icon" aria-label="Zoom out" onClick={() => onNotice("Zoom controls will apply to submitted evidence.")}>−</Button><Button variant="ghost" size="icon" aria-label="Zoom in" onClick={() => onNotice("Zoom controls will apply to submitted evidence.")}>＋</Button></div></div><div className="canvas-empty"><div className="empty-icon"><FolderOpen size={22} /></div><strong>Evidence workspace is empty</strong><span>Upload package views to inspect declarations and evidence regions.</span><Button variant="outline" size="sm" onClick={() => onNotice("Evidence upload will be available with connected storage.")}><ImagePlus size={15} /> Add package image</Button></div></div><aside className="evidence-panel"><div className="panel-heading"><div><p className="section-kicker">EVIDENCE DETAILS</p><h3>Nothing selected</h3></div><Button variant="ghost" size="icon" aria-label="Evidence options"><MoreHorizontal size={17} /></Button></div><div className="evidence-fields"><EvidenceField label="Field" value="--" /><EvidenceField label="Observed text" value="--" /><EvidenceField label="Image side" value="--" /><EvidenceField label="Bounding box" value="Pending" /></div><div className="panel-divider" /><div className="evidence-next"><AlertCircle size={16} /><div><strong>Recommended next action</strong><span>Capture the rear declaration panel when the screening service identifies insufficient coverage.</span></div></div><Button className="primary-action full-width" onClick={onOpenDrawer}>Open evidence details <ArrowRight size={15} /></Button></aside></div></StepShell>; }

function EvidenceField({ label, value }: { label: string; value: string }) { return <div><span>{label}</span><strong>{value}</strong></div>; }

function SourceBadge({ label }: { label: string }) { return <span className="source-badge"><span />{label}</span>; }
function StatusBadge({ label, tone }: { label: string; tone: "neutral" | "warning" | "success" | "danger" }) { return <span className={`status-badge ${tone}`}><span />{label}</span>; }
function Field({ label, placeholder, icon: Icon, wide, disabled }: { label: string; placeholder: string; icon?: typeof ChevronDown; wide?: boolean; disabled?: boolean }) { return <div className={`field ${wide ? "wide" : ""}`}><label>{label}</label><div className="input-wrap"><input placeholder={placeholder} disabled={disabled} />{Icon && <Icon size={16} />}</div></div>; }

function EvidenceDrawer({ onClose }: { onClose: () => void }) { return <div className="drawer-backdrop" onClick={onClose}><aside className="evidence-drawer" onClick={(event) => event.stopPropagation()}><div className="drawer-header"><div><p className="section-kicker">EVIDENCE DETAIL</p><h2>Declaration record</h2></div><Button variant="ghost" size="icon" aria-label="Close evidence details" onClick={onClose}><X size={18} /></Button></div><div className="drawer-empty"><div className="empty-icon"><FileSearch size={22} /></div><strong>No declaration selected</strong><span>Submitted evidence and extracted values will appear here together with their source and confidence.</span></div><div className="drawer-section"><p className="section-kicker">SOURCE PROVENANCE</p><div className="drawer-field"><span>Source</span><strong>Pending backend data</strong></div><div className="drawer-field"><span>OCR confidence</span><strong>--</strong></div><div className="drawer-field"><span>Rule reference</span><strong>Pending approved requirement</strong></div></div><div className="drawer-footer"><Button variant="outline" onClick={onClose}>Close</Button></div></aside></div>; }

function EmptySection({ view, onNavigate }: { view: ViewKey; onNavigate: (view: ViewKey) => void }) { const configMap = { inspections: { icon: ClipboardCheck, title: "Inspection records", text: "Live inspection history will appear when the backend is connected." }, rules: { icon: BookOpen, title: "Rules & sources", text: "Approved requirements and regulatory sources will appear here without fabricated rule content." }, reports: { icon: FileBarChart, title: "Reports", text: "Generated inspection reports will appear here when evidence and review data are available." }, analytics: { icon: Gauge, title: "Analytics", text: "No sufficient historical data is connected yet." } }; const config = configMap[view as keyof typeof configMap] ?? configMap.inspections; const Icon = config.icon; return <div className="page-container empty-section-page"><div className="page-heading-row"><div><p className="section-kicker">{pageLabel(view)?.toUpperCase()}</p><h1>{config.title}</h1><p className="page-description">A structured workspace for the inspection team.</p></div><Button className="primary-action" onClick={() => onNavigate("inspection")}><Plus size={17} /> New inspection</Button></div><div className="full-page-empty"><div className="large-empty-icon"><Icon size={28} /></div><h2>{config.title} are ready</h2><p>{config.text}</p><Button variant="outline" onClick={() => onNavigate("inspection")}>Start an inspection <ArrowRight size={15} /></Button></div></div>; }