from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.core.deps import get_current_user, require_roles
from app.models import User, UserRole, Organization, Opportunity, Task, TaskStatus, Application, ApplicationStatus
from app.schemas.applications import TaskCreate, TaskUpdate, TaskOut

router = APIRouter(prefix="/tasks", tags=["tasks"])

def to_out(db: Session, t: Task) -> TaskOut:
    out = TaskOut.model_validate(t)
    out.opportunity_title = t.opportunity.title if t.opportunity else None
    if t.assigned_to_id:
        u = db.get(User, t.assigned_to_id)
        out.assignee_name = u.full_name if u else None
    return out

@router.post("", response_model=TaskOut)
def create_task(payload: TaskCreate, db: Session = Depends(get_db), current_user: User = Depends(require_roles(UserRole.NGO))):
    org = db.query(Organization).filter(Organization.user_id==current_user.id).first()
    opp = db.get(Opportunity, payload.opportunity_id)
    if not org or not opp or opp.organization_id != org.id:
        raise HTTPException(status_code=403, detail="Not allowed")
    if payload.assigned_to_id:
        # ensure assigned user is approved applicant for this opportunity
        app = db.query(Application).filter(Application.opportunity_id==opp.id, Application.volunteer_id==payload.assigned_to_id, Application.status==ApplicationStatus.APPROVED).first()
        if not app:
            raise HTTPException(status_code=400, detail="Assignee must be an approved volunteer for this opportunity")
    task = Task(**payload.model_dump())
    db.add(task); db.commit(); db.refresh(task)
    return to_out(db, task)

@router.get("/mine", response_model=List[TaskOut])
def my_tasks(db: Session = Depends(get_db), current_user: User = Depends(require_roles(UserRole.VOLUNTEER))):
    tasks = db.query(Task).filter(Task.assigned_to_id==current_user.id).order_by(Task.created_at.desc()).all()
    return [to_out(db,t) for t in tasks]

@router.get("/ngo", response_model=List[TaskOut])
def ngo_tasks(db: Session = Depends(get_db), current_user: User = Depends(require_roles(UserRole.NGO))):
    org = db.query(Organization).filter(Organization.user_id==current_user.id).first()
    if not org:
        return []
    tasks = db.query(Task).join(Opportunity).filter(Opportunity.organization_id==org.id).order_by(Task.created_at.desc()).all()
    return [to_out(db,t) for t in tasks]

@router.patch("/{task_id}", response_model=TaskOut)
def update_task(task_id: int, payload: TaskUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    task = db.get(Task, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    opp = task.opportunity
    org = db.query(Organization).filter(Organization.user_id==current_user.id).first() if current_user.role==UserRole.NGO else None
    if current_user.role == UserRole.VOLUNTEER:
        if task.assigned_to_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not allowed")
        # volunteers can only update status
        if payload.status:
            task.status = TaskStatus(payload.status)
        else:
            raise HTTPException(status_code=400, detail="Volunteers can update task status only")
    elif current_user.role == UserRole.NGO:
        if not org or not opp or opp.organization_id != org.id:
            raise HTTPException(status_code=403, detail="Not allowed")
        data = payload.model_dump(exclude_unset=True)
        if 'assigned_to_id' in data and data['assigned_to_id']:
            app = db.query(Application).filter(Application.opportunity_id==opp.id, Application.volunteer_id==data['assigned_to_id'], Application.status==ApplicationStatus.APPROVED).first()
            if not app:
                raise HTTPException(status_code=400, detail="Assignee must be an approved volunteer")
        for k,v in data.items():
            if k == 'status' and v is not None:
                setattr(task, k, TaskStatus(v))
            else:
                setattr(task, k, v)
    elif current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not allowed")
    db.commit(); db.refresh(task)
    return to_out(db, task)

@router.delete("/{task_id}")
def delete_task(task_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_roles(UserRole.NGO))):
    task = db.get(Task, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    org = db.query(Organization).filter(Organization.user_id==current_user.id).first()
    if not org or task.opportunity.organization_id != org.id:
        raise HTTPException(status_code=403, detail="Not allowed")
    db.delete(task); db.commit()
    return {"ok": True}
