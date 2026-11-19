
from datetime import date, timedelta
from sqlalchemy.orm import Session
from app.models import (
    User, UserRole, VolunteerProfile, Organization, Opportunity, OpportunityStatus,
    Application, ApplicationStatus, Schedule, ScheduleStatus, Task, TaskStatus,
    Participation, Feedback
)
from app.core.security import get_password_hash

def seed_if_empty(db: Session):
    if db.query(User).first():
        return

    # Admin
    admin = User(
        email="admin@volunteermatch.ai",
        full_name="Platform Admin",
        hashed_password=get_password_hash("Admin@123"),
        role=UserRole.ADMIN,
    )
    db.add(admin)

    # NGOs (3+)
    ngo_specs = [
        ("ngo1@volunteermatch.ai", "Udaan Welfare Foundation", "Udaan Welfare Foundation", "Ghaziabad, UP", "Empowering communities through education and digital access."),
        ("ngo2@volunteermatch.ai", "GreenEarth NCR Initiative", "GreenEarth NCR Initiative", "Noida, UP", "Environmental restoration, cleanups, and sustainability drives."),
        ("ngo3@volunteermatch.ai", "Sanjeevani Care Trust", "Sanjeevani Care Trust", "Delhi NCR", "Healthcare outreach, blood donation camps, and wellness support."),
        ("ngo4@volunteermatch.ai", "HopeBridge Learning", "HopeBridge Learning", "Remote / NCR", "Remote mentoring and learning support for underserved students."),
        ("events@volunteermatch.ai", "NCR Live Events", "NCR Live Events", "Delhi NCR", "Concerts, cultural nights, carnivals and live entertainment across the capital region."),
        ("campus@volunteermatch.ai", "Symbiosis Institute Noida", "Symbiosis Institute Noida", "Noida, UP", "Student-led college festivals, cultural nights and campus events."),
        ("sports@volunteermatch.ai", "RunNCR Sports Foundation", "RunNCR Sports Foundation", "Noida, UP", "Marathons, races and community sports events."),
        ("civic@volunteermatch.ai", "District Outreach Cell", "District Outreach Cell", "Delhi", "Government awareness campaigns, civic drives and public outreach."),
        ("summit@volunteermatch.ai", "TechSummit India", "TechSummit India", "Noida, UP", "Conferences, summits and professional networking events."),
    ]
    ngos = []
    orgs = []
    for email, name, org_name, loc, mission in ngo_specs:
        u = User(email=email, full_name=name, hashed_password=get_password_hash("Ngo@123"), role=UserRole.NGO)
        db.add(u); db.flush()
        o = Organization(user_id=u.id, name=org_name, location=loc, mission=mission, description=mission, phone="9990001111")
        db.add(o); db.flush()
        ngos.append(u); orgs.append(o)

    # Volunteers (10+)
    vol_specs = [
        ("volunteer@volunteermatch.ai","Arpit Singh","Python,Teaching,Communication","Education,Technology,Community Development","Saturday,Sunday","Morning,Afternoon","Ghaziabad, UP","Intermediate experience mentoring students","any"),
        ("anshika@volunteermatch.ai","Anshika Sharma","Design,Social Media,Communication","Environment,Education","Saturday","Morning","Noida, UP","Organized awareness campaigns","hybrid"),
        ("archita@volunteermatch.ai","Archita Katiyar","Teaching,Web Dev,First Aid","Education,Digital Literacy,Healthcare","Saturday,Sunday","Morning","Indirapuram, Ghaziabad","Volunteer tutor and basic web developer","on-site"),
        ("arjun@volunteermatch.ai","Arjun Singh","Event Management,Public Speaking","Environment,Community Development","Sunday","Morning","Delhi","Led local cleanup events","on-site"),
        ("aditya@volunteermatch.ai","Aditya Kumar","Python,Data Entry,Research","Technology,Education","Weekdays","Evening","Remote","Beginner data and research support","remote"),
        ("riya@volunteermatch.ai","Riya Verma","First Aid,Nursing Basics,Communication","Healthcare,Community Development","Saturday","Afternoon","Noida, UP","Health camp volunteer experience","on-site"),
        ("kabir@volunteermatch.ai","Kabir Mehta","Web Dev,UI Design,Social Media","Digital Literacy,Education","Sunday","Evening","Remote","Built small websites for NGOs","remote"),
        ("neha@volunteermatch.ai","Neha Gupta","Teaching,English,Public Speaking","Education,Women Empowerment","Saturday,Sunday","Morning,Evening","Ghaziabad, UP","Tutored school children in English and math","any"),
        ("rahul@volunteermatch.ai","Rahul Jain","Photography,Event Management,Logistics","Environment,Healthcare","Saturday","Morning,Afternoon","Delhi NCR","Managed event logistics and documentation","hybrid"),
        ("sana@volunteermatch.ai","Sana Ali","Content Writing,Research,Communication","Education,Technology","Weekdays,Saturday","Evening","Remote","Created educational content and reports","remote"),
        ("vikram@volunteermatch.ai","Vikram Rao","Teaching,Python,Web Dev","Digital Literacy,Technology","Sunday","Afternoon","Noida, UP","Conducted coding workshops for beginners","hybrid"),
    ]
    vols = []
    for email,name,skills,interests,days,slots,loc,exp,remote_pref in vol_specs:
        u = User(email=email, full_name=name, hashed_password=get_password_hash("Volunteer@123"), role=UserRole.VOLUNTEER)
        db.add(u); db.flush()
        p = VolunteerProfile(
            user_id=u.id,
            phone="9876543210",
            location=loc,
            profession="Other",
            education="Bachelor's Degree",
            skills=skills,
            interests=interests,
            experience=exp,
            preferred_categories=interests,
            availability_days=days,
            available_time_slots=slots,
            remote_preference=remote_pref,
            languages="English,Hindi",
            description=f"{name} is interested in contributing to community initiatives.",
        )
        db.add(p)
        vols.append(u)

    today = date.today()
    def d(offset):
        return today + timedelta(days=offset)

    def img(photo_id: str) -> str:
        return f"https://images.unsplash.com/{photo_id}?auto=format&fit=crop&w=1200&q=80"

    opps = [
        Opportunity(organization_id=orgs[0].id, title="Weekend Teaching Volunteer", description="Teach basic math and communication skills to children during weekend learning sessions.", category="NGOs & Social Causes", required_skills="Teaching,Communication", preferred_skills="Public Speaking", experience_required="Beginner", location="Ghaziabad, UP", mode="on-site", start_date=d(10), end_date=d(40), available_days="Saturday,Sunday", working_hours="10:00-13:00", volunteers_required=5, application_deadline=d(7), cover_image=img("photo-1497486751825-1233686d5d80"), is_demo=True, status=OpportunityStatus.OPEN),
        Opportunity(organization_id=orgs[0].id, title="Digital Literacy Camp Mentor", description="Help students learn basic computer usage, internet safety, and introductory coding.", category="Workshops & Seminars", required_skills="Teaching,Web Dev", preferred_skills="Python", experience_required="Intermediate", location="Indirapuram, Ghaziabad", mode="on-site", start_date=d(12), end_date=d(30), available_days="Saturday", working_hours="09:00-14:00", volunteers_required=4, application_deadline=d(9), cover_image=img("photo-1516321318423-f06f85e504b3"), is_demo=True, status=OpportunityStatus.OPEN),
        Opportunity(organization_id=orgs[1].id, title="Riverbank Clean-Up Drive", description="Participate in waste collection and awareness activities along the riverbank.", category="Environmental Campaigns", required_skills="Event Management", preferred_skills="Public Speaking", experience_required="Beginner", location="Noida, UP", mode="on-site", start_date=d(6), end_date=d(6), available_days="Sunday", working_hours="07:00-11:00", volunteers_required=12, application_deadline=d(4), cover_image=img("photo-1618477388954-7852f32655ec"), is_demo=True, status=OpportunityStatus.OPEN),
        Opportunity(organization_id=orgs[1].id, title="Tree Plantation Coordinator", description="Coordinate volunteers and manage sapling plantation logistics in local parks.", category="Environmental Campaigns", required_skills="Event Management,Logistics", preferred_skills="Communication", experience_required="Intermediate", location="Delhi NCR", mode="on-site", start_date=d(14), end_date=d(14), available_days="Saturday", working_hours="08:00-12:00", volunteers_required=6, application_deadline=d(11), cover_image=img("photo-1416879595882-3373a0480b5b"), is_demo=True, status=OpportunityStatus.OPEN),
        Opportunity(organization_id=orgs[2].id, title="Community Health Camp Assistant", description="Assist staff with registrations, guidance, and basic support at a community health camp.", category="NGOs & Social Causes", required_skills="Communication,First Aid", preferred_skills="Nursing Basics", experience_required="Beginner", location="Noida, UP", mode="on-site", start_date=d(9), end_date=d(9), available_days="Saturday", working_hours="09:00-15:00", volunteers_required=8, application_deadline=d(6), cover_image=img("photo-1576091160399-112ba8d25d1d"), is_demo=True, status=OpportunityStatus.OPEN),
        Opportunity(organization_id=orgs[2].id, title="Blood Donation Camp Volunteer", description="Support donor registration, help desks, and post-donation care coordination.", category="NGOs & Social Causes", required_skills="Communication,Event Management", preferred_skills="First Aid", experience_required="Beginner", location="Delhi", mode="on-site", start_date=d(20), end_date=d(20), available_days="Sunday", working_hours="10:00-16:00", volunteers_required=10, application_deadline=d(16), cover_image=img("photo-1615461066841-6116e61058f4"), is_demo=True, status=OpportunityStatus.OPEN),
        Opportunity(organization_id=orgs[3].id, title="Remote Coding Mentor", description="Mentor students online in Python basics and problem-solving.", category="Workshops & Seminars", required_skills="Python,Teaching", preferred_skills="Web Dev", experience_required="Intermediate", location="Remote", mode="remote", start_date=d(8), end_date=d(45), available_days="Saturday,Sunday", working_hours="Flexible", volunteers_required=6, application_deadline=d(5), cover_image=img("photo-1515879218367-8466d910aaa4"), is_demo=True, status=OpportunityStatus.OPEN),
        Opportunity(organization_id=orgs[3].id, title="Online Content Creator for Education", description="Create simple educational posts and learning materials for social media and online classes.", category="Community Initiatives", required_skills="Content Writing,Communication", preferred_skills="Design,Social Media", experience_required="Beginner", location="Remote", mode="remote", start_date=d(7), end_date=d(35), available_days="Weekdays,Saturday", working_hours="Flexible", volunteers_required=4, application_deadline=d(5), cover_image=img("photo-1499750310107-5fef28a66643"), is_demo=True, status=OpportunityStatus.OPEN),
        Opportunity(organization_id=orgs[0].id, title="After-School English Tutor", description="Support students with spoken English practice and reading comprehension.", category="NGOs & Social Causes", required_skills="Teaching,English", preferred_skills="Public Speaking", experience_required="Beginner", location="Ghaziabad, UP", mode="on-site", start_date=d(11), end_date=d(50), available_days="Weekdays", working_hours="17:00-19:00", volunteers_required=3, application_deadline=d(8), cover_image=img("photo-1503676260728-1c00da094a0b"), is_demo=True, status=OpportunityStatus.OPEN),
        Opportunity(organization_id=orgs[1].id, title="Sustainability Awareness Social Media Volunteer", description="Design and publish awareness posts for environmental campaigns.", category="Environmental Campaigns", required_skills="Social Media,Content Writing", preferred_skills="Design", experience_required="Beginner", location="Remote", mode="remote", start_date=d(13), end_date=d(30), available_days="Weekdays", working_hours="Flexible", volunteers_required=3, application_deadline=d(10), cover_image=img("photo-1466611653911-95081537e5b7"), is_demo=True, status=OpportunityStatus.OPEN),
        Opportunity(organization_id=orgs[2].id, title="Community Wellness Research Support", description="Assist with collecting and organizing non-sensitive wellness outreach data.", category="NGOs & Social Causes", required_skills="Research,Data Entry", preferred_skills="Communication", experience_required="Beginner", location="Remote", mode="remote", start_date=d(15), end_date=d(25), available_days="Weekdays", working_hours="Flexible", volunteers_required=2, application_deadline=d(12), cover_image=img("photo-1551288049-bebda4e38f71"), is_demo=True, status=OpportunityStatus.OPEN),
        Opportunity(organization_id=orgs[3].id, title="Hybrid STEM Workshop Facilitator", description="Facilitate beginner STEM workshops with both online prep and on-site sessions.", category="Workshops & Seminars", required_skills="Teaching,Python", preferred_skills="Public Speaking,Web Dev", experience_required="Intermediate", location="Noida, UP", mode="hybrid", start_date=d(18), end_date=d(32), available_days="Sunday", working_hours="11:00-15:00", volunteers_required=5, application_deadline=d(14), cover_image=img("photo-1532094349884-543bc11b234d"), is_demo=True, status=OpportunityStatus.OPEN),
        Opportunity(organization_id=orgs[4].id, title="Sunburn Arena Music Festival — Volunteer Crew", description="Support crowd guidance, wristband checks and artist-area coordination at a live music festival. Demo listing created for this academic prototype.", category="Concerts & Music Festivals", required_skills="Event Management,Crowd Management", preferred_skills="Public Speaking", experience_required="Beginner", location="Delhi NCR", mode="on-site", start_date=d(25), end_date=d(25), available_days="Saturday", working_hours="14:00-23:00", volunteers_required=45, application_deadline=d(20), cover_image=img("photo-1501386761578-eac5c94b800a"), is_demo=True, status=OpportunityStatus.OPEN),
        Opportunity(organization_id=orgs[5].id, title="Ignite College Cultural Fest — Event Crew", description="Join the crew running stage logistics, registrations and participant support at a student cultural fest. Demo listing created for this academic prototype.", category="College Fests", required_skills="Event Management,Public Speaking", preferred_skills="Social Media,Photography", experience_required="Beginner", location="Noida, UP", mode="on-site", start_date=d(16), end_date=d(17), available_days="Saturday,Sunday", working_hours="09:00-21:00", volunteers_required=60, application_deadline=d(12), cover_image=img("photo-1523580494863-6f3031224c94"), is_demo=True, status=OpportunityStatus.OPEN),
        Opportunity(organization_id=orgs[6].id, title="RunNCR Half Marathon — Route Marshal", description="Guide runners along the route, manage water points and support event-day safety. Demo listing created for this academic prototype.", category="Sports & Marathons", required_skills="Coordination,First Aid", preferred_skills="Event Management", experience_required="Beginner", location="Noida, UP", mode="on-site", start_date=d(22), end_date=d(22), available_days="Sunday", working_hours="05:00-11:00", volunteers_required=80, application_deadline=d(18), cover_image=img("photo-1452626038306-9aae5e071dd3"), is_demo=True, status=OpportunityStatus.OPEN),
        Opportunity(organization_id=orgs[7].id, title="Swachh Delhi Awareness Campaign — Field Volunteer", description="Support a public cleanliness awareness drive with resident outreach and survey collection. Demo listing created for this academic prototype.", category="Government Events", required_skills="Communication,Data Entry", preferred_skills="Public Speaking", experience_required="Beginner", location="Delhi", mode="on-site", start_date=d(9), end_date=d(12), available_days="Weekdays", working_hours="09:00-13:00", volunteers_required=30, application_deadline=d(6), cover_image=img("photo-1529107386315-e1a2ed48a620"), is_demo=True, status=OpportunityStatus.OPEN),
        Opportunity(organization_id=orgs[8].id, title="TechSummit India 2026 — Conference Volunteer", description="Help with delegate registration, speaker support and session coordination at a technology summit. Demo listing created for this academic prototype.", category="Conferences & Summits", required_skills="Communication,Event Management", preferred_skills="Social Media", experience_required="Beginner", location="Noida, UP", mode="on-site", start_date=d(28), end_date=d(29), available_days="Friday,Saturday", working_hours="08:00-18:00", volunteers_required=25, application_deadline=d(24), cover_image=img("photo-1540575467063-178a50c2df87"), is_demo=True, status=OpportunityStatus.OPEN),
        Opportunity(organization_id=orgs[4].id, title="Diwali Cultural Carnival — Volunteer Crew", description="Support artists, stalls and visitor experience at a festive cultural carnival. Demo listing created for this academic prototype.", category="Cultural Events", required_skills="Crowd Management,Communication", preferred_skills="Event Management", experience_required="Beginner", location="Delhi", mode="on-site", start_date=d(35), end_date=d(36), available_days="Saturday,Sunday", working_hours="15:00-22:00", volunteers_required=35, application_deadline=d(30), cover_image=img("photo-1533174072545-7a4b6ad7a6c3"), is_demo=True, status=OpportunityStatus.OPEN),
        Opportunity(organization_id=orgs[4].id, title="India Art & Design Exhibition — Gallery Assistant", description="Welcome visitors, guide exhibits and assist exhibitors during a design showcase. Demo listing created for this academic prototype.", category="Carnivals & Exhibitions", required_skills="Communication,Event Management", preferred_skills="Design", experience_required="Beginner", location="Delhi", mode="on-site", start_date=d(19), end_date=d(21), available_days="Weekdays,Weekend", working_hours="10:00-18:00", volunteers_required=18, application_deadline=d(15), cover_image=img("photo-1531058020387-3be344556be6"), is_demo=True, status=OpportunityStatus.OPEN),
        Opportunity(organization_id=orgs[7].id, title="Youth Civic Forum — Volunteer Coordinator", description="Coordinate registrations and participant support at a civic engagement forum. Demo listing created for this academic prototype.", category="Political Events", required_skills="Event Management,Public Speaking", preferred_skills="Communication", experience_required="Intermediate", location="Delhi", mode="on-site", start_date=d(24), end_date=d(24), available_days="Saturday", working_hours="09:00-16:00", volunteers_required=20, application_deadline=d(20), cover_image=img("photo-1521295121783-8a321d551ad2"), is_demo=True, status=OpportunityStatus.OPEN),
    ]
    for o in opps:
        db.add(o)
    db.flush()

    # ---------------------------------------------------------------
    # Demo workflow data: applications across all statuses, schedules,
    # tasks, verified participation and feedback. This makes the
    # volunteer, NGO and admin dashboards meaningful out of the box.
    # ---------------------------------------------------------------

    # Arpit keeps one pending application so the NGO review flow can be demoed live.
    pending_arpit = Application(
        opportunity_id=opps[0].id, volunteer_id=vols[0].id, status=ApplicationStatus.PENDING,
        message="I would love to contribute my teaching and communication skills.",
    )
    # Arpit is already approved and has verified history for another opportunity.
    approved_arpit = Application(
        opportunity_id=opps[6].id, volunteer_id=vols[0].id, status=ApplicationStatus.APPROVED,
        message="I can mentor students in Python every weekend.",
    )
    approved_archita = Application(
        opportunity_id=opps[0].id, volunteer_id=vols[2].id, status=ApplicationStatus.APPROVED,
        message="I have tutored children and can support weekend sessions.",
    )
    completed_arjun = Application(
        opportunity_id=opps[2].id, volunteer_id=vols[3].id, status=ApplicationStatus.COMPLETED,
        message="I have led clean-up drives before and can coordinate volunteers.",
    )
    approved_riya = Application(
        opportunity_id=opps[4].id, volunteer_id=vols[5].id, status=ApplicationStatus.APPROVED,
        message="I have basic first-aid training and health camp experience.",
    )
    completed_sana = Application(
        opportunity_id=opps[7].id, volunteer_id=vols[9].id, status=ApplicationStatus.COMPLETED,
        message="I write educational content and can manage the posting schedule.",
    )
    approved_aditya = Application(
        opportunity_id=opps[10].id, volunteer_id=vols[4].id, status=ApplicationStatus.APPROVED,
        message="I can help organise outreach data remotely.",
    )
    for app in (pending_arpit, approved_arpit, approved_archita, completed_arjun, approved_riya, completed_sana, approved_aditya):
        db.add(app)
    db.flush()

    # Approved applications get schedule entries (with times where the opportunity defines them).
    schedules = [
        Schedule(application_id=approved_arpit.id, scheduled_date=d(8), notes="Remote mentoring session", status=ScheduleStatus.UPCOMING),
        Schedule(application_id=approved_archita.id, scheduled_date=d(10), notes="Weekend teaching session", status=ScheduleStatus.UPCOMING),
        Schedule(application_id=approved_riya.id, scheduled_date=d(9), notes="Health camp support", status=ScheduleStatus.UPCOMING),
        Schedule(application_id=approved_aditya.id, scheduled_date=d(15), notes="Remote research support", status=ScheduleStatus.UPCOMING),
        Schedule(application_id=completed_arjun.id, scheduled_date=d(6), notes="Clean-up drive coordination", status=ScheduleStatus.COMPLETED),
        Schedule(application_id=completed_sana.id, scheduled_date=d(7), notes="Content creation cycle", status=ScheduleStatus.COMPLETED),
    ]
    for s in schedules:
        db.add(s)

    tasks = [
        Task(opportunity_id=opps[0].id, assigned_to_id=vols[2].id, title="Prepare weekend teaching materials", description="Print worksheets and prepare the session plan for Saturday.", deadline=d(8), status=TaskStatus.PENDING),
        Task(opportunity_id=opps[6].id, assigned_to_id=vols[0].id, title="Review Python curriculum", description="Go through the beginner module before the first mentoring session.", deadline=d(6), status=TaskStatus.IN_PROGRESS),
        Task(opportunity_id=opps[2].id, assigned_to_id=vols[3].id, title="Coordinate waste collection supplies", description="Arrange gloves, bags and collection bins for the drive.", deadline=d(4), status=TaskStatus.COMPLETED),
        Task(opportunity_id=opps[4].id, assigned_to_id=vols[5].id, title="Prepare registration desk checklist", description="List required forms and volunteer assignments for the health camp.", deadline=d(7), status=TaskStatus.PENDING),
        Task(opportunity_id=opps[7].id, assigned_to_id=vols[9].id, title="Draft first social media post", description="Create the first educational post for the campaign.", deadline=d(5), status=TaskStatus.COMPLETED),
    ]
    for t in tasks:
        db.add(t)

    participations = [
        Participation(application_id=approved_arpit.id, volunteer_id=vols[0].id, opportunity_id=opps[6].id, hours=3.0, verified=True, verified_by_org_id=orgs[3].id, notes="Mentored two students in Python basics."),
        Participation(application_id=completed_arjun.id, volunteer_id=vols[3].id, opportunity_id=opps[2].id, hours=4.0, verified=True, verified_by_org_id=orgs[1].id, notes="Led a team of six volunteers during the clean-up."),
        Participation(application_id=completed_sana.id, volunteer_id=vols[9].id, opportunity_id=opps[7].id, hours=6.5, verified=True, verified_by_org_id=orgs[3].id, notes="Produced five educational posts and a newsletter draft."),
    ]
    for p in participations:
        db.add(p)

    feedbacks = [
        Feedback(application_id=approved_arpit.id, volunteer_id=vols[0].id, opportunity_id=opps[6].id, rating=5, comment="Well organised mentoring programme with clear expectations."),
        Feedback(application_id=completed_arjun.id, volunteer_id=vols[3].id, opportunity_id=opps[2].id, rating=4, comment="Great turnout and a tangible impact on the riverbank."),
        Feedback(application_id=completed_sana.id, volunteer_id=vols[9].id, opportunity_id=opps[7].id, rating=5, comment="Loved the creative freedom and the cause behind the campaign."),
    ]
    for f in feedbacks:
        db.add(f)

    db.commit()
