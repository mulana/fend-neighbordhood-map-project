//MODEL
var MapModel = function() {

	// //Display google maps in div with class map
	this.mapDiv = document.getElementById('map');
	//Google map point on coordinate of San Mateo
	this.mapCenter = ko.observableArray([{ lat: 37.562992, lng: -122.325525}]);
	//Set Map type : roadmap, satellite, hybrid, terrain
	//  mapTypeId: 'terrain',
	this.namePlaygrounds = ["Koret Children's Quarter Playground",
		"Coyote Point Recreation Area",
		"Ryder Court Park",
		"Happy Hollow Park and Zoo",
		"Gilroy Gardens Family Theme Park"];
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

var MapViewModel = function(map, mapModel) {
	var self = this;

	//Google Maps

	self.googleMap = map;

	self.allPlaces = [];
    var locationList = mapModel.locPlaygrounds;
	locationList.forEach( function (place) {
		self.allPlaces.push(new Place(place));
	});


	self.visiblePlaces = ko.observableArray();

    self.allPlaces.forEach( function (place) {
        var markerOptions = {
            map: self.googleMap,
            position: place.cord,
            animation: google.maps.Animation.DROP,
        };
        place.marker = new google.maps.Marker(markerOptions);
    });
    self.allPlaces.forEach( function (place) {
        self.visiblePlaces.push(place);
    });


	self.userInput = ko.observable('');

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

    self.userInput.subscribe(self.filterMarkers);

	function Place(dataObj) {
		this.name = dataObj.name;
		this.cord = dataObj.cord;
		this.marker = null
	}

    return self;
};

var mapModel = new MapModel();

// Initialise the Google Map with pre-defined centre
function initMap() {
	var map = new google.maps.Map(document.getElementById('map'), {
        center: {lat: 37.587281, lng: -122.328408},
        styles: mapModel.styleMap,
		zoom: 9
	});
	// MapView.addLocationMarkers();
    var mapViewModel = new MapViewModel(map, mapModel);
    ko.applyBindings(mapViewModel);
}

