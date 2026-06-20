"use client";

import {
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
  useRef,
} from "react";
import { toPng } from "html-to-image";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CategoryData {
  name: string;
  value: number;
}

export interface StreakSummary {
  currentStreak: number;
  longestStreak: number;
  totalDays: number;
}

export interface PullQuote {
  text: string;
  source?: string;
}

export interface NewspaperLayoutProps {
  title: string;
  subtitle?: string;
  footprint: number; // total CO₂e in kg
  categoryBreakdown: CategoryData[];
  streakData?: StreakSummary | null;
  pullQuotes?: PullQuote[];
}

export interface NewspaperLayoutHandle {
  exportAsPNG: () => Promise<void>;
  exportAsPDF: () => Promise<void>;
}

// ---------------------------------------------------------------------------
// Helper: check CSS multi-column support
// ---------------------------------------------------------------------------

function checkMultiColumnSupport(): boolean {
  if (typeof document === "undefined") return true; // SSR default
  try {
    return CSS.supports("columns", "4");
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const NewspaperLayout = forwardRef<NewspaperLayoutHandle, NewspaperLayoutProps>(
  function NewspaperLayout(
    { title, subtitle, footprint, categoryBreakdown, streakData, pullQuotes },
    ref,
  ) {
    const [exporting, setExporting] = useState(false);
    const [multiColumnSupported, setMultiColumnSupported] = useState(true);
    const [exportError, setExportError] = useState<string | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      setMultiColumnSupported(checkMultiColumnSupport());
    }, []);

    // ------------------------------------------------------------------
    // Export helpers
    // ------------------------------------------------------------------

    const captureAsDataUrl = async (pixelRatio = 2): Promise<string> => {
      if (!containerRef.current) {
        throw new Error("Broadsheet container not mounted");
      }
      return toPng(containerRef.current, {
        quality: 0.95,
        backgroundColor: "#FAFAF8",
        pixelRatio,
      });
    };

    const triggerDownload = (dataUrl: string, filename: string) => {
      const link = document.createElement("a");
      link.download = filename;
      link.href = dataUrl;
      link.click();
    };

    const exportAsPNG = async () => {
      if (exporting) return;
      setExporting(true);
      setExportError(null);
      try {
        const dataUrl = await captureAsDataUrl(2);
        const filename = `calm-broadsheet-${new Date()
          .toISOString()
          .slice(0, 10)}.png`;
        triggerDownload(dataUrl, filename);
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "Export failed";
        setExportError(msg);
        console.error("Broadsheet PNG export failed:", err);
      } finally {
        setExporting(false);
      }
    };

    const exportAsPDF = async () => {
      if (exporting) return;
      setExporting(true);
      setExportError(null);
      try {
        // Capture at high resolution for clean PDF rendering
        const dataUrl = await captureAsDataUrl(2);
        const { jsPDF } = await import("jspdf");
        // Landscape 11×17 (ledger) in mm: 279.4 × 431.8
        const pdf = new jsPDF({
          orientation: "landscape",
          unit: "mm",
          format: [279.4, 431.8],
        });
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const img = new Image();
        img.src = dataUrl;
        await new Promise<void>((resolve) => {
          img.onload = () => resolve();
        });
        const ratio = img.height / img.width;
        const imgWidth = pageWidth - 20;
        const imgHeight = imgWidth * ratio;
        // If image is taller than page, scale down
        const finalHeight = Math.min(imgHeight, pageHeight - 20);
        const finalWidth = finalHeight / ratio;
        pdf.addImage(
          dataUrl,
          "PNG",
          10,
          10,
          finalWidth,
          finalHeight,
        );
        const filename = `calm-broadsheet-${new Date()
          .toISOString()
          .slice(0, 10)}.pdf`;
        pdf.save(filename);
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "PDF export failed";
        setExportError(msg);
        console.error("Broadsheet PDF export failed:", err);
      } finally {
        setExporting(false);
      }
    };

    useImperativeHandle(ref, () => ({
      exportAsPNG,
      exportAsPDF,
    }));

    // ------------------------------------------------------------------
    // Derived data
    // ------------------------------------------------------------------

    const totalTons = (footprint / 1000).toFixed(1);
    const dateString = new Date().toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // ------------------------------------------------------------------
    // Render
    // ------------------------------------------------------------------

    return (
      <div
        className="newspaper-broadsheet-wrapper"
        style={{ position: "relative" }}
      >
        {/* Multi-column warning banner */}
        {!multiColumnSupported && (
          <div className="newspaper-column-warning">
            Your browser does not fully support multi-column layout.
            Export will still work but print appearance may vary.
          </div>
        )}

        {/* Export error banner */}
        {exportError && (
          <div className="newspaper-export-error">
            {exportError}
          </div>
        )}

        {/* Export loading overlay */}
        {exporting && (
          <div className="newspaper-export-loading-overlay">
            <div className="newspaper-export-loading-spinner" />
            <span>Generating your broadsheet...</span>
          </div>
        )}

        {/* ---------- SVG filter definitions ---------- */}
        <svg width="0" height="0" style={{position:'absolute'}} aria-hidden="true">
          <defs>
            <filter id="paper-grain" filterUnits="userSpaceOnUse" x="0" y="0" width="100%" height="100%">
              <feTurbulence type="fractalNoise" baseFrequency="0.5" numOctaves="4" seed="3" result="noise" />
              <feColorMatrix in="noise" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.06 0" result="grain" />
              <feBlend in="SourceGraphic" in2="grain" mode="multiply" />
            </filter>
            <filter id="halftone-img">
              <feColorMatrix type="matrix" values="0.33 0.33 0.33 0 0  0.33 0.33 0.33 0 0  0.33 0.33 0.33 0 0  0 0 0 1 0" result="grayscale" />
              <feComponentTransfer in="grayscale">
                <feFuncR type="linear" slope="1.8" intercept="-0.15" />
                <feFuncG type="linear" slope="1.8" intercept="-0.15" />
                <feFuncB type="linear" slope="1.8" intercept="-0.15" />
              </feComponentTransfer>
            </filter>
            <filter id="ink-bleed" x="-10%" y="-10%" width="120%" height="120%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="0.4" result="blur" />
              <feComponentTransfer in="blur" result="sharpened">
                <feFuncR type="linear" slope="2.5" intercept="-0.3" />
                <feFuncG type="linear" slope="2.5" intercept="-0.3" />
                <feFuncB type="linear" slope="2.5" intercept="-0.3" />
              </feComponentTransfer>
            </filter>
            <filter id="edge-wear" x="-20%" y="-20%" width="140%" height="140%">
              <feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="3" seed="5" result="turbulence" />
              <feDisplacementMap in="SourceGraphic" in2="turbulence" scale="3" xChannelSelector="R" yChannelSelector="G" />
            </filter>
          </defs>
        </svg>

        {/* ---------- Broadsheet container ---------- */}
        <div
          ref={containerRef}
          className="newspaper-broadsheet"
        >
          {/* Masthead */}
          <header className="newspaper-masthead">
            <div className="newspaper-masthead-rule" />
            <h1 className="newspaper-masthead-title">
              The Daily Calm
            </h1>
            <p className="newspaper-masthead-date">{dateString}</p>
            {subtitle && (
              <p className="newspaper-masthead-subtitle">{subtitle}</p>
            )}
            <div className="newspaper-masthead-rule" />
          </header>

          {/* Main Headline — Total Footprint */}
          <section className="newspaper-headline">
            <h2 className="newspaper-headline-title">
              {title}
            </h2>
            {subtitle && (
              <p className="newspaper-headline-subtitle">{subtitle}</p>
            )}
            <div className="newspaper-footprint-banner">
              <span className="newspaper-footprint-number">
                {totalTons}
              </span>
              <span className="newspaper-footprint-unit">
                tonnes CO₂e / year
              </span>
            </div>
          </section>

          {/* Horizontal fold crease */}
          <div className="newspaper-fold" aria-hidden="true" />

          {/* Category breakdown — flows across columns */}
          {categoryBreakdown.length > 0 && (
            <section className="newspaper-categories">
              <h3 className="newspaper-section-label">
                Category Breakdown
              </h3>
              <table className="newspaper-category-table">
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Tonnes CO₂e</th>
                    <th>Share</th>
                  </tr>
                </thead>
                <tbody>
                  {categoryBreakdown
                    .slice()
                    .sort((a, b) => b.value - a.value)
                    .map((cat) => {
                      const tons = (cat.value / 1000).toFixed(2);
                      const share =
                        footprint > 0
                          ? ((cat.value / footprint) * 100).toFixed(
                              0,
                            )
                          : "0";
                      return (
                        <tr key={cat.name}>
                          <td>{cat.name}</td>
                          <td>{tons}</td>
                          <td>{share}%</td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </section>
          )}

          {/* Streak statistics */}
          {streakData && (
            <section className="newspaper-streaks">
              <h3 className="newspaper-section-label">
                Your Carbon Streak
              </h3>
              <div className="newspaper-streak-stats">
                <div className="newspaper-streak-stat">
                  <span className="newspaper-streak-value">
                    {streakData.currentStreak}
                  </span>
                  <span className="newspaper-streak-label">
                    Current Streak (days)
                  </span>
                </div>
                <div className="newspaper-streak-stat">
                  <span className="newspaper-streak-value">
                    {streakData.longestStreak}
                  </span>
                  <span className="newspaper-streak-label">
                    Longest Streak
                  </span>
                </div>
                <div className="newspaper-streak-stat">
                  <span className="newspaper-streak-value">
                    {streakData.totalDays}
                  </span>
                  <span className="newspaper-streak-label">
                    Total Days Tracked
                  </span>
                </div>
              </div>
            </section>
          )}

          {/* Pull quotes — sidebar box style */}
          {pullQuotes && pullQuotes.length > 0 && (
            <section className="newspaper-quotes">
              <h3 className="newspaper-section-label">
                From Your Interview
              </h3>
              {pullQuotes.map((q, i) => (
                <blockquote
                  key={i}
                  className="newspaper-quote"
                >
                  <p>&ldquo;{q.text}&rdquo;</p>
                  {q.source && (
                    <cite className="newspaper-quote-source">
                      — {q.source}
                    </cite>
                  )}
                </blockquote>
              ))}
            </section>
          )}

          {/* Footer */}
          <footer className="newspaper-footer">
            <div className="newspaper-footer-rule" />
            <p className="newspaper-footer-text">
              Generated by Calm — Track your carbon footprint at
              calm.app
            </p>
          </footer>
        </div>

        {/* ---------- Styles ---------- */}
        <style jsx global>{`
          /* ===========================================================
             Broadsheet Container
             =========================================================== */
          .newspaper-broadsheet {
            width: 100%;
            max-width: 17in;
            margin: 0 auto;
            padding: 0.75in 0.5in;
            background: linear-gradient(180deg, #FAFAF8 0%, #F5F0E8 100%);
            color: #2c2c2a;
            font-family: var(--font-newspaper-body), 'PT Serif', Georgia, serif;
            box-sizing: border-box;
            position: relative;
            filter: url(#paper-grain) url(#edge-wear);
          }

          /* ===========================================================
             Multi-column layout (screen fallback)
             =========================================================== */
          @media screen {
            .newspaper-broadsheet {
              column-count: 5;
              column-gap: 0.5in;
              column-rule: 1px solid #d4d4cd;
            }
          }

          /* ===========================================================
             Print — true 11×17 broadsheet
             =========================================================== */
          @media print {
            @page {
              size: 17in 11in landscape;
              margin: 0.5in;
            }

            body {
              background: #fafaf8 !important;
              color: #2c2c2a !important;
            }

            .newspaper-broadsheet {
              width: 17in;
              height: 11in;
              padding: 0.5in 0.4in;
              margin: 0;
              column-count: 5;
              column-gap: 0.5in;
              column-rule: 1px solid #d4d4cd;
              max-width: none;
            }
          }

          /* ===========================================================
             Fallback for browsers without column support
             =========================================================== */
          @supports not (columns: 5) {
            .newspaper-broadsheet {
              column-count: auto;
              display: flex;
              flex-direction: column;
              gap: 24px;
            }
          }

          @media screen and (max-width: 1200px) {
            .newspaper-broadsheet {
              column-count: 3;
            }
          }

          @media screen and (max-width: 768px) {
            .newspaper-broadsheet {
              column-count: 1;
            }
          }

          /* ===========================================================
             Masthead
             =========================================================== */
          .newspaper-masthead {
            column-span: all;
            text-align: center;
            margin-bottom: 0.4in;
          }

          .newspaper-masthead-title {
            font-family: var(--font-newspaper-headline), 'Playfair Display', 'Times New Roman', serif;
            font-size: 36px;
            font-weight: 700;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            margin: 0.15in 0 0.1in;
            color: #1a1a1a;
            break-after: avoid;
            filter: url(#ink-bleed);
          }

          .newspaper-masthead-date {
            font-family: var(--font-newspaper-body), 'PT Serif', Georgia, serif;
            font-size: 12px;
            color: #6b6b68;
            letter-spacing: 0.1em;
            text-transform: uppercase;
            margin: 0.05in 0;
            break-after: avoid;
          }

          .newspaper-masthead-rule {
            width: 100%;
            height: 2px;
            background: #2c2c2a;
            margin: 0.1in 0;
          }

          .newspaper-masthead-subtitle {
            font-family: var(--font-newspaper-body), 'PT Serif', Georgia, serif;
            font-size: 13px;
            color: #6b6b68;
            text-align: center;
            letter-spacing: 0.05em;
            margin: 0 0 0.05in;
            font-style: normal;
          }

          /* ===========================================================
             Headline
             =========================================================== */
          .newspaper-headline {
            column-span: all;
            text-align: center;
            margin-bottom: 0.35in;
            break-after: avoid;
          }

          .newspaper-headline-title {
            font-family: var(--font-newspaper-headline), 'Playfair Display', 'Times New Roman', serif;
            font-size: 28px;
            font-weight: 700;
            line-height: 1.2;
            margin: 0 0 0.1in;
            color: #1a1a1a;
            filter: url(#ink-bleed);
          }

          .newspaper-headline-subtitle {
            font-family: var(--font-newspaper-body), 'PT Serif', Georgia, serif;
            font-size: 14px;
            font-style: normal;
            color: #6b6b68;
            margin: 0 0 0.15in;
          }

          .newspaper-footprint-banner {
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 0.2in 0;
            border-top: 1px solid #d4d4cd;
            border-bottom: 1px solid #d4d4cd;
            margin: 0.15in 0;
          }

          .newspaper-footprint-number {
            font-family: var(--font-newspaper-headline), 'Playfair Display', 'Times New Roman', serif;
            font-size: 64px;
            font-weight: 700;
            letter-spacing: -0.02em;
            color: #1a1a1a;
            line-height: 1;
          }

          .newspaper-footprint-unit {
            font-family: var(--font-newspaper-body), 'PT Serif', Georgia, serif;
            font-size: 14px;
            color: #6b6b68;
            letter-spacing: 0.05em;
            margin-top: 4px;
          }

          /* ===========================================================
             Section labels
             =========================================================== */
          .newspaper-section-label {
            font-family: var(--font-newspaper-headline), 'Playfair Display', 'Times New Roman', serif;
            font-size: 15px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.06em;
            margin: 0 0 0.12in;
            color: #1a1a1a;
            break-after: avoid;
          }

          /* ===========================================================
             Category table
             =========================================================== */
          .newspaper-categories {
            margin-bottom: 0.3in;
            break-inside: avoid;
          }

          .newspaper-category-table {
            width: 100%;
            border-collapse: collapse;
            font-family: var(--font-newspaper-body), 'PT Serif', Georgia, serif;
            font-size: 11px;
            line-height: 1.4;
          }

          .newspaper-category-table th {
            text-align: left;
            font-weight: 700;
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: #6b6b68;
            border-bottom: 1px solid #d4d4cd;
            padding: 4px 4px 3px 0;
          }

          .newspaper-category-table td {
            padding: 3px 4px 3px 0;
            border-bottom: 1px dotted #e5e5e2;
          }

          .newspaper-category-table tr:last-child td {
            border-bottom: none;
          }

          /* ===========================================================
             Streaks section
             =========================================================== */
          .newspaper-streaks {
            margin-bottom: 0.3in;
            break-inside: avoid;
          }

          .newspaper-streak-stats {
            display: flex;
            flex-direction: column;
            gap: 8px;
          }

          .newspaper-streak-stat {
            display: flex;
            flex-direction: column;
            padding: 6px 0;
            border-bottom: 1px dotted #e5e5e2;
          }

          .newspaper-streak-value {
            font-family: var(--font-newspaper-headline), 'Playfair Display', 'Times New Roman', serif;
            font-size: 24px;
            font-weight: 700;
            color: #1a1a1a;
          }

          .newspaper-streak-label {
            font-family: var(--font-newspaper-body), 'PT Serif', Georgia, serif;
            font-size: 10px;
            color: #6b6b68;
            text-transform: uppercase;
            letter-spacing: 0.04em;
          }

          /* ===========================================================
             Pull quotes
             =========================================================== */
          .newspaper-quotes {
            margin-bottom: 0.3in;
            break-inside: avoid;
          }

          .newspaper-quote {
            margin: 0 0 0.15in;
            padding: 0.1in 0.15in;
            border-left: 3px solid #c2856b;
            background: rgba(194, 133, 107, 0.05);
          }

          .newspaper-quote p {
            font-family: var(--font-newspaper-body), 'PT Serif', Georgia, serif;
            font-size: 12px;
            line-height: 1.5;
            font-style: italic;
            color: #2c2c2a;
            margin: 0;
          }

          .newspaper-quote-source {
            display: block;
            font-family: var(--font-newspaper-body), 'PT Serif', Georgia, serif;
            font-size: 10px;
            color: #6b6b68;
            font-style: normal;
            margin-top: 4px;
          }

          /* ===========================================================
             Footer
             =========================================================== */
          .newspaper-footer {
            column-span: all;
            text-align: center;
            margin-top: 0.3in;
          }

          .newspaper-footer-rule {
            width: 100%;
            height: 1px;
            background: #d4d4cd;
            margin-bottom: 0.1in;
          }

          .newspaper-footer-text {
            font-family: var(--font-newspaper-body), 'PT Serif', Georgia, serif;
            font-size: 10px;
            color: #9a9a97;
            letter-spacing: 0.03em;
          }

          /* ===========================================================
             Fold crease
             =========================================================== */
          .newspaper-fold {
            column-span: all;
            height: 0;
            margin: 0.3in 0;
            border-top: 1px solid rgba(0, 0, 0, 0.08);
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04);
            pointer-events: none;
          }

          /* ===========================================================
             Vignette overlay
             =========================================================== */
          .newspaper-broadsheet::after {
            content: '';
            position: absolute;
            inset: 0;
            pointer-events: none;
            background: radial-gradient(ellipse at center, transparent 60%, rgba(0, 0, 0, 0.03) 100%);
            z-index: 1;
          }

          /* ===========================================================
             Halftone on images
             =========================================================== */
          .newspaper-broadsheet img {
            filter: url(#halftone-img);
          }

          /* ===========================================================
             Utility — banners & overlays
             =========================================================== */
          .newspaper-broadsheet-wrapper {
            position: relative;
          }

          .newspaper-column-warning {
            background: #fef3c7;
            color: #92400e;
            font-family: Georgia, serif;
            font-size: 12px;
            padding: 8px 16px;
            text-align: center;
            border-bottom: 1px solid #f59e0b;
            margin-bottom: 12px;
          }

          .newspaper-export-error {
            background: #fee2e2;
            color: #991b1b;
            font-family: Georgia, serif;
            font-size: 12px;
            padding: 8px 16px;
            text-align: center;
            border-bottom: 1px solid #f87171;
            margin-bottom: 12px;
          }

          .newspaper-export-loading-overlay {
            position: absolute;
            inset: 0;
            z-index: 50;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 12px;
            background: rgba(250, 250, 248, 0.85);
            backdrop-filter: blur(2px);
          }

          .newspaper-export-loading-spinner {
            width: 32px;
            height: 32px;
            border: 3px solid #e5e5e2;
            border-top-color: #c2856b;
            border-radius: 50%;
            animation: newspaper-spin 0.8s linear infinite;
          }

          @keyframes newspaper-spin {
            to {
              transform: rotate(360deg);
            }
          }

          /* ===========================================================
             Print overrides
             =========================================================== */
          @media print {
            .newspaper-export-loading-overlay,
            .newspaper-column-warning,
            .newspaper-export-error {
              display: none !important;
            }

            .newspaper-fold {
              display: none !important;
            }

            .newspaper-broadsheet::after {
              display: none !important;
            }
          }
        `}</style>
      </div>
    );
  },
);

export default NewspaperLayout;
