from fastapi import APIRouter, HTTPException, Depends, Header
from sqlalchemy.orm import Session
from passlib.hash import bcrypt
from database import get_db
from models import User, Token, Shop
from pydantic import BaseModel
import uuid
from typing import Optional
from datetime import datetime, timedelta
import jwt as pyjwt
from jwt.exceptions import ExpiredSignatureError, InvalidTokenError

router = APIRouter()


class UserCreate(BaseModel):
    email: str
    password: str
    firstName: str | None = None
    lastName: str | None = None


class UserLogin(BaseModel):
    email: str
    password: str


# Add this function to get the current user
async def get_current_user(authorization: Optional[str] = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Not authenticated")

    try:
        # Remove 'Bearer ' prefix if present
        if authorization.startswith('Bearer '):
            token = authorization.split(' ')[1]
        else:
            token = authorization

        # Decode and verify the JWT token
        payload = pyjwt.decode(token, 'vansh-is-noob', algorithms=['HS256'])

        if not payload or 'id' not in payload:
            raise HTTPException(status_code=401, detail="Invalid token")

        return {"id": payload["id"]}

    except ExpiredSignatureError:
        print(f"[auth.py:47] Token expired")
        raise HTTPException(status_code=401, detail="Token has expired")
    except InvalidTokenError as e:
        print(f"[auth.py:50] Invalid token error: {str(e)}")
        raise HTTPException(status_code=401, detail="Could not validate credentials")
    except Exception as e:
        print(f"[auth.py:53] Unexpected error: {str(e)}")
        raise HTTPException(status_code=401, detail=str(e))


@router.post("/auth/signup")
async def signup(user_data: UserCreate, db: Session = Depends(get_db)):
    # Check if user exists
    if db.query(User).filter(User.email == user_data.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    # Create new user
    hashed_password = bcrypt.hash(user_data.password)
    new_user = User(
        id=str(uuid.uuid4()),
        email=user_data.email,
        password_hash=hashed_password,
        first_name=user_data.firstName,
        last_name=user_data.lastName
    )

    try:
        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        return {
            "user": {
                "id": new_user.id,
                "email": new_user.email,
                "firstName": new_user.first_name,
                "lastName": new_user.last_name
            }
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/auth/login")
async def login(credentials: UserLogin, db: Session = Depends(get_db)):
    try:
        print(f"[auth.py:91] Login attempt for email: {credentials.email}")
        user = db.query(User).filter(User.email == credentials.email).first()
        
        if not user:
            print(f"[auth.py:94] User not found: {credentials.email}")
            raise HTTPException(status_code=401, detail="Invalid credentials")
            
        if not bcrypt.verify(credentials.password, user.password_hash):
            print(f"[auth.py:98] Invalid password for user: {credentials.email}")
            raise HTTPException(status_code=401, detail="Invalid credentials")

        # Deactivate all existing tokens for this user
        db.query(Token).filter(
            Token.user_id == user.id,
            Token.is_active == True
        ).update({"is_active": False})
        db.commit()  # Commit the token deactivation

        # Create new token
        token_data = {
            "id": user.id,
            "email": user.email,
            "exp": datetime.utcnow() + timedelta(days=1)
        }
        
        token_str = pyjwt.encode(token_data, 'vansh-is-noob', algorithm='HS256')
        
        # Store token in database
        db_token = Token(
            id=str(uuid.uuid4()),
            user_id=user.id,
            token=token_str,
            expires_at=datetime.utcnow() + timedelta(days=1)
        )
        
        try:
            db.add(db_token)
            db.commit()
            db.refresh(db_token)
        except Exception as e:
            db.rollback()
            print(f"[auth.py:error] Failed to store token: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to create authentication token")
        
        print(f"[auth.py:108] Successfully created token for user: {user.email}")

        return {
            "id": user.id,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "name": f"{user.first_name} {user.last_name}".strip(),
            "role": "owner" if db.query(Shop).filter(Shop.owner_id == user.id).first() else "customer",
            "token": token_str
        }
    except HTTPException as he:
        print(f"[auth.py:119] HTTP Exception in login: {str(he)}")
        raise he
    except Exception as e:
        print(f"[auth.py:122] Unexpected error in login: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/auth/logout")
async def logout(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        # Deactivate all tokens for the user
        db.query(Token).filter(
            Token.user_id == current_user["id"],
            Token.is_active == True
        ).update({"is_active": False})
        
        db.commit()
        return {"message": "Successfully logged out"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
