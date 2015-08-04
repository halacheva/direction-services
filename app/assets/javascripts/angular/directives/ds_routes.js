angular.module('directionServicesApp').directive('dsRoutes', ['Router',
  function(Router) {
    return {
      templateUrl: 'assets/angular/templates/ds_routes.html',
      link: function(scope, element, attrs) {
        var originAddress = element.find('#origin_address');
        var destinationAddress = element.find('#destination_address');

        Router.init(element.find('#map'), originAddress, destinationAddress);
      },
      controller: function($scope, Router) {
        $scope.origin = '';
        $scope.destination = '';

        $scope.resetOrigin = function() {
          if ($scope.origin === '') {
            Router.reset('origin');
          }
        };

        $scope.resetDestination = function() {
          if ($scope.destination === '') {
            Router.reset('destination');
          }
        };

        $scope.findRoutes = function() {
          Router.route();
        };
      }
    };
  }
]);
