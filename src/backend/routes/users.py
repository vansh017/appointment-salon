@router.patch("/users/{user_id}/preferences")
async def update_user_preferences(
    user_id: str,
    preferences: dict,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        if current_user["id"] != user_id:
            raise HTTPException(status_code=403, detail="Not authorized to update this user's preferences")
            
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
            
        user.dark_mode = preferences.get("dark_mode", user.dark_mode)
        db.commit()
        
        return {"message": "Preferences updated successfully"}
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e)) 

@router.get("/users/{user_id}/preferences")
async def get_user_preferences(
    user_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        if current_user["id"] != user_id:
            raise HTTPException(status_code=403, detail="Not authorized to access this user's preferences")
            
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
            
        return {
            "dark_mode": user.dark_mode,
            "other_preferences": {} # For future preference additions
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 