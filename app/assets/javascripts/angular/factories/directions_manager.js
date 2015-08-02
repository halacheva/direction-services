'use strict';

angular.module('directionServicesApp').factory('DirectionsManager', ['$window', '$http',
  function($window, $http) {
    var map, geocoder, placesService, directionsService, directionsRenderer;
    // Holds all elements for each address: marker, searchBox, input
    var addresses = {
      origin: {},
      destination: {}
    };

    function loadServices(originInput, destinationInput) {
      geocoder = new google.maps.Geocoder();
      placesService = new google.maps.places.PlacesService(map);
      directionsService = new google.maps.DirectionsService();
      directionsRenderer = new google.maps.DirectionsRenderer({ map: map, draggable: true });

      addresses.origin = {
        input: originInput,
        searchBox: new google.maps.places.SearchBox(originInput[0])
      };

      google.maps.event.addListener(addresses.origin.searchBox, 'places_changed', function() {
        addressSearch('origin');
      });

      addresses.destination = {
        input: destinationInput,
        searchBox: new google.maps.places.SearchBox(destinationInput[0])
      };

      google.maps.event.addListener(addresses.destination.searchBox, 'places_changed', function() {
        addressSearch('destination');
      });

      google.maps.event.addListener(map, 'click', function(event) {
        locationSearch(event.latLng);
      });
    }


    function addressSearch(type) {
      var address = addresses[type].input.val();

      placesService.textSearch({ query: address }, function(places, status) {
        onPlacesFound(type, places);
        updateViewPort();
      });
    }

    function locationSearch(location, type) {
      var type = selectAddressType(type);

      if (typeof type !== 'undefined') {
        geocoder.geocode({ location: location }, function(places, status) {
          onPlacesFound(type, places, true);
        });
      }
    }

    function selectAddressType(type) {
      if (typeof addresses[type] !== 'undefined') {
        return type;
      } if (typeof addresses.origin.marker === 'undefined') {
        return 'origin';
      } else if (typeof addresses.destination.marker === 'undefined') {
        return 'destination';
      }
    }

    function onPlacesFound(type, places, updateInputValue) {
      resetAddress(type);

      if (places.length > 0) {
        positionMarker(type, places[0]);

        if (updateInputValue) {
          addresses[type].input.val(places[0].formatted_address);
        }

        toggleMapCursor();
      }
    }

    function positionMarker(type, place) {
      var location = place.geometry.location;
      var title = place.formatted_address;

      addresses[type].marker = new google.maps.Marker({
        position: location,
        title: title,
        map: map,
        draggable: true,
        type: type
      });

      google.maps.event.addListener(addresses[type].marker, 'dragend', function(event) {
        locationSearch(event.latLng, type);
      });
    }

    function updateViewPort() {
      var bounds = new google.maps.LatLngBounds();
      if (typeof addresses.origin.marker !== 'undefined') {
        bounds.extend(addresses.origin.marker.position);
      }

      if (typeof addresses.destination.marker !== 'undefined') {
        bounds.extend(addresses.destination.marker.position);
      }

      map.fitBounds(bounds);
    }

    function resetAddress(type) {
      if (typeof addresses[type].marker !== 'undefined') {
        addresses[type].marker.setMap(null);
        addresses[type].marker = undefined;
      }

      toggleMapCursor();
    }

    function toggleMapCursor() {
      if (typeof addresses.origin.marker !== 'undefined' && typeof addresses.destination.marker !== 'undefined') {
        map.draggableCursor = undefined;
      } else {
        map.draggableCursor = 'crosshair';
      }
    }

    function findRoutes() {
      var request = {
        origin: addresses.origin.marker.position,
        destination: addresses.destination.marker.position,
        travelMode: google.maps.TravelMode.DRIVING,
        provideRouteAlternatives: true
      };
      directionsService.route(request, function(result, status) {
        if (status == google.maps.DirectionsStatus.OK) {
          addresses.origin.marker.setMap(null);
          addresses.destination.marker.setMap(null);
          directionsRenderer.setDirections(result);
        }
      });
    }

    return {
      init: function(mapElement, originInput, destinationInput) {
        map = new google.maps.Map(mapElement[0], {
          draggableCursor: 'crosshair',
          zoom: 10,
          center: { lat: 42.6954322, lng: 23.3239467 } // Sofia coordinates
        });

        loadServices(originInput, destinationInput);
      },

      reset: function(type) {
        resetAddress(type);
      },

      find: function() {
        findRoutes();
      }
    };
  }]
);
