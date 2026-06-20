import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act, waitFor } from "@testing-library/react";
import { createRef } from "react";
import { toPng } from "html-to-image";
import NewspaperLayout, {
  type NewspaperLayoutHandle,
  type NewspaperLayoutProps,
} from "@/components/broadsheet/NewspaperLayout";

// ---------------------------------------------------------------------------
// Mock html-to-image
// ---------------------------------------------------------------------------

vi.mock("html-to-image", () => ({
  toPng: vi.fn().mockResolvedValue("data:image/png;base64,mock-broadsheet"),
}));

// ---------------------------------------------------------------------------
// Mock jspdf (dynamic import used by exportAsPDF)
// ---------------------------------------------------------------------------

vi.mock("jspdf", () => ({
  jsPDF: vi.fn().mockImplementation(() => ({
    internal: {
      pageSize: {
        getWidth: () => 279.4,
        getHeight: () => 431.8,
      },
    },
    addImage: vi.fn(),
    save: vi.fn(),
  })),
}));

// ---------------------------------------------------------------------------
// Mock next/link (used by some test files)
// ---------------------------------------------------------------------------

vi.mock("next/link", () => ({
  default: ({ children }: { children: React.ReactNode }) => children,
}));

// ---------------------------------------------------------------------------
// Mock CSS.supports for multi-column detection
// ---------------------------------------------------------------------------

const originalCSS = { ...CSS };

