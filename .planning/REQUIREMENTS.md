# Requirements: MVP - The Interview (AI Carbon Coach)

This document outlines the requirements for the Minimum Viable Product (MVP), which focuses on "The Interview" feature.

## 1. User Goal

The user wants to understand their personal carbon footprint through a guided, conversational experience and receive a personalized, beautifully formatted summary of the results.

## 2. Core User Flow

1.  **Landing Page:** A user visits the site. The page presents a single, clear call-to-action: "Begin Your Interview." The design is calm and minimal, with soft colors and generous whitespace.
2.  **The Conversation:**
    *   The user is introduced to the AI Carbon Coach, which asks questions gently and clearly.
    *   The AI asks a series of questions one at a time, in a calm, unhurried manner.
    *   Questions cover key carbon-impact areas: commute, travel, home energy, and diet. The initial question set will be predefined.
    *   The interface is purely conversational (chat-like), styled with a clean, minimal aesthetic. No complex UI elements.
3.  **Profile Generation:**
    *   Once the interview is complete, the system calculates a high-level carbon footprint estimate.
    *   The user's answers and the resulting footprint are formatted into a clear, beautiful summary page.
4.  **The Summary (Output):**
    *   The output is a single, shareable web page.
    *   It will feature a clear headline with the user's total footprint.
    *   The footprint breakdown is presented in a clean, organized layout with category comparisons.
    *   It will include key insights extracted from the user's answers.

## 3. Technical & Design Requirements

*   **Frontend:** A Next.js application.
    *   A single page for the interview/chat interface.
    *   A dynamically generated page for the final output "Edition".
*   **Backend:** A Python service.
    *   An API endpoint to handle the conversational logic with the AI coach.
    *   This service will manage the conversation state and call the Google Cloud AI API.
    *   A simple carbon calculation model based on the user's answers.
*   **Database:** PostgreSQL.
    *   A simple schema to store the conversation history and the final carbon profile for a user session. No user accounts in the MVP.
*   **AI:** Google Cloud AI (Gemini).
    *   The model will be prompted to act as a calm, curious journalist. The conversation flow will be guided by the application logic.
*   **Design:**
    *   **Aesthetic:** Calm and cozy — soft, warm, minimal. Inspired by quiet interfaces like Claude.ai and Zen Browser.
    *   **Typography:** Clean sans-serif for all text (system fonts or Inter). Generous line heights for readability.
    *   **Color:** Warm off-white background, soft sage/muted green accents, warm grays for text. No harsh contrasts.
    *   **Layout:** Centered content, max-width containers, generous whitespace. Rounded corners, subtle shadows. No harsh borders.

## 4. Out of Scope for MVP

*   User accounts and persistence. The interview is ephemeral.
*   "The Ledger" (receipt scanning).
*   Detailed, scientifically accurate carbon calculations. The MVP is an estimate to engage the user.
*   Complex animations or interactions. The focus is on stillness and reading.
