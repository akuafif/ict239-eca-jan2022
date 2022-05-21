// template/dashboard.html

// date picker object, For total_income
fromDate = new dtsel.DTS('input[name="fromdate"]',  {
    dateFormat: "dd-mm-yyyy",}
);
todate = new dtsel.DTS('input[name="todate"]',  {
    dateFormat: "dd-mm-yyyy",}
);

// Initialise the chart.js object
const myChart = new Chart(
    document.getElementById('myChart'),
    config = {
        options: {
            maintainAspectRatio: false,
            responsive: true
        }
    }
);
// end of chart object declaration


// on load, assign both the date input field and variable to the TMA date
var hotel_label = [];
var date_labels = [];
var datasets = [];

// Get the current page route
url_bar = window.location.href.split("/");
current_url = url_bar[url_bar.length-1]
window.onload = function() {
    // call the function in the base.html to show the dashboard sub menu onload
    showStuff('submenu', 'mainmenu');

    // Show and Hide the HTML elements according to the page url
    if(current_url === "trend_chart_per_user"){ // user
        // hide the date range
        document.getElementById("daterangediv").style.display = 'none';
        document.getElementById("dropdownuser").style.display = 'block';
        document.getElementById("dropdownhotel").style.display = 'none';
        document.getElementById("chart_title").innerHTML = 'Due Per User';
    } else if (current_url === "trend_chart_per_hotel"){ // hotel
        document.getElementById("daterangediv").style.display = 'none';
        document.getElementById("dropdownuser").style.display = 'none';
        document.getElementById("dropdownhotel").style.display = 'block';
        document.getElementById("chart_title").innerHTML = 'Due Per Hotel';
    } else { // total income
        document.getElementById("dropdownuser").style.display = 'none';
        document.getElementById("dropdownhotel").style.display = 'none';
        document.getElementById('fromdate').value = '17-01-2022';
        document.getElementById('todate').value = '12-03-2022';
    }

    // call the function that will check the page type and call the AJAX function
    ajaxUpdateChart();
};

// Submit Button to update the chart data
$('button').click(function(){
    // clear the output error field
    document.getElementById("output").innerHTML = ''; // Show total days in range
    document.getElementById("error").innerHTML = ''; // for error output
    ajaxUpdateChart();
});

$('select').change(function(){
    ajaxUpdateChart();
});

