import logging
import httpx
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwk, jwt
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from app.core.config import COGNITO_REGION, COGNITO_USER_POOL_ID
from app.deps.db import get_db
from app.db.models.user import User

logger = logging.getLogger(__name__)

bearer_scheme = HTTPBearer()

JWKS_URL = (
    f"https://cognito-idp.{COGNITO_REGION}.amazonaws.com"
    f"/{COGNITO_USER_POOL_ID}/.well-known/jwks.json"
)
_jwks_cache: dict | None = None


def _get_jwks() -> dict:
    global _jwks_cache
    if _jwks_cache is None:
        try:
            response = httpx.get(JWKS_URL, timeout=5.0)
            response.raise_for_status()
            _jwks_cache = response.json()
        except httpx.TimeoutException:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Auth service timed out fetching signing keys",
            )
        except httpx.HTTPError as e:
            logger.error("Failed to fetch JWKS: %s", e)
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Unable to fetch signing keys",
            )
    return _jwks_cache


def _verify_token(token: str) -> dict:
    jwks = _get_jwks()
    try:
        header = jwt.get_unverified_header(token)
        key = next((k for k in jwks["keys"] if k["kid"] == header["kid"]), None)
        if key is None:
            # kid mismatch — could be a key rotation; bust the cache and retry once
            global _jwks_cache
            _jwks_cache = None
            jwks = _get_jwks()
            key = next((k for k in jwks["keys"] if k["kid"] == header["kid"]), None)
        if key is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token key"
            )
        public_key = jwk.construct(key)
        payload = jwt.decode(
            token,
            public_key,
            algorithms=["RS256"],
            options={"verify_aud": False, "verify_at_hash": False},
        )
        return payload
    except JWTError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    """Validates JWT and lazy-creates the user row on first login."""
    payload = _verify_token(credentials.credentials)
    sub = payload.get("sub")
    if not sub:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing sub in token"
        )

    user = db.query(User).filter(User.cognito_sub == sub).first()
    if not user:
        email = payload.get("email")
        # If the email already belongs to another account (e.g. prior sign-up method),
        # link by updating that row's cognito_sub rather than creating a duplicate.
        if email:
            existing = db.query(User).filter(User.email == email).first()
            if existing:
                existing.cognito_sub = sub
                try:
                    db.commit()
                    db.refresh(existing)
                except IntegrityError:
                    db.rollback()
                    logger.error(
                        "IntegrityError linking cognito_sub %s to email %s", sub, email
                    )
                    raise HTTPException(
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        detail="Account linking failed",
                    )
                return existing

        user = User(cognito_sub=sub, email=email)
        db.add(user)
        try:
            db.commit()
            db.refresh(user)
        except IntegrityError:
            db.rollback()
            # Race condition: another request already created this user — just fetch it
            db.expire_all()
            user = db.query(User).filter(User.cognito_sub == sub).first()
            if not user:
                logger.error("Failed to create or retrieve user for sub %s", sub)
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="User creation failed",
                )

    return user
