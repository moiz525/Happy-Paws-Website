import os
from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from datetime import datetime
from decimal import Decimal
import hashlib
import secrets
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)
CORS(app)  # Enable CORS for all origins during development

# PostgreSQL connection URI (Neon)
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://neondb_owner:npg_CcAOwx3Ihf1y@ep-restless-shadow-a44e8y6x-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# ---------------------
# Models
# ---------------------
class Animal(db.Model):
    __tablename__ = 'animal'
    AnimalID = db.Column(db.Integer, primary_key=True)
    Name = db.Column(db.String(100), nullable=False)
    Species = db.Column(db.String(50), nullable=False)
    Breed = db.Column(db.String(100))
    Age = db.Column(db.Integer)
    Gender = db.Column(db.String(10))
    ArrivalDate = db.Column(db.Date, default=datetime.utcnow)
    Status = db.Column(db.String(20), default='Available')
    medical_records = db.relationship('MedicalRecord', backref='animal', cascade="all, delete-orphan")
    adoption_applications = db.relationship('AdoptionApplication', backref='animal', cascade="all, delete-orphan")

class MedicalRecord(db.Model):
    __tablename__ = 'medical_record'
    RecordID = db.Column(db.Integer, primary_key=True)
    AnimalID = db.Column(db.Integer, db.ForeignKey('animal.AnimalID'), nullable=False)
    Date = db.Column(db.Date, default=datetime.utcnow)
    Description = db.Column(db.Text)
    VetName = db.Column(db.String(100))

class AdoptionApplication(db.Model):
    __tablename__ = 'adoption_application'
    ApplicationID = db.Column(db.Integer, primary_key=True)
    AnimalID = db.Column(db.Integer, db.ForeignKey('animal.AnimalID'), nullable=False)
    AnimalName = db.Column(db.String(100), nullable=False) 
    ApplicantName = db.Column(db.String(100), nullable=False)
    ApplicantContact = db.Column(db.String(100), nullable=False)
    ApplicantAddress = db.Column(db.String(200), nullable=False)  
    ApplicationDate = db.Column(db.Date, default=datetime.utcnow)
    Status = db.Column(db.String(20), default='Pending')

class Donor(db.Model):
    __tablename__ = 'donor'
    DonorID = db.Column(db.Integer, primary_key=True)
    Name = db.Column(db.String(100), nullable=False)
    ContactInfo = db.Column(db.String(150))
    donations = db.relationship('Donation', backref='donor', cascade="all, delete-orphan")

class Donation(db.Model):
    __tablename__ = 'donation'
    DonationID = db.Column(db.Integer, primary_key=True)
    DonorID = db.Column(db.Integer, db.ForeignKey('donor.DonorID'), nullable=False)
    Amount = db.Column(db.Numeric(10, 2), nullable=False)
    Date = db.Column(db.Date, default=datetime.utcnow)
    Method = db.Column(db.String(50))

class Volunteer(db.Model):
    __tablename__ = 'volunteer'
    VolunteerID = db.Column(db.Integer, primary_key=True)
    Name = db.Column(db.String(100), nullable=False)
    ContactInfo = db.Column(db.String(150))
    JoinDate = db.Column(db.Date, default=datetime.utcnow)
    AssignedTasks = db.Column(db.String(250))

class User(db.Model):
    __tablename__ = 'user'
    UserID = db.Column(db.Integer, primary_key=True)
    Name = db.Column(db.String(100), nullable=False)
    Email = db.Column(db.String(150), nullable=False, unique=True)
    Password = db.Column(db.String(256), nullable=False)
    RegisterDate = db.Column(db.Date, default=datetime.utcnow)

    def set_password(self, password):
        # Generate a more secure password hash with salt
        self.Password = generate_password_hash(password, method='pbkdf2:sha256')

    def check_password(self, password):
        # Check the password against the stored hash
        return check_password_hash(self.Password, password)

# ---------------------
# Create tables once at server startup
# ---------------------
with app.app_context():
    db.create_all()

# ---------------------
# API Endpoints for Frontend Integration
# ---------------------

