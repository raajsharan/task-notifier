from datetime import date
from sqlalchemy.orm import Session
from app import models, schemas
from app.auth import hash_password


# ---------- Users ----------

def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()


def create_user(db: Session, user: schemas.UserCreate) -> models.User:
    db_user = models.User(email=user.email, hashed_password=hash_password(user.password))
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


# ---------- Tasks (always scoped to the owning user) ----------

def create_task(db: Session, task: schemas.TaskCreate, owner_id: int) -> models.Task:
    db_task = models.Task(**task.model_dump(), owner_id=owner_id)
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return db_task


def get_tasks(db: Session, owner_id: int):
    return (
        db.query(models.Task)
        .filter(models.Task.owner_id == owner_id)
        .order_by(models.Task.due_date.asc())
        .all()
    )


def get_task(db: Session, task_id: int, owner_id: int):
    return (
        db.query(models.Task)
        .filter(models.Task.id == task_id, models.Task.owner_id == owner_id)
        .first()
    )


def update_task(db: Session, task_id: int, updates: schemas.TaskUpdate, owner_id: int):
    db_task = get_task(db, task_id, owner_id)
    if not db_task:
        return None
    for field, value in updates.model_dump(exclude_unset=True).items():
        setattr(db_task, field, value)
    db.commit()
    db.refresh(db_task)
    return db_task


def delete_task(db: Session, task_id: int, owner_id: int) -> bool:
    db_task = get_task(db, task_id, owner_id)
    if not db_task:
        return False
    db.delete(db_task)
    db.commit()
    return True


def get_today_tasks(db: Session, owner_id: int):
    return (
        db.query(models.Task)
        .filter(models.Task.owner_id == owner_id, models.Task.due_date == date.today())
        .order_by(models.Task.id.asc())
        .all()
    )


def get_pending_tasks(db: Session, owner_id: int, include_today: bool = False):
    query = db.query(models.Task).filter(
        models.Task.owner_id == owner_id, models.Task.status == models.TaskStatus.pending
    )
    if include_today:
        query = query.filter(models.Task.due_date <= date.today())
    else:
        query = query.filter(models.Task.due_date < date.today())
    return query.order_by(models.Task.due_date.asc()).all()
