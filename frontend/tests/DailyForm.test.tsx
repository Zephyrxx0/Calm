import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { DailyForm } from "@/components/daily/DailyForm";

// Mock useAuth
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from "@/contexts/AuthContext";

// Helper: fill all 4 form fields
function fillForm() {
  // Transport — click "Walk" label
  fireEvent.click(screen.getByText("Walk"));
  // Meals — open Select and pick option
  fireEvent.click(screen.getByText("Select meals..."));
  // The SelectItem renders text as children within a span; use getAllByText
  const ones = screen.getAllByText("1");
  fireEvent.click(ones[ones.length - 1]);
  // Energy — click "Low"
  fireEvent.click(screen.getByText("Low"));
  // Consciousness — open Select and pick
  fireEvent.click(screen.getByText("Rate 1–5..."));
  const threes = screen.getAllByText(/3 — Moderately/);
  fireEvent.click(threes[threes.length - 1]);
}

describe("DailyForm", () => {
  const mockGetIdToken = vi.fn().mockResolvedValue("fake-token");

  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      user: {
        uid: "test-uid",
        email: "test@example.com",
        getIdToken: mockGetIdToken,
      },
      loading: false,
      isAnonymous: false,
    });
  });

  it("renders all 4 required fields", () => {
    render(<DailyForm />);

    // Transport mode
    expect(screen.getByText("How did you get around today?")).toBeInTheDocument();
    expect(screen.getByText("Walk")).toBeInTheDocument();
    expect(screen.getByText("Car")).toBeInTheDocument();

    // Meals count
    expect(screen.getByText("How many meals did you have?")).toBeInTheDocument();

    // Energy usage
    expect(screen.getByText(/energy use today felt/i)).toBeInTheDocument();
    expect(screen.getByText("Low")).toBeInTheDocument();
    expect(screen.getByText("Medium")).toBeInTheDocument();

    // Carbon consciousness — just check placeholder text
    expect(screen.getByText(/conscious of your carbon impact/i)).toBeInTheDocument();
    expect(screen.getByText("Rate 1–5...")).toBeInTheDocument();
  });

  it("has submit button disabled when form incomplete", () => {
    render(<DailyForm />);
    expect(screen.getByRole("button", { name: /track today/i })).toBeDisabled();
  });

  it("submits form with valid data to /api/daily", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    });
    global.fetch = mockFetch;

    render(<DailyForm />);
    fillForm();

    fireEvent.click(screen.getByRole("button", { name: /track today/i }));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith("/api/daily", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer fake-token",
        },
        body: JSON.stringify({
          transport_mode: "walk",
          meals_count: 1,
          energy_usage: "low",
          carbon_consciousness: 3,
        }),
      });
    });
  });

  it("shows success feedback after submission", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    });

    render(<DailyForm />);
    fillForm();
    fireEvent.click(screen.getByRole("button", { name: /track today/i }));

    await waitFor(() => {
      expect(screen.getByText(/entry saved/i)).toBeInTheDocument();
    });
  });

  it("shows error on duplicate entry (409)", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 409,
      json: () => Promise.resolve({ detail: "Already tracked today" }),
    });

    render(<DailyForm />);
    fillForm();
    fireEvent.click(screen.getByRole("button", { name: /track today/i }));

    await waitFor(() => {
      expect(screen.getByText(/already tracked today/i)).toBeInTheDocument();
    });
  });

  it("shows network error when fetch fails", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));

    render(<DailyForm />);
    fillForm();
    fireEvent.click(screen.getByRole("button", { name: /track today/i }));

    await waitFor(() => {
      expect(screen.getByText(/network error/i)).toBeInTheDocument();
    });
  });
});
