console.log("JS initialized");

var getMetarButton = document.getElementById("getMetarButton"), useLocationButton = document.getElementById("useLocationButton"), returnButton = document.getElementById("returnButton"), cancelled = false, ended = false, failed = false, failedOnce = false;

// Set up a listener for given station identifier button click
getMetarButton.addEventListener('click', function(event) {
	cancelled = false;
	var station = document.getElementById("stationIdentifier").value;
	hideElements();
	fetchMetar(station);
});

// Set up event listener for using location button click
useLocationButton.addEventListener('click', function(event) {
	cancelled = false;
	var station = document.getElementById("stationIdentifier").value;
	hideElements();
	getUserLocation();
});

// Set up even listener for using the return button click
returnButton.addEventListener('click', function(event) {
	if (!ended) {
		cancelled = true;
	}
	resetElements();
	hideLoading();
	window.scrollTo(0, 0);
})

document.getElementById('stationIdentifier').onkeypress=function(e){
	if (e.keyCode == 13){
		document.getElementById('getMetarButton').click();
		document.getElementById('stationIdentifier').blur(); // To hide the software keyboard after user presses enter
	}
}

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

// A function to hide original elements
function hideElements() {
	document.getElementById("content").className = "transition-up";
	document.getElementById("main-instruction").style.display = "none";
	document.getElementById("stationIdentifier").style.display = "none";
	document.getElementById("getMetarButton").style.display = "none";
	document.getElementById("useLocationButton").style.display = "none";
	document.getElementById("related").style.display = "none";
	document.getElementById("loading-text").style.display = "block";
	document.getElementById("loading-animation").style.display = "inline-block";
	document.getElementById("returnButton").style.display = "inline-block"; // Show the return button
}

// A function to hide/destroy newly created elements and to show original elements
function resetElements() {
	document.getElementById("content").className = "transition-down";
	document.getElementById("main-instruction").style.display = "block";
	document.getElementById("stationIdentifier").style.display = "inline-block";
	document.getElementById("getMetarButton").style.display = "inline-block";
	document.getElementById("useLocationButton").style.display = "inline-block";
	document.getElementById("related").style.display = "block";
	document.getElementById("returnButton").style.display = "none";
	hideLoading();
	document.getElementById("metarDiv").parentNode.removeChild(document.getElementById("metarDiv"));
	if (!failed && !cancelled) {
		document.getElementById("translatedMETARDiv").parentNode.removeChild(document.getElementById("translatedMETARDiv"));
		document.getElementById("METARText").parentNode.removeChild(document.getElementById("METARText"));
	} else {
		failed = false;
	}
	if (failedOnce) {
		failedOnce = false;
	}
}

// A function to hide the loading elements
function hideLoading() {
	document.getElementById("loading-text").style.display = "none"; // Hide the loading text
	document.getElementById('loading-animation').style.display = "none"; //Hide the loading animation
}

// A function to show failed elements
function showFailed(reason, element) {
	console.log(reason);
	failed = true;
	hideLoading();
	element.innerHTML = reason + "<br><br>";
	addElement(element); // Add to the webpage!
}

// A function to add an element to the page
function addElement(element) {
	if (!cancelled) {
		document.getElementById("metarText").appendChild(element);
	}
}

// Function to get user location
function getUserLocation() {
	if (navigator.geolocation) { // If the browser supports getting from geolocation then get location
		document.getElementById("loading-text").innerHTML = "Getting your location..."
		navigator.geolocation.getCurrentPosition(function(position) { // Getting location succeeded; do something with it!
			var params = position.coords.latitude + "," + position.coords.longitude; // Add to parameters and fetch
			fetchMetar(params);
		}, function(error) { // Something bad has happened; show to the user
			console.log(error.code);
			var metarDiv = document.createElement('div');
			metarDiv.id = "metarDiv";
			metarDiv.innerHTML = "This site couldn't determine your location. Try again?<br><br>"
			addElement(metarDiv); // Add to the webpage!
			hideLoading();
		});
	}
}

