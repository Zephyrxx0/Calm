import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { OrganicBarChart, OrganicBarShape, ORGANIC_COLORS } from "@/components/charts/OrganicBar";

describe("OrganicBar Chart", () => {
  it("exports OrganicBarShape and ORGANIC_COLORS", () => {
    expect(OrganicBarShape).toBeDefined();
    expect(ORGANIC_COLORS).toHaveLength(5);
    expect(ORGANIC_COLORS[0]).toBe("#7A8B6F");
  });

  it("renders without crashing with valid data", () => {
    const data = [
      { name: "Transport", value: 2.5 },
      { name: "Diet", value: 1.5 },
      { name: "Energy", value: 1.0 },
    ];
    const { container } = render(<OrganicBarChart data={data} />);
    expect(container.querySelector(".recharts-responsive-container")).toBeTruthy();
  });

  it("applies brand colors from UI-SPEC", () => {
    expect(ORGANIC_COLORS[0]).toBe("#7A8B6F"); // sage green accent
  });
});
