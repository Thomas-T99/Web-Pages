var serverName = 'https://mapdb-victest.australiaeast.cloudapp.azure.com/pins';

var southWest = L.latLng(-41.29012931030752 - 200, 174.76792012621496 - 200);
var northEast = L.latLng(-41.29012931030752 + 200, 174.76792012621496 + 200);
var bounds = L.latLngBounds(southWest, northEast);

// Initialise the map
var map1 = L.map('map', {
    maxBounds: bounds,
    zoomControl: false,
    scrollWheelZoom: false,
    smoothWheelZoom: true,
    smoothSensitivity: 3,
}).setView([-41.29012931030752, 174.76792012621496], 5);

var currentMarker;
var currentId = null;

//Adding marker on click 
function addMarkeronClick(e) {
    if (currentMarker != null) {
        map1.removeLayer(currentMarker) //Removes last marker
    }
    coords = e.latlng;
    currentMarker = new L.Marker(coords, { draggable: true });
    map1.addLayer(currentMarker);
    currentMarker.on('dragend', function (e) {
    console.log(currentMarker.getLatLng().lat + ", " + currentMarker.getLatLng().lng);
    });
}

map1.on('click', addMarkeronClick);

// Retrieve coordinates from search
var geocoder = L.Control.geocoder({
    defaultMarkGeocode: false
})
    .on('markgeocode', function (e) {
        if (currentMarker != null) {
            map1.removeLayer(currentMarker) //Removes last marker
        }
        coords = e.geocode.center;
        const newMarker = L.marker(coords, { draggable: true });
        map1.addLayer(newMarker);
        currentMarker = newMarker;
        map1.setView(coords, 14);
        currentMarker.on('dragend', function (e) {
        console.log(currentMarker.getLatLng().lat + ", " + currentMarker.getLatLng().lng);
        });
    })
    .addTo(map1);

var locations = {};
// initialise lists of markers for clusters

L.control.zoom({
    position: 'topright'
}).addTo(map1);


// Add the tiles (image of the maps)
var lyr_streets = L.tileLayer('http://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    minZoom: 2,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
});

lyr_streets.addTo(map1);

// Fetch the JSON from local file, parse through
// fetch('https://tong-jt.github.io/map-test/plainlocations.json')
fetch(serverName, {method: "GET",})
    .then(response => response.json())
    .then(plainJson => {
        var geoJson = convertMultipleToGeoJson(plainJson)
        addToSelectionDiv(geoJson);
        const addbtn = document.getElementById('addbtn'); //Why is this in the forEach loop???
        addbtn.addEventListener('click', function () {
            showFormAdd();
        });
    })
    .catch(error => console.error('Error loading GeoJSON:', error));

function openForm(feature) {
    currentId = feature.properties.id;
    var title = feature.properties.name;
    var category = feature.properties.category;
    var description = feature.properties.description;
    var coordinates = feature.coordinates;
    if (currentMarker != null) {
        map1.removeLayer(currentMarker);
    }
    $(locationname).val(title);
    $(locationtype).val(category);
    //Force dropdown to register update with safari bug
    $(locationtype).focus().blur();
    $(descriptionfield).val(description);
    var marker = L.marker(coordinates, { draggable: true }).addTo(map1);
    currentMarker = marker;
    currentMarker.on('dragend', function (e) {
    console.log(currentMarker.getLatLng().lat + ", " + currentMarker.getLatLng().lng);
    });
}

//Delete needs to also somehow remove the location from the locations[id]?
    document.getElementById('deleteBtn').addEventListener('click', function (e) {
        e.preventDefault();
        if (confirm("Are you sure you want to delete this entry?") == true) {
            const raw = "";
            const requestOptions = {
              method: "DELETE",
              body: raw,
              redirect: "follow"
            };
            console.log(currentId);
            fetch("https://mapdb-victest.australiaeast.cloudapp.azure.com/pins/"+currentId, requestOptions)
                .then(response => {
                    console.log(response);
                    delete locations[currentId];
                    console.log("About to reset Search");
                    showFormReset();
                    console.log("Done reset Search");
                    currentId = null;
                })
              .catch((error) => console.error(error));
          } else {
            console.log('You canceled a delete');
          }
    });