function daysBetween(fromdate, todate){
    //calculate days difference by dividing total milliseconds in a day
    return ((todate.getTime() - fromdate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
}   

function getDateObject(date){
    var datearray = date.split("-");
    return new Date(datearray[2]+'/'+datearray[1]+'/'+datearray[0]+' 00:00:00');
}

function updateChart(date_labels, hotel_label, income_dict, income_label){
    // Update chart without reloading
    datasets = []
    for (let i = 0; i < hotel_label.length; i++) {
        randcolor = 'rgb('+ getRndInteger(255) + ','+ getRndInteger(255)+','+getRndInteger(255)+')';
        datasets.push({ 
            label:hotel_label[i],
            backgroundColor: randcolor,
            borderColor: randcolor,
            fill: false,
            data: (function(){
                data_xy = [];
                for (let j = 0; j < income_dict[hotel_label[i]].length; j++){
                    data_xy.push({x: income_label[hotel_label[i]][j], y: income_dict[hotel_label[i]][j]});
                }
                return data_xy;
            })()
        });
    };
    myChart.config.chartOptions = {
        maintainAspectRatio: false,
        responsive: true,
        tooltips: {
            intersect: false,
            callbacks: {
                title: function() {}, /* hide title */
                label: function(tooltipItem, data) {
                    // Get the correct data for the tooltip
                    const dataset = data.datasets[tooltipItem.datasetIndex];
                    const index = tooltipItem.index;
                    return dataset.data[index]['x'] + ': $' + dataset.data[index]['y'];
                }
            }
        }
    };
    
    myChart.config.type = 'line'
    myChart.data.labels = date_labels;
    myChart.data.datasets = datasets;
    myChart.update();
}

function getRndInteger(max) {
    // to give random colors to the chart legends
    return Math.floor(Math.random() * max) + 1;
}

function updatePerChart(x_label, y_content){
    // Create label based on the url page (user or hotel)
    var label = ''
    if (current_url === "trend_chart_per_user"){
        label = 'Booking Due Per User by ' + $("#userchartselect option:selected").text();
    } else if (current_url === "trend_chart_per_hotel"){
        label =  'Booking Due Per Hotel by ' + $("#hotelchartselect option:selected").text();
    }     

    // Choose a random color
    randcolor = 'rgb('+ getRndInteger(255) + ','+ getRndInteger(255)+','+getRndInteger(255)+')';
    
    // Set the chart type to be bar
    myChart.config.type = 'bar'

    // Set the labels to the x_label list.
    // The x_label list is the x-axis legend and depending on the page,
    // the x_label will contain user names or hotel names
    myChart.data.labels = x_label;

    // Set the datasets to the value for each x_label
    // the y_content list is the value generated by the server-side
    // depending on the page, the server side will return the booking due per user or hotel
    myChart.data.datasets = [
        {
            // Set the label that was generated at the start of the function
            label: label, 
            // Set the data to the y_content
            data: y_content,
            
            // Assign the random color choosen by the javascript
            borderColor: randcolor,
            backgroundColor: randcolor,
        }
    ];

    // Update the chart with the updated values
    myChart.update();
}

function ajaxUpdateChart(){
    // Declaring variable for the total_income page
    // get dates and prepare to validate them
    var fromdate = document.getElementById('fromdate').value
    var todate = document.getElementById('todate').value
    var fromdate_date = getDateObject(fromdate);
    var todate_date = getDateObject(todate);

    // Declare a variable to hold the JSON string to send over by AJAX
    var jsonToSend = JSON.stringify();

    // Check the page and set up the JSON accordingly
    if (current_url === "trend_chart"){
        if (moment(fromdate, 'DD-MM-YYYY', true).isValid() && 
            moment(todate, 'DD-MM-YYYY', true).isValid()  && todate_date > fromdate_date){
            document.getElementById("output").innerHTML = 'Total Days: ' + daysBetween(fromdate_date, todate_date);
            jsonToSend = JSON.stringify({
                "fromdate": document.getElementById('fromdate').value,
                "todate": document.getElementById('todate').value,
                "charttype": current_url,
                "viewall": document.getElementById('checkbox').checked
            });
        } else {
            document.getElementById("error").innerHTML = 'Error: Invalid date format/range or URL';
            return 0;
        }
    } else if (current_url === "trend_chart_per_user"){
        // prepare JSON with the charttype and email
        // charttype: will be used by server side to return the correct data
        // email: the primary key of the User object in the appUser collection
        jsonToSend = JSON.stringify({
            "charttype": current_url,
            "email": $("#userchartselect").val()
        });
    } else if (current_url === "trend_chart_per_hotel"){
        // prepare JSON with the charttype and hotel
        // charttype: will be used by server side to return the correct data
        // hotel: the primary key of the STAYCATION object in the staycation collection
        jsonToSend = JSON.stringify({
            "charttype": current_url,
            "hotel": $("#hotelchartselect").val()
        });
    }    

    $.ajax({
        type: 'POST',
        url: "/get_chart_data",
        data: jsonToSend,
        error: function(e) {
            document.getElementById("error").innerHTML = e;
        },
        dataType: "json",
        contentType: "application/json",
        success: function(response){
            // Upon successful AJAX call, check the charttype to route the javascript to the correct function
            if (current_url === "trend_chart"){
                if (response['status'] === 'OK'){
                    // grab the content of the return JSON
                    date_labels = response['date_labels'];
                    hotel_label = response['hotel_label'];
                    income_dict = response['income_dict'];
                    income_label = response['income_label'];

                    // Update the chart (total_income)
                    updateChart(date_labels, hotel_label, income_dict, income_label);
                } else {
                    document.getElementById("error").innerHTML = response['message'];
                }
            } else if (current_url === "trend_chart_per_user" || current_url === "trend_chart_per_hotel"){
                // grab the content of the return JSON
                x_label = response['x_label'];
                y_content = response['y_content'];

                // Update the chart for per user and per hotel
                updatePerChart(x_label, y_content);
            }
        }
    });
}