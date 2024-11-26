from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from database import get_db
from models import Shop, Service, ShopService, Queue
from pydantic import BaseModel
import uuid
from typing import List
from .auth import get_current_user
import traceback
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

class ServiceCreate(BaseModel):
    service_id: str
    price: float
    duration: int

class ShopCreate(BaseModel):
    name: str
    address: str
    description: str
    services: List[ServiceCreate]

class ShopUpdate(BaseModel):
    name: str
    address: str
    description: str
    services: List[ServiceCreate]

@router.get("/services/catalog")
async def get_service_catalog(db: Session = Depends(get_db)):
    try:
        services = db.query(Service).all()
        return {"services": services}
    except Exception as e:
        logger.error(f"Error fetching services: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.post("/shops")
async def create_shop(
    shop_data: ShopCreate, 
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    logger.info(f"Creating shop for user: {current_user['id']}")
    logger.info(f"Shop data: {shop_data}")
    
    shop_id = str(uuid.uuid4())
    try:
        new_shop = Shop(
            id=shop_id,
            owner_id=current_user["id"],
            name=shop_data.name,
            address=shop_data.address,
            description=shop_data.description
        )
        
        db.add(new_shop)
        
        # Add services
        for service in shop_data.services:
            logger.info(f"Adding service: {service}")
            shop_service = ShopService(
                id=str(uuid.uuid4()),
                shop_id=shop_id,
                service_id=service.service_id,
                price=service.price,
                duration=service.duration
            )
            db.add(shop_service)
            
        db.commit()
        logger.info(f"Successfully created shop with ID: {shop_id}")
        return {"message": "Shop created successfully", "shop_id": shop_id}
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating shop: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Failed to create shop: {str(e)}")

@router.get("/shops/owner/{owner_id}")
async def get_owner_shops(
    owner_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    try:
        shops = db.query(Shop).filter(Shop.owner_id == owner_id).all()
        shop_data = []
        
        for shop in shops:
            # Get services for each shop
            shop_services = db.query(ShopService).filter(ShopService.shop_id == shop.id).all()
            services = []
            
            for shop_service in shop_services:
                service = db.query(Service).filter(Service.id == shop_service.service_id).first()
                services.append({
                    "id": service.id,
                    "name": service.name,
                    "price": shop_service.price,
                    "duration": shop_service.duration
                })
            
            shop_data.append({
                "id": shop.id,
                "name": shop.name,
                "address": shop.address,
                "description": shop.description,
                "services": services
            })
            
        return {"shops": shop_data}
    except Exception as e:
        logger.error(f"Error fetching shops: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.get("/shops/{shop_id}/queue")
async def get_shop_queue(shop_id: str, db: Session = Depends(get_db)):
    try:
        # Fetch queue with service durations
        queue = db.query(
            Queue, ShopService.duration
        ).join(
            ShopService, Queue.service_id == ShopService.id
        ).filter(
            Queue.shop_id == shop_id,
            Queue.status != 'completed'
        ).all()
        
        return {
            "queue": [{
                "id": item.Queue.id,
                "name": item.Queue.customer_name,
                "service": item.Queue.service_name,
                "time": item.Queue.appointment_time,
                "status": item.Queue.status,
                "duration": item.duration
            } for item in queue]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/shops/{shop_id}")
async def update_shop(
    shop_id: str,
    shop_data: ShopUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        # Verify shop ownership
        shop = db.query(Shop).filter(
            Shop.id == shop_id,
            Shop.owner_id == current_user.id
        ).first()
        
        if not shop:
            raise HTTPException(
                status_code=404,
                detail="Shop not found or you don't have permission to update it"
            )
        
        # Update basic shop details
        shop.name = shop_data.name
        shop.address = shop_data.address
        shop.description = shop_data.description
        
        # Update shop services
        # First, remove all existing services
        db.query(ShopService).filter(ShopService.shop_id == shop_id).delete()
        
        # Add new services
        for service in shop_data.services:
            new_shop_service = ShopService(
                shop_id=shop_id,
                service_id=service.service_id,
                price=service.price,
                duration=service.duration
            )
            db.add(new_shop_service)
        
        db.commit()
        
        return {"message": "Shop updated successfully"}
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e)) 