import os
import sys

# Ensure backend directory is in python path
sys.path.append(os.path.abspath(os.path.dirname(__file__)))

from dotenv import load_dotenv
load_dotenv()

from app.database.base import Base
# Import all models to register them on Base.metadata
from app.models.user import User, UserProfile
from app.models.college import College
from app.models.event import Event
from app.models.registration import EventRegistration
from app.models.attendance import Attendance
from app.models.certificate import Certificate
from app.models.notification import Notification
from app.models.organizer import Organizer
from app.models.payment import Payment
from app.models.result import Result

from sqlalchemy import create_engine

def dump_sql():
    engine = create_engine('postgresql://')
    output_file = "campusconnect_schema.sql"
    
    with open(output_file, "w") as f:
        f.write("-- =====================================================\n")
        f.write("-- CampusConnect Database Schema (PostgreSQL DDL)\n")
        f.write("-- =====================================================\n\n")
        
        def mock_executor(sql, *multiparams, **params):
            statement = str(sql.compile(dialect=engine.dialect))
            # Clean up compile dialect output
            f.write(statement + ";\n\n")
            
        mock_engine = create_engine('postgresql://', strategy='mock', executor=mock_executor)
        Base.metadata.create_all(mock_engine)
        
    print(f"SUCCESS: Schema DDL successfully written to {output_file}")

if __name__ == "__main__":
    dump_sql()
