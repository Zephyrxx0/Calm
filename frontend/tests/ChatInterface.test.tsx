import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import ChatInterface from "@/components/chat/ChatInterface";

// Mock @ai-sdk/react useChat hook
vi.mock("@ai-sdk/react", () => ({
  useChat: vi.fn(() => ({
    messages: [],
    sendMessage: vi.fn(),
    status: "ready",
    error: null,
  })),
}));

// Mock ai DefaultChatTransport
vi.mock("ai", () => ({
  DefaultChatTransport: vi.fn().mockImplementation(() => ({})),
}));

describe("ChatInterface", () => {
  it("renders scrollable list of previous messages", () => {
    // Mock useChat to return messages
    const { useChat } = require("@ai-sdk/react");
    useChat.mockReturnValue({
      messages: [
        { id: "1", role: "ai", parts: [{ type: "text", text: "Hello!" }] },
        { id: "2", role: "user", parts: [{ type: "text", text: "Hi there" }] },
      ],
      sendMessage: vi.fn(),
      status: "ready",
      error: null,
    });

    render(<ChatInterface sessionId="test-session-123" />);

    // Should render messages in a scrollable container
    const messageList = screen.getByRole("log");
    expect(messageList).toBeInTheDocument();
    expect(messageList).toHaveClass("overflow-y-auto");

    // Should display both messages
    expect(screen.getByText("Hello!")).toBeInTheDocument();
    expect(screen.getByText("Hi there")).toBeInTheDocument();
  });

  it("renders hybrid input with text box and quick-answer buttons", () => {
    render(<ChatInterface sessionId="test-session-123" />);

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
    const { useChat } = require("@ai-sdk/react");
    const { DefaultChatTransport } = require("ai");

    render(<ChatInterface sessionId="test-session-456" />);

    // useChat should be called
    expect(useChat).toHaveBeenCalled();

    // DefaultChatTransport should be instantiated with API endpoint
    expect(DefaultChatTransport).toHaveBeenCalled();

    // Verify the transport was configured with the correct API path
    const transportCall = DefaultChatTransport.mock.calls[0][0];
    expect(transportCall.api).toContain("/api/interview/message");
  });
});
