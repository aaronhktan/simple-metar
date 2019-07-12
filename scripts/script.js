var getMetarButton = document.getElementById('getMetarButton'), useLocationButton = document.getElementById('useLocationButton'), returnButton = document.getElementById('returnButton'), cancelled = false, failed = false, failedOnce = false;

// Set up a listener for given station identifier button click
getMetarButton.addEventListener('click', (event) => {
  cancelled = false;
  var station = document.getElementById('stationIdentifier').value;
  hideElements();
  fetchMetar(station);
});

// Set up event listener for using location button click
useLocationButton.addEventListener('click', (event) => {
  cancelled = false;
  var station = document.getElementById('stationIdentifier').value;
  hideElements();
  getUserLocation();
});

// Set up even listener for using the return button click
returnButton.addEventListener('click', (event) => {
  cancelled = true;
  resetElements();
  window.scrollTo(0, 0);
})

document.getElementById('stationIdentifier').onkeypress = (event) => {
  if (event.keyCode == 13){
    document.getElementById('getMetarButton').click();
    document.getElementById('stationIdentifier').blur(); // To hide the software keyboard after user presses enter
  }
}

// A function to fetch things from a server
function request(URL) {
  var xmlRequest = new XMLHttpRequest(); // Gets stuff from server

  xmlRequest.open('GET', URL, true); // Initialize and send the request
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
  document.getElementById('content').className = 'transition-up';
  document.getElementById('mainInstruction').style.display = 'none';
  document.getElementById('stationIdentifier').style.display = 'none';
  document.getElementById('getMetarButton').style.display = 'none';
  document.getElementById('useLocationButton').style.display = 'none';
  document.getElementById('related').style.display = 'none';
  document.getElementById('loadingText').style.display = 'block';
  document.getElementById('loading-animation').style.display = 'inline-block';
  document.getElementById('returnButton').style.display = 'inline-block'; // Show the return button
}

// A function to hide/destroy newly created elements and to show original elements
function resetElements() {
  document.getElementById('content').className = 'transition-down';
  document.getElementById('mainInstruction').style.display = 'block';
  document.getElementById('stationIdentifier').style.display = 'inline-block';
  document.getElementById('getMetarButton').style.display = 'inline-block';
  document.getElementById('useLocationButton').style.display = 'inline-block';
  document.getElementById('related').style.display = 'block';
  document.getElementById('returnButton').style.display = 'none';
  hideLoading();
  var parent = document.getElementById('metarText');
  var metarDivs = parent.getElementsByClassName('metarDiv');
  var numberOfElements = metarDivs.length;
  for (let i = 0; i < numberOfElements; i++) {
    parent.removeChild(metarDivs[i]);
  }
  var translatedMetarDivs = parent.getElementsByClassName('translatedMetarDiv');
  var numberOfElements = translatedMetarDivs.length;
  for (let i = 0; i < numberOfElements; i++) {
    parent.removeChild(translatedMetarDivs[i]);
  }
  var metarTexts = document.getElementsByClassName('metarText');
  var numberOfElements = metarTexts.length;
  for (let i = 0; i < numberOfElements; i++) {
    parent.removeChild(metarTexts[i]);
  }
  if (failed) {
    failed = false;
  }
  if (failedOnce) {
    failedOnce = false;
  }
}

// A function to hide the loading elements
function hideLoading() {
  document.getElementById('loadingText').style.display = 'none'; // Hide the loading text
  document.getElementById('loading-animation').style.display = 'none'; //Hide the loading animation
}

// A function to show failed elements
function showFailed(reason, element) {
  console.log(reason);
  failed = true;
  hideLoading();
  element.innerHTML = 'Uh oh! Something went wrong.<br><br> Error code:<br>' + reason + '<br><br>';
  addElement(element); // Add to the webpage!
}

// A function to add an element to the page
function addElement(element) {
  if (!cancelled) {
    document.getElementById('metarText').appendChild(element);
  }
}

// Function to get user location
function getUserLocation() {
  if (navigator.geolocation) { // If the browser supports getting from geolocation then get location
    document.getElementById('loadingText').innerHTML = 'Getting your location...'
    navigator.geolocation.getCurrentPosition((position) => { // Getting location succeeded; do something with it!
      var params = position.coords.latitude + ',' + position.coords.longitude; // Add to parameters and fetch
      fetchMetar(params);
    }, (error) => { // Something bad has happened; show to the user
      console.log(error.code);
      failed = true;
      var metarDiv = document.createElement('div');
      metarDiv.className = 'metarDiv';
      metarDiv.innerHTML = 'This site couldn\'t determine your location. Try again?<br><br>'
      addElement(metarDiv); // Add to the webpage!
      hideLoading();
    });
  }
}