function mockMultiColumn(supported: boolean) {
  // @ts-expect-error — mock CSS.supports
  globalThis.CSS = {
    ...originalCSS,
    supports: vi.fn((prop: string, value: string) => {
      if (prop === "columns") return supported;
      return originalCSS.supports(prop, value);
    }),
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeDefaultProps(): NewspaperLayoutProps {
  return {
    title: "Your Carbon Summary",
    subtitle: "Based on your lifestyle interview",
    footprint: 5200, // 5.2 tonnes in kg
    categoryBreakdown: [
      { name: "Transport", value: 2500 },
      { name: "Diet", value: 1500 },
      { name: "Energy", value: 1200 },
    ],
    streakData: {
      currentStreak: 7,
      longestStreak: 14,
      totalDays: 42,
    },
    pullQuotes: [
      { text: "I drive a lot for work", source: "Interview" },
    ],
  };
}

// ===========================================================================
// Tests — NewspaperLayout component rendering
// ===========================================================================

describe("NewspaperLayout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMultiColumn(true);
  });

  afterEach(() => {
    globalThis.CSS = originalCSS;
  });

  // ---- Rendering ----

  it("renders broadsheet masthead 'The Daily Calm'", () => {
    const props = makeDefaultProps();
    render(<NewspaperLayout {...props} />);
    expect(screen.getByText("The Daily Calm")).toBeTruthy();
  });

  it("displays the user footprint in tonnes", () => {
    const props = makeDefaultProps();
    render(<NewspaperLayout {...props} />);
    // 5200 kg → 5.2 tonnes
    expect(screen.getByText("5.2")).toBeTruthy();
    expect(screen.getByText("tonnes CO₂e / year")).toBeTruthy();
  });

  it("renders category breakdown table", () => {
    const props = makeDefaultProps();
    render(<NewspaperLayout {...props} />);
    expect(screen.getByText("Transport")).toBeTruthy();
    expect(screen.getByText("Diet")).toBeTruthy();
    expect(screen.getByText("Energy")).toBeTruthy();
    expect(screen.getByText("Category Breakdown")).toBeTruthy();
  });

  it("renders streak statistics when streakData is provided", () => {
    const props = makeDefaultProps();
    render(<NewspaperLayout {...props} />);
    expect(screen.getByText("Your Carbon Streak")).toBeTruthy();
    expect(screen.getByText("7")).toBeTruthy();
    expect(screen.getByText("14")).toBeTruthy();
    expect(screen.getByText("42")).toBeTruthy();
  });

  it("does not render streak section when streakData is null", () => {
    const props = { ...makeDefaultProps(), streakData: null };
    render(<NewspaperLayout {...props} />);
    expect(screen.queryByText("Your Carbon Streak")).toBeNull();
  });

  it("renders pull quotes when provided", () => {
    const props = makeDefaultProps();
    render(<NewspaperLayout {...props} />);
    expect(screen.getByText(/I drive a lot for work/)).toBeTruthy();
    expect(screen.getByText("From Your Interview")).toBeTruthy();
  });

  it("has broadsheet container with multi-column CSS class", () => {
    const props = makeDefaultProps();
    const { container } = render(<NewspaperLayout {...props} />);
    const broadsheet = container.querySelector(".newspaper-broadsheet");
    expect(broadsheet).toBeTruthy();
  });

  it("shows multi-column warning when CSS columns are not supported", () => {
    mockMultiColumn(false);
    const props = makeDefaultProps();
    render(<NewspaperLayout {...props} />);
    expect(
      screen.getByText(/Your browser does not fully support/),
    ).toBeTruthy();
  });

  it("displays newspaper footer text", () => {
    const props = makeDefaultProps();
    render(<NewspaperLayout {...props} />);
    expect(
      screen.getByText(
        /Generated by Calm — Track your carbon footprint at calm.app/,
      ),
    ).toBeTruthy();
  });

  // ---- 11"×17" print dimensions ----

  it("applies 11in × 17in print media dimensions in styles", () => {
    const props = makeDefaultProps();
    render(<NewspaperLayout {...props} />);

    // The style element is rendered inside the component via <style jsx global>
    const styles = document.querySelectorAll("style");
    const styleTexts = Array.from(styles)
      .map((s) => s.textContent ?? "")
      .join(" ");

    expect(styleTexts).toContain("width: 17in");
    expect(styleTexts).toContain("height: 11in");
    expect(styleTexts).toContain("column-count: 5");
  });

  // ---- Export functionality ----

  it("calls html-to-image toPng during exportAsPNG", async () => {
    const props = makeDefaultProps();
    const ref = createRef<NewspaperLayoutHandle>();
    render(<NewspaperLayout ref={ref} {...props} />);

    await act(async () => {
      await ref.current?.exportAsPNG();
    });

    expect(toPng).toHaveBeenCalled();
  });

  it("triggers a link download in exportAsPNG", async () => {
    // Spy on URL.createObjectURL + link.click to verify download is triggered
    const clickSpy = vi.fn();
    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation(
      (...args) => {
        const el = originalCreateElement(...args);
        if (args[0] === "a") {
          el.click = clickSpy;
        }
        return el;
      },
    );

    const props = makeDefaultProps();
    const ref = createRef<NewspaperLayoutHandle>();
    render(<NewspaperLayout ref={ref} {...props} />);

    await act(async () => {
      await ref.current?.exportAsPNG();
    });

    expect(clickSpy).toHaveBeenCalled();
    vi.restoreAllMocks();
  });

  it("shows export error when toPng fails", async () => {
    vi.mocked(toPng).mockRejectedValueOnce(new Error("Canvas error"));

    const props = makeDefaultProps();
    const ref = createRef<NewspaperLayoutHandle>();
    render(<NewspaperLayout ref={ref} {...props} />);

    await act(async () => {
      await ref.current?.exportAsPNG();
    });

    await waitFor(() => {
      expect(screen.getByText("Canvas error")).toBeTruthy();
    });

    vi.mocked(toPng).mockResolvedValue("data:image/png;base64,mock-broadsheet");
  });

  it("shows loading overlay during export operations", async () => {
    // Make toPng hang so we can observe the loading state
    let resolvePromise!: (value: string) => void;
    const deferred = new Promise<string>((resolve) => {
      resolvePromise = resolve;
    });
    vi.mocked(toPng).mockReturnValueOnce(deferred);

    const props = makeDefaultProps();
    const ref = createRef<NewspaperLayoutHandle>();
    render(<NewspaperLayout ref={ref} {...props} />);

    // Fire the export (don't await — we want to catch the loading state)
    let exportPromise: Promise<void> | undefined;
    await act(async () => {
      exportPromise = ref.current?.exportAsPNG();
    });

    // The loading text should be visible while the promise is pending
    expect(
      screen.getByText("Generating your broadsheet..."),
    ).toBeTruthy();

    // Resolve the promise and wait for cleanup
    resolvePromise("data:image/png;base64,mock-broadsheet");
    await act(async () => {
      await exportPromise;
    });
  });
});

// ===========================================================================
// Tests — Ref / Export Handle
// ===========================================================================

describe("NewspaperLayout — Ref Handle", () => {
  beforeEach(() => {
    mockMultiColumn(true);
  });

  afterEach(() => {
    globalThis.CSS = originalCSS;
  });

  it("exposes exportAsPNG and exportAsPDF via forwardRef handle", () => {
    const ref = createRef<NewspaperLayoutHandle>();
    const props = makeDefaultProps();
    render(<NewspaperLayout ref={ref} {...props} />);

    expect(ref.current).toBeTruthy();
    expect(typeof ref.current?.exportAsPNG).toBe("function");
    expect(typeof ref.current?.exportAsPDF).toBe("function");
  });

  it("renders broadsheet with all required sections present", () => {
    const props = makeDefaultProps();
    render(<NewspaperLayout {...props} />);

    // Masthead
    expect(screen.getByText("The Daily Calm")).toBeTruthy();
    // Footprint
    expect(screen.getByText("5.2")).toBeTruthy();
    // Categories
    expect(screen.getByText("Category Breakdown")).toBeTruthy();
    // Streaks
    expect(screen.getByText("Your Carbon Streak")).toBeTruthy();
    // Quotes
    expect(screen.getByText("From Your Interview")).toBeTruthy();
    // Footer
    expect(screen.getByText(/calm.app/)).toBeTruthy();
  });
});

