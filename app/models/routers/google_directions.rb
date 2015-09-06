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

      avoid_preferences(options[:avoid])
      consider_waypoints(options[:waypoints], options[:optimize])
    end

    def route
      @response = JSON.parse(RestClient.get(base_url, params: @options))
      assign_details
      @response['routes']
    end

    private

    def avoid_preferences(avoid_options)
      preferences = avoid_options.select { |_key, value| value }
      @options[:avoid] = preferences.keys.join '|'
    end

    def consider_waypoints(waypoints, optimize)
      return '' if waypoints.empty?
      optimize_waypoints = 'optimize:true|' if optimize

      formatted_waypoints = waypoints.map { |waypoint| "#{waypoint[:location]}" }.join('|')

      @options[:waypoints] = "#{optimize_waypoints}#{formatted_waypoints}"
    end

    def assign_details
      @response['routes'].each do |route|
        route['provider'] = 'Google'
        route['distance_to_text'] = ditanse_to_text(route)
        route['duration_to_text'] = duration_to_text(route)
      end
    end

    def ditanse_to_text(route)
      kilometers = route['legs'].sum { |leg| leg['distance']['text'].to_f }
      "#{kilometers} km"
    end

    def duration_to_text(route)
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
