angular.module('directionServicesApp').directive('dsMap', ['DirectionsManager',
  function(DirectionsManager) {
  return {
    templateUrl: 'assets/angular/templates/ds_map.html',
    link: function(scope, element, attrs) {
      var originAddress = element.find('#origin_address');
      var destinationAddress = element.find('#destination_address');

      DirectionsManager.init(element.find('#map'), originAddress, destinationAddress);

      originAddress.on('blur', function() {
        if (this.value === '') {
          DirectionsManager.reset('origin');
        }
      });

      destinationAddress.on('blur', function() {
        if (this.value === '') {
          DirectionsManager.reset('destination');
        }
      });
    }
  }
}]);

