# Requirements: MVP - The Interview (AI Carbon Coach)

This document outlines the requirements for the Minimum Viable Product (MVP), which focuses on "The Interview" feature.

## 1. User Goal

The user wants to understand their personal carbon footprint through a guided, conversational experience and receive a personalized, beautifully formatted summary of the results.

## 2. Core User Flow

1.  **Landing Page:** A user visits the site. The page presents a single, clear call-to-action: "Begin Your Interview." The design will evoke a vintage newspaper's front page, with a strong headline and minimal other elements.
2.  **The Conversation:**
    *   The user is introduced to the AI Carbon Coach, which acts as a "journalist."
    *   The AI asks a series of questions one at a time, in a calm, unhurried manner.
    *   Questions cover key carbon-impact areas: commute, travel, home energy, and diet. The initial question set will be predefined.
    *   The interface is purely conversational (chat-like), styled with a typographic, minimalist aesthetic. No complex UI elements.
3.  **Profile Generation:**
    *   Once the interview is complete, the system calculates a high-level carbon footprint estimate.
    *   The user's answers and the resulting footprint are formatted into "The Edition" - a single-page, personalized newspaper layout.
4.  **The Edition (Output):**
    *   The output is a single, shareable web page.
    *   It will feature a bold, personalized headline (e.g., "A CONVERSATION WITH [USER'S NAME]: A LOOK AT YOUR CARBON FOOTPRINT").
    *   The user's footprint and a high-level breakdown are presented in a multi-column, typeset layout, mimicking a newspaper article.
    *   It will include one or two "pull quotes" extracted from the user's answers.

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
    *   **Aesthetic:** Vintage Broadsheet, guided by the principles of "Taste Skill."
    *   **Typography:** A classic serif font for headlines and body text (e.g., a web-safe Garamond or a Google Font like Cormorant). Monospace for any "data" or "input" fields if necessary.
    *   **Color:** Strictly monochrome (off-white `#FDFCF7` for the "paper", and a dark grey `#1A1A1A` for "ink").
    *   **Layout:** Strong use of columns, white space, and typographic hierarchy. No traditional UI components like cards or buttons with background colors.

## 4. Out of Scope for MVP

*   User accounts and persistence. The interview is ephemeral.
*   "The Ledger" (receipt scanning).
*   Detailed, scientifically accurate carbon calculations. The MVP is an estimate to engage the user.
*   Complex animations or interactions. The focus is on stillness and reading.