@app.route('/api/adoptions', methods=['POST'])
def create_adoption_application():
    data = request.get_json()
    required = ['adoptAnimal', 'adoptAnimalName', 'adoptName', 'adoptContact', 'adoptAddress']
    for f in required:
        if not data.get(f):
            return jsonify({"success": False, "message": f"Missing field: {f}"}), 400
    try:
        animal_id = int(data['adoptAnimal'])
        application = AdoptionApplication(
            AnimalID=animal_id,
            AnimalName=data['adoptAnimalName'].strip(),    # Store animal name
            ApplicantName=data['adoptName'].strip(),
            ApplicantContact=data['adoptContact'].strip(),
            ApplicantAddress=data['adoptAddress'].strip(), # Store address
            ApplicationDate=datetime.utcnow(),
            Status='Pending'
        )
        db.session.add(application)
        db.session.commit()
        return jsonify({"success": True, "message": "Adoption application submitted!"}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": str(e)}), 500

from decimal import Decimal, InvalidOperation

@app.route('/api/admin/login', methods=['POST'])
def admin_login():
    ADMIN_USER = 'admin'
    ADMIN_PASS = 'password'
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    if username == ADMIN_USER and password == ADMIN_PASS:
        return jsonify({'success': True}), 200
    return jsonify({'success': False, 'message': 'Invalid username or password.'}), 401

from flask import abort

@app.route('/api/animals', methods=['GET'])
def get_animals():
    animals = Animal.query.all()
    results = [{
        "AnimalID": a.AnimalID,
        "Name": a.Name,
        "Species": a.Species,
        "Breed": a.Breed,
        "Age": a.Age,
        "Gender": a.Gender,
        "ArrivalDate": str(a.ArrivalDate),
        "Status": a.Status,
    } for a in animals]
    return jsonify(results), 200

@app.route('/api/animals', methods=['POST'])
def add_animal():
    data = request.get_json()
    required = ["Name", "Species"]
    for field in required:
        if not data.get(field):
            return jsonify({"success": False, "message": f"{field} is required."}), 400
    try:
        animal = Animal(
            Name=data["Name"],
            Species=data["Species"],
            Breed=data.get("Breed"),
            Age=int(data["Age"]) if data.get("Age") else None,
            Gender=data.get("Gender"),
            ArrivalDate=datetime.strptime(data["ArrivalDate"], "%Y-%m-%d") if data.get("ArrivalDate") else datetime.utcnow(),
            Status=data.get("Status", "Available"),
        )
        db.session.add(animal)
        db.session.commit()
        return jsonify({"success": True, "message": "Animal added."}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": f"Error: {e}"}), 500

@app.route('/api/animals/<int:animal_id>', methods=['PUT'])
def update_animal(animal_id):
    animal = Animal.query.get(animal_id)
    if not animal:
        return jsonify({"success": False, "message": "Animal not found."}), 404
    data = request.get_json()
    try:
        for key in ["Name", "Species", "Breed", "Age", "Gender", "ArrivalDate", "Status"]:
            if key in data:
                if key == "Age" and data["Age"] is not None:
                    setattr(animal, key, int(data["Age"]))
                elif key == "ArrivalDate" and data["ArrivalDate"]:
                    setattr(animal, key, datetime.strptime(data["ArrivalDate"], "%Y-%m-%d"))
                else:
                    setattr(animal, key, data[key])
        db.session.commit()
        return jsonify({"success": True, "message": "Animal updated."}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": f"Error: {e}"}), 500

@app.route('/api/animals/<int:animal_id>', methods=['DELETE'])
def delete_animal(animal_id):
    animal = Animal.query.get(animal_id)
    if not animal:
        return jsonify({"success": False, "message": "Animal not found."}), 404
    try:
        db.session.delete(animal)
        db.session.commit()
        return jsonify({"success": True, "message": "Animal deleted."}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": f"Error: {e}"}), 500

@app.route('/api/medical', methods=['GET'])
def get_medical_records():
    records = MedicalRecord.query.all()
    results = [{
        "RecordID": r.RecordID,
        "AnimalID": r.AnimalID,
        "Date": str(r.Date),
        "Description": r.Description,
        "VetName": r.VetName
    } for r in records]
    return jsonify(results), 200

@app.route('/api/medical', methods=['POST'])
def add_medical_record():
    data = request.get_json()
    required = ["AnimalID", "Date", "Description"]
    for field in required:
        if not data.get(field):
            return jsonify({"success": False, "message": f"{field} is required."}), 400
    try:
        rec = MedicalRecord(
            AnimalID=int(data["AnimalID"]),
            Date=datetime.strptime(data["Date"], "%Y-%m-%d"),
            Description=data["Description"],
            VetName=data.get("VetName", "")
        )
        db.session.add(rec)
        db.session.commit()
        return jsonify({"success": True, "message": "Medical record added."}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": f"Error: {e}"}), 500

@app.route('/api/medical/<int:record_id>', methods=['PUT'])
def update_medical_record(record_id):
    rec = MedicalRecord.query.get(record_id)
    if not rec:
        return jsonify({"success": False, "message": "Medical record not found."}), 404
    data = request.get_json()
    try:
        if data.get("AnimalID"):
            rec.AnimalID = int(data["AnimalID"])
        if data.get("Date"):
            rec.Date = datetime.strptime(data["Date"], "%Y-%m-%d")
        if "Description" in data:
            rec.Description = data["Description"]
        if "VetName" in data:
            rec.VetName = data["VetName"]
        db.session.commit()
        return jsonify({"success": True, "message": "Medical record updated."}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": f"Error: {e}"}), 500

@app.route('/api/medical/<int:record_id>', methods=['DELETE'])
def delete_medical_record(record_id):
    rec = MedicalRecord.query.get(record_id)
    if not rec:
        return jsonify({"success": False, "message": "Medical record not found."}), 404
    try:
        db.session.delete(rec)
        db.session.commit()
        return jsonify({"success": True, "message": "Medical record deleted."}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": f"Error: {e}"}), 500

@app.route('/api/adoptions', methods=['GET'])
def get_adoption_applications():
    apps = AdoptionApplication.query.all()
    results = [{
        "ApplicationID": a.ApplicationID,
        "AnimalID": a.AnimalID,
        "AnimalName": a.AnimalName,  # <-- returns AnimalName
        "ApplicantName": a.ApplicantName,
        "ApplicantContact": a.ApplicantContact,
        "ApplicantAddress": a.ApplicantAddress,  # <-- returns ApplicantAddress
        "ApplicationDate": str(a.ApplicationDate),
        "Status": a.Status,
    } for a in apps]
    return jsonify(results), 200

@app.route('/api/adoptions/<int:application_id>', methods=['PUT'])
def update_adoption_application(application_id):
    app_obj = AdoptionApplication.query.get(application_id)
    if not app_obj:
        return jsonify({"success": False, "message": "Adoption application not found."}), 404
    data = request.get_json()
    try:
        if data.get("AnimalID"):
            app_obj.AnimalID = int(data["AnimalID"])
        if "ApplicantName" in data:
            app_obj.ApplicantName = data["ApplicantName"]
        if "ApplicantContact" in data:
            app_obj.ApplicantContact = data["ApplicantContact"]
        if data.get("Status"):
            app_obj.Status = data["Status"]
        db.session.commit()
        return jsonify({"success": True, "message": "Adoption application updated."}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": f"Error: {e}"}), 500

@app.route('/api/adoptions/<int:application_id>', methods=['DELETE'])
def delete_adoption_application(application_id):
    app_obj = AdoptionApplication.query.get(application_id)
    if not app_obj:
        return jsonify({"success": False, "message": "Adoption application not found."}), 404
    try:
        db.session.delete(app_obj)
        db.session.commit()
        return jsonify({"success": True, "message": "Adoption application deleted."}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": f"Error: {e}"}), 500

# ----------- DONORS -----------
@app.route('/api/donors', methods=['GET'])
def get_donors():
    donors = Donor.query.all()
    results = [{
        "DonorID": d.DonorID,
        "Name": d.Name,
        "ContactInfo": d.ContactInfo
    } for d in donors]
    return jsonify(results), 200

@app.route('/api/donors', methods=['POST'])
def add_donor():
    data = request.get_json()
    if not data.get("Name"):
        return jsonify({"success": False, "message": "Name is required."}), 400
    try:
        donor = Donor(
            Name=data["Name"],
            ContactInfo=data.get("ContactInfo", "")
        )
        db.session.add(donor)
        db.session.commit()
        return jsonify({"success": True, "message": "Donor added."}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": f"Error: {e}"}), 500

@app.route('/api/donors/<int:donor_id>', methods=['PUT'])
def update_donor(donor_id):
    donor = Donor.query.get(donor_id)
    if not donor:
        return jsonify({"success": False, "message": "Donor not found."}), 404
    data = request.get_json()
    try:
        if "Name" in data:
            donor.Name = data["Name"]
        if "ContactInfo" in data:
            donor.ContactInfo = data["ContactInfo"]
        db.session.commit()
        return jsonify({"success": True, "message": "Donor updated."}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": f"Error: {e}"}), 500

@app.route('/api/donors/<int:donor_id>', methods=['DELETE'])
def delete_donor(donor_id):
    donor = Donor.query.get(donor_id)
    if not donor:
        return jsonify({"success": False, "message": "Donor not found."}), 404
    try:
        db.session.delete(donor)
        db.session.commit()
        return jsonify({"success": True, "message": "Donor deleted."}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": f"Error: {e}"}), 500


# ----------- DONATIONS -----------
@app.route('/api/donations', methods=['GET'])
def get_donations():
    donations = Donation.query.all()
    results = [{
        "DonationID": d.DonationID,
        "DonorID": d.DonorID,
        "Amount": str(d.Amount),
        "Date": str(d.Date),
        "Method": d.Method
    } for d in donations]
    return jsonify(results), 200

@app.route('/api/donations', methods=['POST'])
def submit_donation():
    from decimal import Decimal, InvalidOperation
    data = request.get_json()
    name = data.get('donorName')
    contact = data.get('donorContact', '')  # Optional; may be empty
    amount = data.get('donationAmount')
    if not name or not amount:
        return jsonify({'success': False, 'message': 'Name and amount are required.'}), 400
    try:
        # Find or create donor
        donor = Donor.query.filter_by(Name=name).first()
        if not donor:
            donor = Donor(Name=name, ContactInfo=contact)
            db.session.add(donor)
            db.session.flush()  # Ensures DonorID is available for the donation
        else:
            # Update donor contact info if a new one is provided
            if contact and (not donor.ContactInfo or donor.ContactInfo != contact):
                donor.ContactInfo = contact
                db.session.flush()
        # Parse donation amount
        try:
            decimal_amount = Decimal(str(amount))
        except InvalidOperation:
            return jsonify({'success': False, 'message': 'Invalid donation amount.'}), 400
        donation = Donation(
            DonorID=donor.DonorID,
            Amount=decimal_amount,
            Method='Online'
        )
        db.session.add(donation)
        db.session.commit()
        return jsonify({'success': True, 'message': 'Donation submitted. Thank you!'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f'Error: {type(e).__name__}: {e}'}), 500

@app.route('/api/donations/<int:donation_id>', methods=['PUT'])
def update_donation(donation_id):
    from decimal import Decimal, InvalidOperation
    donation = Donation.query.get(donation_id)
    if not donation:
        return jsonify({"success": False, "message": "Donation not found."}), 404
    data = request.get_json()
    try:
        if "DonorID" in data:
            donation.DonorID = int(data["DonorID"])
        if "Amount" in data:
            donation.Amount = Decimal(str(data["Amount"]))
        if "Date" in data:
            donation.Date = datetime.strptime(data["Date"], "%Y-%m-%d")
        if "Method" in data:
            donation.Method = data["Method"]
        db.session.commit()
        return jsonify({"success": True, "message": "Donation updated."}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": f"Error: {e}"}), 500

@app.route('/api/donations/<int:donation_id>', methods=['DELETE'])
def delete_donation(donation_id):
    donation = Donation.query.get(donation_id)
    if not donation:
        return jsonify({"success": False, "message": "Donation not found."}), 404
    try:
        db.session.delete(donation)
        db.session.commit()
        return jsonify({"success": True, "message": "Donation deleted."}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": f"Error: {e}"}), 500

# ----------- VOLUNTEERS -----------
@app.route('/api/volunteers', methods=['GET'])
def get_volunteers():
    vols = Volunteer.query.all()
    results = [{
        "VolunteerID": v.VolunteerID,
        "Name": v.Name,
        "ContactInfo": v.ContactInfo,
        "JoinDate": str(v.JoinDate),
        "AssignedTasks": v.AssignedTasks
    } for v in vols]
    return jsonify(results), 200

@app.route('/api/volunteers', methods=['POST'])
def add_volunteer():
    data = request.get_json()
    if not data.get("Name"):
        return jsonify({"success": False, "message": "Name is required."}), 400
    try:
        volunteer = Volunteer(
            Name=data["Name"],
            ContactInfo=data.get("ContactInfo", ""),
            JoinDate=datetime.strptime(data["JoinDate"], "%Y-%m-%d") if data.get("JoinDate") else datetime.utcnow(),
            AssignedTasks=data.get("AssignedTasks", "")
        )
        db.session.add(volunteer)
        db.session.commit()
        return jsonify({"success": True, "message": "Volunteer added."}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": f"Error: {e}"}), 500

@app.route('/api/volunteers/<int:volunteer_id>', methods=['PUT'])
def update_volunteer(volunteer_id):
    volunteer = Volunteer.query.get(volunteer_id)
    if not volunteer:
        return jsonify({"success": False, "message": "Volunteer not found."}), 404
    data = request.get_json()
    try:
        if "Name" in data:
            volunteer.Name = data["Name"]
        if "ContactInfo" in data:
            volunteer.ContactInfo = data["ContactInfo"]
        if "JoinDate" in data:
            volunteer.JoinDate = datetime.strptime(data["JoinDate"], "%Y-%m-%d")
        if "AssignedTasks" in data:
            volunteer.AssignedTasks = data["AssignedTasks"]
        db.session.commit()
        return jsonify({"success": True, "message": "Volunteer updated."}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": f"Error: {e}"}), 500

@app.route('/api/volunteers/<int:volunteer_id>', methods=['DELETE'])
def delete_volunteer(volunteer_id):
    volunteer = Volunteer.query.get(volunteer_id)
    if not volunteer:
        return jsonify({"success": False, "message": "Volunteer not found."}), 404
    try:
        db.session.delete(volunteer)
        db.session.commit()
        return jsonify({"success": True, "message": "Volunteer deleted."}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": f"Error: {e}"}), 500

# ----------- USER AUTHENTICATION -----------
@app.route('/api/users/signup', methods=['POST'])
def user_signup():
    data = request.get_json()
    required = ['name', 'email', 'password']
    for field in required:
        if not data.get(field):
            return jsonify({"success": False, "message": f"{field} is required."}), 400

    # Check if user already exists
    existing_user = User.query.filter_by(Email=data['email']).first()
    if existing_user:
        return jsonify({"success": False, "message": "Email already registered. Please login."}), 400

    try:
        # Create new user with secure password hashing
        new_user = User(
            Name=data['name'],
            Email=data['email']
        )
        new_user.set_password(data['password'])

        db.session.add(new_user)
        db.session.commit()

        return jsonify({
            "success": True,
            "message": "User registered successfully. Please login."
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": f"Error: {str(e)}"}), 500

@app.route('/api/users/login', methods=['POST'])
def user_login():
    data = request.get_json()
    if not data.get('email') or not data.get('password'):
        return jsonify({"success": False, "message": "Email and password required."}), 400

    try:
        # Find user by email
        user = User.query.filter_by(Email=data['email']).first()

        # If user doesn't exist or password doesn't match
        if not user or not user.check_password(data['password']):
            return jsonify({"success": False, "message": "Invalid email or password."}), 401

        # Return user data (excluding password)
        return jsonify({
            "success": True,
            "message": "Login successful",
            "user": {
                "id": user.UserID,
                "name": user.Name,
                "email": user.Email
            }
        }), 200
    except Exception as e:
        return jsonify({"success": False, "message": f"Error: {str(e)}"}), 500

if __name__ == '__main__':
    app.run(debug=True)
