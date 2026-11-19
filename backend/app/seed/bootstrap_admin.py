from getpass import getpass

from email_validator import EmailNotValidError, validate_email

from app.core.security import get_password_hash
from app.db.session import SessionLocal
from app.models import User, UserRole


def main() -> None:
    email_input = input("Initial administrator email: ").strip()
    try:
        email = validate_email(email_input, check_deliverability=False).normalized.lower()
    except EmailNotValidError as error:
        raise SystemExit(f"Invalid email address: {error}") from error

    full_name = input("Administrator name: ").strip()
    if not full_name:
        raise SystemExit("Administrator name cannot be empty")

    password = getpass("Administrator password (minimum 12 characters): ")
    confirmation = getpass("Confirm administrator password: ")
    if len(password) < 12:
        raise SystemExit("Administrator password must contain at least 12 characters")
    if password != confirmation:
        raise SystemExit("Passwords do not match")

    with SessionLocal() as db:
        if db.query(User).filter(User.email == email).first():
            raise SystemExit("An account already uses this email address")
        if db.query(User).filter(User.role == UserRole.ADMIN).first():
            raise SystemExit("An administrator already exists; use the admin account-management workflow")
        db.add(User(
            email=email,
            full_name=full_name,
            hashed_password=get_password_hash(password),
            role=UserRole.ADMIN,
        ))
        db.commit()
    print("Initial administrator account created.")


if __name__ == "__main__":
    main()
