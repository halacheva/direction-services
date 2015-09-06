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
      @response = JSON.parse(RestClient.get(base_url, params: @options))
      assign_totals
      @response
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

    def assign_totals
      @response['routes'].each do |route|
        route['distance'] = estimate_total_distance(route)
        route['duration'] = estimate_total_duration(route)
      end
    end

    def estimate_total_distance(route)
      kilometers = route['legs'].sum { |leg| leg['distance']['text'].to_f }
      "#{kilometers} km"
    end

    def estimate_total_duration(route)
      time_details = extract_time_details(route)

      info = ''
      info += "#{time_details[:days]} days " if time_details[:days] > 0
      info += "#{time_details[:hours]} hours " if time_details[:hours] > 0
      info += "#{time_details[:minutes]} mins " if time_details[:minutes] > 0

      info
    end

    def extract_time_details(route)
      seconds = route['legs'].sum { |leg| leg['duration']['value'].to_f }
      minutes = (seconds / 60).round
      hours = minutes / 60
      days = hours / 24

      { minutes: minutes % 60, hours: hours % 60, days: days % 24 }
    end

    def base_url
      'https://maps.googleapis.com/maps/api/directions/json?'
    end
  end
end