function convertSingleToGeoJson(plain) {
    const geoJSON = {
        type: "FeatureCollection",
        features: [{
            type: "Feature",
            geometry: {
                type: "Point",
                coordinates: plain.coordinates
            },
            properties: {
                id: plain.id,
                name: plain.name,
                description: plain.description,
                category: plain.category
            }
        }]
    };
    console.log(geoJSON);
    return geoJSON;
}

// Converts plainJSON to a GeoJSON
function convertMultipleToGeoJson(plain) {
    const geoJSON = {
        type: "FeatureCollection",
        features: plain.map(site => ({
            type: "Feature",
            geometry: {
                type: "Point",
                coordinates: site.coordinates
            },
            properties: {
                id: site.id,
                name: site.name,
                description: site.description,
                category: site.category
            }
        }))
    };
    return geoJSON;
}

let fetchMethod = 'UNSELECTED';

//Reset form to initial stage
function showFormReset(){
    var form = document.getElementById('formcontents');
    resetSearch();
    form.reset();
    removeErrorBorders();
    currentId = null;
    form.style.display = 'none';
    document.getElementById('addingHeader').style.display = 'none';
    document.getElementById('editingHeader').style.display = 'none';
    if (currentMarker != null) {
        map1.removeLayer(currentMarker) //Removes last marker
        currentMarker = null;
    }
    fetchMethod = 'UNSELECTED';
}

//Reset form ready for populating to edit an existing location
function showFormEdit() {
    var form = document.getElementById('formcontents');
    var deleteBtn = document.getElementById('deleteBtn');
    removeErrorBorders()
    form.style.display = 'block';
    document.getElementById('addingHeader').style.display = 'none';
    document.getElementById('editingHeader').style.display = 'block';
    deleteBtn.style.display = 'block';
    map1.invalidateSize();
    fetchMethod = 'EDIT';
}

//Reset form ready for adding a new location
function showFormAdd() {
    resetSearch();
    var form = document.getElementById('formcontents');
    var deleteBtn = document.getElementById('deleteBtn');
    removeErrorBorders()
    currentId = null;
    form.style.display = 'block';
    document.getElementById('addingHeader').style.display = 'block';
    document.getElementById('editingHeader').style.display = 'none';
    deleteBtn.style.display = 'none';
    map1.invalidateSize();
    fetchMethod = 'ADD';
    if (currentMarker != null) {
        map1.removeLayer(currentMarker) //Removes last marker
        currentMarker = null;
    }
    form.reset();
}

function handleSearch() {
  var query = document.getElementById('search-bar').value.toLowerCase();

  if (query !== '') {
    var matches = Object.keys(locations).filter(function(id) {
      return locations[id].properties.name.toLowerCase().includes(query);
    });

    $(".selectiondiv").empty();

    if (matches.length > 0) {
      matches.forEach(function(match) {
        var location = locations[match];
        var markerPoint = location.properties;

        var resultItem = document.createElement('div');
        resultItem.id = match;
        resultItem.className = 'locationdiv';

        var titleElement = document.createElement('div');
        titleElement.className = 'locationtitle';
        titleElement.textContent = markerPoint.name;
        resultItem.appendChild(titleElement);

        var categoryElement = document.createElement('div');
        categoryElement.className = 'category';
        categoryElement.textContent = markerPoint.category;
        resultItem.appendChild(categoryElement);

        resultItem.addEventListener('click', function() {
          showFormEdit(); 
          openForm(locations[match]);
        });

        $(".selectiondiv").append(resultItem);
      });
    } else {
      var noResultsItem = document.createElement('div');
      noResultsItem.className = 'search-result-item';
      noResultsItem.textContent = 'No results found';
      $(".selectiondiv").append(noResultsItem);
    }
  }

  else {
    resetSearch();
  }
}

