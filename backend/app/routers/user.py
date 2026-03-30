from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app import models
from app.schemas import user as user_schema
from app.schemas.user import UpdateUsernameRequest, UpdatePasswordRequest
from app.security import verify_password, hash_password, get_current_user

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

    # Guardar hash nuevo
    current_user.password = hash_password(payload.new_password)
    db.commit()

    return {"message": "Contraseña actualizada correctamente"}