from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt as pyjwt
from jwt.exceptions import ExpiredSignatureError, InvalidTokenError
from typing import Optional
from datetime import datetime
from database import get_db
from models import Token

security = HTTPBearer()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    try:
        token = credentials.credentials
        if not token:
            print(f"[auth.py:12] No token provided in request")
            raise HTTPException(status_code=401, detail="No authorization token provided")
            
        # Remove 'Bearer ' prefix if present
        if token.startswith('Bearer '):
            token = token.split(' ')[1]
        
        # First verify token exists and is active in database
        db_token = db.query(Token).filter(
            Token.token == token,
            Token.is_active == True,
            Token.expires_at > datetime.utcnow()
        ).first()
        
        if not db_token:
            print(f"[auth.py:25] Token not found or inactive in database")
            raise HTTPException(status_code=401, detail="Invalid token")
            
        # Decode and verify the token
        payload = pyjwt.decode(token, 'vansh-is-noob', algorithms=['HS256'])
        
        if not payload:
            print(f"[auth.py:31] Invalid token payload: {payload}")
            raise HTTPException(status_code=401, detail="Invalid token")
            
        return payload
        
    except ExpiredSignatureError:
        print(f"[auth.py:27] Token expired")
        raise HTTPException(status_code=401, detail="Token has expired")
    except InvalidTokenError as e:
        print(f"[auth.py:30] Invalid token error: {str(e)}")
        raise HTTPException(status_code=401, detail="Could not validate credentials")
    except Exception as e:
        print(f"[auth.py:33] Unexpected error: {str(e)}")
        raise HTTPException(status_code=401, detail=str(e)) 