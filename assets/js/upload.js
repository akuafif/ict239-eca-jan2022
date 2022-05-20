// assets/js/upload.js
$('button').click(function(){
	document.getElementById("output").innerHTML = '';
    document.getElementById("error").innerHTML = '';
   
    // if the file input not empty,
    if (!($('#file')[0].files.length === 0)){
        var out = ''; // To store the output string
        var err = ''; // To store the error string

        // to get the type of upload from the html tag id 'datatype'
        var datatype = $("#datatype").val(); 

        // to get the file to be uploaded, from the html tag id 'uploadForm'
        var formData = new FormData($('#uploadForm')[0]);

        // to set the POST url from the datatype
        if (datatype === 'user'){
            var url = '/up_user'  ; 
        } else if (datatype === 'staycation') {
            var url = '/up_staycation';  
        } else {
            var url = '/up_booking';
        }

        $.ajax({
            url:url,
            type: "POST",
            data: formData,
            async: true,
            cashe: false,
            contentType:false,
            processData:false,
            success:function (response) {
                // if the upload is successful at server side, get the output message
                if (response['status'] === 'OK'){
                    for (var i=0; i<response['message'].length; i++ ){
                        if (response['message'][i].includes('Missing') || response['message'][i].includes('existing')){
                            err += response['message'][i] + '<br>';
                        } else {
                            out += response['message'][i] + '<br>';
                        }
                    }
                } else {
                    // if the upload is unsuccessful at server side, get the error message
                    for (var i=0; i<response['message'].length; i++ ){
                        err += response['message'][i] + '<br>';
                    }
                }
                // Display the output/error message
                document.getElementById("output").innerHTML = out;
                document.getElementById("error").innerHTML = err;
        　　}, 
　　         error: function (response) { 
                document.getElementById("error").innerHTML = 'Upload failed!';
　 　        }
        });
    } else {
        document.getElementById("error").innerHTML = 'Please select a file to upload';
    }
});