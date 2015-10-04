module Routers
  class YOURS
    ROUTE_TYPES_TRANSLATION = { driving: 'motorcar',
                                bicycling: 'bicycle',
                                walking: 'foot' }
    def initialize(options)
      @options = {
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
      @options[:flat], @options[:flon] = pair[0][:location].split(',')
      @options[:tlat], @options[:tlon] = pair[1][:location].split(',')

      JSON.parse(RestClient.get(base_url, params: @options))
    end

    def base_url
      'http://www.yournavigation.org/api/1.0/gosmore.php'
    end

    def format_path(response)
      response['coordinates'].map { |pair| { lat: pair[1], lng: pair[0] } }
    end

    def format_leg(response, pair)
      {
        distance: { text: "#{response['properties']['distance'].to_f.round(1)} km",
                    value: response['properties']['distance'].to_f },
        duration: { text: duration_to_text(response['properties']['traveltime'].to_i),
                    value: response['properties']['traveltime'].to_i },
        start_address: pair[0][:title],
        end_address: pair[1][:title]
      }
    end

    def format_route(path, legs)
      total_distance = legs.sum { |leg| leg[:distance][:value] }
      total_duration = legs.sum { |leg| leg[:duration][:value] }

      { provider: 'YOURS (Open Street Maps)',
        legs: legs,
        path: path,
        distance_to_text: "#{total_distance.round(1)} km",
        duration_to_text: duration_to_text(total_duration) }
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
  end
end
