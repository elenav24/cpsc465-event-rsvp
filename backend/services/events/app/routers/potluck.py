from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.deps.db import get_db
from app.deps.auth import get_current_user_sub
from app.db.models.event_member import EventMember
from app.db.models.potluck import PotluckItem, PotluckClaim
from app.schemas.potluck import PotluckItemCreate, PotluckItemUpdate, PotluckItemOut, PotluckClaimOut

router = APIRouter()


def _require_member(event_id: int, user_id: str, db: Session) -> EventMember:
    member = db.query(EventMember).filter(
        EventMember.event_id == event_id,
        EventMember.user_id == user_id,
    ).first()
    if not member:
        raise HTTPException(status_code=403, detail="Not a member of this event")
    return member


def _require_host_or_cohost(event_id: int, user_id: str, db: Session) -> EventMember:
    member = _require_member(event_id, user_id, db)
    if member.role not in ("host", "co_host"):
        raise HTTPException(status_code=403, detail="Host or co-host access required")
    return member


def _build_item_out(item: PotluckItem) -> PotluckItemOut:
    return PotluckItemOut(
        id=item.id,
        event_id=item.event_id,
        created_by=item.created_by,
        name=item.name,
        description=item.description,
        quantity_needed=item.quantity_needed,
        claims_count=len(item.claims),
        claims=[PotluckClaimOut(
            id=c.id, item_id=c.item_id, user_id=c.user_id, claimed_at=c.claimed_at
        ) for c in item.claims],
        created_at=item.created_at,
    )


@router.get("/{event_id}/potluck", response_model=list[PotluckItemOut])
def get_potluck(
    event_id: int,
    user_id: Annotated[str, Depends(get_current_user_sub)],
    db: Annotated[Session, Depends(get_db)],
):
    _require_member(event_id, user_id, db)
    items = db.query(PotluckItem).filter(PotluckItem.event_id == event_id).all()
    return [_build_item_out(i) for i in items]


@router.post("/{event_id}/potluck", response_model=PotluckItemOut, status_code=status.HTTP_201_CREATED)
def create_potluck_item(
    event_id: int,
    body: PotluckItemCreate,
    user_id: Annotated[str, Depends(get_current_user_sub)],
    db: Annotated[Session, Depends(get_db)],
):
    _require_host_or_cohost(event_id, user_id, db)
    item = PotluckItem(
        event_id=event_id,
        created_by=user_id,
        name=body.name,
        description=body.description,
        quantity_needed=body.quantity_needed,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return _build_item_out(item)


@router.put("/{event_id}/potluck/{item_id}", response_model=PotluckItemOut)
def update_potluck_item(
    event_id: int,
    item_id: int,
    body: PotluckItemUpdate,
    user_id: Annotated[str, Depends(get_current_user_sub)],
    db: Annotated[Session, Depends(get_db)],
):
    _require_host_or_cohost(event_id, user_id, db)
    item = db.query(PotluckItem).filter(PotluckItem.id == item_id, PotluckItem.event_id == event_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Potluck item not found")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(item, field, value)
    db.commit()
    db.refresh(item)
    return _build_item_out(item)


@router.delete("/{event_id}/potluck/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_potluck_item(
    event_id: int,
    item_id: int,
    user_id: Annotated[str, Depends(get_current_user_sub)],
    db: Annotated[Session, Depends(get_db)],
):
    _require_host_or_cohost(event_id, user_id, db)
    item = db.query(PotluckItem).filter(PotluckItem.id == item_id, PotluckItem.event_id == event_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Potluck item not found")
    db.delete(item)
    db.commit()


@router.post("/{event_id}/potluck/{item_id}/claim", response_model=PotluckItemOut, status_code=status.HTTP_201_CREATED)
def claim_item(
    event_id: int,
    item_id: int,
    user_id: Annotated[str, Depends(get_current_user_sub)],
    db: Annotated[Session, Depends(get_db)],
):
    """Attendee signs up to bring this item."""
    _require_member(event_id, user_id, db)
    item = db.query(PotluckItem).filter(PotluckItem.id == item_id, PotluckItem.event_id == event_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Potluck item not found")

    existing = db.query(PotluckClaim).filter(
        PotluckClaim.item_id == item_id,
        PotluckClaim.user_id == user_id,
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="You already claimed this item")

    if len(item.claims) >= item.quantity_needed:
        raise HTTPException(status_code=400, detail="This item is fully claimed")

    db.add(PotluckClaim(item_id=item_id, user_id=user_id))
    db.commit()
    db.refresh(item)
    return _build_item_out(item)


@router.delete("/{event_id}/potluck/{item_id}/claim", status_code=status.HTTP_204_NO_CONTENT)
def unclaim_item(
    event_id: int,
    item_id: int,
    user_id: Annotated[str, Depends(get_current_user_sub)],
    db: Annotated[Session, Depends(get_db)],
):
    """Attendee removes their claim."""
    _require_member(event_id, user_id, db)
    claim = db.query(PotluckClaim).filter(
        PotluckClaim.item_id == item_id,
        PotluckClaim.user_id == user_id,
    ).first()
    if not claim:
        raise HTTPException(status_code=404, detail="No claim found")
    db.delete(claim)
    db.commit()
