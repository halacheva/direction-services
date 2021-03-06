angular.module('directionServicesApp').directive('dsRoutes', ['Router',
  function(Router) {
    return {
      templateUrl: 'assets/angular/templates/ds_routes.html',

      link: function($scope, element, attrs) {
        $scope.originInput = element.find('#origin_address');
        $scope.destinationInput = element.find('#destination_address');
        $scope.waypointsInput = element.find('#waypoints');
        $scope.mapContainer = element.find('#map');
        $scope.checkboxes = element.find("input[type='checkbox']");
        $scope.fitMap();

        Router.init($scope.mapContainer, $scope.originInput, $scope.destinationInput, $scope.waypointsInput);
      },

      controller: ['$scope', '$window', '$timeout', '$http', 'Router',
        function($scope, $window, $timeout, $http, Router) {
          $scope.options = {
            mode: 'driving',
            waypoints: [],
            optimize: false,
            avoid: [],
          };
          $scope.routingInProgress = false;

          $scope.addWaypoint = function() {
            if ($scope.waypointsInput.val() !== '' && !$scope.reachedWaypointsLimit()) {
              var waypoint = Router.addWaypoint();
              var locationString = waypoint.position.lat() + ',' + waypoint.position.lng();
              $scope.options.waypoints.push({ location: locationString, title: waypoint.title });
              $scope.waypointsInput.val('');
              $scope.clearRoutes();
            }
          };

          $scope.removeWaypoint = function(index) {
            $scope.options.waypoints.splice(index, 1);
            Router.removeWaypoint(index);
            $scope.clearRoutes();

            if ($scope.options.waypoints.length == 0) {
              $scope.options.optimize = false;
            }
          };

          $scope.reachedWaypointsLimit = function() {
            return $scope.options.waypoints.length == 3;
          };

          $scope.toggleAvoidPreference = function(preference) {
            var index = $scope.options.avoid.indexOf(preference);
            if (index >= 0) {
              $scope.options.avoid.splice(index, 1);
            } else {
              $scope.options.avoid.push(preference);
            }
          };

          $scope.findRoutes = function() {
            $scope.options.origin = {
              location: Router.location('origin'),
              title: $scope.originInput.val()
            };
            $scope.options.destination = {
              location: Router.location('destination'),
              title: $scope.destinationInput.val()
            };
            $scope.clearRoutes();
            Router.clear({ keepMarkers: true });
            $scope.routingInProgress = true;
            Router.route($scope.options).then(function(routes) {
              $scope.routes = routes;
              $scope.displayedRoute = 0;
              $scope.routingInProgress = false;

              // wait for displaying the list with routes
              $timeout(function() {
                Router.fitMap();
                $scope.displayRoute(0);
              }, 200);
            });
          };

          $scope.displayRoute = function(index) {
            Router.display(index);
            $scope.displayedRoute = index;
          };

          $scope.clear = function() {
            $scope.originInput.val('');
            $scope.destinationInput.val('');
            $scope.waypointsInput.val('');
            $scope.checkboxes.attr('checked', false);
            $scope.options.mode = 'driving';
            $scope.options.waypoints = [];
            $scope.options.avoid = [];
            $scope.clearRoutes();
            Router.clear();
          };

          $scope.clearRoutes = function() {
            $scope.routes = [];
            // wait for removing the list with routes
            $timeout(function() { Router.fitMap(); }, 200);
          };

          $scope.resetDestination = function() {
            if ($scope.destinationInput.val() === '') {
              Router.reset('destination');
              Router.clear({ keepMarkers: true });
            }

            if (Router.routes.polylines.length === 0) {
              $scope.clearRoutes();
            }
          };

          $scope.resetOrigin = function() {
            if ($scope.originInput.val() === '') {
              Router.reset('origin');
              Router.clear({ keepMarkers: true });
            }

            if (Router.routes.polylines.length === 0) {
              $scope.clearRoutes();
            }
          };

          $scope.fitMap = function() {
            $scope.mapContainer.height($window.innerHeight - 42);
          };

          $scope.evaluateRoute = function(index, positive) {
            var route_id = $scope.routes[index].id;
            var url = '/evaluate?route_id=' + route_id + '&positive=' + positive;
            $http.get(url).then(function(response) {
              if (typeof response.data.evaluations !== 'undefined') {
                $scope.routes[index].evaluations = response.data.evaluations;
              } else {
                $scope.errorMessage = response.data.error_message;
                // wait for removing the list with routes
                $timeout(function() { $scope.errorMessage = undefined; }, 3000);
              }
            });
          };
        }
      ]
    };
  }
]);
