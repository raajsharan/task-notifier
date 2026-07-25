import logging

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.config import settings
from app.database import Base, engine, get_db
from app import crud, schemas, models
from app.auth import (
    authenticate_user,
    create_access_token,
    get_current_user,
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("main")

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Task Manager API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_ORIGIN],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------- Auth ----------

@app.post("/api/auth/register", response_model=schemas.UserOut, status_code=status.HTTP_201_CREATED)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    existing = crud.get_user_by_email(db, user.email)
    if existing:
        raise HTTPException(status_code=400, detail="An account with that email already exists")
    return crud.create_user(db, user)


@app.post("/api/auth/login", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    # OAuth2PasswordRequestForm sends "username" — we treat it as the email.
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = create_access_token(subject=user.email)
    return schemas.Token(access_token=token)


@app.get("/api/auth/me", response_model=schemas.UserOut)
def read_me(current_user: models.User = Depends(get_current_user)):
    return current_user


# ---------- Task CRUD API (used by the React frontend, scoped per user) ----------

@app.get("/api/tasks", response_model=list[schemas.TaskOut])
def list_tasks(
    db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)
):
    return crud.get_tasks(db, owner_id=current_user.id)


@app.post("/api/tasks", response_model=schemas.TaskOut, status_code=status.HTTP_201_CREATED)
def create_task(
    task: schemas.TaskCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    return crud.create_task(db, task, owner_id=current_user.id)


@app.patch("/api/tasks/{task_id}", response_model=schemas.TaskOut)
def update_task(
    task_id: int,
    updates: schemas.TaskUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    updated = crud.update_task(db, task_id, updates, owner_id=current_user.id)
    if not updated:
        raise HTTPException(status_code=404, detail="Task not found")
    return updated


@app.delete("/api/tasks/{task_id}")
def delete_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    ok = crud.delete_task(db, task_id, owner_id=current_user.id)
    if not ok:
        raise HTTPException(status_code=404, detail="Task not found")
    return {"deleted": True}


@app.get("/api/health")
def health():
    return {"status": "ok"}
