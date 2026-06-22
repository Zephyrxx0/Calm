"""Firebase Admin SDK token verification."""
import json
import os
import tempfile

import firebase_admin
from firebase_admin import auth, credentials
from fastapi import HTTPException

_app_initialized = False


def _ensure_initialized():
    global _app_initialized
    if _app_initialized:
        return
    # 1. File path (local dev)
    creds_path = os.environ.get("FIREBASE_CREDENTIALS_PATH")
    if creds_path and os.path.exists(creds_path):
        cred = credentials.Certificate(creds_path)
        firebase_admin.initialize_app(cred)
        _app_initialized = True
        return
    # 2. JSON string env var (Vercel / serverless)
    creds_json = os.environ.get("FIREBASE_CREDENTIALS_JSON")
    if creds_json:
        with tempfile.NamedTemporaryFile(mode="w", suffix=".json", delete=False) as f:
            f.write(creds_json)
            tmp_path = f.name
        cred = credentials.Certificate(tmp_path)
        firebase_admin.initialize_app(cred)
        os.unlink(tmp_path)
        _app_initialized = True
        return
    # 3. Falls back to GOOGLE_APPLICATION_CREDENTIALS or GCP default creds
    firebase_admin.initialize_app()
    _app_initialized = True


async def verify_firebase_token(token: str) -> str:
    """Verify a Firebase ID token and return the user's UID.

    Uses firebase_admin.auth.verify_id_token which handles:
    - Signature verification against Google's public keys
    - Token expiration and issued-at checks
    - Audience and issuer validation
    - Revocation checks

    Raises:
        HTTPException(401) if the token is invalid.
    """
    if not token:
        raise HTTPException(status_code=401, detail="Missing token")

    _ensure_initialized()

    try:
        decoded = auth.verify_id_token(token)
        uid = decoded.get("uid", "")
        if not uid:
            raise HTTPException(status_code=401, detail="Invalid token: missing uid")
        return uid
    except auth.RevokedIdTokenError:
        raise HTTPException(status_code=401, detail="Token has been revoked")
    except auth.ExpiredIdTokenError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except auth.InvalidIdTokenError as exc:
        raise HTTPException(status_code=401, detail=f"Invalid token: {exc}")
    except Exception as exc:
        raise HTTPException(status_code=401, detail="Token verification failed")
