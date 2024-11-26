from fastapi import APIRouter, HTTPException, Depends, Header
from sqlalchemy.orm import Session
from passlib.hash import bcrypt
from database import get_db
from models import User
from pydantic import BaseModel
import uuid
from typing import Optional

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
        # Here you would typically verify a JWT token
        # For now, we'll just parse the user ID from the auth header
        user_data = authorization.split(" ")[1]  # Bearer <token>
        return {"id": user_data}
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid authentication")

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
async def login(user_data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == user_data.email).first()
    
    if not user or not bcrypt.verify(user_data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    return {
        "user": {
            "id": user.id,
            "email": user.email,
            "firstName": user.first_name,
            "lastName": user.last_name
        }
    } 