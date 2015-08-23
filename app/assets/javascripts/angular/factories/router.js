'use strict';

angular.module('directionServicesApp').factory('Router', ['$window', '$http', '$q',
  function($window, $http, $q) {
    var map, geocoder, directionsService, directionsRenderer;
    // Holds all elements for each address: marker, searchBox, input
    var addresses = {
      origin: {},
      destination: {},
      waypoints: {}
    };
    var routes;

    return {
      init: function(mapElement, originInput, destinationInput, waypointsInput) {
        map = new google.maps.Map(mapElement[0], {
          draggableCursor: 'crosshair',
          zoom: 10,
          center: { lat: 42.6954322, lng: 23.3239467 } // Sofia coordinates
        });

        loadServices(originInput, destinationInput, waypointsInput);
      },

      clear: function() {
        resetAddress('origin');
        resetAddress('destination');
        directionsRenderer.setMap(null);
      },

      display: function(index) {
        directionsRenderer.setRouteIndex(index);
      },

      reset: function(type) {
        resetAddress(type);
      },

      route: function(options) {
        var deferred = $q.defer();

        directionsService.route(mergeRouteOptions(options), function(result, status) {
          if (status == google.maps.DirectionsStatus.OK) {
            addresses.origin.marker.setMap(null);
            addresses.destination.marker.setMap(null);
            routes = result;
            deferred.resolve(result);
            directionsRenderer.setMap(map);
            directionsRenderer.setDirections(result);
          }
        });

        return deferred.promise;
      },
    };

    // Private methods

    function loadServices(originInput, destinationInput, waypointsInput) {
      geocoder = new google.maps.Geocoder();
      directionsService = new google.maps.DirectionsService();
      directionsRenderer = new google.maps.DirectionsRenderer({ map: map, draggable: true });

      // Origin
      addresses.origin = {
        input: originInput,
        searchBox: new google.maps.places.SearchBox(originInput[0])
      };

      google.maps.event.addListener(addresses.origin.searchBox, 'places_changed', function() {
        addressSearch('origin');
      });

      // Destination
      addresses.destination = {
        input: destinationInput,
        searchBox: new google.maps.places.SearchBox(destinationInput[0])
      };

      google.maps.event.addListener(addresses.destination.searchBox, 'places_changed', function() {
        addressSearch('destination');
      });

      // Waypoints
      addresses.waypoints = {
        input: waypointsInput,
        searchBox: new google.maps.places.SearchBox(waypointsInput[0])
      };

      // Google Maps Click
      google.maps.event.addListener(map, 'click', function(event) {
        locationSearch(event.latLng);
      });
    }

    function addressSearch(type) {
      var places = addresses[type].searchBox.getPlaces();
      onPlacesFound(type, places);
      updateViewPort();
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

    function mergeRouteOptions(options) {
      var defaultOptions = {
        origin: addresses.origin.marker.position,
        destination: addresses.destination.marker.position,
        travelMode: google.maps.TravelMode.DRIVING,
        provideRouteAlternatives: true
      };

      var mergedOptions = defaultOptions;

      for (var key in options) {
        mergedOptions[key] = options[key];
      };

      return mergedOptions;
    };
  }]
);
