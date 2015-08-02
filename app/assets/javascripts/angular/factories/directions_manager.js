'use strict';

angular.module('directionServicesApp').factory('DirectionsManager', ['$window', '$http',
  function($window, $http) {
    return {
      markers: {},

      init: function(map) {
        this.map = new google.maps.Map(map[0], {
          zoom: 10,
          center: { lat: 42.6954322, lng: 23.3239467 } // Sofia coordinates
        });
      },

      loadSearchServices: function(fromInput, toInput) {
        var that = this;
        this.geocoder = new google.maps.Geocoder();

        this.fromInput = fromInput;
        this.fromSearchBox = new google.maps.places.SearchBox(fromInput[0]);
        this.fromPlacesService = new google.maps.places.PlacesService(fromInput[0]);
        google.maps.event.addListener(this.fromSearchBox, 'places_changed', function() {
          that.addressSearch(that.fromPlacesService, 'from', that.fromInput);
        });

        this.toInput = toInput;
        this.toSearchBox = new google.maps.places.SearchBox(toInput[0]);
        this.toPlacesService = new google.maps.places.PlacesService(toInput[0]);
        google.maps.event.addListener(this.toSearchBox, 'places_changed', function() {
          that.addressSearch(that.toPlacesService, 'to', that.toInput);
        });

        google.maps.event.addListener(this.map, 'click', function(event) {
          that.locationSearch(event.latLng);
        });
      },

      addressSearch: function(service, type, input) {
        var that = this;
        service.textSearch({ query: input.val() }, function(places, status) {
          that.onPlacesFound(type, places);
        });
      },

      locationSearch: function(location) {
        var that = this;
        var searchBox = this.selectSearchBox();

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
          draggable: true
        });

        google.maps.event.addListener(this.markers[type], 'dragend', function(event) {
          that.locationSearch(event.latLng);
        });

        this.updateViewPort();
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
      },

      selectSearchBox: function() {
        if (typeof this.markers.from === 'undefined') {
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
        }
      }
    };
  }]
);
