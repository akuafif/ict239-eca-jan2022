# import the db variable
# To inherits db.Document class which allows CRUD to the mongodb
from app import db

# Creates a STAYCATION class with db.Document
class STAYCATION(db.Document):
    # Select the collection 'staycation' to store the staycation data
    meta = {'collection': 'staycation'}

    # Creates a 'hotel_name' field with contains String variable with max length of 30 characters
    hotel_name = db.StringField(max_length=30)
    
    # Creates a 'duration' field with contains Integer variable
    # duration is the amount of days of the staycation package
    duration = db.IntField()
    
    # Creates a 'unit_cost' field with contains Float variable. Float allows decimal value to be stored
    # unit_cost is the cost of the staycation package per day
    unit_cost = db.FloatField()
    
    # Creates a 'image_url' field with contains String variable with max length of 30 characters
    image_url = db.StringField(max_length=30)
    
    # Creates a 'description' field with contains String variable with max length of 500 characters
    description = db.StringField(max_length=500)


# Import the neccessary classes
from flask import Blueprint, request, render_template
from flask_login import login_required, current_user
from datetime import datetime, timedelta

# Creates a new blueprint for the package related routes/views
package = Blueprint('package', __name__)

@package.route('/products')
@login_required
def packages():
    # Home page of all authenticated users
    return render_template('packages.html', hotel_list = STAYCATION.objects)

@package.route('/view', methods=['GET'])
@login_required
def viewpackage():
    # retrive the hotel name from url query string
    hotel_name = request.args.get("hotel")

    # Get the STAYCATION objects from the mongodb
    selected_hotel = STAYCATION.objects(hotel_name=hotel_name).first()

    # if the hotel name from the url query string does not exist in the db, return an error inside the STAYCATION object
    if selected_hotel is None:
        selected_hotel = STAYCATION(hotel_name="Invalid Staycation Package",
                               description="Invalid Staycation Package",
                               image_url="https://fscene8.me/content/images/size/w1000/2022/04/question-mark-1019820_1280-1-.jpg")
    
    # Return the neccessary data, hotel_name, image_url and description
    return render_template('booking.html', 
                            hotel_name=hotel_name, 
                            image_url=selected_hotel.image_url, 
                            description=selected_hotel.description)
