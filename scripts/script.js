console.log("JS initialized");

var getMetarButton = document.getElementById("getMetarButton"), useLocationButton = document.getElementById("useLocationButton"), returnButton = document.getElementById("returnButton");

// Set up a listener for given station identifier button click
getMetarButton.addEventListener('click', function(event) {
	var station = document.getElementById("stationIdentifier").value;
	document.getElementById("main-instruction").style.display = "none";
	document.getElementById("stationIdentifier").style.display = "none";
	document.getElementById("getMetarButton").style.display = "none";
	document.getElementById("useLocationButton").style.display = "none";
	document.getElementById("loading-animation").style.display = "inline-block";
	document.getElementById("returnButton").style.display = "inline-block"; // Show the return button
	fetchMetar(station);
});

// Set up event listener for using location button click
useLocationButton.addEventListener('click', function(event) {
	var station = document.getElementById("stationIdentifier").value;
	document.getElementById("main-instruction").style.display = "none";
	document.getElementById("stationIdentifier").style.display = "none";
	document.getElementById("getMetarButton").style.display = "none";
	document.getElementById("useLocationButton").style.display = "none";
	document.getElementById("loading-animation").style.display = "inline-block";
	document.getElementById("returnButton").style.display = "inline-block"; // Show the return button
	getUserLocation();
});

// Set up even listener for using the return button click
returnButton.addEventListener('click', function(event) {
	document.getElementById("main-instruction").style.display = "block";
	document.getElementById("stationIdentifier").style.display = "inline-block";
	document.getElementById("getMetarButton").style.display = "inline-block";
	document.getElementById("useLocationButton").style.display = "inline-block";
	document.getElementById("returnButton").style.display = "none";
	document.getElementById('loading-animation').style.display = "none";
	document.getElementById("raw").parentNode.removeChild(document.getElementById("raw"));
})

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

function resetElements() {
	document.getElementById("main-instruction").style.display = "block";
	document.getElementById("stationIdentifier").style.display = "inline-block";
	document.getElementById("getMetarButton").style.display = "inline-block";
	document.getElementById("useLocationButton").style.display = "block";
}

// Function to get user location
function getUserLocation() {
	if (navigator.geolocation) { // If the browser supports getting from geolocation then get location
		navigator.geolocation.getCurrentPosition(function(position) { // Getting location succeeded; do something with it!
			var params = position.coords.latitude + "," + position.coords.longitude; // Add to parameters and fetch
			fetchMetar(params); 
		}, function(error) {
			var raw = document.createElement('div');
			raw.id = "raw";
			switch(error.code) {
				case error.PERMISSION_DENIED:
					raw.innerHTML = "You didn't give this site access to your location. Try something else?<br><br>"
					break;
				case error.POSITION_UNAVAILABLE:
					raw.innerHTML = "The site couldn't determine your location. Try something else?<br><br>"
					break;
				case error.TIMEOUT:
					raw.innerHTML = "It took so long to get your location that the site died. Try something else?<br><br>"
					break;
				case error.UNKNOWN_ERROR:
					raw.innerHTML = "You broke this site. Try something else?<br><br>"
					break;
			}
			document.getElementById("location").appendChild(raw); // Add to the webpage!
			document.getElementById('loading-animation').style.display = "none"; // Hide the loading animation
		});
	}
}

// Function to get METAR provided station identifer
function fetchMetar(params) {

	var URL = "https://avwx.rest/api/metar/" + params; // This is the URL

	var raw = document.createElement('div'); // This creates a new div to display the raw METAR
	raw.id = "raw";
	request(URL).then(function(result) { // Wait for promise to be fulfilled, and then do things with the response
		metar = JSON.parse(result); // Parse JSON

		if (metar["Raw-Report"] !== undefined) { // If there is a raw-report field in the JSON, then show that in the text
			raw.innerHTML = metar["Raw-Report"] + "<br><br>";
		} else { // If there isn't, tell the user that their query was invalid
			raw.innerHTML = "Your request was invalid!";
		}

		document.getElementById("location").appendChild(raw); // Add to the webpage!
		document.getElementById('loading-animation').style.display = "none"; // Hide the loading animation
	}).catch(function(reason) { // This means that the query was rejected for some reason
		console.log(reason); // Log the reason and tell the user
		raw.innerHTML = "Your request was invalid!" + "<br><br>";
		document.getElementById("location").appendChild(raw);
		document.getElementById('loading-animation').style.display = "none"; //Hide the loading animation
    });
}