from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User
from app.schemas.user import UserCreate, UserLogin, Token, UserOut
from app.security import hash_password, verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])

#pruebap pára usuario y contraseña

#joshuaprueba@gmail.com
#joshuaprueba de contraseña


@router.post("/register", response_model=Token)
def register(user: UserCreate, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == user.email).first():
        raise HTTPException(status_code=400, detail="Email ya registrado")

    new_user = User(
        username=user.username,
        email=user.email,
        password=hash_password(user.password),
        gender=user.gender,
        role="user",
        verified=False
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    token = create_access_token({"sub": str(new_user.id), "role": new_user.role})
    return {"access_token": token, "token_type": "bearer"}



@router.post("/login", response_model=Token)
def login(data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()

    if not user or not verify_password(data.password, user.password):
        raise HTTPException(status_code=401, detail="Credenciales inválidas")

    token = create_access_token({"sub": str(user.id), "role": user.role})
    return {"access_token": token, "token_type": "bearer"}


@router.get("/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)):
    return current_user


@router.post("/token", response_model=Token)
def token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    # En OAuth2, el campo se llama username aunque se use email
    user = db.query(User).filter(User.email == form_data.username).first()

    if not user or not verify_password(form_data.password, user.password):
        raise HTTPException(status_code=401, detail="Credenciales inválidas")

    token = create_access_token({"sub": str(user.id), "role": user.role})
    return {"access_token": token, "token_type": "bearer"}
