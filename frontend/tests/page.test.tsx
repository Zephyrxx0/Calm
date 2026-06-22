import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import Page from "@/app/page";

// Mock useAuth to simulate logged-in state so CTA renders as a link
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: { uid: "test-user" },
    loading: false,
    signInAnonymous: vi.fn(),
  }),
}));

describe("Landing Page", () => {
  it("renders the project title and a Begin Your Interview CTA link", () => {
    render(<Page />);

    // Should have a heading with the project name
    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toBeInTheDocument();
    expect(heading.textContent).toMatch(/calm/i);

    // Should have a CTA link to begin the interview
    const cta = screen.getByRole("link", { name: /begin your interview/i });
    expect(cta).toBeInTheDocument();
    expect(cta).toHaveAttribute("href", "/interview");
  });
});
