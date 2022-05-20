# Import the User model class
from users import User

# Import the STAYCATION model class
from staycation import STAYCATION

# import the db variable
# To inherits db.Document class which allows CRUD to the mongodb
from app import db

# Creates a Booking class with db.Document
class Booking(db.Document):
    # Select the collection 'booking' to store the staycation data
    meta = {'collection': 'booking'}
    
    # Creates a 'check_in_date' field with contains DateTime variable
    check_in_date = db.DateTimeField(required=True)

    # Creates a 'customer' field with contains the ObjectId of the User model object
    customer = db.ReferenceField(User)
    
    # Creates a 'package' field with contains the ObjectId of the STAYCATION model object
    package = db.ReferenceField(STAYCATION)
    
    # Creates a 'total_cost' field with contains Float variable. Float allows decimal value to be stored.
    total_cost = db.FloatField()

    # This is an instance method which will return the total cost of the booking.
    # It will use the package variable which refrences to the STAYCATION object the is associated to the booking instance.
    def calculate_total_cost(self):
        self.total_cost = self.package.duration * self.package.unit_cost


from flask import jsonify, request
from flask_login import login_required, current_user
from datetime import datetime
from app import app
@app.route('/addbooking', methods=['POST'])
@login_required
def addbooking():
    data = request.get_json()
    hotel_name = data['hotel_name']

    d,m,y = str(data['checkindate']).split('-')
    checkindate = datetime(year=int(y),month=int(m),day=int(d))
    selected_hotel = STAYCATION.objects(hotel_name=hotel_name).first()

    # If hotel name does not exist in mongodb, return error
    if selected_hotel is None:
        return jsonify({'status' : 'ERROR',
                        'message': f'ERROR: Cannot find "{hotel_name}"'})
    # Check if there is a booking made by the user at the same date for the hotel
    elif Booking.objects(package=selected_hotel.id, customer=current_user.id, check_in_date=checkindate).first() is None:
        Booking(check_in_date=checkindate,customer=current_user.id,package=selected_hotel.id).save()
        return jsonify({'status' : 'OK',
                        'message': f'Booking at "{hotel_name}" on {checkindate.strftime("%d-%m-%Y")} for {current_user.name} was made.'})
    # Return an error msg that there is already an existing booking made by user at the same date
    else:
        return jsonify({'status' : 'ERROR',
                        'message': f'ERROR: You already have an existing booking at "{hotel_name}" on {checkindate.strftime("%d-%m-%Y")}, under the name of {current_user.name}.'})