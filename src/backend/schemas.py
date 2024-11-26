class ShopServiceUpdate(BaseModel):
    service_id: str
    price: float
    duration: int

class ShopUpdate(BaseModel):
    name: str
    address: str
    description: str
    services: List[ShopServiceUpdate] 

class QueueCreate(BaseModel):
    customer_name: str
    service_ids: List[str] 