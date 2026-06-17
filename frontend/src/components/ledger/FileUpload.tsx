"use client";

import { useCallback, useState } from "react";

interface FileUploadProps {
  sessionId: string;
  onUploadComplete: (data: unknown) => void;
}

export function FileUpload({ sessionId, onUploadComplete }: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleUpload = useCallback(async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`/api/ledger/upload/${sessionId}`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      onUploadComplete(data);
    } finally {
      setUploading(false);
    }
  }, [sessionId, onUploadComplete]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  }, [handleUpload]);

  return (
    <label
      className={`block border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-colors ${
        dragOver ? "border-accent bg-accent/5" : "border-border/50 hover:border-accent/50"
      }`}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
    >
      <input
        type="file"
        className="sr-only"
        accept=".jpg,.jpeg,.png,.pdf"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleUpload(file);
        }}
        disabled={uploading}
      />
      <p className="text-sm text-muted font-sans">
        {uploading ? "Processing..." : "Drop a receipt or bill here, or click to browse"}
      </p>
      <p className="text-xs text-muted/60 mt-1 font-sans">JPG, PNG, or PDF</p>
    </label>
  );
}
