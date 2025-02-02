from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
from database import SessionLocal, engine, Item
from pydantic import BaseModel

app = FastAPI()

# Dependency to get a database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Pydantic model for API requests
class ItemCreate(BaseModel):
    name: str
    price: int
    description: str = None

# Endpoint to create an item (POST request)
@app.post("/items/")
def create_item(item: ItemCreate, db: Session = Depends(get_db)):
    db_item = Item(name=item.name, price=item.price, description=item.description)
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

# Endpoint to retrieve all items (GET request)
from typing import Optional

@app.get("/items/")
def get_items(
    db: Session = Depends(get_db),
    name: Optional[str] = None,
    min_price: Optional[int] = None,
    max_price: Optional[int] = None
):
    query = db.query(Item)

    if name: 
        query = query.filter(Item.name.ilike(f"%{name}%"))
    if min_price:
        query = query.filter(Item.price >= min_price)
    if max_price:
        query = query.filter(Item.price <= max_price)

    return query.all()


@app.put("/items/{item_id}")
def update_item(item_id: int, item: ItemCreate, db: Session = Depends(get_db)):
    db_item = db.query(Item).filter(Item.id == item_id).first()
    if not db_item:
        return{"error": "Item not found"}
    db_item.name = item.name
    db_item.price = item.price
    db_item.description = item.description
    db.commit()
    db.refresh(db_item)
    return db_item


@app.delete("/items/{item_id}")
def delete_item(item_id: int, db: Session = Depends(get_db)):
    db_item = db.query(Item).filter(Item.id == item_id).first()
    if not db_item:
        return {"error": "Item not found"}

    db.delete(db_item)
    db.commit()
    return {"message": f"Item {item_id} deleted successfully"}

from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow requests from any frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
