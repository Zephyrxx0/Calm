---
phase: 02
slug: the-ledger
status: verified
threats_open: 0
asvs_level: 1
created: 2026-06-18
---

# Phase 02 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| File Upload | Client submits arbitrary files to backend | Binary files (JPG, PNG, PDF) |
| AI API | Extracted data from Gemini is parsed into DB | JSON + numeric carbon data |
| File System | Temp files created during upload processing | Binary files (ephemeral) |
| Client Browser | Rendering AI-extracted content | Text, category names, carbon values |

---

## Threat Register

| Threat ID | Category | Component | Disposition | Mitigation | Status |
|-----------|----------|-----------|-------------|------------|--------|
| T-02-01 | Tampering | python-multipart | mitigate | `python-multipart>=0.0.9` in requirements.txt | closed |
| T-02-02 | Info Disclosure | scanner.py | mitigate | Remote file deletion enforced in `finally` block (`client.aio.files.delete`) | closed |
| T-02-03 | Spoofing | AI Output | mitigate | JSON output validated via `json.loads()` + try/except before DB insert | closed |
| T-02-SC | Tampering | npm/pip | mitigate | slopcheck + blocking human checkpoint for assumed dependencies | closed |
| T-02-04 | Denial of Service | File Upload | accept | Relying on FastAPI default upload limits for MVP | closed |
| T-02-05 | Info Disclosure | File System | mitigate | Temp files deleted in `finally: os.unlink(tmp.name)` after processing | closed |
| T-02-06 | Cross-Site Scripting | LedgerView | mitigate | React escapes `description` and `category` by default; no `dangerouslySetInnerHTML` used | closed |

*Status: open · closed*

---

## Verification Evidence

| Threat | Evidence |
|--------|----------|
| T-02-01 | `python-multipart>=0.0.9` present in `backend/requirements.txt` |
| T-02-02 | `finally: await client.aio.files.delete(name=uploaded.name)` in `backend/app/services/scanner.py` |
| T-02-03 | `data = json.loads(text)` with try/except in `backend/app/services/scanner.py` |
| T-02-SC | slopcheck configured for dependency verification |
| T-02-04 | Accepted — FastAPI enforces default 1MB upload limit |
| T-02-05 | `finally: os.unlink(tmp.name)` in `backend/app/api/ledger.py` |
| T-02-06 | No `dangerouslySetInnerHTML` found in `frontend/src/components/ledger/LedgerView.tsx` |

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| R-02-01 | T-02-04 | FastAPI default upload limits sufficient for MVP phase | plan author | 2026-06-18 |

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-06-18 | 7 | 7 | 0 | gsd-secure-phase |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-06-18
