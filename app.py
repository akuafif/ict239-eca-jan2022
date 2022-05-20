
import os
from flask import render_template, send_from_directory
from app import app, db, login_manager

from users import User
from auth import auth
from staycation import STAYCATION, package
app.register_blueprint(auth)
app.register_blueprint(package)

# Load the current user if user previously logged in
@login_manager.user_loader
def load_user(user_id):
    return User.objects(pk=user_id).first()

@app.route("/favicon.ico")
def favicon():
	return send_from_directory(os.path.join(app.root_path, 'assets'),'favicon.ico',mimetype='image/vnd.microsof.icon')

@app.route('/base')
def base():
    return render_template('base.html')

@app.errorhandler(404)
def page_not_found(e):
    return render_template('404.html'), 404

from flask import Blueprint, request, redirect, render_template, url_for, flash, render_template, jsonify
from flask_login import login_required, current_user
from werkzeug.security import generate_password_hash

# file upload operation related imports
import os
from werkzeug.utils import secure_filename
import pandas as pd
from users import User
from staycation import STAYCATION
from book import Booking
from datetime import datetime, timedelta

ALLOWED_EXTENSIONS = set(['csv'])
def allowed_file(filename):
    """ whitelists file extensions for security reasons """
    return '.' in filename and filename.split('.')[-1].lower()  in ALLOWED_EXTENSIONS

@app.route('/upload', methods=['GET'])
@login_required
def upload():
    # 1. check if current user is admin
    # 2. if POST, ajax will check file and data type
    # 3. open file with pd, check if headers is valid for the datatype
    #    return error if wrong header for datatype. This requires pandas.
    # 4. for loop the pd object and save each row to db
    if current_user.email == 'admin@abc.com':
        return render_template('upload.html')
    return redirect(url_for('auth.login')) 

@app.route('/up_user', methods=['POST'])
@login_required
def up_user():
    if current_user.email != 'admin@abc.com':
        return jsonify({'status' : 'ERROR', 
                        'message' : ['Not Allowed! User is not admin!']})
    
    # For the output message
    upload_result = [] 
    # To retrieve the file that was send over by the clien
    f = request.files['file']

    # The column names of the csv 
    headers = ['email','password','name']

    # The error message to be returned if the file is invalid 
    upload_result.append(f'ERROR: File contains invalid user.csv header format')
    status = 'ERROR'

    if allowed_file(secure_filename(f.filename)): # To verify the filename
        fdata = pd.read_csv(f) # Open the file with pd
        if list(fdata.columns) == headers: # to verify the csv columns
            for index, row in fdata.iterrows():
                # retrive the values in each row
                email , password, name = list(row) 
                existing_user = User.objects(email=email).first() # Check for existing user
                if existing_user is None:
                    # Hash the password before adding to db
                    hashpass = generate_password_hash(str(password), method='sha256')
                    # Creates the User object and save it to mongodb
                    User(email=email, 
                        password=hashpass, 
                        name=name).save()
                        
                    
                    # Append the result to the upload_result list
                    upload_result.append(f'{name} [{email}] >> Added Successfully')
                else:
                    upload_result.append(f'{name} [{email}] >> Failed, existing email!')
            status = 'OK'
            upload_result.pop(0) # remove error msg at index 0
    return jsonify({'status' :status, 
                    'datatype' : 'user',
                    'filename': f'{f.filename}',
                    'message' : upload_result})

@app.route('/up_staycation', methods=['POST'])
@login_required
def up_staycation():
    if current_user.email != 'admin@abc.com':
        return jsonify({'status' : 'ERROR', 
                        'message' : ['Not Allowed! User is not admin!']})

    # For the output message
    upload_result = [] 
    # To retrieve the file that was send over by the clien
    f = request.files['file']
    
    # The column names of the csv 
    headers = ['hotel_name','duration','unit_cost','image_url','description']

    # The error message to be returned if the file is invalid 
    upload_result.append(f'ERROR: File contains invalid staycation.csv header format')
    status = 'ERROR'

    if allowed_file(secure_filename(f.filename)): # To verify the filename
        fdata = pd.read_csv(f) # Open the file with pd
        if list(fdata.columns) == headers: # to verify the csv columns
            for index, row in fdata.iterrows():
                # retrive the values in each row
                hotel_name,duration,unit_cost,image_url,description = list(row) 
                # Creates the STAYCATION object and save it to mongodb
                pa = STAYCATION(hotel_name=hotel_name,
                        duration=duration,
                        unit_cost=unit_cost,
                        image_url=image_url,
                        description=description).save()

                # Append the result to the upload_result list
                upload_result.append(f'{hotel_name} >> Added Succssfully')
            status = 'OK'
            upload_result.pop(0) # remove error msg at index 0
    return jsonify({'status' :status, 
                    'datatype' : 'staycation',
                    'filename': f'{f.filename}',
                    'message' : upload_result})

@app.route('/up_booking', methods=['POST'])
@login_required
def up_booking():
    if current_user.email != 'admin@abc.com':
        return jsonify({'status' : 'ERROR', 
                        'message' : ['Not Allowed! User is not admin!']})
                    
    # For the output message
    upload_result = [] 
    # To retrieve the file that was send over by the clien
    f = request.files['file']

    # The column names of the csv 
    headers = ['check_in_date','customer','hotel_name']

    # The error message to be returned if the file is invalid 
    upload_result.append(f'ERROR: File contains invalid booking.csv header format')
    status = 'ERROR'

    if allowed_file(secure_filename(f.filename)): # To verify the filename
        fdata = pd.read_csv(f) # Open the file with pd
        if list(fdata.columns) == headers: # to verify the csv columns
            for index, row in fdata.iterrows():
                # retrive the values in each row
                check_in_date,customer,hotel_name = list(row)

                # Retrieves the User and STAYCATION object first
                user_obj = User.objects(email=customer).first()
                hotel_obj = STAYCATION.objects(hotel_name=hotel_name).first()

                # Verify that the user and staycation object exists in the mongodb
                if user_obj and hotel_obj:
                    # Creates a new Booking object with user and staycation as reference
                    new_book = Booking(check_in_date=check_in_date,
                                        customer=user_obj,
                                        package=hotel_obj)
                    # calculate the total cost of the Booking object
                    new_book.calculate_total_cost()                 

                    # Save the Booking object the the mongodb   
                    new_book.save()
                    
                    # Append the result to the upload_result list
                    upload_result.append(f'{check_in_date} - {customer} - {hotel_name} >> Added Successfully!')
                else:
                    upload_result.append(f'{check_in_date} - {customer} - {hotel_name} >> Failed! Missing reference for user and staycation!')
            status = 'OK'
            upload_result.pop(0) # remove error msg at index 0
    return jsonify({'status' :status, 
                    'datatype' : 'booking',
                    'filename': f'{f.filename}',
                    'message' : upload_result})