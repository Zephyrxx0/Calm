import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import LedgerView from "@/components/ledger/LedgerView";
import { FileUpload } from "@/components/ledger/FileUpload";

describe("LedgerView", () => {
  it("renders total footprint and category breakdown", () => {
    render(
      <LedgerView
        entries={[
          { id: 1, description: "Electric bill", category: "Energy", carbon_impact: 40 },
          { id: 2, description: "Bus fare", category: "Transport", carbon_impact: 5 },
        ]}
        totalFootprint={45}
        categoryBreakdown={{ Energy: 40, Transport: 5 }}
      />
    );

    expect(screen.getByText(/45\.0/)).toBeInTheDocument();
    expect(screen.getByText(/Energy: 40\.0 kg/)).toBeInTheDocument();
    expect(screen.getByText(/Transport: 5\.0 kg/)).toBeInTheDocument();
  });

  it("renders entries with descriptions", () => {
    render(
      <LedgerView
        entries={[{ id: 1, description: "Groceries", category: "Food", carbon_impact: 12 }]}
        totalFootprint={12}
        categoryBreakdown={{ Food: 12 }}
      />
    );

    expect(screen.getByText("Groceries")).toBeInTheDocument();
    expect(screen.getByText("Food")).toBeInTheDocument();
  });

  it("shows empty state message when no entries", () => {
    render(
      <LedgerView entries={[]} totalFootprint={0} categoryBreakdown={{}} />
    );

    expect(screen.getByText(/Your ledger is empty/)).toBeInTheDocument();
  });
});

describe("FileUpload", () => {
  it("renders upload interface", () => {
    render(<FileUpload sessionId="test-123" onUploadComplete={vi.fn()} />);

    expect(screen.getByText(/Drop a receipt or bill/)).toBeInTheDocument();
    expect(screen.getByText(/JPG, PNG, or PDF/)).toBeInTheDocument();
  });
});
