from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.deps.db import get_db
from app.deps.auth import get_current_user_sub
from app.db.models.event_member import EventMember
from app.db.models.task import Task
from app.schemas.task import TaskCreate, TaskUpdate, TaskOut
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


@router.get("/{event_uuid}/tasks", response_model=list[TaskOut])
def get_tasks(
    event_uuid: str,
    user_id: Annotated[str, Depends(get_current_user_sub)],
    db: Annotated[Session, Depends(get_db)],
):
    event = resolve_event(event_uuid, db)
    _require_member(event.id, user_id, db)
    return db.query(Task).filter(Task.event_id == event.id).order_by(Task.created_at).all()


@router.post("/{event_uuid}/tasks", response_model=TaskOut, status_code=status.HTTP_201_CREATED)
def create_task(
    event_uuid: str,
    body: TaskCreate,
    user_id: Annotated[str, Depends(get_current_user_sub)],
    db: Annotated[Session, Depends(get_db)],
):
    event = resolve_event(event_uuid, db)
    _require_host_or_cohost(event.id, user_id, db)

    # Validate assigned_to is a member if provided
    if body.assigned_to:
        assignee = db.query(EventMember).filter(
            EventMember.event_id == event.id,
            EventMember.user_id == body.assigned_to,
        ).first()
        if not assignee:
            raise HTTPException(status_code=400, detail="Assigned user is not a member of this event")

    task = Task(
        event_id=event.id,
        created_by=user_id,
        title=body.title,
        description=body.description,
        assigned_to=body.assigned_to,
        due_date=body.due_date,
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    try:
        from app.utils.broadcast import broadcast_event_update
        from app.utils._broadcast_helpers import task_dict
        broadcast_event_update(event.id, "task", "create", task_dict(task))
    except Exception:
        pass
    return task


@router.put("/{event_uuid}/tasks/{task_id}", response_model=TaskOut)
def update_task(
    event_uuid: str,
    task_id: int,
    body: TaskUpdate,
    user_id: Annotated[str, Depends(get_current_user_sub)],
    db: Annotated[Session, Depends(get_db)],
):
    """
    Host/co-host can update any field.
    Regular members can only mark a task complete/incomplete if it's assigned to them,
    or volunteer (assign themselves) to an unassigned task.
    """
    event = resolve_event(event_uuid, db)
    member = _require_member(event.id, user_id, db)
    task = db.query(Task).filter(Task.id == task_id, Task.event_id == event.id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    is_privileged = member.role in ("host", "co_host")

    if is_privileged:
        # Validate assigned_to if being changed
        if body.assigned_to is not None:
            assignee = db.query(EventMember).filter(
                EventMember.event_id == event.id,
                EventMember.user_id == body.assigned_to,
            ).first()
            if not assignee:
                raise HTTPException(status_code=400, detail="Assigned user is not a member of this event")
        for field, value in body.model_dump(exclude_unset=True).items():
            setattr(task, field, value)
    else:
        # Attendees: can volunteer for unassigned tasks or complete their own
        if body.assigned_to is not None and body.assigned_to != user_id:
            raise HTTPException(status_code=403, detail="You can only assign tasks to yourself")
        if body.assigned_to == user_id and task.assigned_to is not None and task.assigned_to != user_id:
            raise HTTPException(status_code=403, detail="Task is already assigned to someone else")
        if body.is_completed is not None:
            if task.assigned_to != user_id:
                raise HTTPException(status_code=403, detail="Only the assigned member can complete this task")
            task.is_completed = body.is_completed
        if body.assigned_to is not None:
            task.assigned_to = body.assigned_to

    db.commit()
    db.refresh(task)
    try:
        from app.utils.broadcast import broadcast_event_update
        from app.utils._broadcast_helpers import task_dict
        broadcast_event_update(event.id, "task", "upsert", task_dict(task))
    except Exception:
        pass
    return task


@router.delete("/{event_uuid}/tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(
    event_uuid: str,
    task_id: int,
    user_id: Annotated[str, Depends(get_current_user_sub)],
    db: Annotated[Session, Depends(get_db)],
):
    event = resolve_event(event_uuid, db)
    _require_host_or_cohost(event.id, user_id, db)
    task = db.query(Task).filter(Task.id == task_id, Task.event_id == event.id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    db.delete(task)
    db.commit()
    try:
        from app.utils.broadcast import broadcast_event_update
        broadcast_event_update(event.id, "task", "delete", {"id": task_id})
    except Exception:
        pass
