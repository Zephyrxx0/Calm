import "@testing-library/jest-dom/vitest";

// SVG filter elements (feTurbulence, feColorMatrix, feGaussianBlur, feDisplacementMap,
// feComponentTransfer) are defined as DOM elements in NewspaperLayout. jsdom renders
// them as HTMLElements but does not apply visual filter effects. Tests verify element
// presence and attribute values, not visual output.

// Mock scrollIntoView for jsdom
Element.prototype.scrollIntoView = () => {};

// Mock ResizeObserver for shadcn/radix components
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
window.ResizeObserver = ResizeObserverMock as any;

// Mock IntersectionObserver for scroll in view hooks
class IntersectionObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
window.IntersectionObserver = IntersectionObserverMock as any;

// Mock PointerEvent for radix tooltip/select triggers
if (typeof PointerEvent === "undefined") {
  (window as any).PointerEvent = class PointerEvent extends MouseEvent {};
}

// Global Firebase mocks to prevent crashes due to missing config in tests
import { vi } from "vitest";

vi.mock("firebase/app", () => ({
  initializeApp: vi.fn(() => ({})),
}));

vi.mock("firebase/auth", () => ({
  getAuth: vi.fn(() => ({})),
  connectAuthEmulator: vi.fn(),
  onAuthStateChanged: vi.fn((auth, cb) => {
    cb(null);
    return () => {};
  }),
}));

vi.mock("@/lib/firebase", () => ({
  app: {},
  auth: {},
}));
