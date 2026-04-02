from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session

from app.database import get_db
from app import models
from app.schemas import user as user_schema
from app.schemas.user import UpdateUsernameRequest, UpdatePasswordRequest, EmailChangeRequest, EmailChangeConfirm
from app.security import verify_password, hash_password, get_current_user

from app.models.auth_otp import AuthOtpChallenge

from app.otp import generate_otp_code, hash_otp, verify_otp

from app.services.email_service import send_otp_email

from datetime import datetime, timedelta
import os
OTP_EXPIRE_MINUTES = int(os.getenv("OTP_EXPIRE_MINUTES", "10"))
OTP_MAX_ATTEMPTS = int(os.getenv("OTP_MAX_ATTEMPTS", "5"))
router = APIRouter(prefix="/user", tags=["user"])


@router.get("", response_model=list[user_schema.UserOut])
@router.get("/", response_model=list[user_schema.UserOut])
def list_users(db: Session = Depends(get_db)):
    return db.query(models.User).order_by(models.User.id.asc()).all()


@router.patch("/me/username")
def update_username(
    payload: UpdateUsernameRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    new_username = payload.username.strip()

    if len(new_username) < 3:
        raise HTTPException(status_code=400, detail="El username es muy corto")

    exists = db.query(models.User).filter(
        models.User.username == new_username,
        models.User.id != current_user.id
    ).first()

    if exists:
        raise HTTPException(status_code=409, detail="El nombre de usuario ya está en uso")

    current_user.username = new_username
    db.commit()
    db.refresh(current_user)

    return {
        "message": "Nombre de usuario actualizado correctamente",
        "username": current_user.username
    }


@router.patch("/me/password")
def update_password(
    payload: UpdatePasswordRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    # Verificar contraseña actual
    if not verify_password(payload.current_password, current_user.password):
        raise HTTPException(status_code=401, detail="Contraseña actual incorrecta")

    # Evitar reutilizar la misma
    if payload.current_password == payload.new_password:
        raise HTTPException(
            status_code=400,
            detail="La nueva contraseña no puede ser igual a la anterior"
        )

    # Re-cargar el usuario desde esta sesión para garantizar que SQLAlchemy
    # registre el cambio y lo incluya en el commit
    user = db.query(models.User).filter(models.User.id == current_user.id).first()
    user.password = hash_password(payload.new_password)
    db.commit()

    return {"message": "Contraseña actualizada correctamente"}

@router.patch("/me/email/request")
def request_email_change(
    payload: EmailChangeRequest,
    background_task: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    new_email = payload.new_email.lower().strip()

    #Verificacion de la contraseña actual
    if not verify_password(payload.current_password, current_user.password):
        raise HTTPException(status_code=401, detail = "contraseña incorrecta")
    # Verifica que el correo no este en uso
    exists = db.query(models.User).filter(models.User.email == new_email).first()
    if exists:
        raise HTTPException(status_code = 409, detail = "Ese correo ya existe")
    #Guarda correo pendiente 
    current_user.pending_email = new_email
    db.commit()

    #Genera OTP
    code = generate_otp_code()
    ch = AuthOtpChallenge(user_id = current_user.id, code_hash = hash_otp(code), expires_at = datetime.utcnow() + timedelta(minutes= OTP_EXPIRE_MINUTES),)
    db.add(ch)
    db.commit()
    db.refresh(ch)

    background_task.add_task(send_otp_email, new_email, code)
    return {
        "message" : "Te enviamos un codigo al nuevo correo para confirmar el cambio",
        "challenge_id": str(ch.challenge_id),
        "pending_email" : new_email
    }

@router.post("/me/email/confirm")
def confirm_email_change(
    payload: EmailChangeConfirm,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),        
    ):
        if not current_user.pending_email:
            raise HTTPException( status_code = 400, detail = "No hay un cambio de correo pendiente")
        ch = db.query(AuthOtpChallenge).filter(
            AuthOtpChallenge.challenge_id == payload.challenge_id,
            AuthOtpChallenge.user_id == current_user.id
        ). first()


        if not ch:
            raise HTTPException(status_code=400, detail="challenge_id inválido")
        if ch.consumed:
            raise HTTPException(status_code=400, detail="Este código ya fue usado")
        if ch.attempts >= OTP_MAX_ATTEMPTS:
            raise HTTPException(status_code=400, detail="Demasiados intentos")
        if datetime.utcnow() > ch.expires_at:
            raise HTTPException(status_code=400, detail="Codigo expirado")
        
        if not verify_otp(payload.code, ch.code_hash):
            ch.attempts += 1
            db.commit()
            raise HTTPException(status_code = 400, detail = "Codigo Incorrecto")
        #marcar como consumido 
        ch.consumed = True
        
        current_user.email = current_user.pending_email
        current_user.pending_email = None
        current_user.verified = True

        db.commit()
        db.refresh(current_user)
        return{
            "message" : "Correo actualizado correctamente",
            "email": current_user.email
        }

@router.delete("/me", status_code = 204)
def delete_my_account(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    db.delete(current_user)
    db.commit()