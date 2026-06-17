# Phase 2: The Ledger - Research

## Context
**Phase:** 2 - The Ledger
**Goal:** Extend the ephemeral interview experience with a session-based automated data ingestion tool. Users can upload images (receipts) or documents (utility bills) which are processed by Gemini 1.5 to extract carbon-relevant data.

## Implementation Strategy

### 1. File Upload Architecture
- **Frontend (Next.js):** Implement file upload UI supporting images (JPG/PNG) and PDFs. Forward `multipart/form-data` directly to the FastAPI backend using standard `fetch` API. Avoid loading files fully into Next.js memory where possible.
- **Backend (FastAPI):** Use `UploadFile` (from `fastapi`) which utilizes `python-multipart` to safely handle file uploads by spooling larger files to disk rather than consuming RAM.

### 2. Gemini 1.5 Integration (google-genai SDK)
- The project already uses the `google-genai` SDK (`google-genai>=1.0.0` in `requirements.txt`).
- **File API:** To process documents (PDFs) and images with Gemini 1.5 Pro/Flash, use the File API.
  - Upload file using `client.aio.files.upload(file=file_path)`.
  - For non-image files like PDFs, poll the file state until it becomes `ACTIVE` before generating content.
  - Call `client.aio.models.generate_content` passing the uploaded file object and the extraction prompt.
  - **Ephemerality Rule:** Immediately delete the file from Google's servers using `client.aio.files.delete(name=uploaded_file.name)` after extraction is complete to adhere to strict ephemerality (D-17).

### 3. Ephemeral State Management (Database)
- **Extending the Session:** The existing `Session` model (UUID-based) handles ephemeral data well.
- **New Ledger Models:** Create new SQLAlchemy models (e.g., `LedgerEntry`) linked via foreign key to `Session.id`.
- **Real-time Updates:** When a receipt is processed, the backend should save the `LedgerEntry` and recalculate the session's total carbon footprint, returning the updated state to the frontend to satisfy the dynamic update requirement (D-22).

### 4. UI/UX (Organic Style)
- Utilize existing `Doodle` components (`frontend/src/components/OrganicDoodles.tsx`).
- Apply the "Tending a Garden" metaphor (D-21): Design the ledger list with soft boundaries, earthy colors, and possibly organic dividers rather than harsh grid lines.

## Potential Pitfalls
- **Memory Exhaustion on Upload:** Do not read file contents directly into `bytes` in FastAPI endpoint parameters; strictly use `UploadFile`.
- **Gemini Rate Limits/File Quotas:** Ensure cleanup of uploaded files via the Gemini API after processing to avoid hitting quotas and violating privacy constraints.

## Next Steps for Planning
- Plan 1: Backend Infrastructure (File upload endpoint, Gemini File API integration, Ledger database models).
- Plan 2: Frontend Implementation (Upload component, Organic Ledger UI, real-time total updates).