function resetSearch() {
    console.log("Reset Search Starting");
  $(".selectiondiv").empty();
  $("#search-bar").val("");
  Object.keys(locations).forEach(key => {
    var feature = locations[key];
    var id = feature.properties.id;
    var title = feature.properties.name;
    var category = feature.properties.category;

    var resultItem = document.createElement('div');
    resultItem.id = id;
    resultItem.className = 'locationdiv';

    var titleElement = document.createElement('div');
    titleElement.className = 'locationtitle';
    titleElement.textContent = title;
    resultItem.appendChild(titleElement);

    var categoryElement = document.createElement('div');
    categoryElement.className = 'category';
    categoryElement.textContent = category;
    resultItem.appendChild(categoryElement);

    resultItem.addEventListener('click', function() {
      showFormEdit(); 
      openForm(locations[id]);
    });

    $(".selectiondiv").append(resultItem);
  });
  console.log("Reset Search Ending");
}

// SUBMIT BUTTON LISTENER
document.getElementById('submitBtn').addEventListener('click', function (e) {
    e.preventDefault();
    var newname = document.getElementById('locationname').value;
    var type = document.getElementById('locationtype').value;
    var description = document.getElementById('descriptionfield').value;

    // Create list of errors
    var errors = [];
    if(currentMarker == null) {
        errors.push("CoordError: No location selected");
    } else {
        var coords = currentMarker.getLatLng();
    }

    var dataErrors = validateData(newname, type, description);
    if (dataErrors.length > 0) {
        errors.push(...dataErrors);
    }

    //Process list of errors
    if (errors.length > 0) {
        for(let formError of errors) {
            if(formError.startsWith("NameError")){
                document.getElementById('locationname').style.border = "5px solid red";
            }
            if(formError.startsWith("TypeError")){
                document.getElementById('locationtype').style.border = "5px solid red";
            }
            if(formError.startsWith("DescriptionError")){
                document.getElementById('descriptionfield').style.border = "5px solid red";
            }
            if(formError.startsWith("CoordError")){
                document.getElementById('map').style.border = "5px solid red"
            }
            console.log(formError);
        }
        return; // returns if there are any errors so that no attempts to send data to API are made
    }

    if (checkIfEmpty(description)) {
        switch (type){
            case "Good Friend":
                description =  "Our Good Friends contribute to on-the-ground, collaborative, and circular community projects creating long-term carbon sinks, all over New Zealand.";
                break;
            case "Project":
                description = "We collaborate with good people delivering important school and community food-growing and conservation projects across New Zealand to provide a home for our biochar.";
                break;
            case "Carbon Farmer":
                description = "Working around New Zealand, our carbon farmers save green waste from re-emitting carbon to the atmosphere by converting it to biochar.";
                break;
            case "Donor":
                description = "Our donors provide funding and support to implement projects across New Zealand.";
                break;
            case "Store":
                description = "Supporters of The Good Carbon Store provide funding to implement projects across New Zealand.";
                break;
        }
    }

    console.log(newname+type+description);
    const myHeaders = new Headers();
    myHeaders.append("Accept", "application/json");
    myHeaders.append("Content-Type", "application/json");
    // ADD METHOD
    if (fetchMethod=='ADD'){
        const raw = JSON.stringify({
            name: newname,
            coordinates: [coords.lng, coords.lat],  
            category: type,
            description: description
        });
        console.log("SENT DATA : "+raw);
        // const raw = '{"name":"'+newname+'", "coordinates":'+formattedcoords+', "category": "'+type+'", "description": "'+description+'"}';
        fetch(serverName, {
            method: "POST",
            headers: myHeaders,
            body: raw
        })
        .then(response => response.json())
        .then(data => {
            console.log("Success:", data);
            const geoJson = convertSingleToGeoJson(data);
            addToSelectionDiv(geoJson);
            showFormReset();
        })
        .catch(error => console.error("Error:", error));

    // PUT METHOD
    } else if (fetchMethod=='EDIT'){
        if (currentId == null) {
            console.log("Id not found");
            return;
        }

        if (confirm("This will update the entry, and the old data will be lost. Continue?")==true) {
            const raw = JSON.stringify({
                name: newname,
                coordinates: [coords.lng, coords.lat],
                category: type,
                description: description
            });
            fetch((serverName + "/" + currentId), {
                method: "PUT",
                headers: myHeaders,
                body: raw,
                redirect: 'follow'
            }).catch(error => console.error("Error:", error));
            //below code needs server to be updated so that POST returns data
                // .then(response => response.json())
                // .then(data => {
                //     console.log("Success:", data);
                //     const geoJson = convertSingleToGeoJson(data);
                //     geoJson.features.forEach(function (feature) {
                //         var id = feature.properties.id;
                //         locations[id] = {
                //             properties: feature.properties,
                //             coordinates: [coordinates[1], coordinates[0]]
                //         };
                //     })
                //     resetSearch();
                // })
            showFormReset(); // make if no error
        }
        // Add check for confirmation and remove red borders if success
        // Update sidebar if successful

    }
});

