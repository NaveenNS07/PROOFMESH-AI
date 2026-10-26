import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Upload,
  AlertTriangle,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Download,
  Search,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { StatusIndicator } from '../components/ProofMeshLogo';
import {
  ApplicationDocument,
  DocumentExtraction,
  ExtractedField,
  ValidationFinding,
  EvidenceNode,
  EvidenceRelationship,
  ChangeImpactFinding,
  ComplianceAssessment,
  RegulatoryRule,
} from '../types/domain';

/* ============================================================================
 * PAGE 8: DOCUMENT INTELLIGENCE (/document-intelligence)
 * ========================================================================== */
export const DocumentIntelligencePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { apiFetch, addToast } = useApp();
  const [documents, setDocuments] = useState<ApplicationDocument[]>([]);
  const [extractions, setExtractions] = useState<DocumentExtraction[]>([]);
  const [fields, setFields] = useState<ExtractedField[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string>(searchParams.get('docId') || '');
  const [selectedFieldId, setSelectedFieldId] = useState<string>('');
  const [activePage, setActivePage] = useState<number>(1);
  const [uploading, setUploading] = useState(false);

  // Upload simulation form
  const [newFileName, setNewFileName] = useState('');

  const loadDocs = useCallback(async () => {
    try {
      const data = await apiFetch<{
        documents: ApplicationDocument[];
        extractions: DocumentExtraction[];
        extractedFields: ExtractedField[];
      }>('/api/v1/documents');
      setDocuments(data.documents);
      setExtractions(data.extractions || []);
      setFields(data.extractedFields || []);
      if (!selectedDocId && data.documents.length > 0) {
        setSelectedDocId(data.documents[0].id);
      }
    } catch (e: any) {
      addToast({ title: 'Document Load Error', description: e.message, variant: 'critical' });
    }
  }, [apiFetch, addToast, selectedDocId]);

  useEffect(() => {
    loadDocs();
  }, [loadDocs]);

  const selectedDoc = documents.find((d) => d.id === selectedDocId) || documents[0];
  const docExtraction = extractions.find((e) => e.documentId === selectedDoc?.id);
  const docFields = fields.filter((f) => f.documentId === selectedDoc?.id);
  const activeField = docFields.find((f) => f.id === selectedFieldId) || docFields[0];

  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName.trim()) return;
    setUploading(true);
    try {
      const res = await apiFetch<{ document: ApplicationDocument }>(
        '/api/v1/applications/APP-DEMO-2026-001/documents',
        {
          method: 'POST',
          body: JSON.stringify({
            filename: newFileName.endsWith('.pdf') ? newFileName : `${newFileName}.pdf`,
            fileSizeBytes: 845200,
          }),
        }
      );
      addToast({
        title: 'Document Classified & Parsed',
        description: `${res.document.filename} classified as ${res.document.documentType} (${Math.round(
          res.document.classificationConfidence * 100
        )}% confidence).`,
        variant: 'success',
      });
      setNewFileName('');
      await loadDocs();
      setSelectedDocId(res.document.id);
    } catch (err: any) {
      addToast({ title: 'Upload Error', description: err.message, variant: 'critical' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#10243A]">
            Document Intelligence & Split-Screen OCR Inspector
          </h1>
          <p className="text-xs text-[#617384] mt-0.5">
            Automated document classification, field extraction, SHA-256 duplicate fingerprinting, and page-level
            coordinate anchoring.
          </p>
        </div>

        {/* Upload New Evidence Form */}
        <form onSubmit={handleUploadDocument} className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            value={newFileName}
            onChange={(e) => setNewFileName(e.target.value)}
            placeholder="e.g., Land_Deed_Supplement_2026.pdf"
            className="px-3 py-1.5 rounded border border-[#DCE5EC] bg-white text-xs text-[#10243A] w-60"
          />
          <button
            type="submit"
            disabled={uploading}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded bg-[#087F8C] text-white text-xs font-semibold hover:bg-[#10243A] cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            {uploading ? 'Classifying & Extracting...' : 'Ingest & Classify Document'}
          </button>
        </form>
      </div>

      {/* Main Split-Screen Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Document List & Extracted Fields */}
        <div className="lg:col-span-5 space-y-4">
          <div className="pm-card p-4 bg-white">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#617384] mb-2.5">
              Ingested Regulatory Documents ({documents.length})
            </h2>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {documents.map((doc) => (
                <button
                  key={doc.id}
                  onClick={() => {
                    setSelectedDocId(doc.id);
                    setSelectedFieldId('');
                    setActivePage(1);
                  }}
                  className={`w-full text-left p-2.5 rounded border transition-colors cursor-pointer ${
                    selectedDoc?.id === doc.id
                      ? 'border-[#087F8C] bg-[#E6F4F5]/50'
                      : 'border-[#DCE5EC] hover:bg-[#F4F7FA]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] font-bold text-[#087F8C]">{doc.documentType}</span>
                    <StatusIndicator status={doc.processingStatus} />
                  </div>
                  <div className="text-xs font-bold text-[#10243A] mt-0.5 truncate font-mono">{doc.filename}</div>
                  <div className="flex items-center justify-between text-[11px] font-mono text-[#617384] mt-1">
                    <span>Class Conf: {Math.round(doc.classificationConfidence * 100)}%</span>
                    <span>{doc.pageCount}p</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {selectedDoc && (
            <div className="pm-card p-4 bg-white space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#10243A]">
                  Extracted Fields (Click to Highlight on Page)
                </h3>
                <span className="font-mono text-[11px] text-[#087F8C]">{docFields.length} Anchors</span>
              </div>
              <div className="space-y-2">
                {docFields.map((fld) => {
                  const isHighlighted = activeField?.id === fld.id;
                  return (
                    <button
                      key={fld.id}
                      onClick={() => {
                        setSelectedFieldId(fld.id);
                        setActivePage(fld.pageNumber);
                      }}
                      className={`w-full text-left p-3 rounded border transition-colors cursor-pointer ${
                        isHighlighted
                          ? 'border-[#087F8C] bg-[#E6F4F5]/60'
                          : 'border-[#DCE5EC] hover:bg-[#F4F7FA]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#10243A]">{fld.fieldLabel}</span>
                        <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-[#10243A] text-white">
                          Page {fld.pageNumber}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="font-mono text-xs font-bold text-[#087F8C]">
                          {fld.fieldValue || 'Not detected'}
                        </span>
                        <span className="font-mono text-[11px] text-[#617384]">
                          Conf: {Math.round(fld.confidence * 100)}%
                        </span>
                      </div>
                      <div className="text-[11px] text-[#617384] font-mono mt-1 truncate">
                        Region: {fld.regionCoordinates}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Interactive Page & Bounding-Box Canvas */}
        <div className="lg:col-span-7 pm-card p-5 bg-white flex flex-col justify-between">
          {selectedDoc ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#DCE5EC]">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[#087F8C]">{selectedDoc.id}</span>
                    <span className="text-sm font-bold text-[#10243A] font-mono">{selectedDoc.filename}</span>
                  </div>
                  <div className="text-[11px] font-mono text-[#617384] mt-0.5">
                    SHA-256: {selectedDoc.sha256Hash.slice(0, 24)}... | Issued: {selectedDoc.issueDate || 'N/A'} |
                    Expiry: {selectedDoc.expiryDate || 'Perpetual'}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 font-mono text-xs">
                  <span className="px-2.5 py-1 rounded bg-[#F4F7FA] border border-[#DCE5EC]">
                    Viewing Page {activeField?.pageNumber || activePage} of {selectedDoc.pageCount}
                  </span>
                </div>
              </div>

              {/* Preliminary Anomaly Banner if applicable */}
              {(selectedDoc.isDuplicateOf || selectedDoc.metadataFlags.length > 0) && (
                <div className="p-3 rounded bg-amber-50 border border-amber-300 text-xs space-y-1">
                  <div className="font-bold text-[#B7791F] flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" />
                    Preliminary Anomaly — Requires Human Verification
                  </div>
                  {selectedDoc.isDuplicateOf && (
                    <div className="text-[#10243A] font-mono text-[11px]">
                      • Exact SHA-256 duplicate of document {selectedDoc.isDuplicateOf}
                    </div>
                  )}
                  {selectedDoc.metadataFlags.map((m, idx) => (
                    <div key={idx} className="text-[#10243A] font-mono text-[11px]">
                      • {m}
                    </div>
                  ))}
                </div>
              )}

              {/* Simulated High-Precision Document Sheet with Highlighted Bounding Box */}
              <div className="relative w-full min-h-[400px] rounded border-2 border-[#DCE5EC] bg-[#F8FAFC] p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-[#DCE5EC] pb-2 text-[11px] font-mono text-[#617384]">
                  <span>OFFICIAL REGULATORY SUBMISSION RECORD — {selectedDoc.issuingAuthority}</span>
                  <span>CERT REF: {selectedDoc.certificateReference}</span>
                </div>

                {docExtraction && (
                  <pre className="text-xs font-mono text-[#10243A] whitespace-pre-wrap bg-white p-3 rounded border border-[#DCE5EC]">
                    {docExtraction.rawText}
                  </pre>
                )}

                {/* Render all fields for this document with visual highlight cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {docFields.map((fld) => {
                    const isTarget = activeField?.id === fld.id;
                    return (
                      <div
                        key={fld.id}
                        onClick={() => setSelectedFieldId(fld.id)}
                        className={`p-3 rounded transition-all cursor-pointer ${
                          isTarget
                            ? 'border-2 border-[#087F8C] bg-[#E6F4F5] shadow-sm'
                            : 'border border-dashed border-[#617384]/50 bg-white hover:border-[#087F8C]'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[10px] font-mono font-bold text-[#087F8C]">
                          <span>
                            ANCHOR: {fld.fieldName} (Page {fld.pageNumber})
                          </span>
                          <span>CONF: {Math.round(fld.confidence * 100)}%</span>
                        </div>
                        <div className="text-xs font-mono font-semibold text-[#10243A] mt-1">
                          {fld.fieldLabel}: {fld.fieldValue || 'NULL'}
                        </div>
                        <div className="text-[10px] font-mono text-[#617384] mt-0.5">
                          Coords: {fld.regionCoordinates}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
 * PAGE 9: VALIDATION CENTER (/validation-center)
 * ========================================================================== */
export const ValidationCenterPage: React.FC = () => {
  const { apiFetch, addToast } = useApp();
  const [findings, setFindings] = useState<ValidationFinding[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [comment, setComment] = useState('');

  const loadFindings = useCallback(async () => {
    try {
      const data = await apiFetch<{ findings: ValidationFinding[] }>('/api/v1/findings');
      setFindings(data.findings);
    } catch (e: any) {
      addToast({ title: 'Validation Load Error', description: e.message, variant: 'critical' });
    }
  }, [apiFetch, addToast]);

  useEffect(() => {
    loadFindings();
  }, [loadFindings]);

  const categories = ['ALL', ...Array.from(new Set(findings.map((f) => f.category)))];

  const filtered = findings.filter((f) => {
    if (categoryFilter !== 'ALL' && f.category !== categoryFilter) return false;
    if (severityFilter !== 'ALL' && f.severity !== severityFilter) return false;
    return true;
  });

  const handleReviewAction = async (
    findingId: string,
    actionType: 'Accept Finding' | 'Dismiss Finding' | 'Request Additional Evidence'
  ) => {
    if (!comment.trim()) {
      addToast({
        title: 'Justification Required',
        description: 'Please enter an explicit justification comment before updating a finding.',
        variant: 'warning',
      });
      return;
    }
    try {
      await apiFetch(`/api/v1/findings/${findingId}/actions`, {
        method: 'POST',
        body: JSON.stringify({ actionType, justification: comment }),
      });
      addToast({
        title: `Action Recorded: ${actionType}`,
        description: 'Officer decision logged to tamper-evident audit trail.',
        variant: 'success',
      });
      setReviewingId(null);
      setComment('');
      await loadFindings();
    } catch (e: any) {
      addToast({ title: 'Update Error', description: e.message, variant: 'critical' });
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#10243A]">
            Cross-Document Consistency & Validation Center
          </h1>
          <p className="text-xs text-[#617384] mt-0.5">
            Inspect completeness, cross-document mismatches, expired certificates, SHA-256 duplicates, and capacity
            ratios across all applications.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 rounded border border-[#DCE5EC] bg-white text-xs font-medium text-[#10243A]"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                Category: {c}
              </option>
            ))}
          </select>
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-3 py-1.5 rounded border border-[#DCE5EC] bg-white text-xs font-medium text-[#10243A]"
          >
            <option value="ALL">All Severities</option>
            <option value="Critical Review">Critical Review</option>
            <option value="High Priority">High Priority</option>
            <option value="Medium Priority">Medium Priority</option>
            <option value="Low Priority">Low Priority</option>
          </select>
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((f) => (
          <div key={f.id} className="pm-card p-5 bg-white">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-1.5 max-w-3xl">
                <div className="flex items-center gap-2 flex-wrap">
                  <StatusIndicator status={f.severity} />
                  <span className="font-mono text-xs font-bold text-[#087F8C]">{f.ruleId}</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-[#F4F7FA] text-[#10243A]">
                    {f.category}
                  </span>
                  <Link
                    to={`/applications/${f.applicationId}?tab=findings`}
                    className="font-mono text-xs text-[#087F8C] hover:underline"
                  >
                    {f.applicationId}
                  </Link>
                  <span className="font-mono text-xs text-[#617384]">Review State: {f.reviewStatus}</span>
                </div>
                <h3 className="text-sm font-bold text-[#10243A]">{f.title}</h3>
                <p className="text-xs text-[#617384] leading-relaxed">{f.description}</p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs font-mono">
                  <div className="p-2 rounded bg-[#F4F7FA]">
                    <span className="text-[10px] uppercase text-[#617384] block">Expected / Claimed</span>
                    <span className="font-bold text-[#10243A]">{f.expectedValue}</span>
                  </div>
                  <div className="p-2 rounded bg-red-50">
                    <span className="text-[10px] uppercase text-[#617384] block">Observed Evidence</span>
                    <span className="font-bold text-[#B42318]">{f.observedValue}</span>
                  </div>
                  <div className="p-2 rounded bg-[#F4F7FA]">
                    <span className="text-[10px] uppercase text-[#617384] block">Source Reference</span>
                    <span className="text-[#087F8C]">{f.evidenceReference}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setReviewingId(reviewingId === f.id ? null : f.id)}
                className="px-3 py-1.5 rounded bg-[#10243A] text-white text-xs font-semibold hover:bg-[#183B56] cursor-pointer"
              >
                {reviewingId === f.id ? 'Cancel' : 'Officer Action'}
              </button>
            </div>

            {reviewingId === f.id && (
              <div className="mt-4 pt-3 border-t border-[#DCE5EC] space-y-2">
                <input
                  type="text"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Enter mandatory officer justification..."
                  className="w-full p-2 rounded border border-[#DCE5EC] text-xs"
                />
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleReviewAction(f.id, 'Accept Finding')}
                    className="px-3 py-1 rounded bg-[#18794E] text-white text-xs font-semibold cursor-pointer"
                  >
                    Accept Finding
                  </button>
                  <button
                    onClick={() => handleReviewAction(f.id, 'Request Additional Evidence')}
                    className="px-3 py-1 rounded bg-[#B7791F] text-white text-xs font-semibold cursor-pointer"
                  >
                    Request Additional Evidence
                  </button>
                  <button
                    onClick={() => handleReviewAction(f.id, 'Dismiss Finding')}
                    className="px-3 py-1 rounded bg-[#B42318] text-white text-xs font-semibold cursor-pointer"
                  >
                    Dismiss with Justification
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

/* ============================================================================
 * PAGE 10: SIGNATURE INTERACTIVE CLAIM-TO-EVIDENCE GRAPH (/evidence-graph)
 * ========================================================================== */
export const EvidenceGraphPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { apiFetch, addToast } = useApp();
  const appId = searchParams.get('appId') || 'APP-DEMO-2026-001';

  const [nodes, setNodes] = useState<EvidenceNode[]>([]);
  const [relationships, setRelationships] = useState<EvidenceRelationship[]>([]);
  const [selectedNode, setSelectedNode] = useState<EvidenceNode | null>(null);
  const [nodeTypeFilter, setNodeTypeFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    apiFetch<{ nodes: EvidenceNode[]; relationships: EvidenceRelationship[] }>(
      `/api/v1/applications/${appId}/evidence-graph`
    )
      .then((data) => {
        setNodes(data.nodes || []);
        setRelationships(data.relationships || []);
        const firstFinding = data.nodes?.find((n) => n.nodeType === 'FINDING') || data.nodes?.[0];
        if (firstFinding) setSelectedNode(firstFinding);
      })
      .catch((e) => addToast({ title: 'Graph Load Error', description: e.message, variant: 'critical' }));
  }, [appId, apiFetch, addToast]);

  const visibleNodes = nodes.filter((n) => {
    if (nodeTypeFilter !== 'ALL' && n.nodeType !== nodeTypeFilter) return false;
    if (
      searchQuery &&
      !n.label.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !n.subtitle.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const visibleNodeIds = new Set(visibleNodes.map((n) => n.id));
  const visibleEdges = relationships.filter(
    (e) => visibleNodeIds.has(e.sourceNodeId) && visibleNodeIds.has(e.targetNodeId)
  );

  const handleExportSvg = () => {
    const svgEl = document.getElementById('proofmesh-evidence-graph-svg');
    if (!svgEl) return;
    const serializer = new XMLSerializer();
    const source = serializer.serializeToString(svgEl);
    const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${appId}-claim-to-evidence-graph.svg`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#10243A]">
            Interactive Claim-to-Evidence Graph ({appId})
          </h1>
          <p className="text-xs text-[#617384] mt-0.5">
            Every institutional claim connected to extracted document snippets, regulatory clauses, and external
            verification records.
          </p>
        </div>

        {/* Graph Controls Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#617384] absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search nodes..."
              className="pl-8 pr-3 py-1.5 rounded border border-[#DCE5EC] bg-white text-xs w-44"
            />
          </div>
          <select
            value={nodeTypeFilter}
            onChange={(e) => setNodeTypeFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded border border-[#DCE5EC] bg-white text-xs"
          >
            <option value="ALL">All Node Types</option>
            <option value="CLAIM">Claim</option>
            <option value="DOCUMENT">Document</option>
            <option value="EXTRACTED_VALUE">Extracted Value</option>
            <option value="REGULATORY_RULE">Regulatory Rule</option>
            <option value="FINDING">Finding</option>
          </select>
          <button
            onClick={() => setZoom((z) => Math.min(z + 0.15, 1.6))}
            className="p-1.5 rounded border border-[#DCE5EC] bg-white hover:bg-[#F4F7FA] cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4 text-[#10243A]" />
          </button>
          <button
            onClick={() => setZoom((z) => Math.max(z - 0.15, 0.65))}
            className="p-1.5 rounded border border-[#DCE5EC] bg-white hover:bg-[#F4F7FA] cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4 text-[#10243A]" />
          </button>
          <button
            onClick={() => {
              setZoom(1);
              setPan({ x: 0, y: 0 });
            }}
            className="p-1.5 rounded border border-[#DCE5EC] bg-white hover:bg-[#F4F7FA] cursor-pointer"
            title="Fit to Screen"
          >
            <Maximize2 className="w-4 h-4 text-[#10243A]" />
          </button>
          <button
            onClick={handleExportSvg}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-[#087F8C] text-white text-xs font-semibold hover:bg-[#10243A] cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Export SVG
          </button>
        </div>
      </div>

      {/* Canvas + Contextual Inspector Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-8 pm-card bg-white overflow-hidden relative">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#DCE5EC] bg-[#F4F7FA] text-[11px] font-mono">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#087F8C] inline-block" /> Supported / Extracted
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#B42318] inline-block" /> Conflicts / Discrepancy
              </span>
            </div>
            <span>Click any node to inspect evidence provenance</span>
          </div>

          <div className="overflow-auto h-[560px] bg-[#F8FAFC]">
            <svg
              id="proofmesh-evidence-graph-svg"
              viewBox="0 0 1220 720"
              className="w-full h-full min-w-[920px]"
              style={{
                transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
                transformOrigin: 'top left',
              }}
            >
              {/* Edges */}
              {visibleEdges.map((edge) => {
                const src = visibleNodes.find((n) => n.id === edge.sourceNodeId)?.position;
                const tgt = visibleNodes.find((n) => n.id === edge.targetNodeId)?.position;
                if (!src || !tgt) return null;
                const strokeColor = edge.isConflict ? '#B42318' : '#087F8C';
                const strokeDash = edge.isConflict ? '5,4' : undefined;

                return (
                  <g key={edge.id}>
                    <path
                      d={`M ${src.x + 85} ${src.y + 28} C ${(src.x + tgt.x) / 2 + 85} ${src.y + 28}, ${
                        (src.x + tgt.x) / 2 + 85
                      } ${tgt.y + 28}, ${tgt.x + 85} ${tgt.y + 28}`}
                      fill="none"
                      stroke={strokeColor}
                      strokeWidth={2}
                      strokeDasharray={strokeDash}
                    />
                    <text
                      x={(src.x + tgt.x) / 2 + 85}
                      y={(src.y + tgt.y) / 2 + 22}
                      textAnchor="middle"
                      fill={strokeColor}
                      fontSize="9"
                      fontFamily="IBM Plex Mono, monospace"
                    >
                      {edge.relationshipType}
                    </text>
                  </g>
                );
              })}

              {/* Nodes */}
              {visibleNodes.map((node) => {
                const pos = node.position;
                const isSelected = selectedNode?.id === node.id;
                const isConflictNode =
                  node.status.toLowerCase().includes('mismatch') ||
                  node.status.toLowerCase().includes('critical') ||
                  node.status.toLowerCase().includes('expired') ||
                  node.nodeType === 'FINDING';
                const borderColor = isConflictNode ? '#B42318' : '#087F8C';
                const bgFill = isConflictNode ? '#FEF2F2' : '#FFFFFF';

                return (
                  <g
                    key={node.id}
                    transform={`translate(${pos.x}, ${pos.y})`}
                    onClick={() => setSelectedNode(node)}
                    className="cursor-pointer"
                  >
                    <rect
                      width="175"
                      height="56"
                      rx="6"
                      fill={bgFill}
                      stroke={isSelected ? '#10243A' : borderColor}
                      strokeWidth={isSelected ? 3 : 1.75}
                    />
                    <text x="10" y="16" fontSize="9" fontWeight="700" fill={borderColor} fontFamily="IBM Plex Mono">
                      {node.nodeType}
                    </text>
                    <text x="10" y="32" fontSize="11" fontWeight="700" fill="#10243A">
                      {node.label.length > 23 ? `${node.label.slice(0, 22)}…` : node.label}
                    </text>
                    <text x="10" y="46" fontSize="9.5" fill="#617384" fontFamily="IBM Plex Mono">
                      {node.subtitle.length > 26 ? `${node.subtitle.slice(0, 25)}…` : node.subtitle}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Right Contextual Node Details Drawer */}
        <div className="lg:col-span-4 pm-card p-5 bg-white space-y-4">
          <div className="border-b border-[#DCE5EC] pb-3">
            <span className="text-[11px] font-mono font-bold uppercase text-[#087F8C]">
              Evidence Node Inspector
            </span>
            <h2 className="text-base font-bold text-[#10243A] mt-0.5">
              {selectedNode ? selectedNode.label : 'Select a Node'}
            </h2>
          </div>

          {selectedNode ? (
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[#617384]">Node Type:</span>
                <span className="font-mono font-bold text-[#10243A]">{selectedNode.nodeType}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#617384]">Verification Posture:</span>
                <StatusIndicator status={selectedNode.status} />
              </div>
              <div className="p-3 rounded bg-[#F4F7FA] border border-[#DCE5EC] space-y-2">
                <div className="font-semibold text-[#10243A]">{selectedNode.subtitle}</div>
                {Object.entries(selectedNode.details).map(([k, v]) =>
                  v ? (
                    <div key={k} className="flex justify-between gap-2 text-[11px] font-mono">
                      <span className="text-[#617384]">{k}:</span>
                      <span className="text-[#10243A] font-semibold text-right">{String(v)}</span>
                    </div>
                  ) : null
                )}
              </div>

              <div className="pt-2 space-y-2">
                <div className="text-[11px] font-bold uppercase text-[#617384]">Connected Relationships</div>
                {relationships
                  .filter((e) => e.sourceNodeId === selectedNode.id || e.targetNodeId === selectedNode.id)
                  .map((edge) => (
                    <div key={edge.id} className="p-2.5 rounded border border-[#DCE5EC] text-[11px] font-mono">
                      <div className="font-bold text-[#087F8C]">{edge.relationshipType}</div>
                      <div className="text-[#617384] mt-0.5">
                        {edge.sourceNodeId} → {edge.targetNodeId}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
 * PAGE 11: SIGNATURE REGULATORY CHANGE IMPACT ENGINE (/change-impact)
 * ========================================================================== */
export const ChangeImpactPage: React.FC = () => {
  const { apiFetch, addToast } = useApp();
  const [changes, setChanges] = useState<ChangeImpactFinding[]>([]);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [resolutionStatus, setResolutionStatus] =
    useState<ChangeImpactFinding['resolutionStatus']>('Reviewed & Acknowledged');

  const loadChanges = useCallback(async () => {
    try {
      const data = await apiFetch<{ changeImpacts: ChangeImpactFinding[] }>(
        '/api/v1/applications/APP-DEMO-2026-001/change-impact'
      );
      setChanges(data.changeImpacts || []);
    } catch (e: any) {
      addToast({ title: 'Load Error', description: e.message, variant: 'critical' });
    }
  }, [apiFetch, addToast]);

  useEffect(() => {
    loadChanges();
  }, [loadChanges]);

  const handleResolve = async (id: string) => {
    try {
      await apiFetch(`/api/v1/change-impact/${id}/resolve`, {
        method: 'POST',
        body: JSON.stringify({ resolutionStatus }),
      });
      addToast({
        title: 'Change Impact Updated',
        description: `Marked as "${resolutionStatus}" in audit log.`,
        variant: 'success',
      });
      setResolvingId(null);
      await loadChanges();
    } catch (e: any) {
      addToast({ title: 'Update Failed', description: e.message, variant: 'critical' });
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-[#10243A]">
          Regulatory Change Impact Engine (2025–2026 vs 2026–2027)
        </h1>
        <p className="text-xs text-[#617384] mt-0.5">
          Automated detection of year-on-year intake expansions, faculty attritions, land/built-up area changes, and
          resulting regulatory rule triggers.
        </p>
      </div>

      <div className="space-y-4">
        {changes.map((c) => (
          <div key={c.id} className="pm-card p-5 bg-white">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-2 max-w-3xl">
                <div className="flex items-center gap-2 flex-wrap">
                  <StatusIndicator status={c.changeClassification} />
                  <span className="font-mono text-xs font-bold text-[#087F8C]">{c.applicationId}</span>
                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-[#F4F7FA] text-[#10243A]">
                    Resolution: {c.resolutionStatus}
                  </span>
                </div>
                <h2 className="text-base font-bold text-[#10243A]">{c.fieldLabel}</h2>
                <p className="text-xs text-[#617384] leading-relaxed">{c.potentialImpact}</p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 font-mono text-xs">
                  <div className="p-2.5 rounded bg-[#F4F7FA] border border-[#DCE5EC]">
                    <div className="text-[10px] uppercase text-[#617384]">2025–2026 Approved Baseline</div>
                    <div className="font-bold text-[#10243A] mt-0.5">{c.previousValue}</div>
                  </div>
                  <div className="p-2.5 rounded bg-[#E6F4F5] border border-[#087F8C]/30">
                    <div className="text-[10px] uppercase text-[#087F8C]">2026–2027 Current Submission</div>
                    <div className="font-bold text-[#10243A] mt-0.5">{c.currentValue}</div>
                  </div>
                  <div className="p-2.5 rounded bg-red-50 border border-red-200">
                    <div className="text-[10px] uppercase text-[#B42318]">Applicable Rule Clause</div>
                    <div className="font-bold text-[#B42318] mt-0.5">{c.applicableRuleCode}</div>
                  </div>
                </div>

                <div className="text-xs text-[#10243A] pt-1">
                  <span className="font-semibold">Recommended Officer Action: </span>
                  {c.recommendedAction}
                </div>
              </div>

              <button
                onClick={() => setResolvingId(resolvingId === c.id ? null : c.id)}
                className="px-3 py-1.5 rounded bg-[#10243A] text-white text-xs font-semibold hover:bg-[#183B56] cursor-pointer"
              >
                Update Resolution
              </button>
            </div>

            {resolvingId === c.id && (
              <div className="mt-4 pt-3 border-t border-[#DCE5EC] flex flex-wrap items-center gap-2">
                <select
                  value={resolutionStatus}
                  onChange={(e) => setResolutionStatus(e.target.value as any)}
                  className="px-3 py-1.5 rounded border border-[#DCE5EC] text-xs"
                >
                  <option value="Reviewed & Acknowledged">Reviewed & Acknowledged</option>
                  <option value="Escalated for Verification">Escalated for Verification</option>
                  <option value="Unresolved">Unresolved</option>
                </select>
                <button
                  onClick={() => handleResolve(c.id)}
                  className="px-3 py-1.5 rounded bg-[#087F8C] text-white text-xs font-semibold cursor-pointer"
                >
                  Save Resolution State
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

/* ============================================================================
 * PAGE 12: COMPLIANCE ASSESSMENT CENTER (/compliance)
 * ========================================================================== */
export const ComplianceCenterPage: React.FC = () => {
  const { apiFetch, addToast } = useApp();
  const [compliance, setCompliance] = useState<ComplianceAssessment[]>([]);
  const [rules, setRules] = useState<RegulatoryRule[]>([]);
  const [selectedItem, setSelectedItem] = useState<ComplianceAssessment | null>(null);

  useEffect(() => {
    apiFetch<{ complianceAssessments: ComplianceAssessment[]; rules: RegulatoryRule[] }>(
      '/api/v1/applications/APP-DEMO-2026-001/compliance'
    )
      .then((d) => {
        setCompliance(d.complianceAssessments || []);
        setRules(d.rules || []);
        if (d.complianceAssessments?.length > 0) setSelectedItem(d.complianceAssessments[0]);
      })
      .catch((e) => addToast({ title: 'Compliance Error', description: e.message, variant: 'critical' }));
  }, [apiFetch, addToast]);

  const matchingRule = rules.find((r) => r.ruleCode === selectedItem?.ruleCode);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-[#10243A]">
          Clause-by-Clause Regulatory Compliance Assessment
        </h1>
        <p className="text-xs text-[#617384] mt-0.5">
          Deterministic threshold evaluation linked to configured regulatory handbook clauses. Passing checks state
          &ldquo;No discrepancy detected by the checks performed.&rdquo;
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-8 pm-card p-5 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#DCE5EC] text-[11px] font-semibold uppercase text-[#617384]">
                  <th className="py-2.5 pr-3">Rule Code</th>
                  <th className="py-2.5 px-3">Requirement</th>
                  <th className="py-2.5 px-3">Evidence Required</th>
                  <th className="py-2.5 px-3">Supplied Evidence</th>
                  <th className="py-2.5 px-3">Outcome</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DCE5EC]">
                {compliance.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => setSelectedItem(c)}
                    className={`cursor-pointer transition-colors ${
                      selectedItem?.id === c.id ? 'bg-[#E6F4F5]/60' : 'hover:bg-[#F4F7FA]'
                    }`}
                  >
                    <td className="py-3 pr-3 font-mono font-bold text-[#087F8C]">{c.ruleCode}</td>
                    <td className="py-3 px-3 font-semibold text-[#10243A]">{c.requirementText}</td>
                    <td className="py-3 px-3">{c.evidenceRequired}</td>
                    <td className="py-3 px-3 font-mono">{c.evidenceSupplied}</td>
                    <td className="py-3 px-3">
                      <StatusIndicator status={c.validationResult} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Rule Details Drawer */}
        <div className="lg:col-span-4 pm-card p-5 bg-white space-y-3">
          <div className="border-b border-[#DCE5EC] pb-2">
            <span className="text-[10px] font-mono font-bold uppercase text-[#087F8C]">
              Regulatory Clause Details Drawer
            </span>
            <h2 className="text-base font-bold text-[#10243A] mt-0.5">
              {selectedItem ? `${selectedItem.ruleCode} (${selectedItem.ruleVersion})` : 'Select a Clause'}
            </h2>
          </div>
          {selectedItem && (
            <div className="space-y-3 text-xs">
              <StatusIndicator status={selectedItem.validationResult} />
              <div className="p-3 rounded bg-[#F4F7FA] border border-[#DCE5EC] space-y-1.5">
                <div className="font-semibold text-[#10243A]">{selectedItem.requirementText}</div>
                <div className="font-mono text-[11px] text-[#617384]">
                  Category: {selectedItem.requirementCategory}
                </div>
                <div className="font-mono text-[11px]">Evidence Ref: {selectedItem.evidenceReference}</div>
              </div>
              {matchingRule && (
                <div className="p-3 rounded border border-[#DCE5EC] space-y-1 text-[11px] font-mono">
                  <div className="font-bold text-[#087F8C]">Validation Logic:</div>
                  <div>{matchingRule.validationLogic}</div>
                </div>
              )}
              <p className="text-[#617384] leading-relaxed">Next Action: {selectedItem.nextAction}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
