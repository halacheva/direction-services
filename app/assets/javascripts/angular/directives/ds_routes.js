angular.module('directionServicesApp').directive('dsRoutes', ['Router',
  function(Router) {
    return {
      templateUrl: 'assets/angular/templates/ds_routes.html',

      link: function(scope, element, attrs) {
        var originAddress = element.find('#origin_address');
        var destinationAddress = element.find('#destination_address');

        Router.init(element.find('#map'), originAddress, destinationAddress);
      },

      controller: ['$scope', 'Router',
        function($scope, Router) {
          $scope.origin = '';
          $scope.destination = '';

          $scope.clear = function() {
            $scope.origin = '';
            $scope.destination = '';
            Router.clear();
          };

          $scope.displayRoute = function(index) {
            Router.display(index);
            $scope.displayedRoute = index;
          };

          $scope.findRoutes = function() {
            Router.route().then(function(result) {
              $scope.routes = result.routes;
              $scope.displayedRoute = 0;
            });
          };

          $scope.resetDestination = function() {
            if ($scope.destination === '') {
              Router.reset('destination');
            }
          };

          $scope.resetOrigin = function() {
            if ($scope.origin === '') {
              Router.reset('origin');
            }
          };
        }
      ]
    };
  }
]);
