import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { createRef } from "react";
import { toPng } from "html-to-image";
import NewspaperLayout, {
  type NewspaperLayoutHandle,
  type NewspaperLayoutProps,
} from "@/components/broadsheet/NewspaperLayout";

vi.mock("html-to-image", () => ({
  toPng: vi.fn().mockResolvedValue("data:image/png;base64,mock"),
}));

vi.mock("jspdf", () => ({
  jsPDF: vi.fn().mockImplementation(() => ({
    internal: {
      pageSize: { getWidth: () => 279.4, getHeight: () => 431.8 },
    },
    addImage: vi.fn(),
    save: vi.fn(),
  })),
}));

const originalCSS = { ...CSS };

function mockMultiColumn(supported: boolean) {
  globalThis.CSS = {
    ...originalCSS,
    supports: vi.fn((prop: string) => {
      if (prop === "columns") return supported;
      return true;
    }),
  } as any;
}

function makeDefaultProps(): NewspaperLayoutProps {
  return {
    title: "Your Carbon Summary",
    subtitle: "Your Carbon Story, in Print",
    footprint: 5200,
    categoryBreakdown: [
      { name: "Transport", value: 2500 },
      { name: "Diet", value: 1500 },
      { name: "Energy", value: 1200 },
    ],
    streakData: { currentStreak: 7, longestStreak: 14, totalDays: 42 },
    pullQuotes: [{ text: "I drive a lot for work", source: "Interview" }],
  };
}

function getStyleTexts(): string {
  return Array.from(document.querySelectorAll("style"))
    .map((s) => s.textContent ?? "")
    .join(" ");
}

describe("NewspaperLayout — SVG filter rendering", () => {
  beforeEach(() => mockMultiColumn(true));
  afterEach(() => { globalThis.CSS = originalCSS; });

  it("renders a hidden SVG element with filter definitions", () => {
    const { container } = render(<NewspaperLayout {...makeDefaultProps()} />);
    const svg = container.querySelector("svg[aria-hidden='true']");
    expect(svg).toBeTruthy();
    expect(svg?.getAttribute("width")).toBe("0");
    expect(svg?.getAttribute("height")).toBe("0");
  });

  it("defines the paper-grain filter with feTurbulence", () => {
    const { container } = render(<NewspaperLayout {...makeDefaultProps()} />);
    const filter = container.querySelector("filter#paper-grain");
    expect(filter).toBeTruthy();
    expect(filter?.querySelector("feTurbulence")).toBeTruthy();
  });

  it("defines the halftone-img filter with feColorMatrix", () => {
    const { container } = render(<NewspaperLayout {...makeDefaultProps()} />);
    const filter = container.querySelector("filter#halftone-img");
    expect(filter).toBeTruthy();
    expect(filter?.querySelector("feColorMatrix")).toBeTruthy();
  });

  it("defines the ink-bleed filter with feGaussianBlur", () => {
    const { container } = render(<NewspaperLayout {...makeDefaultProps()} />);
    const filter = container.querySelector("filter#ink-bleed");
    expect(filter).toBeTruthy();
    expect(filter?.querySelector("feGaussianBlur")).toBeTruthy();
    expect(filter?.querySelector("feComponentTransfer")).toBeTruthy();
  });

  it("defines the edge-wear filter with feDisplacementMap", () => {
    const { container } = render(<NewspaperLayout {...makeDefaultProps()} />);
    const filter = container.querySelector("filter#edge-wear");
    expect(filter).toBeTruthy();
    expect(filter?.querySelector("feDisplacementMap")).toBeTruthy();
  });
});