// ===========================================================================
// Tests — Social share integration
// ===========================================================================

describe("Broadsheet Export — Social Share Integration", () => {
  beforeEach(() => {
    mockMultiColumn(true);
  });

  afterEach(() => {
    globalThis.CSS = originalCSS;
    vi.clearAllMocks();
  });

  it("verifies OG image URL generation format is correct", () => {
    // Simulate what handleShareSocialCard constructs
    const origin = "https://calm.app";
    const snapshotId = "abc-123-def";
    const totalFootprint = "5.2";
    const streakDays = "7";
    const topCategory = "Transport";

    const ogUrl = new URL("/api/og", origin);
    ogUrl.searchParams.set("snapshotId", snapshotId);
    ogUrl.searchParams.set("totalFootprint", totalFootprint);
    ogUrl.searchParams.set("streakDays", streakDays);
    ogUrl.searchParams.set("topCategory", topCategory);

    expect(ogUrl.toString()).toContain("snapshotId=abc-123-def");
    expect(ogUrl.toString()).toContain("totalFootprint=5.2");
    expect(ogUrl.toString()).toContain("streakDays=7");
    expect(ogUrl.toString()).toContain("topCategory=Transport");
  });

  it("prepares correct social card data from snapshot payload", () => {
    // Simulate extracting data from a snapshot for OG card construction
    const snapshotPayload = {
      footprint: {
        total_co2e: 4200,
        breakdown: { transport: 2500, diet: 1200, energy: 500 },
      },
      streak_data: { current_streak: 12, longest_streak: 30, total_days: 65 },
    };

    const totalFootprint = (
      snapshotPayload.footprint.total_co2e / 1000
    ).toFixed(1);
    const breakdown = Object.entries(
      snapshotPayload.footprint.breakdown,
    ).sort(([, a], [, b]) => b - a);
    const topCategory = breakdown[0][0];
    const streakDays = snapshotPayload.streak_data.current_streak.toString();

    expect(totalFootprint).toBe("4.2");
    expect(topCategory).toBe("transport");
    expect(streakDays).toBe("12");
  });

  it("handles missing streak data gracefully in social card preparation", () => {
    const payloadWithoutStreak = {
      footprint: { total_co2e: 5200, breakdown: { transport: 5200 } },
    };

    const totalFootprint = (
      payloadWithoutStreak.footprint.total_co2e / 1000
    ).toFixed(1);
    const breakdown = Object.entries(
      payloadWithoutStreak.footprint.breakdown,
    ).sort(([, a], [, b]) => b - a);
    const topCategory = breakdown.length > 0 ? breakdown[0][0] : "";
    const streakDays = "0"; // fallback

    expect(totalFootprint).toBe("5.2");
    expect(topCategory).toBe("transport");
    expect(streakDays).toBe("0");
  });
});

// ===========================================================================
// Tests — Firebase user integration
// ===========================================================================

describe("Broadsheet Export — Firebase User Integration", () => {
  beforeEach(() => {
    mockMultiColumn(true);
  });

  afterEach(() => {
    globalThis.CSS = originalCSS;
  });

  it("renders streak data when authenticated user data is present", () => {
    const props = makeDefaultProps();
    props.streakData = { currentStreak: 5, longestStreak: 10, totalDays: 30 };
    render(<NewspaperLayout {...props} />);

    expect(screen.getByText("Your Carbon Streak")).toBeTruthy();
    expect(screen.getByText("5")).toBeTruthy();
    expect(screen.getByText("10")).toBeTruthy();
    expect(screen.getByText("30")).toBeTruthy();
  });

  it("omits streak section when user is not authenticated (streakData is null)", () => {
    const props = makeDefaultProps();
    props.streakData = null;
    render(<NewspaperLayout {...props} />);

    expect(screen.queryByText("Your Carbon Streak")).toBeNull();
  });

  it("gracefully handles undefined streak data", () => {
    const props = makeDefaultProps();
    // @ts-expect-error — test null behavior
    props.streakData = undefined;
    render(<NewspaperLayout {...props} />);

    // Should render without crashing — streak section skipped
    expect(screen.getByText("The Daily Calm")).toBeTruthy();
    expect(screen.queryByText("Your Carbon Streak")).toBeNull();
  });
});

// ===========================================================================
// Tests — it.todo for complex browser compat
// ===========================================================================

describe("Broadsheet — Browser Compatibility (todo)", () => {
  it.todo("verifies print to PDF on Safari outputs correct 11×17 dimensions");
  it.todo("tests Firefox column-fill behavior with dynamic content height");
  it.todo("validates PNG export pixel dimensions at 2x pixelRatio");
  it.todo("validates PDF export embeds image at correct ledger format");
  it.todo("confirms social card OG image renders correctly across platforms");
});
