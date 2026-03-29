
import os
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.database import get_db
from app.models import User
from app.schemas.user import UserCreate, Token, UserOut, RegisterResponse
from app.security import hash_password, verify_password, create_access_token, get_current_user

from app.models.auth_otp import AuthOtpChallenge
from app.otp import generate_otp_code, hash_otp, verify_otp
from app.services.email_service import send_otp_email



router = APIRouter(prefix="/auth", tags=["auth"])


class LoginStep1Response(BaseModel):
    requires_2fa: bool = True
    challenge_id: str

class VerifyOtpRequest(BaseModel):
    challenge_id: str
    code: str

OTP_EXPIRE_MINUTES = int(os.getenv("OTP_EXPIRE_MINUTES", "10"))
OTP_MAX_ATTEMPTS = int(os.getenv("OTP_MAX_ATTEMPTS", "5"))



#pruebap pára usuario y contraseña

#joshuaprueba@gmail.com
#joshuaprueba de contraseña


@router.post("/register", response_model=RegisterResponse)
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


    return {"message": "Usuario creado. Inicia sesión para recibir el código 2FA."}



@router.post("/login", response_model=LoginStep1Response)
async def login_step1(payload: dict, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    email = payload.get("email")
    password = payload.get("password")

    user = db.query(User).filter(User.email == email).first()
    if not user or not verify_password(password, user.password):
        raise HTTPException(status_code=401, detail="Credenciales inválidas")

    code = generate_otp_code()
    ch = AuthOtpChallenge(
        user_id=user.id,
        code_hash=hash_otp(code),
        expires_at=datetime.utcnow() + timedelta(minutes=OTP_EXPIRE_MINUTES),
    )
    db.add(ch)
    db.commit()
    db.refresh(ch)

    #  Enviar OTP por correo en background 
    background_tasks.add_task(send_otp_email, user.email, code)

    return {"requires_2fa": True, "challenge_id": str(ch.challenge_id)}



@router.get("/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)):
    return current_user

#despues hay que quitar esto cuando ya este la app de verdad
@router.post("/token", response_model=Token)
def token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    # En OAuth2, el campo se llama username aunque se use email
    user = db.query(User).filter(User.email == form_data.username).first()

    if not user or not verify_password(form_data.password, user.password):
        raise HTTPException(status_code=401, detail="Credenciales inválidas")

    token = create_access_token({"sub": str(user.id), "role": user.role})
    return {"access_token": token, "token_type": "bearer"}

@router.post("/2fa/verify", response_model=Token)
def verify_otp_step2(req: VerifyOtpRequest, db: Session = Depends(get_db)):
    ch = db.query(AuthOtpChallenge).filter(AuthOtpChallenge.challenge_id == req.challenge_id).first()
    if not ch:
        raise HTTPException(status_code=400, detail="challenge_id inválido")
    if ch.consumed:
        raise HTTPException(status_code=400, detail="Este código ya fue usado")
    if ch.attempts >= OTP_MAX_ATTEMPTS:
        raise HTTPException(status_code=400, detail="Demasiados intentos")
    if datetime.utcnow() > ch.expires_at:
        raise HTTPException(status_code=400, detail="Código expirado")

    if not verify_otp(req.code, ch.code_hash):
        ch.attempts += 1
        db.commit()
        raise HTTPException(status_code=400, detail="Código incorrecto")

    ch.consumed = True
    db.commit()

    user = db.query(User).filter(User.id == ch.user_id).first()
    token = create_access_token({"sub": str(user.id), "role": user.role})
    return {"access_token": token, "token_type": "bearer"}

@router.get("/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)):
    return current_user

