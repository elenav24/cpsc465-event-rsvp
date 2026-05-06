from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.deps.db import get_db
from app.deps.auth import get_current_user_sub
from app.db.models.event_member import EventMember
from app.db.models.potluck import PotluckItem, PotluckClaim
from app.schemas.potluck import PotluckItemCreate, PotluckItemUpdate, PotluckItemOut, PotluckClaimOut
from app.routers._resolve import resolve_event

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


@router.get("/{event_uuid}/potluck", response_model=list[PotluckItemOut])
def get_potluck(
    event_uuid: str,
    user_id: Annotated[str, Depends(get_current_user_sub)],
    db: Annotated[Session, Depends(get_db)],
):
    event = resolve_event(event_uuid, db)
    _require_member(event.id, user_id, db)
    items = db.query(PotluckItem).filter(PotluckItem.event_id == event.id).all()
    return [_build_item_out(i) for i in items]


@router.post("/{event_uuid}/potluck", response_model=PotluckItemOut, status_code=status.HTTP_201_CREATED)
def create_potluck_item(
    event_uuid: str,
    body: PotluckItemCreate,
    user_id: Annotated[str, Depends(get_current_user_sub)],
    db: Annotated[Session, Depends(get_db)],
):
    event = resolve_event(event_uuid, db)
    _require_host_or_cohost(event.id, user_id, db)
    item = PotluckItem(
        event_id=event.id,
        created_by=user_id,
        name=body.name,
        description=body.description,
        quantity_needed=body.quantity_needed,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    result = _build_item_out(item)
    try:
        from app.utils.broadcast import broadcast_event_update
        from app.utils._broadcast_helpers import potluck_dict
        broadcast_event_update(event.id, "potluck", "create", potluck_dict(item))
    except Exception:
        pass
    return result


@router.put("/{event_uuid}/potluck/{item_id}", response_model=PotluckItemOut)
def update_potluck_item(
    event_uuid: str,
    item_id: int,
    body: PotluckItemUpdate,
    user_id: Annotated[str, Depends(get_current_user_sub)],
    db: Annotated[Session, Depends(get_db)],
):
    event = resolve_event(event_uuid, db)
    _require_host_or_cohost(event.id, user_id, db)
    item = db.query(PotluckItem).filter(PotluckItem.id == item_id, PotluckItem.event_id == event.id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Potluck item not found")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(item, field, value)
    db.commit()
    db.refresh(item)
    result = _build_item_out(item)
    try:
        from app.utils.broadcast import broadcast_event_update
        from app.utils._broadcast_helpers import potluck_dict
        broadcast_event_update(event.id, "potluck", "upsert", potluck_dict(item))
    except Exception:
        pass
    return result


@router.delete("/{event_uuid}/potluck/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_potluck_item(
    event_uuid: str,
    item_id: int,
    user_id: Annotated[str, Depends(get_current_user_sub)],
    db: Annotated[Session, Depends(get_db)],
):
    event = resolve_event(event_uuid, db)
    _require_host_or_cohost(event.id, user_id, db)
    item = db.query(PotluckItem).filter(PotluckItem.id == item_id, PotluckItem.event_id == event.id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Potluck item not found")
    db.delete(item)
    db.commit()
    try:
        from app.utils.broadcast import broadcast_event_update
        broadcast_event_update(event.id, "potluck", "delete", {"id": item_id})
    except Exception:
        pass


@router.post("/{event_uuid}/potluck/{item_id}/claim", response_model=PotluckItemOut, status_code=status.HTTP_201_CREATED)
def claim_item(
    event_uuid: str,
    item_id: int,
    user_id: Annotated[str, Depends(get_current_user_sub)],
    db: Annotated[Session, Depends(get_db)],
):
    """Attendee signs up to bring this item."""
    event = resolve_event(event_uuid, db)
    _require_member(event.id, user_id, db)
    item = db.query(PotluckItem).filter(PotluckItem.id == item_id, PotluckItem.event_id == event.id).first()
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
    result = _build_item_out(item)
    try:
        from app.utils.broadcast import broadcast_event_update
        from app.utils._broadcast_helpers import potluck_dict
        broadcast_event_update(event.id, "potluck", "upsert", potluck_dict(item))
    except Exception:
        pass
    return result


@router.delete("/{event_uuid}/potluck/{item_id}/claim", status_code=status.HTTP_204_NO_CONTENT)
def unclaim_item(
    event_uuid: str,
    item_id: int,
    user_id: Annotated[str, Depends(get_current_user_sub)],
    db: Annotated[Session, Depends(get_db)],
):
    """Attendee removes their claim."""
    event = resolve_event(event_uuid, db)
    _require_member(event.id, user_id, db)
    claim = db.query(PotluckClaim).filter(
        PotluckClaim.item_id == item_id,
        PotluckClaim.user_id == user_id,
    ).first()
    if not claim:
        raise HTTPException(status_code=404, detail="No claim found")
    db.delete(claim)
    db.commit()
    # Broadcast updated item state after unclaim
    try:
        from app.utils.broadcast import broadcast_event_update
        from app.utils._broadcast_helpers import potluck_dict
        db.refresh(item)
        broadcast_event_update(event.id, "potluck", "upsert", potluck_dict(item))
    except Exception:
        pass
