module Routers
  class GoogleDirections
    def initialize(options)
      @options = {
        key: Figaro.env.google_directions_key,
        alternatives: true,
        units: 'metric',
        mode: options[:mode],
        origin: options[:origin],
        destination: options[:destination]
      }

      avoid_features(options[:avoid])
      consider_waypoints(options[:waypoints], options[:optimize])
    end

    def route
      response = RestClient.get(base_url, params: @options)
      JSON.parse(response)
    end

    private

    def avoid_features(features)
      active_features = features.select { |_key, value| value }
      @options[:avoid] = active_features.keys.join '|'
    end

    def consider_waypoints(waypoints, optimize)
      return '' if waypoints.empty?
      optimize_waypoints = 'optimize:true|' if optimize

      formatted_waypoints = waypoints.map do |waypoint|
        via = 'via:' unless waypoint[:stopover]
        "#{via}#{waypoint[:location]}"
      end

      @options[:waypoints] = "#{optimize_waypoints}#{formatted_waypoints.join('|')}"
    end

    def base_url
      'https://maps.googleapis.com/maps/api/directions/json?'
    end
  end
end
