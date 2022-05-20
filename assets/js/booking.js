// template/viewpackage.html

function getDateObject(date){
    var datearray = date.split("-");
    return new Date(datearray[2]+'/'+datearray[1]+'/'+datearray[0]+' 00:00:00');
}

// datepicker objeect
instance = new dtsel.DTS('input[name="checkindate"]',  {
	dateFormat: "dd-mm-yyyy",}
);
	
document.getElementById('checkindate').value = moment().format('DD-MM-yyyy');
$('button').click(function(){
	document.getElementById("output").innerHTML = '';
	document.getElementById("error").innerHTML = '';

	var checkindate = document.getElementById('checkindate').value;
	var today = new Date();
	today.setDate(today.getDate()-1); // comparing yesterday date
	
	// checks for date format with dd-mm-yyyy
	if (moment(checkindate, 'DD-MM-YYYY', true).isValid()){
		$.ajax({
			type: 'POST',
			url: "/addbooking",
			data: JSON.stringify({
			"hotel_name": document.getElementById('hotel_name').innerHTML,
			"checkindate": checkindate
		}),
			error: function(e) {
				document.getElementById("error").innerHTML = e;
			},
			dataType: "json",
			contentType: "application/json",
			success: function(response){
				if (response['status'] === 'OK'){
					document.getElementById("output").innerHTML = response['message'];
				} else {
					document.getElementById("error").innerHTML = response['message'];
				}
			}
		});
	} else {
		document.getElementById("error").innerHTML = 'ERROR: Cannot book past date or invalid format (dd-mm-yyyy)';
	}
});