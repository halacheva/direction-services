module Routers
  class YOURS
    ROUTE_TYPES_TRANSLATION = { driving: 'motorcar',
                                bicycling: 'bicycle',
                                walking: 'foot' }
    def initialize(options)
      @options = options
      @params = {
        format: 'geojson',
        v: ROUTE_TYPES_TRANSLATION[options[:mode].to_sym],
        instructions: 1,
        fast: 1
      }
      @points = [options[:origin], *options[:waypoints], options[:destination]]
    end

    def route
      path = []
      legs = []

      @points.each_cons(2) do |pair|
        response = make_request(pair)
        path += format_path(response)
        legs << format_leg(response, pair)
      end

      [format_route(path, legs)]
    end

    private

    def make_request(pair)
      @params[:flat], @params[:flon] = pair[0][:location].split(',')
      @params[:tlat], @params[:tlon] = pair[1][:location].split(',')

      JSON.parse(RestClient.get(base_url, params: @params))
    end

    def base_url
      'http://www.yournavigation.org/api/1.0/gosmore.php'
    end

    def format_path(response)
      response['coordinates'].map { |pair| { lat: pair[1], lng: pair[0] } }
    end

    def format_leg(response, pair)
      {
        'distance' => format_distance(response),
        'duration' => format_duration(response),
        'start_address' => pair[0][:title],
        'end_address' => pair[1][:title]
      }
    end

    def format_distance(response)
      {
        'text' => "#{response['properties']['distance'].to_f.round(1)} km",
        'value' => response['properties']['distance'].to_f * 1000
      }
    end

    def format_duration(response)
      {
        'text' => duration_to_text(response['properties']['traveltime'].to_i),
        'value' => response['properties']['traveltime'].to_i
      }
    end

    def format_route(path, legs)
      totals = extract_totals(legs)

      route_response = {
        'provider' => 'YOURS (Open Street Maps)',
        'origin' => @options[:origin][:title],
        'destination' => @options[:destination][:title],
        'mode' => @options[:mode],
        'legs' => legs,
        'path' => path,
        'distance_to_text' => "#{totals[:distance].round(1)} km",
        'duration_to_text' => duration_to_text(totals[:duration])
      }

      route_response['id'] = Route.find_or_create(route_response)

      route_response
    end

    def duration_to_text(duration_in_seconds)
      time_details = extract_time_details(duration_in_seconds)

      info = ''
      info += "#{time_details[:days]} days " if time_details[:days] > 0
      info += "#{time_details[:hours]} hours " if time_details[:hours] > 0
      info += "#{time_details[:minutes]} mins" if time_details[:minutes] > 0

      info
    end

    def extract_time_details(duration_in_seconds)
      minutes = (duration_in_seconds / 60).round
      hours = minutes / 60
      days = hours / 24

      { minutes: minutes % 60, hours: hours % 60, days: days % 24 }
    end

    def extract_totals(legs)
      total_distance = legs.sum { |leg| leg['distance']['value'] }
      total_duration = legs.sum { |leg| leg['duration']['value'] }

      {
        distance: total_distance,
        duration: total_duration
      }
    end
  end
end
