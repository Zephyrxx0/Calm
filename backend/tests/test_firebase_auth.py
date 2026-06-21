"""Tests for Firebase auth token verification (mocked Admin SDK)."""
import unittest.mock

import pytest
from fastapi import HTTPException
from firebase_admin.auth import ExpiredIdTokenError, InvalidIdTokenError

from app.auth.firebase_auth import verify_firebase_token


@pytest.fixture
def anyio_backend():
    return "asyncio"


@pytest.mark.asyncio
async def test_verify_valid_token():
    """Valid token returns the decoded uid."""
    with unittest.mock.patch("firebase_admin.auth.verify_id_token") as mock_verify:
        mock_verify.return_value = {"uid": "test_uid_123"}
        result = await verify_firebase_token("valid-token")
        assert result == "test_uid_123"
        mock_verify.assert_called_once_with("valid-token")


@pytest.mark.asyncio
async def test_verify_invalid_token():
    """Invalid token raises HTTPException(401)."""
    with unittest.mock.patch("firebase_admin.auth.verify_id_token") as mock_verify:
        mock_verify.side_effect = InvalidIdTokenError("Token is invalid")
        with pytest.raises(HTTPException) as exc_info:
            await verify_firebase_token("bad-token")
        assert exc_info.value.status_code == 401
        assert exc_info.value.detail == "Invalid token: Token is invalid"


@pytest.mark.asyncio
async def test_verify_expired_token():
    """Expired token raises HTTPException(401)."""
    with unittest.mock.patch("firebase_admin.auth.verify_id_token") as mock_verify:
        mock_verify.side_effect = ExpiredIdTokenError(
            "Token has expired", cause=ValueError("expired")
        )
        with pytest.raises(HTTPException) as exc_info:
            await verify_firebase_token("expired-token")
        assert exc_info.value.status_code == 401
        assert exc_info.value.detail == "Token has expired"


@pytest.mark.asyncio
async def test_verify_malformed_token():
    """Malformed token (ValueError) raises HTTPException(401)."""
    with unittest.mock.patch("firebase_admin.auth.verify_id_token") as mock_verify:
        mock_verify.side_effect = ValueError("Malformed token")
        with pytest.raises(HTTPException) as exc_info:
            await verify_firebase_token("malformed-token")
        assert exc_info.value.status_code == 401
        assert exc_info.value.detail == "Token verification failed"

