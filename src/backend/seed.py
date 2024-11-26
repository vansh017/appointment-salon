from database import SessionLocal, Base, engine
from models import Service
import uuid

# Create tables
Base.metadata.create_all(bind=engine)

# Initial services
INITIAL_SERVICES = [
    {"name": "Haircut", "description": "Basic haircut service", "default_duration": 30},
    {"name": "Styling", "description": "Hair styling service", "default_duration": 45},
    {"name": "Color", "description": "Hair coloring service", "default_duration": 90},
    {"name": "Shave", "description": "Professional shaving service", "default_duration": 20},
    {"name": "Beard Trim", "description": "Beard trimming and styling", "default_duration": 15},
]

def seed_services():
    db = SessionLocal()
    try:
        # Check if services already exist
        if db.query(Service).count() == 0:
            for service_data in INITIAL_SERVICES:
                service = Service(
                    id=str(uuid.uuid4()),
                    **service_data
                )
                db.add(service)
            db.commit()
            print("Services seeded successfully!")
        else:
            print("Services already exist, skipping seed.")
    except Exception as e:
        print(f"Error seeding services: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_services() 