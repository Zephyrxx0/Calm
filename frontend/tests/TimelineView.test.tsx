import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { StrictMode } from "react";

const mockUseAuth = vi.fn();
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => mockUseAuth(),
}));

import { TimelineView } from "@/components/daily/TimelineView";

describe("TimelineView (rewrite)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global as any).IntersectionObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  });

  it("renders items even under React StrictMode (double-invoke)", async () => {
    mockUseAuth.mockReturnValue({
      user: { uid: "u1", getIdToken: vi.fn().mockResolvedValue("tok") },
      loading: false,
    });

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          items: [
            { id: 131, activity_type: "quick_log", consciousness_score: 5, metadata: { transport: "bicycle", meal: "vegan", energy: "low", notes: "" }, logged_at: "2026-06-21T16:14:24Z" },
            { id: 1,   activity_type: "legacy_entry", consciousness_score: 3, metadata: { transport: "car", energy: "medium" }, logged_at: "2026-06-20T18:24:23Z" },
          ],
          next_cursor: null,
        }),
    }) as unknown as typeof fetch;

    render(
      <StrictMode>
        <TimelineView />
      </StrictMode>
    );

    await waitFor(() => {
      expect(screen.getByText(/activity log/i)).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText(/Bicycle/i)).toBeInTheDocument();
    });
  });

  it("refetches with target_date query param when filterDate changes", async () => {
    mockUseAuth.mockReturnValue({
      user: { uid: "u1", getIdToken: vi.fn().mockResolvedValue("tok") },
      loading: false,
    });

    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ items: [], next_cursor: null }),
    });
    global.fetch = fetchSpy as unknown as typeof fetch;

    const { rerender } = render(<TimelineView filterDate={null} />);

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalled();
    });

    // First call has no target_date
    const firstCallUrl = fetchSpy.mock.calls[0][0] as string;
    expect(firstCallUrl).not.toContain("target_date");

    // Now pass a filterDate
    rerender(<TimelineView filterDate="2026-06-21" />);

    await waitFor(() => {
      const calls = fetchSpy.mock.calls.map((c) => c[0] as string);
      expect(calls.some((u) => u.includes("target_date=2026-06-21"))).toBe(true);
    });
  });
});
