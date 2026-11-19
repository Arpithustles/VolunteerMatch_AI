from sqlalchemy import inspect, text

from app.db.session import engine


VOLUNTEER_PROFILE_COLUMNS = {
    "date_of_birth": "DATE",
    "gender": "VARCHAR(50)",
    "address": "TEXT",
    "city": "VARCHAR(100)",
    "state": "VARCHAR(100)",
    "pincode": "VARCHAR(20)",
    "profession": "VARCHAR(100)",
    "profession_details": "TEXT",
    "maximum_travel_distance": "INTEGER",
    "willing_to_travel": "BOOLEAN",
    "volunteering_preference": "VARCHAR(50)",
    "weekday_availability": "BOOLEAN",
    "weekend_availability": "BOOLEAN",
    "skill_proficiency": "TEXT",
    "safety_declaration": "VARCHAR(50)",
    "profile_status": "VARCHAR(40) NOT NULL DEFAULT 'registered'",
}


def migrate_existing_schema() -> None:
    """Apply additive changes needed by databases created before these profile fields existed."""
    inspector = inspect(engine)
    if "volunteer_profiles" not in inspector.get_table_names():
        return
    existing = {column["name"] for column in inspector.get_columns("volunteer_profiles")}
    with engine.begin() as connection:
        for name, sql_type in VOLUNTEER_PROFILE_COLUMNS.items():
            if name not in existing:
                connection.execute(text(f"ALTER TABLE volunteer_profiles ADD COLUMN {name} {sql_type}"))
