from flask_wtf import FlaskForm
from wtforms import StringField, PasswordField
from wtforms.validators import Email, Length, InputRequired

class RegForm(FlaskForm):
    # Create an input field which only accepts String
    # With validators of InputRequired and the format must be in email format, with length of 30 characters maximum
    email = StringField('Email', validators=[InputRequired(), Email(message='Invalid email'), 
    Length(max=30)])

    # Create an input field which only accepts String
    # With validators of InputRequired with length between 5 to 20 characters
    password = PasswordField('Password', validators=[InputRequired(), Length(min=5, max=20)])
    
    # Create an input field which only accepts String
    name = StringField('Name')