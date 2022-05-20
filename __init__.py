from flask import Flask
from flask_mongoengine import MongoEngine, Document
from flask_login import LoginManager
import pymongo
def create_app():
    # Create Flask app
    app = Flask(__name__)

    # Set the mongodb settings values
    app.config['MONGODB_SETTINGS'] = {
        'db':'eca', # Select the Database name, eca
        'host':'localhost' # Set the host as localhost(127.0.0.1)
    }

    # Set the flask application static folder to point to the assets folder 
    app.static_folder = 'assets'

    # Initialise the db variable which allows the app to connect to db
    # This uses the mongodb_settings values to connect to db
    db = MongoEngine(app)

    # Set the application secret key. The secret key is needed to keep the client-side sessions secure
    app.config['SECRET_KEY'] = '9OLWxND4o83j4K4iuopO'

    # Initialise the login manager with the application
    login_manager = LoginManager()
    login_manager.init_app(app)

    # The login_view will points to the route '/login' if the user is anonymous.
    login_manager.login_view = 'login'

    # Return the variable required for other classes to import.
    # app: The flask variable, for blueprints and routes
    # db: the mongodb variable, for mapping classes to the mongodb collections for CRUD operations
    # login_manager: the login_manager, for login related events such as login() and logout()
    return app, db, login_manager

app, db, login_manager = create_app()
