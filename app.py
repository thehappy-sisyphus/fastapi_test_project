from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from db import SessionLocal, engine, Item, User, verify_password, hash_password  # Import User and verify_password
from pydantic import BaseModel
import jwt
import datetime


app = FastAPI()

SECRET_KEY = "mysecretkey"
ALGORITHM = "HS256"

# Dependency to get a database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Defines what is needed to register
class UserCreate(BaseModel):
    username: str
    password: str

# Defines what is needed to login
class LoginRequest(BaseModel):
    username: str
    password: str

#Login endpoint. Call to get token
@app.post("/login/")
def login(request: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == request.username).first()

    if not user or not verify_password(request.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect username or password")

    #Generate a JWT token
    payload = {
        "sub": user.username,
        "exp": datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=1)
    }
    token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
    
    return {"access_token": token, "token_type": "bearer"}

# Register endpoint
@app.post("/register/")
def register(request: UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.username == request.username).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Username is already taken")
    
    new_user = User(username=request.username, hashed_password=hash_password(request.password))

    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return {"message": "User created successfully"}


# Setting up user authentication
from fastapi import Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

security = HTTPBearer()
def get_current_user(credentials: HTTPAuthorizationCredentials = Security(security)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
        return username
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


# Pydantic model for API requests
class ItemCreate(BaseModel):
    name: str
    price: int
    description: str = None

# Endpoint to create an item (POST request)
@app.post("/items/")
def create_item(item: ItemCreate, db: Session = Depends(get_db), username: str = Depends(get_current_user)):
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
def update_item(item_id: int, item: ItemCreate, db: Session = Depends(get_db), username: str = Depends(get_current_user)):
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
def delete_item(item_id: int, db: Session = Depends(get_db), username: str = Depends(get_current_user)):
    db_item = db.query(Item).filter(Item.id == item_id).first()
    if not db_item:
        return {"error": "Item not found"}

    db.delete(db_item)
    db.commit()
    return {"message": f"Item {item_id} deleted successfully"}