// Function to get METAR provided station identifer
function fetchMetar(params) {

  var URL = 'https://avwx.rest/api/metar/' + params + '?options=info,translate'; // This is the URL with options (extra info and METAR translation)

  document.getElementById('loadingText').innerHTML = 'Fetching METAR...'; // Add loading text

  // Make some divs!
  var metarDiv = document.createElement('div'); // This creates a new div to display the METAR
  metarDiv.className = 'metarDiv';

  var translatedMetarDiv = document.createElement('div'); // This creates a new div to display the title
  translatedMetarDiv.className = 'translatedMetarDiv';

  var metarText = document.createElement('div'); // Creates a div to hold the translated elements
  metarText.className = 'metarText';

  var translatedMetarText = new Array(2);  // This creates three spans to show the translated METAR
  for (var i = 0; i < 3; i++) {
    translatedMetarText[i] = document.createElement('span');
    translatedMetarText[i].className = 'translatedMetarText';
  }

  request(URL).then((result) => { // Wait for promise to be fulfilled, and then do things with the response
    // Parse METAR data
    metar = JSON.parse(result);
    if (metar.raw !== undefined && metar.info !== undefined && metar.translate !== undefined) { // If there is a raw-report field in the JSON, then feching METAR was a SUCCESS!

      metarDiv.innerHTML = '<b>' + metar.raw + '</b><br><br>'; // Show the raw METAR
      
      translatedMetarDiv.innerHTML = 'Translated METAR:' + '<br><br>'; // Title for the translated METAR

      translatedMetarText[0].innerHTML += '<b>City</b>: ' + metar.info.city + '<br>'; // Information about METAR Station in first span
      translatedMetarText[0].innerHTML += '<b>Airport Name</b>: ' + metar.info.name + '<br>';
      translatedMetarText[0].innerHTML += '<b>Altitude</b>: ' + metar.info.elevation_ft  + 'm<br>'; 

      var numberOfElements = 0;
      for (var key in metar.translate) { // Iterate through every element in the translated METAR section and add to second and third spans
        if (metar.translate[key] != '') {
          numberOfElements++;
          let content = '';
          if (key == 'remarks') {
            for (let remark in metar.translate.remarks) {
              content += '<br>' + metar.translate.remarks[remark];
            }
          } else {
            content = metar.translate[key]
          }
          if (numberOfElements < Object.keys(metar.translate).length / 2) {
            translatedMetarText[1].innerHTML += '<b>' + key.charAt(0).toUpperCase() + key.slice(1) + '</b>: ' + content + '<br>'; // Get and display element in middle div if there are fewer than one half displayed
          } else {
            translatedMetarText[2].innerHTML += '<b>' + key.charAt(0).toUpperCase() + key.slice(1) + '</b>: ' + content + '<br>'; // Otherwise, put it in the second div
          }
        }
      }

      if (!cancelled) {
        addElement(metarDiv); // Add to the webpage!
        addElement(translatedMetarDiv);
        // Add the new spans to the div and then add the div
        for (var i = 0; i < 3; i++) {
          metarText.appendChild(translatedMetarText[i]);
        }
        addElement(metarText);
      }
      hideLoading(); // Hide the loading text

    } else if (failedOnce) { // This means that even after having tried to use a lat long from string, fetching the METAR failed
      console.log('Error fetching metar. The value of failedOnce is ' + failedOnce);
      if (metar.error) {
        showFailed(metar.error, metarDiv);
      } else {
        showFailed('Couldn\'t fetch METAR', metarDiv);
      }
    } else { // This means that it's the first time that it's failed. Get the lat/long using Google's geocoding API and try again
      failedOnce = true;
      document.getElementById('loadingText').innerHTML = 'Fetching address...'; // Add loading text
      var addressURL = 'https://maps.googleapis.com/maps/api/geocode/json?address=' + params.split(' ').join('+') + '&key=AIzaSyC-VD77LuMyvahBa4GCglZLWmkD9ysk_TY';
      request(addressURL).then((result) => {
        var geocode = JSON.parse(result);
        try {
          if (geocode.status != 'OK') { // This means that geocoding failed. :(
            showFailed('No places found with that name!', metarDiv);
          } else { // Geocoding succeeded! Get lat and long and fetch METAR again.
            var newParams = geocode.results[0].geometry.location.lat + ',' + geocode.results[0].geometry.location.lng;
            fetchMetar(newParams);
          }
        } catch(error) {
          showFailed(error, metarDiv);
        }
      }).catch((reason) => {
        showFailed(reason, metarDiv);
      });
    }
  }).catch((reason) => { // This means that the query was rejected for some reason
    console.log(reason); // Log the reason and tell the user
    if (!failedOnce) { // Try it again!
      document.getElementById('loadingText').innerHTML = 'Fetching address...'; // Add loading text
      var addressURL = 'https://maps.googleapis.com/maps/api/geocode/json?address=' + params.split(' ').join('+') + '&key=AIzaSyC-VD77LuMyvahBa4GCglZLWmkD9ysk_TY';
      request(addressURL).then((result) => {
        var geocode = JSON.parse(result);
        try {
          if (geocode.status != 'OK') { // This means that geocoding failed. :(
            showFailed('No places found with that name!', metarDiv);
          } else { // Geocoding succeeded! Get lat and long and fetch METAR again.
            var newParams = geocode.results[0].geometry.location.lat + ',' + geocode.results[0].geometry.location.lng;
            failedOnce = true;
            fetchMetar(newParams);
          }
        } catch(error) {
          showFailed(error, metarDiv);
        }
      }).catch((reason) => {
        showFailed(reason, metarDiv);
      });
    } else {
      showFailed(error, metarDiv);
    }
  });
}