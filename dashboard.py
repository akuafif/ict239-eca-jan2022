from flask import Blueprint, request, redirect, render_template, url_for, jsonify
from flask_login import login_required, current_user
from users import User
from auth import auth
from staycation import STAYCATION
from book import Booking
from datetime import datetime, timedelta

dashboard = Blueprint('dashboard', __name__)

@dashboard.route('/trend_chart', methods=['GET'])
@login_required
def chart():
    if current_user.email == 'admin@abc.com':
        return render_template('ternd_chart.html')
    return redirect(url_for('auth.login'))

def generateIncomeInRange(data):   
    # Generate the date objects
    d,m,y = str(data['fromdate']).split('-')
    fromDate = datetime(year=int(y),month=int(m),day=int(d))
    d,m,y = str(data['todate']).split('-')
    toDate = datetime(year=int(y),month=int(m),day=int(d))
    gap = toDate - fromDate

    isViewAll = bool(data['viewall'])

    # Create containers to pass to chart js
    date_labels = [] # x-axis
    hotel_label = [] # legend
    income_label = {} # legend x-axis
    income_dict = {} # legend y-axis
    if isViewAll:
        # Create labels for x-axis for all dictionary object
        date_list = [fromDate + timedelta(days=x) for x in range(gap.days+1)]
        date_labels = [d.strftime("%Y-%m-%d") for d in date_list]
        for hotel in STAYCATION.objects: 
            hotel_label.append(hotel.hotel_name)
            income_dict[hotel.hotel_name] = [0 for d in date_list] # put 0 as default value
            income_label[hotel.hotel_name] = [(fromDate + timedelta(days=x)).strftime("%Y-%m-%d") for x in range(gap.days+1)]

    for h in STAYCATION.objects:
        # Sort the bookings by date
        for book in Booking.objects(package=h.id).order_by('check_in_date'):
            if not book.customer.email == 'admin@abc.com': # Ignore ADMIN
                if toDate >= book.check_in_date >= fromDate: 
                    date_str = book.check_in_date.strftime("%Y-%m-%d")
                    if isViewAll:
                        date_index = date_list.index(book.check_in_date)
                        income_dict[h.hotel_name][date_index] += h.unit_cost   
                    else:
                        if not h.hotel_name in hotel_label:
                            hotel_label.append(h.hotel_name)
                            income_label[h.hotel_name] = []
                            income_dict[h.hotel_name] = []
                        if date_str not in date_labels:
                            date_labels.append(date_str)
                        if date_str not in income_label[h.hotel_name]:
                            income_label[h.hotel_name].append(date_str)
                            income_dict[h.hotel_name].append(h.unit_cost)
                        else:
                            # add the income to existing date
                            index = income_label[h.hotel_name].index(date_str)
                            income_dict[h.hotel_name][index] += h.unit_cost
    date_labels.sort()
    return hotel_label, date_labels, income_dict, income_label, gap
    
@dashboard.route('/get_chart_data', methods=['GET', 'POST'])
@login_required    
def get_chart_data():
    if current_user.email != 'admin@abc.com':
        return jsonify({'status' : 'ERROR', 
                        'message' : ['Not Allowed! User is not admin!']})

    # Generate the required variables for chart js
    data = request.get_json()
    hotel_label, date_labels, income_dict, income_label, gap = generateIncomeInRange(data)
    return jsonify({'status' : 'OK',
                    'message': f'{data}',
                    'hotel_label' : hotel_label,
                    'date_labels' : date_labels,
                    'income_dict' : income_dict,
                    'income_label': income_label,
                    'daysrange' : gap.days+1})