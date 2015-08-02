'use strict';

angular.module('directionServicesApp').factory('DirectionsManager', ['$window', '$http',
  function($window, $http) {
    var map, geocoder, placesService;
    // Holds all elements for each address: marker, searchBox, input
    var addresses = {
      from: {},
      to: {}
    };

    function loadSearchServices(fromInput, toInput) {
      geocoder = new google.maps.Geocoder();
      placesService = new google.maps.places.PlacesService(map);

      addresses.from = {
        input: fromInput,
        searchBox: new google.maps.places.SearchBox(fromInput[0])
      };

      google.maps.event.addListener(addresses.from.searchBox, 'places_changed', function() {
        addressSearch('from');
      });

      addresses.to = {
        input: toInput,
        searchBox: new google.maps.places.SearchBox(toInput[0])
      };

      google.maps.event.addListener(addresses.to.searchBox, 'places_changed', function() {
        addressSearch('to');
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
      } if (typeof addresses.from.marker === 'undefined') {
        return 'from';
      } else if (typeof addresses.to.marker === 'undefined') {
        return 'to';
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
      if (typeof addresses.from.marker !== 'undefined') {
        bounds.extend(addresses.from.marker.position);
      }

      if (typeof addresses.to.marker !== 'undefined') {
        bounds.extend(addresses.to.marker.position);
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
      if (typeof addresses.from.marker !== 'undefined' && typeof addresses.to.marker !== 'undefined') {
        map.draggableCursor = undefined;
      } else {
        map.draggableCursor = 'crosshair';
      }
    }

    return {
      init: function(mapElement, fromInput, toInput) {
        map = new google.maps.Map(mapElement[0], {
          draggableCursor: 'crosshair',
          zoom: 10,
          center: { lat: 42.6954322, lng: 23.3239467 } // Sofia coordinates
        });

        loadSearchServices(fromInput, toInput);
      },

      reset: function(type) {
        resetAddress(type);
      }
    };
  }]
);
