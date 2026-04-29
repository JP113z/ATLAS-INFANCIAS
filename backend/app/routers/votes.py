import random
import string
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.database import get_db
from app.models import User
from app.models.sticker import Sticker
from app.models.vote_session import VoteSession
from app.models.vote_answer import VoteAnswer
from app.security import get_current_user, require_admin, get_optional_user
from typing import Optional

router = APIRouter(prefix="/votes", tags=["votes"])


# ─── Schemas ───────────────────────────────────────────────────────────────

class CreateVoteSessionRequest(BaseModel):
    sticker_id: int
    question: str


class SubmitVoteRequest(BaseModel):
    answer: bool


# ─── Helpers ───────────────────────────────────────────────────────────────

def _generate_code(length: int = 6) -> str:
    return "".join(random.choices(string.ascii_lowercase + string.digits, k=length))


def _session_to_dict(session: VoteSession, sticker: Sticker | None) -> dict:
    """Construye el dict de respuesta incluyendo la ubicación del sticker."""
    lat = lon = category = None
    if sticker and sticker.geojson:
        try:
            coords = sticker.geojson.get("geometry", {}).get("coordinates", [])
            if len(coords) >= 2:
                lon, lat = float(coords[0]), float(coords[1])
            category = sticker.category
        except Exception:
            pass

    return {
        "id": session.id,
        "code": session.code,
        "sticker_id": session.sticker_id,
        "question": session.question,
        "active": session.active,
        "created_by": session.created_by,
        "created_at": session.created_at.isoformat() if session.created_at else None,
        "sticker_lat": lat,
        "sticker_lon": lon,
        "sticker_category": category,
    }


# ─── Endpoints ─────────────────────────────────────────────────────────────

@router.post("")
def create_vote_session(
    payload: CreateVoteSessionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    sticker = db.query(Sticker).filter(Sticker.id == payload.sticker_id).first()
    if not sticker:
        raise HTTPException(status_code=404, detail="Sticker no encontrado")

    if not payload.question.strip():
        raise HTTPException(status_code=400, detail="La pregunta no puede estar vacía")

    # Generar código único
    for _ in range(10):
        code = _generate_code()
        if not db.query(VoteSession).filter(VoteSession.code == code).first():
            break
    else:
        raise HTTPException(status_code=500, detail="No se pudo generar un código único")

    session = VoteSession(
        code=code,
        sticker_id=payload.sticker_id,
        question=payload.question.strip(),
        created_by=current_user.id,
    )
    db.add(session)
    db.commit()
    db.refresh(session)

    return _session_to_dict(session, sticker)


@router.get("/{code}")
def get_vote_session(code: str, db: Session = Depends(get_db)):
    session = db.query(VoteSession).filter(VoteSession.code == code).first()
    if not session:
        raise HTTPException(status_code=404, detail="Sesión de votación no encontrada")

    sticker = db.query(Sticker).filter(Sticker.id == session.sticker_id).first()
    return _session_to_dict(session, sticker)


@router.post("/{code}/answer")
def submit_vote(
    code: str,
    payload: SubmitVoteRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    session = db.query(VoteSession).filter(VoteSession.code == code).first()
    if not session:
        raise HTTPException(status_code=404, detail="Sesión de votación no encontrada")
    if not session.active:
        raise HTTPException(status_code=400, detail="Esta votación ya finalizó")

    # Solo verificar voto duplicado si el usuario tiene cuenta
    if current_user is not None:
        already_voted = db.query(VoteAnswer).filter(
            VoteAnswer.session_id == session.id,
            VoteAnswer.user_id == current_user.id,
        ).first()
        if already_voted:
            raise HTTPException(status_code=400, detail="Ya registraste tu voto en esta sesión")

    vote = VoteAnswer(
        session_id=session.id,
        user_id=current_user.id if current_user else None,
        answer=payload.answer,
    )
    db.add(vote)
    db.commit()

    return {"message": "Voto registrado correctamente"}


@router.get("/{code}/results")
def get_vote_results(code: str, db: Session = Depends(get_db)):
    session = db.query(VoteSession).filter(VoteSession.code == code).first()
    if not session:
        raise HTTPException(status_code=404, detail="Sesión de votación no encontrada")

    answers = db.query(VoteAnswer).filter(VoteAnswer.session_id == session.id).all()
    total = len(answers)
    in_favor = sum(1 for a in answers if a.answer)
    against = total - in_favor

    return {
        "question": session.question,
        "total": total,
        "in_favor": in_favor,
        "against": against,
        "percent_favor": round(in_favor / total * 100) if total > 0 else 0,
        "percent_against": round(against / total * 100) if total > 0 else 0,
    }


@router.put("/{code}/end")
def end_vote_session(
    code: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    session = db.query(VoteSession).filter(VoteSession.code == code).first()
    if not session:
        raise HTTPException(status_code=404, detail="Sesión de votación no encontrada")
    if not session.active:
        raise HTTPException(status_code=400, detail="Esta votación ya estaba finalizada")

    session.active = False
    db.commit()

    return {"message": "Votación finalizada"}


@router.get("/{code}/voters")
def get_voter_count(code: str, db: Session = Depends(get_db)):
    session = db.query(VoteSession).filter(VoteSession.code == code).first()
    if not session:
        raise HTTPException(status_code=404, detail="Sesión de votación no encontrada")

    count = db.query(VoteAnswer).filter(VoteAnswer.session_id == session.id).count()
    return {"count": count}
