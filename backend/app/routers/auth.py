import os
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.database import get_db
from app.models import User
from app.schemas.user import UserCreate, Token, UserOut, RegisterResponse
from app.security import hash_password, verify_password, create_access_token, get_current_user, require_admin

from app.models.auth_otp import AuthOtpChallenge
from app.models.password_reset import PasswordResetToken
from app.otp import generate_otp_code, hash_otp, verify_otp
from app.services.email_service import send_otp_email, send_reset_email



router = APIRouter(prefix="/auth", tags=["auth"])


class LoginResponse(BaseModel):
    requires_2fa: bool
    challenge_id: str | None = None
    access_token: str | None = None
    token_type: str | None = None

class VerifyOtpRequest(BaseModel):
    challenge_id: str
    code: str


class BlockUserRequest(BaseModel):
    blocked: bool

OTP_EXPIRE_MINUTES = int(os.getenv("OTP_EXPIRE_MINUTES", "10"))
OTP_MAX_ATTEMPTS = int(os.getenv("OTP_MAX_ATTEMPTS", "5"))
RESET_EXPIRE_MINUTES = int(os.getenv("RESET_EXPIRE_MINUTES", "30"))
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")


class RecoverRequest(BaseModel):
    email: str

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


@router.post("/register", response_model=RegisterResponse)
def register(user: UserCreate, db: Session = Depends(get_db)):

    if db.query(User).filter(User.email == user.email).first():
        raise HTTPException(status_code=400, detail="Email ya registrado")

    if db.query(User).filter(User.username == user.username).first():
        raise HTTPException(status_code=400, detail="Nombre de usuario ya registrado")

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


@router.post("/login", response_model=LoginResponse)
async def login(payload: dict, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    email = payload.get("email")
    password = payload.get("password")

    if not email or not password:
        raise HTTPException(status_code=400, detail="Email y contraseña son requeridos")

    user = db.query(User).filter(User.email == email).first()
    if not user or not verify_password(password, user.password):
        raise HTTPException(status_code=401, detail="Credenciales inválidas")

    if user.blocked:
        raise HTTPException(status_code = 403, detail = " Su cuenta está bloqueada. Por favor contacte al administrador de Atlas Infancias.")

    # Si ya está verificado, devolver token directo sin 2FA
    if user.verified:
        token = create_access_token({"sub": str(user.id), "role": user.role})
        return LoginResponse(
            requires_2fa=False,
            access_token=token,
            token_type="bearer",
        )

    # No verificado → enviar OTP
    code = generate_otp_code()
    ch = AuthOtpChallenge(
        user_id=user.id,
        code_hash=hash_otp(code),
        expires_at=datetime.utcnow() + timedelta(minutes=OTP_EXPIRE_MINUTES),
    )
    db.add(ch)
    db.commit()
    db.refresh(ch)

    background_tasks.add_task(send_otp_email, user.email, code)

    return LoginResponse(
        requires_2fa=True,
        challenge_id=str(ch.challenge_id),
    )


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

    # Marcar usuario como verificado para que no pida 2FA de nuevo
    user = db.query(User).filter(User.id == ch.user_id).first()
    user.verified = True
    db.commit()

    token = create_access_token({"sub": str(user.id), "role": user.role})
    return {"access_token": token, "token_type": "bearer"}


@router.get("/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)):
    return current_user


@router.post("/token", response_model=Token)
def token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form_data.username).first()

    if not user or not verify_password(form_data.password, user.password):
        raise HTTPException(status_code=401, detail="Credenciales inválidas")

    token = create_access_token({"sub": str(user.id), "role": user.role})
    return {"access_token": token, "token_type": "bearer"}


@router.post("/recover")
async def recover_password(
    req: RecoverRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.email == req.email.lower().strip()).first()

    # Respuesta genérica para no revelar si el correo existe
    generic_response = {"message": "Si ese correo está registrado, recibirás un enlace en breve."}

    if not user:
        return generic_response

    # Invalidar tokens anteriores pendientes del mismo usuario
    db.query(PasswordResetToken).filter(
        PasswordResetToken.user_id == user.id,
        PasswordResetToken.consumed == False,
    ).update({"consumed": True})
    db.commit()

    reset_token = PasswordResetToken(
        user_id=user.id,
        expires_at=datetime.utcnow() + timedelta(minutes=RESET_EXPIRE_MINUTES),
    )
    db.add(reset_token)
    db.commit()
    db.refresh(reset_token)

    reset_url = f"{FRONTEND_URL}/recuperar/nueva-contrasena?token={reset_token.token}"
    background_tasks.add_task(send_reset_email, user.email, reset_url)

    return generic_response


@router.post("/recover/reset")
def reset_password(req: ResetPasswordRequest, db: Session = Depends(get_db)):
    reset_token = db.query(PasswordResetToken).filter(
        PasswordResetToken.token == req.token
    ).first()

    if not reset_token:
        raise HTTPException(status_code=400, detail="Enlace inválido")
    if reset_token.consumed:
        raise HTTPException(status_code=400, detail="Este enlace ya fue usado")
    if datetime.utcnow() > reset_token.expires_at:
        raise HTTPException(status_code=400, detail="El enlace ha expirado")

    if len(req.new_password) < 6:
        raise HTTPException(status_code=400, detail="La contraseña debe tener al menos 6 caracteres")

    user = db.query(User).filter(User.id == reset_token.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    user.password = hash_password(req.new_password)
    reset_token.consumed = True
    db.commit()

    return {"message": "Contraseña actualizada correctamente"}


@router.put("/users/{user_id}/block")
def set_user_block(
    user_id: int,
    req: BlockUserRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    user.blocked = req.blocked
    db.commit()
    db.refresh(user)

    return {"ok": True, "blocked": user.blocked}

