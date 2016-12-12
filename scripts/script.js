console.log("JS initialized");

var getMetarButton = document.getElementById("getMetarButton"), useLocationButton = document.getElementById("useLocationButton");

// Set up a listener for given station identifier button click
getMetarButton.addEventListener('click', function(event) {
	var station = document.getElementById("stationIdentifier").value;
	fetchMetar(station);
});

// Set up event listener for using location button click
useLocationButton.addEventListener('click', function(event) {
	console.log("The use location button has been pressed!");
});

// A function to fetch things from a server
function request(URL) {
	var xmlRequest = new XMLHttpRequest(); // Gets stuff from server

	xmlRequest.open("GET", URL, true); // Initialize and send the request
	xmlRequest.send();

	var resultPromise = new Promise(
		function(resolve, reject) {
			xmlRequest.onreadystatechange = function() { // Fires on ready state change; if the request is done, then the METAR is displayed
				if (this.readyState == XMLHttpRequest.DONE) {
					resolve(xmlRequest.response);
				}
			};
		})

	return resultPromise;
}

// Function to get METAR provided station identifer
function fetchMetar(station) {
	var URL = "http://avwx.rest/api/metar/" + station;

	var raw = document.createElement('div');
	request(URL).then(function(result) {
		metar = JSON.parse(result);

		if (metar["Raw-Report"] !== undefined) {
			raw.innerHTML = metar["Raw-Report"];
		} else {
			raw.innerHTML = "Your request was invalid!"
		}

		document.getElementById("location").appendChild(raw);
	}).catch(function() {
		raw.innerHTML = "Your request was invalid!"
		document.getElementById("location").appendChild(raw);
    });
}