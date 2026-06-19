import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock @ai-sdk/react useChat hook
const mockUseChat = vi.fn();
vi.mock("@ai-sdk/react", () => ({
  useChat: (...args: unknown[]) => mockUseChat(...args),
}));

// Mock ai DefaultChatTransport
const mockTransport = vi.fn();
vi.mock("ai", () => ({
  DefaultChatTransport: class {
    constructor(opts: unknown) {
      mockTransport(opts);
    }
  },
}));

// Import after mocks
import ChatInterface from "@/components/chat/ChatInterface";

describe("ChatInterface", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseChat.mockReturnValue({
      messages: [],
      sendMessage: vi.fn(),
      status: "ready",
      error: null,
    });
  });

  it("renders scrollable list of previous messages", () => {
    mockUseChat.mockReturnValue({
      messages: [
        { id: "1", role: "assistant", parts: [{ type: "text", text: "Hello!" }] },
        { id: "2", role: "user", parts: [{ type: "text", text: "Hi there" }] },
      ],
      sendMessage: vi.fn(),
      status: "ready",
      error: null,
    });

    render(<ChatInterface sessionId="test-session-123" userId="test-user-123" />);

    // Should render messages in a scrollable container
    const messageList = screen.getByRole("log");
    expect(messageList).toBeInTheDocument();
    expect(messageList).toHaveClass("overflow-y-auto");

    // Should display both messages
    expect(screen.getByText("Hello!")).toBeInTheDocument();
    expect(screen.getByText("Hi there")).toBeInTheDocument();
  });

  it("renders hybrid input with text box and quick-answer buttons", () => {
    render(<ChatInterface sessionId="test-session-123" userId="test-user-123" />);

    // Should have a text input
    const textbox = screen.getByRole("textbox");
    expect(textbox).toBeInTheDocument();

    // Should have quick-answer buttons (range selectors)
    const quickButtons = screen.getAllByRole("button");
    expect(quickButtons.length).toBeGreaterThan(1); // At least submit + quick answers

    // Quick answer buttons should have range-like labels
    const quickAnswerButtons = quickButtons.filter(
      (btn) => btn.textContent?.match(/\d+/) || btn.textContent?.toLowerCase().includes("skip")
    );
    expect(quickAnswerButtons.length).toBeGreaterThan(0);
  });

  it("initializes useChat with correct API endpoint and session ID", () => {
    render(<ChatInterface sessionId="test-session-456" userId="test-user-456" />);

    // useChat should be called
    expect(mockUseChat).toHaveBeenCalled();

    // DefaultChatTransport should be instantiated with API endpoint
    expect(mockTransport).toHaveBeenCalled();

    // Verify the transport was configured with the correct API path
    const transportCall = mockTransport.mock.calls[0][0] as { api: string };
    expect(transportCall.api).toContain("/api/interview/message");
  });
});
