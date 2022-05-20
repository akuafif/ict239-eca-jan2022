# import the db variable
# To inherits db.Document class which allows CRUD operations with the mongodb
from app import db

# import the UserMixin class for inheritance 
# UserMixin class provides the implementation of flask_login properties
from flask_login import UserMixin

# Creates a User class with UserMixin and db.Document
class User(UserMixin, db.Document):
    # Select the collection 'appUsers' to store the Users data
    meta = {'collection': 'appUsers'}

    # Creates a 'email' field with contains String variable with a max length of 30 
    email = db.StringField(max_length=30)

    # Creates a 'password' field with contains String variable
    # The password will not be in plain text and it will be hash by the flask_login
    password = db.StringField()

    # Creates a 'name' field with contains String variable
    name = db.StringField()
