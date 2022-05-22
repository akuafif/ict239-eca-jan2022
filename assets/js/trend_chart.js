// template/dashboard.html

// date picker object
fromDate = new dtsel.DTS('input[name="fromdate"]',  {
    dateFormat: "dd-mm-yyyy",}
);
todate = new dtsel.DTS('input[name="todate"]',  {
    dateFormat: "dd-mm-yyyy",}
);

// Start of chart object declaration
const data = {
    labels: date_labels,
    datasets: datasets
};

const chartOptions = {
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

const config = {
    type: 'line',
    data: data,
    options: chartOptions
};

const myChart = new Chart(
  document.getElementById('myChart'),
  config
);
// end of chart object declaration

// on load, assign both the date input field and variable to the TMA date
var hotel_label = [];
var date_labels = [];
var datasets = []
window.onload = function() {
    document.getElementById('fromdate').value = '17-01-2022';
    document.getElementById('todate').value = '12-03-2022';
    ajaxUpdateChart();
};

// Submit Button to update the chart data
$('button').click(function(){
    // clear the output error field
    document.getElementById("output").innerHTML = ''; // Show total days in range
    document.getElementById("error").innerHTML = ''; // for error output
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
    myChart.data.labels = date_labels;
    myChart.data.datasets = datasets;
    myChart.update();
}

function getRndInteger(max) {
    // to give random colors to the chart legends
    return Math.floor(Math.random() * max) + 1;
}

function ajaxUpdateChart(){
    // get dates and prepare to validate them
    var fromdate = document.getElementById('fromdate').value
    var todate = document.getElementById('todate').value
    var fromdate_date = getDateObject(fromdate);
    var todate_date = getDateObject(todate);
    document.getElementById("output").innerHTML = 'Total Days: ' + daysBetween(fromdate_date, todate_date);

    // if todate is later than fromdate and both date are in 'dd-mm-yyyy' format
    // fromdate.match(/^(0?[1-9]|[12][0-9]|3[01])[\-](0?[1-9]|1[012])[\/\-]\d{4}$/)
    if (moment(fromdate, 'DD-MM-YYYY', true).isValid() && 
        moment(todate, 'DD-MM-YYYY', true).isValid()  && todate_date > fromdate_date){
            $.ajax({
                type: 'POST',
                url: "/get_chart_data",
                data: JSON.stringify({
                    "fromdate": document.getElementById('fromdate').value,
                    "todate": document.getElementById('todate').value,
                    "viewall": document.getElementById('checkbox').checked
                }),
                error: function(e) {
                    document.getElementById("error").innerHTML = e;
                },
                dataType: "json",
                contentType: "application/json",
                success: function(response){
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
                }
        });
    } else {
        document.getElementById("error").innerHTML = 'Error: Invalid date format or range';
    }
}