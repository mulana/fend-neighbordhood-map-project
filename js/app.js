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
    this.marker = null;
};

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
            self.showOnMap(place);
        });

        self.visiblePlaces.push(place);
	});


    // observable for filter field
	self.userInput = ko.observable('');

    self.toggleVisible = ko.observable(true);
    self.toggleMenu = function() {
        self.toggleVisible(!self.toggleVisible());
    };

    self.visiblePlaces = ko.computed(function() {
        var searchInput = self.userInput();
        if (!searchInput) {
            return self.allPlaces;
        } else {
            return ko.utils.arrayFilter(self.allPlaces, function(item) {
                return item.name.toLowerCase().indexOf(searchInput.toLowerCase()) !== -1;
            });
        }
    }, self);

    // display pins that match filter content
    // basically only ones that have filter string in its name
	self.filterMarkers = function() {

		self.allPlaces.forEach( function (place) {
			place.marker.setVisible(false);
        });

		self.visiblePlaces().forEach( function (place) {
			place.marker.setVisible(true);
		});
	};


    var infowindow = new google.maps.InfoWindow({
        content: ''
    });
    var lastMarker;
    infowindow.addListener('closeclick', function() {
        if(lastMarker) {
            lastMarker.setAnimation(null);
        }
    });

    self.showOnMap = function(place) {
        api.getInfo(place.cord, place.name, function(content) {
            infowindow.setContent(content);
            lastMarker = place.marker;
            infowindow.open(self.googleMap, place.marker);
        });
        if(lastMarker) {
            lastMarker.setAnimation(null);
        }
        place.marker.setAnimation(google.maps.Animation.BOUNCE);
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
    // This function is async so we need to use callback (cb) to return content to caller.
    this.getInfo = function(cord, name, cb) {
        var params = 'll=' + cord.lat + ',' + cord.lng;
        var query = '&query=' + name + '&intent=match';
        var key = '&client_id=' + client_id + '&client_secret=' + client_secret + '&v=20161016';
        var url = base_url + endpoint + params + query + key;
        $.ajax({
			url: url,
    		type: 'GET',
    		success: function (result) {
                var content = "<strong>Error:</strong> wasn't able to find any venue with query:<br><i>" + name + "</i>";
                if(result && result.response && result.response.venues && result.response.venues.length > 0) {
                    var venue = result.response.venues[0];

                    var formattedAddress = (venue.location && venue.location.formattedAddress) ? venue.location.formattedAddress : [];

                    content = "<strong>" + name + "</strong><br><br>" + formattedAddress.join("<br>");
                    if(venue && venue.stats) {
                        var checkins = venue.stats.checkinsCount || 0;
                        content += '<br><br><i>Total checkins:</i> ' + checkins;
                    }
                    content += '<br><br><span><i style="font-size: 0.8em">Powered by Foursquare API</i>';
                }
                if(cb) {
                    cb.call(this, content);
                }
            },
            error: function(jqXHR, status, error) {
            	var content = "<strong>Error:</strong> " + status + " - " + error;
                if(cb) {
                    cb.call(this, content);
                }
            }
        });
    };
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

function showMapError() {
    $('.map-message').html('<strong>Error:<strong> Unable to load Google Map');
}

