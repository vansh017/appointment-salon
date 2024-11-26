from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from database import get_db
from models import Shop, Service, ShopService, Queue, User, ServiceHistory
from pydantic import BaseModel
import uuid
from typing import List
from .auth import get_current_user
import traceback
import logging
from datetime import datetime, timedelta
from sqlalchemy.sql import func

# Configure logging with more detailed format
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
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

class ShopResponse(BaseModel):
    id: str
    name: str
    address: str
    description: str
    services: List[dict]
    queue_length: int

class QueueCreate(BaseModel):
    customer_name: str
    service_ids: List[str]

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
        # Fetch queue with service details
        queue = db.query(
            Queue,
            Service.name.label('service_name'),
            ShopService.duration
        ).join(
            ShopService, 
            (Queue.shop_id == ShopService.shop_id) & 
            (Queue.service_id == ShopService.service_id)
        ).join(
            Service, 
            ShopService.service_id == Service.id
        ).filter(
            Queue.shop_id == shop_id,
            Queue.status != 'completed'
        ).order_by(Queue.appointment_time).all()
        
        return {
            "queue": [{
                "id": item.Queue.id,
                "name": item.Queue.customer_name,
                "service": item.service_name,
                "time": item.Queue.appointment_time.strftime("%H:%M"),
                "status": item.Queue.status,
                "duration": item.duration
            } for item in queue]
        }
    except Exception as e:
        logger.error(f"Error fetching queue: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/shops/{shop_id}")