// Function to get METAR provided station identifer
function fetchMetar(params) {

	var URL = "https://avwx.rest/api/metar/" + params + "?options=info,translate"; // This is the URL with options (extra info and METAR translation)

	document.getElementById("loading-text").innerHTML = "Fetching METAR..."; // Add loading text

	// Make some divs!
	var metarDiv = document.createElement('div'); // This creates a new div to display the METAR
	metarDiv.id = "metarDiv";

	var translatedMETARDiv = document.createElement('div'); // This creates a new div to display the title
	translatedMETARDiv.id = "translatedMETARDiv";

	var METARText = document.createElement('div'); // Creates a div to hold the translated elements
	METARText.id = "METARText";

	var translatedMETARText = new Array(2);  // This creates three spans to show the translated METAR
	for (var i = 0; i < 3; i++) {
		translatedMETARText[i] = document.createElement('span');
		translatedMETARText[i].className = "translatedMETARText";
	}

	request(URL).then(function(result) { // Wait for promise to be fulfilled, and then do things with the response
		metar = JSON.parse(result); // Parse JSON
		if (metar["Raw-Report"] !== undefined && metar.Info !== undefined && metar.Translations !== undefined) { // If there is a raw-report field in the JSON, then feching METAR was a SUCCESS!

			metarDiv.innerHTML = "<b>" + metar["Raw-Report"] + "</b><br><br>"; // Show the raw METAR
			
			translatedMETARDiv.innerHTML = "Translated METAR:" + "<br><br>"; // Title for the translated METAR

			translatedMETARText[0].innerHTML += "<b>City</b>: " + metar.Info.City + "<br>"; // Information about METAR Station in first span
			translatedMETARText[0].innerHTML += "<b>Airport Name</b>: " + metar.Info.Name + "<br>";
			translatedMETARText[0].innerHTML += "<b>Altitude</b>: " + metar.Info.Elevation  + "m<br>"; 

			var numberOfElements = 0;
			for (var key in metar.Translations) { // Iterate through every element in the translated METAR section and add to second and third spans
				if (metar.Translations[key] != "") {
					numberOfElements++;
					if (numberOfElements < Object.keys(metar.Translations).length / 2) {
						translatedMETARText[1].innerHTML += "<b>" + key + "</b>: " + metar.Translations[key] + "<br>"; // Get and display element in middle div if there are fewer than one half displayed
					} else {
						translatedMETARText[2].innerHTML += "<b>" + key + "</b>: " + metar.Translations[key] + "<br>"; // Otherwise, put it in the second div
					}
				}
			}

			if (!cancelled) {
				addElement(metarDiv); // Add to the webpage!

				// Add the new spans to the div and then add the div
				addElement(translatedMETARDiv);
				for (var i = 0; i < 3; i++) {
					METARText.appendChild(translatedMETARText[i]);
				}
				addElement(METARText);
			}
			hideLoading(); // Hide the loading text
			ended = true; // The request has ended

		} else if(metar.Error && failedOnce) { // This means that even after having tried to use a lat long from string, fetching the METAR failed
			console.log("Error fetching metar. The value of failedOnce is " + failedOnce);
			showFailed(metar.Error, metarDiv);
		} else { // This means that it's the first time that it's failed. Get the lat/long using Google's geocoding API and try again
			document.getElementById("loading-text").innerHTML = "Fetching address..."; // Add loading text
			var addressURL = "https://maps.googleapis.com/maps/api/geocode/json?address=" + params.split(" ").join("+") + "&key=AIzaSyC-VD77LuMyvahBa4GCglZLWmkD9ysk_TY";
			request(addressURL).then(function(result) {
				var geocode = JSON.parse(result);
				try {
					if (geocode.status != "OK") { // This means that geocoding failed. :(
						showFailed("No places found with that name!", metarDiv);
					} else { // Geocoding succeeded! Get lat and long and fetch METAR again.
						var newParams = geocode.results[0].geometry.location.lat + "," + geocode.results[0].geometry.location.lng;
						failedOnce = true;
						fetchMetar(newParams);
					}
				} catch(error) {
					showFailed("Uh oh! Something went wrong.<br><br> Error code:<br>" + error, metarDiv);
				}
			}).catch(function(reason) {
				showFailed(reason, metarDiv);
			});
		}
	}).catch(function(reason) { // This means that the query was rejected for some reason
		console.log(reason); // Log the reason and tell the user
		if (!failedOnce) { // Try it again!
			document.getElementById("loading-text").innerHTML = "Fetching address..."; // Add loading text
			var addressURL = "https://maps.googleapis.com/maps/api/geocode/json?address=" + params.split(" ").join("+") + "&key=AIzaSyC-VD77LuMyvahBa4GCglZLWmkD9ysk_TY";
			request(addressURL).then(function(result) {
				var geocode = JSON.parse(result);
				try {
					if (geocode.status != "OK") { // This means that geocoding failed. :(
						showFailed("No places found with that name!", metarDiv);
					} else { // Geocoding succeeded! Get lat and long and fetch METAR again.
						var newParams = geocode.results[0].geometry.location.lat + "," + geocode.results[0].geometry.location.lng;
						failedOnce = true;
						fetchMetar(newParams);
					}
				} catch(error) {
					showFailed("Uh oh! Something went wrong.<br><br> Error code:<br>" + error, metarDiv);
				}
			}).catch(function(reason) {
				showFailed(reason, metarDiv);
			});
		} else {
			showFailed("Uh oh! Something went wrong.<br><br> Error code:<br>" + error, metarDiv);
		}
	});
}