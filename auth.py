from werkzeug.security import generate_password_hash, check_password_hash
from flask_login import login_user, login_required, logout_user, current_user
from flask import Blueprint, request, redirect, render_template, url_for, make_response
from form import RegForm
from users import User

COOKIE_TIME_OUT = 60*5 #5 minutes
auth = Blueprint('auth', __name__)

@auth.route('/login', methods=['GET', 'POST'])   
@auth.route('/')
def login():
    # Root of the webpage
    # if log in, redirect to packages.html page
    if current_user.is_authenticated:
         return redirect(url_for('package.packages'))

    form = RegForm()
    email = ""
    pwd = ""
    rem = ""
    if request.method == 'POST':
        if form.validate():
            check_user = User.objects(email=form.email.data).first()
            if check_user:
                if check_password_hash(check_user['password'], form.password.data):
                    #print('Remember user:', request.form.get('checkbox'))
                    resp = make_response(redirect(url_for('package.packages')))

                    # Save details to cookies
                    if request.form.get('checkbox') is not None:
                        resp.set_cookie('email', check_user['email'], max_age=COOKIE_TIME_OUT)
                        resp.set_cookie('rem',  "checked", max_age=COOKIE_TIME_OUT)
                    else: 
                        resp.delete_cookie('email')
                        resp.delete_cookie('rem')
                    login_user(check_user)
                    return resp
                else:
                    form.password.errors.append("User Password Not Correct")
            else:
                form.email.errors.append("No Such User")
    else:
        # Check if remember me check box is set
        if 'email' in request.cookies:
            email = request.cookies.get('email')
            rem = request.cookies.get('rem')
    return render_template('login.html', form=form, email=email, pwd=pwd, rem=rem)

@auth.route('/register', methods=['GET', 'POST'])
def register():
    form = RegForm()
    if request.method == 'POST':
        if form.validate():
            existing_user = User.objects(email=form.email.data).first()
            if existing_user is None:
                hashpass = generate_password_hash(form.password.data, method='sha256')
                new_user = User(email=form.email.data,password=hashpass, name=form.name.data).save()

                resp = make_response(redirect(url_for('package.packages')))

                # Save details to cookies
                if request.form.get('checkbox') is not None:
                    resp.set_cookie('email', new_user['email'], max_age=COOKIE_TIME_OUT)
                    resp.set_cookie('rem',  "checked", max_age=COOKIE_TIME_OUT)
                else: 
                    resp.delete_cookie('email')
                    resp.delete_cookie('rem')
                login_user(new_user)
                return resp
            else:
                form.email.errors.append("User already existed")
    return render_template('register.html', form=form)

@auth.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('auth.login')) 