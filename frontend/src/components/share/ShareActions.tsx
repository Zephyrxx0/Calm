"use client";

import { useState } from "react";
import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";
import { Button } from "@/components/ui/button";
import { Link2, Download, FileText, Check, Loader2 } from "lucide-react";

interface ShareActionsProps {
  onCopyLink: () => Promise<string | null>;
  dateStr?: string;
}

export function ShareActions({ onCopyLink, dateStr }: ShareActionsProps) {
  const [copyState, setCopyState] = useState<"idle" | "loading" | "copied">("idle");
  const [exportingPng, setExportingPng] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);

  const handleCopyLink = async () => {
    if (copyState !== "idle") return;
    setCopyState("loading");
    try {
      const link = await onCopyLink();
      if (link) {
        await navigator.clipboard.writeText(link);
        setCopyState("copied");
        setTimeout(() => setCopyState("idle"), 2500);
      } else {
        setCopyState("idle");
      }
    } catch (err) {
      console.error("Failed to copy link:", err);
      setCopyState("idle");
    }
  };

  const handleDownloadPng = async () => {
    const element = document.getElementById("share-preview-card");
    if (!element) return;
    setExportingPng(true);
    try {
      // Small delay to ensure all fonts and styles are loaded
      await new Promise((resolve) => setTimeout(resolve, 150));
      
      const dataUrl = await toPng(element, {
        cacheBust: true,
        backgroundColor: "#ffffff",
        style: {
          transform: "scale(1)",
          boxShadow: "none",
        },
      });

      const link = document.createElement("a");
      link.download = `carbon-footprint-${dateStr || "today"}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Failed to export PNG:", err);
    } finally {
      setExportingPng(false);
    }
  };

  const handleDownloadPdf = async () => {
    const element = document.getElementById("share-preview-card");
    if (!element) return;
    setExportingPdf(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 150));

      const dataUrl = await toPng(element, {
        cacheBust: true,
        backgroundColor: "#ffffff",
        style: {
          transform: "scale(1)",
          boxShadow: "none",
        },
      });

      const pdf = new jsPDF("p", "mm", "a4");
      
      // Calculate dimensions (A4 is 210mm x 297mm)
      const imgWidth = 130; // 13cm width on A4 page
      const imgHeight = (element.offsetHeight * imgWidth) / element.offsetWidth;
      
      const x = (210 - imgWidth) / 2;
      const y = (297 - imgHeight) / 2;

      pdf.addImage(dataUrl, "PNG", x, y, imgWidth, imgHeight);
      pdf.save(`carbon-report-${dateStr || "today"}.pdf`);
    } catch (err) {
      console.error("Failed to export PDF:", err);
    } finally {
      setExportingPdf(false);
    }
  };

  return (
    <div className="w-full max-w-md flex flex-col gap-3 mt-6">
      <Button
        variant="default"
        className="w-full h-10 font-sans tracking-wide transition-all shadow-sm"
        onClick={handleCopyLink}
        disabled={copyState === "loading"}
      >
        {copyState === "loading" ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Generating public link...
          </>
        ) : copyState === "copied" ? (
          <>
            <Check className="h-4 w-4 text-emerald-600 mr-2" />
            Link Copied!
          </>
        ) : (
          <>
            <Link2 className="h-4 w-4 mr-2" />
            Copy Share Link
          </>
        )}
      </Button>

      <div className="grid grid-cols-2 gap-3">
        <Button
          variant="outline"
          className="h-10 font-sans tracking-wide hover:bg-muted"
          onClick={handleDownloadPng}
          disabled={exportingPng}
        >
          {exportingPng ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Saving PNG...
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              Download PNG
            </>
          )}
        </Button>

        <Button
          variant="outline"
          className="h-10 font-sans tracking-wide hover:bg-muted"
          onClick={handleDownloadPdf}
          disabled={exportingPdf}
        >
          {exportingPdf ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Saving PDF...
            </>
          ) : (
            <>
              <FileText className="h-4 w-4 mr-2" />
              Download PDF
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
