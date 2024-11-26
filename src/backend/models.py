from sqlalchemy import Column, String, Integer, Float, DateTime, ForeignKey, Enum, Boolean, Text, DECIMAL
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base
import enum
from datetime import datetime

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    first_name = Column(String(100))
    last_name = Column(String(100))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Add relationship to shops
    shops = relationship("Shop", back_populates="owner")
    tokens = relationship("Token", back_populates="user")

class Shop(Base):
    __tablename__ = "shops"

    id = Column(String(36), primary_key=True)
    owner_id = Column(String(36), ForeignKey('users.id'))
    name = Column(String(255), nullable=False)
    address = Column(String(255), nullable=False)
    description = Column(String(500))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    services = relationship("ShopService", back_populates="shop")
    owner = relationship("User", back_populates="shops")

class Service(Base):
    __tablename__ = "services"

    id = Column(String(36), primary_key=True)
    name = Column(String(255), nullable=False)
    description = Column(String(500))
    default_duration = Column(Integer)  # in minutes
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class ShopService(Base):
    __tablename__ = "shop_services"

    id = Column(String(36), primary_key=True)
    shop_id = Column(String(36), ForeignKey('shops.id'))
    service_id = Column(String(36), ForeignKey('services.id'))
    price = Column(Float, nullable=False)
    duration = Column(Integer)  # in minutes
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    shop = relationship("Shop", back_populates="services")
    service = relationship("Service")

class Queue(Base):
    __tablename__ = "queues"

    id = Column(String(36), primary_key=True)
    shop_id = Column(String(36), ForeignKey('shops.id'))
    customer_name = Column(String(255), nullable=False)
    service_id = Column(String(36), ForeignKey('services.id'))
    appointment_time = Column(DateTime(timezone=True), nullable=False)
    status = Column(String(50), default='waiting')  # waiting, in-progress, completed
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    shop = relationship("Shop")
    service = relationship("Service")

class Token(Base):
    __tablename__ = "tokens"
    
    id = Column(String(36), primary_key=True)
    user_id = Column(String(36), ForeignKey('users.id'))
    token = Column(String(500), nullable=False)  # JWT tokens can be long
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True), nullable=False)
    
    user = relationship("User", back_populates="tokens")

class ServiceHistory(Base):
    __tablename__ = "service_history"

    id = Column(String(36), primary_key=True)
    shop_id = Column(String(36), ForeignKey('shops.id'))
    customer_name = Column(String(255), nullable=False)
    service_id = Column(String(36), ForeignKey('services.id'))
    completed_at = Column(DateTime(timezone=True), nullable=False)
    duration = Column(Integer)  # actual duration in minutes
    price = Column(Float, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    shop = relationship("Shop")
    service = relationship("Service")