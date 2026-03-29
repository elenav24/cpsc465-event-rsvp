import httpx
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwk, jwt
from sqlalchemy.orm import Session
from app.core.config import COGNITO_REGION, COGNITO_USER_POOL_ID
from app.deps.db import get_db
from app.db.models.user import User

bearer_scheme = HTTPBearer()

JWKS_URL = f"https://cognito-idp.{COGNITO_REGION}.amazonaws.com/{COGNITO_USER_POOL_ID}/.well-known/jwks.json"
_jwks_cache: dict | None = None


def _get_jwks() -> dict:
    global _jwks_cache
    if _jwks_cache is None:
        response = httpx.get(JWKS_URL)
        response.raise_for_status()
        _jwks_cache = response.json()
    return _jwks_cache


def _verify_token(token: str) -> dict:
    jwks = _get_jwks()
    try:
        header = jwt.get_unverified_header(token)
        key = next((k for k in jwks["keys"] if k["kid"] == header["kid"]), None)
        if key is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token key")
        public_key = jwk.construct(key)
        payload = jwt.decode(
            token,
            public_key,
            algorithms=["RS256"],
            options={"verify_aud": False},
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
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing sub in token")

    user = db.query(User).filter(User.cognito_sub == sub).first()
    if not user:
        user = User(cognito_sub=sub, email=payload.get("email"))
        db.add(user)
        db.commit()
        db.refresh(user)

    return user


def get_optional_user(
    credentials: HTTPAuthorizationCredentials = Depends(HTTPBearer(auto_error=False)),
    db: Session = Depends(get_db),
) -> User | None:
    """Returns the User if a valid token is present, otherwise None."""
    if credentials is None:
        return None
    try:
        payload = _verify_token(credentials.credentials)
        sub = payload.get("sub")
        if not sub:
            return None
        user = db.query(User).filter(User.cognito_sub == sub).first()
        if not user:
            user = User(cognito_sub=sub, email=payload.get("email"))
            db.add(user)
            db.commit()
            db.refresh(user)
        return user
    except HTTPException:
        return None
