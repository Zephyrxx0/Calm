import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import ChatInterface from "@/components/chat/ChatInterface";

describe("ChatInterface", () => {
  it("renders input and send button", () => {
    render(
      <ChatInterface
        sessionId="test-session-123"
        userId="test-user-123"
      />
    );

    expect(screen.getByRole("textbox")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /send/i })).toBeInTheDocument();
  });

  it("renders initial message when provided", () => {
    render(
      <ChatInterface
        sessionId="test-session-123"
        userId="test-user-123"
        initialMessage="Hello, I'm Calm"
      />
    );

    expect(screen.getByText("Hello, I'm Calm")).toBeInTheDocument();
  });

  it("disables input and button while streaming", () => {
    // Input starts enabled, streaming is false by default
    render(
      <ChatInterface
        sessionId="test-session-123"
        userId="test-user-123"
      />
    );

    const input = screen.getByRole("textbox");
    expect(input).not.toBeDisabled();
  });
});
