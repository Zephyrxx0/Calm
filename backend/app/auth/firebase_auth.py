"""Firebase Admin SDK integration for token verification."""
import os

from fastapi import HTTPException
from firebase_admin import auth as firebase_auth
from firebase_admin import credentials, initialize_app
from firebase_admin.exceptions import FirebaseError

# Initialize Firebase Admin SDK once at import time.
# In production, FIREBASE_CREDENTIALS_PATH points to a service account JSON file.
# In development, falls back to default credentials (e.g., ADC or emulator).
_firebase_initialized = False


def _initialize_firebase_admin() -> None:
    """Initialize Firebase Admin app with credentials from environment."""
    global _firebase_initialized
    if _firebase_initialized:
        return

    cred_path = os.environ.get("FIREBASE_CREDENTIALS_PATH")
    if cred_path and os.path.isfile(cred_path):
        cred = credentials.Certificate(cred_path)
    else:
        # Use application default credentials (GCP, emulator, or local dev)
        cred = credentials.ApplicationDefault()

    initialize_app(cred)
    _firebase_initialized = True


_initialize_firebase_admin()


async def verify_firebase_token(token: str) -> str:
    """Verify a Firebase ID token and return the user's UID.

    Args:
        token: Firebase ID token from the client SDK.

    Returns:
        The decoded token's uid string.

    Raises:
        HTTPException(401) if the token is invalid, expired, or malformed.
    """
    try:
        decoded_token = firebase_auth.verify_id_token(token)
        return decoded_token["uid"]
    except (FirebaseError, ValueError) as exc:
        raise HTTPException(status_code=401, detail="Invalid token") from exc
