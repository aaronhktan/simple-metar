console.log("JS initialized");

var getMetarButton = document.getElementById("getMetarButton"), useLocationButton = document.getElementById("useLocationButton");

// Set up a listener for given station identifier button click
getMetarButton.addEventListener('click', function(event) {
	var station = document.getElementById("stationIdentifier").value;
	document.getElementById("main-instruction").style.display = "none";
	document.getElementById("stationIdentifier").style.display = "none";
	document.getElementById("getMetarButton").style.display = "none";
	document.getElementById("useLocationButton").style.display = "none";
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

	var resultPromise = new Promise( // Because fetching METAR is async, promise to return value when fetched
		function(resolve, reject) {
			xmlRequest.onreadystatechange = function() { // Fires on ready state change; if the request is done, then return response
				if (this.readyState == XMLHttpRequest.DONE) {
					resolve(xmlRequest.response);
				}
			};
		})

	return resultPromise; // Return this promise
}

// Function to get METAR provided station identifer
function fetchMetar(station) {

	var URL = "http://avwx.rest/api/metar/" + station; // This is the URL

	var raw = document.createElement('div'); // This creates a new div to display the raw METAR
	request(URL).then(function(result) { // Wait for promise to be fulfilled, and then do things with the response
		metar = JSON.parse(result); // Parse JSON

		if (metar["Raw-Report"] !== undefined) { // If there is a raw-report field in the JSON, then show that in the text
			raw.innerHTML = metar["Raw-Report"];
		} else { // If there isn't, tell the user that their query was invalid
			raw.innerHTML = "Your request was invalid!"
		}

		document.getElementById("location").appendChild(raw); // Add to the webpage!
	}).catch(function(reason) { // This means that the query was rejected for some reason
		console.log(reason); // Log the reason and tell the user
		raw.innerHTML = "Your request was invalid!"
		document.getElementById("location").appendChild(raw);
    });
}