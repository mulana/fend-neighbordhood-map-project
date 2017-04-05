/** 
 * The main model for the page.
 * It contains plaground data and style for the google map.
 */
var MapModel = function() {
    //Location (lat + lng) of the Playgrounds in Bay Area that I want to show on the map
	this.locPlaygrounds = [{
		name: "Koret Children's Quarter Playground",
		address: "San Francisco",
		cord: {lat: 37.768345, lng: -122.457378}
		},
		{
		name: "Coyote Point Recreation Area",
		address: "San Mateo",
		cord: {lat: 37.587281, lng: -122.328408}
		},
		{
		name: "Ryder Court Park",
		address: "San Mateo",
		cord: {lat: 37.574390, lng: -122.306703}
		},
		{
		name: "Happy Hollow Park and Zoo",
		address: "San Jose",
		cord: {lat: 37.327758, lng: -121.860686}
		},
		{
		name: "Gilroy Gardens Family Theme Park",
		address: "Gilroy, CA",
		cord: {lat: 37.004996, lng: -121.629061}
	}];
	// Create a styles array to use with the map.
	this.styleMap = [{
		featureType: 'water',
		stylers: [
			{ color: '#19a0d8' }
		]
		},{
		featureType: 'administrative',
		elementType: 'labels.text.stroke',
		stylers: [
			{ color: '#ffffff' },
			{ weight: 6 }
		]
		},{
		featureType: 'administrative',
		elementType: 'labels.text.fill',
		stylers: [
			{ color: '#e85113' }
		]
		},{
		featureType: 'road.highway',
		elementType: 'geometry.stroke',
		stylers: [
			{ color: '#efe9e4' },
			{ lightness: -40 }
		]
		},{
		featureType: 'transit.station',
		stylers: [
			{ weight: 9 },
			{ hue: '#e85113' }
		]
		},{
		featureType: 'road.highway',
		elementType: 'labels.icon',
		stylers: [
			{ visibility: 'off' }
		]
		},{
		featureType: 'water',
		elementType: 'labels.text.stroke',
		stylers: [
			{ lightness: 100 }
		]
		},{
		featureType: 'water',
		elementType: 'labels.text.fill',
		stylers: [
			{ lightness: -100 }
		]
		},{
		featureType: 'poi',
		elementType: 'geometry',
		stylers: [
			{ visibility: 'on' },
			{ color: '#f0e4d3' }
		]
		},{
		featureType: 'road.highway',
		elementType: 'geometry.fill',
		stylers: [
			{ color: '#efe9e4' },
			{ lightness: -25 }
		]
	}];
};

/**
 * Mini class used to store name, coordinate, and marker of a plaground
 */
var Place = function (dataObj) {
    this.name = dataObj.name;
    this.cord = dataObj.cord;
    this.marker = null
}

/**
 * Main MapViewModel. Connects everything on the page.
 */
var MapViewModel = function(map, mapModel, api) {
	var self = this;

	//Google Maps
	self.googleMap = map;
    self.api = api;

	self.allPlaces = [];

    // binded array that shows pins on the page
	self.visiblePlaces = ko.observableArray();

    // create places objects out of playground locations models
    // places objects are used to display pins and info windows
	mapModel.locPlaygrounds.forEach( function (playground) {
        var place = new Place(playground);
		self.allPlaces.push(place);

        var markerOptions = {
            map: self.googleMap,
            position: place.cord,
            animation: google.maps.Animation.DROP,
            icon: 'images/playground-32.png'
        };
        place.marker = new google.maps.Marker(markerOptions);
        place.marker.addListener('click', function() {
            api.getInfo(place.cord, place.name, self.googleMap, place.marker);
        });

        self.visiblePlaces.push(place);
	});


    // observable for filter field
	self.userInput = ko.observable('');


    // display pins that match filter content
    // basically only ones that have filter string in its name
	self.filterMarkers = function() {
		var searchInput = self.userInput().toLowerCase();
		self.visiblePlaces.removeAll();
		self.allPlaces.forEach( function (place) {
			place.marker.setMap(null);
			if (place.name.toLowerCase().indexOf(searchInput) !== -1) {
				self.visiblePlaces.push(place);
			}
		});
		self.visiblePlaces().forEach( function (place) {
			place.marker.setMap(self.googleMap);
		});
	};
    self.showAll = function() {
        self.filterMarkers();
    };
    self.hideAll = function() {
        self.allPlaces.forEach(function (place) {
            place.marker.setMap(null);
        });
        self.visiblePlaces.removeAll();
    };

    // on every change to user input do the filtering
    self.userInput.subscribe(self.filterMarkers);

    return self;
};


// Use foursquare api to obtain formatted address of the plaground and the number
// of checkins. The result is displayed to info window.
var FourSquareApi = function() {

    var client_id = 'T0W2LHGFLB2DOYSCE02MMGS2TVYBDWJHPGRHNOSTZQIVHP4Q';
    var client_secret = 'SBMWUWAYFL0ZYEVNP0OR4AHWDY0SEYDESHMEX1OW5HIJPVW4';
    var base_url = 'https://api.foursquare.com/v2/';
    var endpoint = 'venues/search?';


    // Get info about the venue that matches geo location.
    // Display info window with formatted address and the number of checkins.
    this.getInfo = function(cord, name, map, marker) {
        var params = 'll=' + cord.lat + ',' + cord.lng;
        var query = '&query=' + name + '&intent=match';
        var key = '&client_id=' + client_id + '&client_secret=' + client_secret + '&v=20161016';
        var url = base_url + endpoint + params + query + key;
        $.get(url, function (result) {
            var venues = result.response.venues;
            var content = "<strong>Error:</strong> wasn't able to find any venue with query:<br><i>" + name + "</i>";
            if(venues.length > 0) {
                var venue = venues[0];

                content = "<strong>" + name + "</strong><br><br>" + venue.location.formattedAddress.join("<br>");
                content += '<br><br><i>Total checkins:</i> ' + venue.stats.checkinsCount;
            }

            var infowindow = new google.maps.InfoWindow({
                content: content
            });

            infowindow.open(map, marker);
        });
    }
};

var mapModel = new MapModel();
var fourSquareApi = new FourSquareApi();

// Initialise the Google Map with pre-defined center
function initMap() {
	var map = new google.maps.Map(document.getElementById('map'), {
        center: {lat: 37.587281, lng: -122.328408},
        styles: mapModel.styleMap,
		zoom: 9
	});
    var mapViewModel = new MapViewModel(map, mapModel, fourSquareApi);
    ko.applyBindings(mapViewModel);
}