document.getElementById('cancelBtn').addEventListener('click', function (e) {
    e.preventDefault();
    var form = document.getElementById('formcontents');
    if (confirm("Are you sure you want to cancel?") == true) {
        showFormReset()
        console.log('You confirmed a cancel');
      } else {
        console.log('You canceled a cancel???');
      }
});

function validateData(newname, type, description) {
    const errors = [];
    const nameErrors = validateNewName(newname);
    const typeErrors = validateType(type);
    const descriptionErrors = validateDescription(description);

    if (nameErrors.length > 0) { //checks length as empty arrays cannot be pushed
        errors.push(...nameErrors);
    }
    if (typeErrors.length > 0) {
        errors.push(...typeErrors);
    }
    if (descriptionErrors.length > 0) {
        errors.push(...descriptionErrors);
    }
    return errors;
}

function validateNewName(newname) {
    var nameErrors = [];
    if (checkIfEmpty(newname)) {
        nameErrors.push("NameError: Please enter a name")
    }
    if(newname.length > 85) {
        nameErrors.push("NameError: Name cannot be more than 50 characters");
    }
    return nameErrors;
}

function validateType(type) {
    var typeErrors = [];
    if (checkIfEmpty(type)) {
        typeErrors.push("TypeError: Please select a category")
    }

    let validTypes = ["Good Friend", "Project", "Carbon Farmer", "Donor", "Store"];
    if (!(validTypes.includes(type))) {
        typeErrors.push("TypeError: Invalid type");
    }
    // Type errors go here
    return typeErrors;
}

function validateDescription(description) {
    var descriptionErrors = [];
    // Check description errors here
    if (checkIfEmpty(description)) {
        return [];
    }
    return descriptionErrors;
}

function checkIfEmpty(text) {
    const emptyPattern = /^\s*$/; //regex expression that is either empty or just whitespace
    return emptyPattern.test(text); //returns true if empty
}

function removeErrorBorders() {
    document.getElementById('locationname').style.border = "none";
    document.getElementById('locationtype').style.border = "none";
    document.getElementById('descriptionfield').style.border = "none";
    document.getElementById('map').style.border = "none";
}

function addToSelectionDiv(data) {
    data.features.forEach(function (feature) {
        var id = feature.properties.id;
        var title = feature.properties.name;
        var category = feature.properties.category;
        var coordinates = feature.geometry.coordinates;
        locations[id] = {
            properties: feature.properties,
            coordinates: [coordinates[1], coordinates[0]]
        };
        $(".selectiondiv").append('<div id="' + id + '" class="locationdiv"><div class="locationtitle">' + title + '</div>' + category + '</div>');
        const locationSection = document.getElementById(id);
        locationSection.addEventListener('click', function () {
            showFormEdit();
            openForm(locations[id]);
        });
    });
}