async def update_shop(
    shop_id: str,
    shop_data: ShopUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    try:
        # Verify shop ownership
        shop = db.query(Shop).filter(
            Shop.id == shop_id,
            Shop.owner_id == current_user["id"]
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
                id=str(uuid.uuid4()),
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

@router.get("/shops/catalog")
async def get_shops_catalog(
    page: int = 1,
    limit: int = 10,
    min_rating: float = 0,
    sort_by: str = "queue_length",
    sort_order: str = "asc",
    max_price: float | None = None,
    db: Session = Depends(get_db)
):
    try:
        # Base query
        query = db.query(Shop)
        shops = query.all()
        
        response_shops = []
        for shop in shops:
            # Get queue length
            queue_length = db.query(Queue).filter(
                Queue.shop_id == shop.id,
                Queue.status != 'completed'
            ).count()
            
            # Get shop services
            shop_services = []
            services_query = db.query(ShopService, Service).join(
                Service, ShopService.service_id == Service.id
            ).filter(ShopService.shop_id == shop.id)
            
            for shop_service, service in services_query:
                shop_services.append({
                    "id": service.id,
                    "name": service.name,
                    "price": shop_service.price,
                    "duration": shop_service.duration
                })
            
            # Calculate average price
            avg_price = 0
            if shop_services:
                avg_price = sum(service["price"] for service in shop_services) / len(shop_services)
            
            # Skip if max_price filter is applied and avg_price exceeds it
            if max_price and avg_price > max_price:
                continue
            
            response_shops.append({
                "id": shop.id,
                "name": shop.name,
                "address": shop.address,
                "description": shop.description,
                "services": shop_services,
                "queue_length": queue_length,
                "average_price": avg_price,
                "rating": getattr(shop, 'rating', 0),  # Default to 0 if rating field doesn't exist
                "is_available": queue_length == 0
            })
        
        # Apply sorting
        if sort_by == "queue_length":
            response_shops.sort(key=lambda x: x["queue_length"])
        elif sort_by == "average_price":
            response_shops.sort(key=lambda x: x["average_price"])
        elif sort_by == "rating":
            response_shops.sort(key=lambda x: x["rating"], reverse=True)
            
        if sort_order == "desc" and sort_by != "rating":
            response_shops.reverse()
            
        # Apply pagination
        total_shops = len(response_shops)
        start_idx = (page - 1) * limit
        end_idx = start_idx + limit
        paginated_shops = response_shops[start_idx:end_idx]
        
        return {
            "shops": paginated_shops,
            "total": total_shops,
            "page": page,
            "total_pages": (total_shops + limit - 1) // limit
        }
    except Exception as e:
        logger.error(f"Error fetching shops: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/shops/{shop_id}/details")
async def get_shop_details(shop_id: str, db: Session = Depends(get_db)):
    try:
        # Get shop details with services
        shop = db.query(Shop).filter(Shop.id == shop_id).first()
        if not shop:
            raise HTTPException(status_code=404, detail="Shop not found")
            
        # Get shop services with details
        services = db.query(
            ShopService, Service
        ).join(
            Service, ShopService.service_id == Service.id
        ).filter(
            ShopService.shop_id == shop_id
        ).all()
        
        # Get current queue
        queue = db.query(Queue).filter(
            Queue.shop_id == shop_id,
            Queue.status != 'completed'
        ).order_by(Queue.appointment_time).all()
        
        return {
            "shop": {
                "id": shop.id,
                "name": shop.name,
                "address": shop.address,
                "description": shop.description
            },
            "services": [{
                "id": service.Service.id,
                "name": service.Service.name,
                "price": service.ShopService.price,
                "duration": service.ShopService.duration
            } for service in services],
            "queue": [{
                "id": item.id,
                "name": item.customer_name,
                "time": item.appointment_time,
                "status": item.status
            } for item in queue]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/shops/{shop_id}/queue")
async def join_queue(
    shop_id: str,
    queue_data: dict,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        print(f"[shops.py:356] Queue join attempt - User: {current_user['id']}, Shop: {shop_id}")
        
        service_id = queue_data.get("service_id")
        if not service_id:
            print(f"[shops.py:360] Missing service_id in request data")
            raise HTTPException(status_code=400, detail="Service ID is required")

        # Get service details first
        service = db.query(Service).filter(Service.id == service_id).first()
        if not service:
            print(f"[shops.py:366] Service not found: {service_id}")
            raise HTTPException(status_code=404, detail="Service not found")

        # Verify the service belongs to the shop
        shop_service = db.query(ShopService).filter(
            ShopService.shop_id == shop_id,
            ShopService.service_id == service_id
        ).first()

        if not shop_service:
            print(f"[shops.py:376] Service {service_id} not found for shop {shop_id}")
            raise HTTPException(status_code=404, detail="Service not found for this shop")

        # Get the user from database using the token payload
        user = db.query(User).filter(User.id == current_user['id']).first()
        if not user:
            print(f"[shops.py:382] User not found in database: {current_user['id']}")
            raise HTTPException(status_code=404, detail="User not found")

        # Calculate appointment time based on current queue
        current_time = datetime.utcnow()
        last_queue_item = db.query(Queue).filter(
            Queue.shop_id == shop_id,
            Queue.status != 'completed'
        ).order_by(Queue.appointment_time.desc()).first()

        if last_queue_item:
            appointment_time = last_queue_item.appointment_time + timedelta(minutes=shop_service.duration)
        else:
            appointment_time = current_time

        # Create new queue entry
        new_queue_item = Queue(
            id=str(uuid.uuid4()),
            shop_id=shop_id,
            customer_name=f"{user.first_name} {user.last_name}".strip(),
            service_id=service_id,
            appointment_time=appointment_time,
            status='waiting'
        )

        db.add(new_queue_item)
        db.commit()
        db.refresh(new_queue_item)

        print(f"[shops.py:400] Successfully added to queue - User: {user.email}, Shop: {shop_id}")
        
        return {
            "message": "Successfully joined queue",
            "queue_position": {
                "id": new_queue_item.id,
                "appointment_time": appointment_time,
                "status": "waiting"
            }
        }

    except Exception as e:
        print(f"[shops.py:413] Unexpected error in join_queue: {str(e)}")
        print(f"[shops.py:414] Traceback: {traceback.format_exc()}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}") 

@router.post("/shops/{shop_id}/queue/{queue_id}/complete")
async def complete_queue_item(
    shop_id: str,
    queue_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    try:
        # Verify shop ownership
        shop = db.query(Shop).filter(
            Shop.id == shop_id,
            Shop.owner_id == current_user["id"]
        ).first()
        
        if not shop:
            raise HTTPException(status_code=404, detail="Shop not found")

        # Get queue item
        queue_item = db.query(Queue).filter(
            Queue.id == queue_id,
            Queue.shop_id == shop_id
        ).first()
        
        if not queue_item:
            raise HTTPException(status_code=404, detail="Queue item not found")

        # Get service details
        shop_service = db.query(ShopService).filter(
            ShopService.shop_id == shop_id,
            ShopService.service_id == queue_item.service_id
        ).first()

        # Create history record
        history = ServiceHistory(
            id=str(uuid.uuid4()),
            shop_id=shop_id,
            customer_name=queue_item.customer_name,
            service_id=queue_item.service_id,
            completed_at=datetime.now(),
            duration=shop_service.duration,
            price=shop_service.price
        )
        db.add(history)

        # Remove from queue
        db.delete(queue_item)
        db.commit()

        return {"message": "Service completed successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/shops/{shop_id}/services-today")
async def get_services_today(
    shop_id: str,
    db: Session = Depends(get_db)
):
    try:
        today = datetime.now().date()
        count = db.query(ServiceHistory).filter(
            ServiceHistory.shop_id == shop_id,
            func.date(ServiceHistory.completed_at) == today
        ).count()
        
        return {"count": count}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 