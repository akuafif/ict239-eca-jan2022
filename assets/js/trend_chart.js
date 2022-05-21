// template/dashboard.html

// date picker object
fromDate = new dtsel.DTS('input[name="fromdate"]',  {
    dateFormat: "dd-mm-yyyy",}
);
todate = new dtsel.DTS('input[name="todate"]',  {
    dateFormat: "dd-mm-yyyy",}
);



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

// Get the current page route
url_bar = window.location.href.split("/");
current_url = url_bar[url_bar.length-1]

// on load, assign both the date input field and variable to the TMA date
var hotel_label = [];
var date_labels = [];
var datasets = [];
window.onload = function() {
    // check the url route name and set the side bar correctly
    
    showStuff('submenu', 'mainmenu');
    if(current_url === "trend_chart_per_user"){
        // hide the date range
        document.getElementById("daterangediv").style.display = 'none';
        document.getElementById("dropdownuser").style.display = 'block';
        document.getElementById("dropdownhotel").style.display = 'none';
        document.getElementById("chart_title").innerHTML = 'Due Per User';
    } else if (current_url === "trend_chart_per_hotel"){
        document.getElementById("daterangediv").style.display = 'none';
        document.getElementById("dropdownuser").style.display = 'none';
        document.getElementById("dropdownhotel").style.display = 'block';
        document.getElementById("chart_title").innerHTML = 'Due Per Hotel';
    } else {
        document.getElementById("dropdownuser").style.display = 'none';
        document.getElementById("dropdownhotel").style.display = 'none';
        document.getElementById('fromdate').value = '17-01-2022';
        document.getElementById('todate').value = '12-03-2022';
    }
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
    randcolor = 'rgb('+ getRndInteger(255) + ','+ getRndInteger(255)+','+getRndInteger(255)+')';
    myChart.config.type = 'bar'
    myChart.data.labels = x_label;
    myChart.data.datasets = [
        {
          label: $("#userchartselect option:selected").text(),
          data: y_content,
          borderColor: randcolor,
          backgroundColor: randcolor,
        }
    ];
    if (current_url === "trend_chart_per_user"){
        myChart.data.datasets.label =  $("#userchartselect option:selected").text();
    } else if (current_url === "trend_chart_per_hotel"){
        myChart.data.datasets.label =  $("#hotelchartselect option:selected").text();
    }     
    myChart.update();
}

function ajaxUpdateChart(){
    // get dates and prepare to validate them
    var fromdate = document.getElementById('fromdate').value
    var todate = document.getElementById('todate').value
    var fromdate_date = getDateObject(fromdate);
    var todate_date = getDateObject(todate);
    var jsonToSend = JSON.stringify();

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
            document.getElementById("error").innerHTML = 'Error: Invalid date format or range';
            return 0;
        }
    } else if (current_url === "trend_chart_per_user"){
        jsonToSend = JSON.stringify({
            "charttype": current_url,
            "email": $("#userchartselect").val()
        });
    } else if (current_url === "trend_chart_per_hotel"){
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
            if (current_url === "trend_chart"){
                if (response['status'] === 'OK'){
                    // update the chart
                    date_labels = response['date_labels'];
                    hotel_label = response['hotel_label'];
                    income_dict = response['income_dict'];
                    income_label = response['income_label'];
                    updateChart(date_labels, hotel_label, income_dict, income_label);
                } else {
                    document.getElementById("error").innerHTML = response['message'];
                }
            } else if (current_url === "trend_chart_per_user" || current_url === "trend_chart_per_hotel"){
                console.log(response);
                x_label = response['x_label'];
                y_content = response['y_content'];
                updatePerChart(x_label, y_content);
            }
        }
    });
}