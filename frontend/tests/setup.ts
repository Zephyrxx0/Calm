import "@testing-library/jest-dom/vitest";

// Mock scrollIntoView for jsdom
Element.prototype.scrollIntoView = () => {};

// Mock ResizeObserver for shadcn/radix components
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
window.ResizeObserver = ResizeObserverMock as any;

// Mock PointerEvent for radix tooltip/select triggers
if (typeof PointerEvent === "undefined") {
  (window as any).PointerEvent = class PointerEvent extends MouseEvent {};
}
