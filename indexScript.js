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

var markerMap = {};
  // initialise lists of markers for clusters
var markers = L.markerClusterGroup({
  showCoverageOnHover: false
});

L.control.zoom({
  position: 'topright'
}).addTo(map1);

// Add the tiles (image of the maps)
var lyr_streets = L.tileLayer('http://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    minZoom: 2,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
});

lyr_streets.addTo(map1);

// Add the sidebar
var sidebar1 = L.control.sidebar('sidebar', {
    position: 'left',
    closeButton: true,
    autoPan: true
}).addTo(map1);

// Fetch the JSON from local file, parse through
fetch('https://mapdb-victest.australiaeast.cloudapp.azure.com/pins', {
  method: "GET",
})
  .then(response => response.json())
  .then(plainjson => { 
    const data = convertToGeoJson(plainjson)
    
    // Parsing through each individual entry and extract info
    data.features.forEach(function(feature) {
      var id = feature.properties.id;
      var coordinates = feature.geometry.coordinates;
      var title = feature.properties.name;
      var category = feature.properties.category;

      // Create different classes of icons
      var iconOptions = {};

      if (category === "Good Friend") {
        iconOptions = {
          icon: 'face-smile',
          iconShape: 'marker',
          borderColor: '#2a3d68',
          textColor: 'white',
          backgroundColor: '#2a3d68'
        };
      } else if (category === "Project") {
        iconOptions = {
          icon: 'seedling',
          iconShape: 'marker',
          borderColor: '#195f4d',
          textColor: 'white',
          backgroundColor: '#195f4d'
        };
      } else if (category === "Carbon Farmer") {
        iconOptions = {
          icon: 'tree',
          iconShape: 'marker',
          borderColor: '#bf3938',
          textColor: 'white',
          backgroundColor: '#bf3938'
        };
      } else if (category === "Donor") {
        iconOptions = {
          icon: 'thumbs-up',
          iconShape: 'marker',
          borderColor: '#eb7c2c',
          textColor: 'white',
          backgroundColor: '#eb7c2c'
        };
      } else if (category === "Store") {
        iconOptions = {
          icon: 'store',
          iconShape: 'marker',
          borderColor: '#181818',
          textColor: 'white',
          backgroundColor: '#181818'
        };
      } else {
        iconOptions = {
          icon: 'leaf',
          iconShape: 'marker',
          borderColor: '#2196F3',
          textColor: '#2196F3',
          backgroundColor: 'white'
        };
      }

      // Create the marker object
      var marker = L.marker([coordinates[1], coordinates[0]], {
        id: id,
        title: title,
        icon: L.BeautifyIcon.icon(iconOptions),
        tags: [category]
      });

      marker.on('click', function() {
        showSidebar1(feature.properties);
      });

      markers.addLayer(marker);

      markerMap[id] = {
        title: title,
        marker: marker,
        category: category,
        properties: feature.properties
      };
    });

    map1.addLayer(markers);

  })
  .catch(error => console.error('Error loading GeoJSON:', error));

  function showSidebar1(properties) {
    var marker = markerMap[properties.id].marker;
    var latLng = marker.getLatLng();
  
    var offsetLatLng = L.latLng(latLng.lat, latLng.lng - 0.01);
  
    map1.setView(offsetLatLng, 14);
    sidebar1.setContent('<h5><em>' + properties.category + '</em></h5><h4>' + properties.name + '</h4><p>' + properties.description + '</p>');
    sidebar1.show();
  }

function handleSearch() {
  var query = document.getElementById('search-bar').value.toLowerCase();

  var sidebarContent = sidebar1.getContainer();
  sidebarContent.innerHTML = '';

  if (query !== '') {
    sidebar1.show();

    var matches = Object.keys(markerMap).filter(function(id) {
      return  markerMap[id].title.toLowerCase().includes(query);
    });

    if (matches.length > 0) {
      matches.forEach(function(match) {
        var resultItem = document.createElement('div');
        resultItem.className = 'search-result-item';

        var markerPoint = markerMap[match].properties;

        var categoryElement = document.createElement('h6');
        categoryElement.className = 'category';
        categoryElement.textContent = markerPoint.category;

        var nameElement = document.createElement('h6');
        nameElement.className = 'name';
        nameElement.textContent = markerPoint.name;

        var descriptionElement = document.createElement('p');
        descriptionElement.className = 'description';
        descriptionElement.textContent = markerPoint.description;

        resultItem.appendChild(categoryElement);
        resultItem.appendChild(nameElement);
        resultItem.appendChild(descriptionElement);

        resultItem.addEventListener('click', function() {
          showSidebar1(markerMap[match].properties);
        });

        sidebarContent.appendChild(resultItem);
      });
    } else {
      var noResultsItem = document.createElement('div');
      noResultsItem.className = 'search-result-item';
      noResultsItem.textContent = 'No results found';
      sidebarContent.appendChild(noResultsItem);
    }
  } else {
    sidebar1.hide();
  }
}

// Converts plainJSON to a GeoJSON
function convertToGeoJson(plain){
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



function updateMarkers() {
  markers.clearLayers();

  Object.keys(markerMap).forEach(function(title) {
    var markerData = markerMap[title];
    var marker = markerData.marker;
    var category = markerData.category;

    if (category === "Good Friend" && document.getElementById('good-friend').checked ||
        category === "Project" && document.getElementById('project').checked ||
        category === "Carbon Farmer" && document.getElementById('carbon-farmer').checked ||
        category === "Donor" && document.getElementById('donor-grants').checked ||
        category === "Store" && document.getElementById('store').checked) {
      markers.addLayer(marker);
    }
  });
}