describe("NewspaperLayout — 5-column layout", () => {
  beforeEach(() => mockMultiColumn(true));
  afterEach(() => { globalThis.CSS = originalCSS; });

  it("uses column-count: 5 in styles", () => {
    render(<NewspaperLayout {...makeDefaultProps()} />);
    expect(getStyleTexts()).toContain("column-count: 5");
  });

  it("maintains column-gap: 0.5in", () => {
    render(<NewspaperLayout {...makeDefaultProps()} />);
    expect(getStyleTexts()).toContain("column-gap: 0.5in");
  });

  it("has cream-to-ivory gradient background", () => {
    render(<NewspaperLayout {...makeDefaultProps()} />);
    expect(getStyleTexts()).toContain("linear-gradient(180deg, #FAFAF8 0%, #F5F0E8 100%)");
  });

  it("renders fold crease element", () => {
    const { container } = render(<NewspaperLayout {...makeDefaultProps()} />);
    const fold = container.querySelector(".newspaper-fold");
    expect(fold).toBeTruthy();
    expect(fold?.getAttribute("aria-hidden")).toBe("true");
  });

  it("applies ink bleed filter to masthead title in CSS", () => {
    render(<NewspaperLayout {...makeDefaultProps()} />);
    expect(getStyleTexts()).toMatch(/\.newspaper-masthead-title[^}]*filter:\s*url\(#ink-bleed\)/);
  });
});

describe("NewspaperLayout — adaptive layout", () => {
  beforeEach(() => mockMultiColumn(true));
  afterEach(() => { globalThis.CSS = originalCSS; });

  it("renders streak section when streakData is provided", () => {
    render(<NewspaperLayout {...makeDefaultProps()} />);
    expect(screen.getByText("Your Carbon Streak")).toBeTruthy();
  });

  it("omits streak section when streakData is null", () => {
    render(<NewspaperLayout {...{ ...makeDefaultProps(), streakData: null }} />);
    expect(screen.queryByText("Your Carbon Streak")).toBeNull();
  });

  it("omits pull quotes section when pullQuotes is undefined", () => {
    render(<NewspaperLayout {...{ ...makeDefaultProps(), pullQuotes: undefined }} />);
    expect(screen.queryByText("From Your Interview")).toBeNull();
  });

  it("omits category section when categoryBreakdown is empty", () => {
    render(<NewspaperLayout {...{ ...makeDefaultProps(), categoryBreakdown: [] }} />);
    expect(screen.queryByText("Category Breakdown")).toBeNull();
  });

  it("renders all sections when all data is provided", () => {
    render(<NewspaperLayout {...makeDefaultProps()} />);
    expect(screen.getByText("The Daily Calm")).toBeTruthy();
    expect(screen.getByText("Category Breakdown")).toBeTruthy();
    expect(screen.getByText("Your Carbon Streak")).toBeTruthy();
    expect(screen.getByText("From Your Interview")).toBeTruthy();
  });
});

describe("NewspaperLayout — font rendering", () => {
  beforeEach(() => mockMultiColumn(true));
  afterEach(() => { globalThis.CSS = originalCSS; });

  it("uses --font-newspaper-body CSS variable for body text", () => {
    render(<NewspaperLayout {...makeDefaultProps()} />);
    expect(getStyleTexts()).toContain("var(--font-newspaper-body)");
  });

  it("uses --font-newspaper-headline CSS variable for headlines", () => {
    render(<NewspaperLayout {...makeDefaultProps()} />);
    expect(getStyleTexts()).toContain("var(--font-newspaper-headline)");
  });
});

describe("NewspaperLayout — export with SVG filters", () => {
  beforeEach(() => mockMultiColumn(true));
  afterEach(() => { globalThis.CSS = originalCSS; vi.clearAllMocks(); });

  it("calls html-to-image toPng during exportAsPNG", async () => {
    const ref = createRef<NewspaperLayoutHandle>();
    render(<NewspaperLayout ref={ref} {...makeDefaultProps()} />);
    await act(async () => { await ref.current?.exportAsPNG(); });
    expect(toPng).toHaveBeenCalled();
  });

  it("passes correct toPng options with cream background", async () => {
    const ref = createRef<NewspaperLayoutHandle>();
    render(<NewspaperLayout ref={ref} {...makeDefaultProps()} />);
    await act(async () => { await ref.current?.exportAsPNG(); });
    expect(toPng).toHaveBeenCalledWith(
      expect.any(HTMLElement),
      expect.objectContaining({ quality: 0.95, backgroundColor: "#FAFAF8", pixelRatio: 2 }),
    );
  });

  it("PDF export uses landscape [279.4, 431.8] mm format", async () => {
    const ref = createRef<NewspaperLayoutHandle>();
    render(<NewspaperLayout ref={ref} {...makeDefaultProps()} />);
    await act(async () => { await ref.current?.exportAsPDF(); });
    const { jsPDF } = await import("jspdf");
    expect(jsPDF).toHaveBeenCalledWith(
      expect.objectContaining({ orientation: "landscape", unit: "mm", format: [279.4, 431.8] }),
    );
  });
});

describe("NewspaperLayout — masthead content", () => {
  beforeEach(() => mockMultiColumn(true));
  afterEach(() => { globalThis.CSS = originalCSS; });

  it("renders masthead title 'The Daily Calm'", () => {
    render(<NewspaperLayout {...makeDefaultProps()} />);
    expect(screen.getByText("The Daily Calm")).toBeTruthy();
  });

  it("renders masthead subtitle when prop is provided", () => {
    const { container } = render(<NewspaperLayout {...makeDefaultProps()} />);
    const subtitle = container.querySelector(".newspaper-masthead-subtitle");
    expect(subtitle).toBeTruthy();
    expect(subtitle?.textContent).toBe("Your Carbon Story, in Print");
  });

  it("does not render subtitle when prop is undefined", () => {
    const { container } = render(<NewspaperLayout {...{ ...makeDefaultProps(), subtitle: undefined }} />);
    expect(container.querySelector(".newspaper-masthead-subtitle")).toBeNull();
  });
});

describe("NewspaperLayout — data source variants", () => {
  beforeEach(() => mockMultiColumn(true));
  afterEach(() => { globalThis.CSS = originalCSS; });

  it("renders with edition data (full: categories + streaks + quotes)", () => {
    render(<NewspaperLayout {...makeDefaultProps()} />);
    expect(screen.getByText("Category Breakdown")).toBeTruthy();
    expect(screen.getByText("Your Carbon Streak")).toBeTruthy();
    expect(screen.getByText("From Your Interview")).toBeTruthy();
  });

  it("renders with daily data (streaks only)", () => {
    render(<NewspaperLayout {...{ ...makeDefaultProps(), categoryBreakdown: [], pullQuotes: undefined }} />);
    expect(screen.queryByText("Category Breakdown")).toBeNull();
    expect(screen.getByText("Your Carbon Streak")).toBeTruthy();
    expect(screen.queryByText("From Your Interview")).toBeNull();
  });

  it("renders with snapshot data (categories only)", () => {
    render(<NewspaperLayout {...{ ...makeDefaultProps(), streakData: null, pullQuotes: undefined }} />);
    expect(screen.getByText("Category Breakdown")).toBeTruthy();
    expect(screen.queryByText("Your Carbon Streak")).toBeNull();
    expect(screen.queryByText("From Your Interview")).toBeNull();
  });
});
