import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock react-calendar-heatmap
vi.mock("react-calendar-heatmap", () => ({
  default: function MockCalendarHeatmap(props: any) {
    return (
      <div data-testid="calendar-heatmap">
        CalendarHeatmap: {props.values?.length ?? 0} entries
      </div>
    );
  },
}));

// Mock CSS import
vi.mock("react-calendar-heatmap/dist/styles.css", () => ({}));

// Mock date-fns
vi.mock("date-fns", async () => {
  const actual = await vi.importActual("date-fns") as any;
  return {
    ...actual,
    subDays: vi.fn(() => new Date()),
    format: vi.fn(() => "Jan 1, 2026"),
    parseISO: vi.fn((s) => new Date(s)),
    startOfYear: vi.fn(() => new Date("2026-01-01")),
    endOfYear: vi.fn(() => new Date("2026-12-31")),
  };
});

// Mock useAuth
const mockUseAuth = vi.fn();
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => mockUseAuth(),
}));

import { ContributionGraph } from "@/components/daily/ContributionGraph";

describe("ContributionGraph", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it("renders CalendarHeatmap with streak data", async () => {
    mockUseAuth.mockReturnValue({
      user: {
        uid: "test-uid",
        getIdToken: vi.fn().mockResolvedValue("fake-token"),
      },
      loading: false,
    });

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          current_streak: 7,
          longest_streak: 15,
          total_days: 42,
          entries: [
            { date: "2026-01-15", carbon_consciousness: 3 },
            { date: "2026-01-16", carbon_consciousness: 5 },
          ],
        }),
    });

    render(<ContributionGraph />);

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByTestId("calendar-heatmap")).toBeInTheDocument();
    });

    // Should show CalendarHeatmap with 2 entries
    expect(screen.getByText(/2 entries/)).toBeInTheDocument();
  });

  it("displays streak stats after loading", async () => {
    mockUseAuth.mockReturnValue({
      user: {
        uid: "test-uid",
        getIdToken: vi.fn().mockResolvedValue("fake-token"),
      },
      loading: false,
    });

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          current_streak: 7,
          longest_streak: 15,
          total_days: 42,
          entries: [
            { date: "2026-01-15", carbon_consciousness: 3 },
          ],
        }),
    });

    render(<ContributionGraph />);

    await waitFor(() => {
      expect(screen.getByText("7")).toBeInTheDocument();
    });

    expect(screen.getByText("15")).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
    expect(screen.getByText(/current streak/i)).toBeInTheDocument();
    expect(screen.getByText(/longest streak/i)).toBeInTheDocument();
    expect(screen.getByText(/total days/i)).toBeInTheDocument();
  });

  it("fetches with Authorization header", async () => {
    const mockGetIdToken = vi.fn().mockResolvedValue("fake-token");
    mockUseAuth.mockReturnValue({
      user: {
        uid: "test-uid",
        getIdToken: mockGetIdToken,
      },
      loading: false,
    });

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          current_streak: 0,
          longest_streak: 0,
          total_days: 0,
          entries: [],
        }),
    });

    render(<ContributionGraph />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/daily/streak", {
        headers: {
          Authorization: "Bearer fake-token",
        },
      });
    });
  });

  it("shows empty state when no user is logged in", () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
    });

    render(<ContributionGraph />);

    expect(screen.getByText(/start your carbon journey/i)).toBeInTheDocument();
    expect(
      screen.getByText(/track your first day/i)
    ).toBeInTheDocument();
  });

  it("shows loading state while fetching", () => {
    mockUseAuth.mockReturnValue({
      user: {
        uid: "test-uid",
        getIdToken: vi.fn().mockResolvedValue("fake-token"),
      },
      loading: false,
    });

    // Never resolve fetch to keep loading state
    global.fetch = vi.fn().mockImplementation(() => new Promise(() => {}));

    render(<ContributionGraph />);

    expect(screen.getByText(/loading your carbon story/i)).toBeInTheDocument();
  });

  it("shows loading state during auth initialization", () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: true,
    });

    render(<ContributionGraph />);

    expect(screen.getByText(/loading your carbon story/i)).toBeInTheDocument();
  });

  it("shows error state on fetch failure", async () => {
    mockUseAuth.mockReturnValue({
      user: {
        uid: "test-uid",
        getIdToken: vi.fn().mockResolvedValue("fake-token"),
      },
      loading: false,
    });

    global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));

    render(<ContributionGraph />);

    await waitFor(() => {
      expect(screen.getByText(/Network error/)).toBeInTheDocument();
    });
  });
});
