'use strict';

angular.module('directionServicesApp').factory('DirectionsManager', ['$window', '$http',
  function($window, $http) {
    return {
      markers: {},

      init: function(map) {
        this.map = new google.maps.Map(map[0], {
          draggableCursor: 'crosshair',
          zoom: 10,
          center: { lat: 42.6954322, lng: 23.3239467 } // Sofia coordinates
        });
      },

      loadSearchServices: function(fromInput, toInput) {
        var that = this;
        this.geocoder = new google.maps.Geocoder();
        this.placesService = new google.maps.places.PlacesService(this.map);

        this.fromInput = fromInput;
        this.fromSearchBox = new google.maps.places.SearchBox(fromInput[0]);
        google.maps.event.addListener(this.fromSearchBox, 'places_changed', function() {
          that.addressSearch('from', that.fromInput);
        });

        this.toInput = toInput;
        this.toSearchBox = new google.maps.places.SearchBox(toInput[0]);
        google.maps.event.addListener(this.toSearchBox, 'places_changed', function() {
          that.addressSearch('to', that.toInput);
        });

        google.maps.event.addListener(this.map, 'click', function(event) {
          that.locationSearch(event.latLng);
        });
      },

      addressSearch: function(type, input) {
        var that = this;
        this.placesService.textSearch({ query: input.val() }, function(places, status) {
          that.onPlacesFound(type, places);
          that.updateViewPort();
        });
      },

      locationSearch: function(location, type) {
        var that = this;
        var searchBox = this.selectSearchBox(type);

        if (typeof searchBox !== 'undefined') {
          this.geocoder.geocode({ location: location }, function(places, status) {
            that.onPlacesFound(searchBox.type, places, searchBox.input);
          });
        }
      },

      positionMarker: function(type, place) {
        var that = this;
        var location = place.geometry.location;
        var title = place.formatted_address;

        this.markers[type] = new google.maps.Marker({
          position: location,
          title: title,
          map: this.map,
          draggable: true,
          type: type
        });

        google.maps.event.addListener(this.markers[type], 'dragend', function(event) {
          that.locationSearch(event.latLng, this.type);
        });
      },

      updateViewPort: function() {
        var bounds = new google.maps.LatLngBounds();
        if (typeof this.markers.from !== 'undefined') {
          bounds.extend(this.markers.from.position);
        }

        if (typeof this.markers.to !== 'undefined') {
          bounds.extend(this.markers.to.position);
        }

        this.map.fitBounds(bounds);
      },

      removeMarker: function(type) {
        if (typeof this.markers[type] !== 'undefined') {
          this.markers[type].setMap(null);
          this.markers[type] = undefined;
        }

        this.toggleMapCursor();
      },

      selectSearchBox: function(type) {
        if (typeof type !== 'undefined') {
          return { type: type,
                   input: this[type + 'Input'] };
        } if (typeof this.markers.from === 'undefined') {
          return { type: 'from',
                   input: this.fromInput };
        } else if (typeof this.markers.to === 'undefined') {
          return { type: 'to',
                   input: this.toInput };
        }
      },

      onPlacesFound: function(type, places, input) {
        this.removeMarker(type);

        if (places.length > 0) {
          this.positionMarker(type, places[0]);
          if (typeof input !== 'undefined') {
            input.val(places[0].formatted_address);
          }

          this.toggleMapCursor();
        }
      },

      toggleMapCursor: function() {
        if (typeof this.markers.from !== 'undefined' && typeof this.markers.to !== 'undefined') {
          this.map.draggableCursor = undefined;
        } else {
          this.map.draggableCursor = 'crosshair';
        }
      }
    };
  }]
);
