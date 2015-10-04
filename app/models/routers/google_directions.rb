module Routers
  class GoogleDirections
    def initialize(options)
      @options = {
        key: Figaro.env.google_directions_key,
        alternatives: true,
        units: 'metric',
        mode: options[:mode],
        origin: options[:origin],
        destination: options[:destination],
        avoid: options[:avoid].join('|')
      }

      consider_waypoints(options[:waypoints], options[:optimize])
    end

    def route
      params = @options.clone
      params[:origin] = @options[:origin][:location]
      params[:destination] = @options[:destination][:location]
      @response = JSON.parse(RestClient.get(base_url, params: params))
      assign_details
      @response['routes']
    end

    private

    def consider_waypoints(waypoints, optimize)
      return '' if waypoints.empty?
      optimize_waypoints = 'optimize:true|' if optimize

      formatted_waypoints = waypoints.map { |waypoint| "#{waypoint[:location]}" }.join('|')

      @options[:waypoints] = "#{optimize_waypoints}#{formatted_waypoints}"
    end

    def assign_details
      @response['routes'].each do |route_response|
        route_response = assing_metadata(route_response)
        route_response['distance_to_text'] = ditanse_to_text(route_response)
        route_response['duration_to_text'] = duration_to_text(route_response)
        assign_evaluation_details(route_response)
      end
    end

    def assing_metadata(route_response)
      route_response['provider'] = 'Google'
      route_response['origin'] = @options[:origin][:title]
      route_response['destination'] = @options[:destination][:title]
      route_response['mode'] = @options[:mode]

      route_response
    end

    def assign_evaluation_details(route_response)
      route_object = Route.find_or_create(route_response)
      route_response['id'] = route_object.id
      route_response['evaluations'] = route_object.format_evaluations

      route_response
    end

    def ditanse_to_text(route_response)
      total_kilometers = 0
      route_response['legs'].each do |leg|
        distance = (leg['distance']['value'].to_f / 1000).round(1)
        leg['distance']['text'] = "#{distance} km"
        total_kilometers += distance
      end
      "#{total_kilometers.round(1)} km"
    end

    def duration_to_text(route_response)
      time_details = extract_time_details(route_response)

      info = ''
      info += "#{time_details[:days]} days " if time_details[:days] > 0
      info += "#{time_details[:hours]} hours " if time_details[:hours] > 0
      info += "#{time_details[:minutes]} mins" if time_details[:minutes] > 0

      info
    end

    def extract_time_details(route_response)
      seconds = route_response['legs'].sum do |leg|
        leg['duration']['value'].to_f
      end
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
