module Routers
  class MapQuest
    ROUTE_TYPES_TRANSLATION = { driving: 'fastest',
                                walking: 'pedestrian',
                                bicycling: 'bicycle',
                                transit: 'multimodal' }

    AVOID_TYPES_TRANSLATIONS = { highways: 'Limited Access',
                                 tolls: 'Toll Road',
                                 ferries: 'Ferry',
                                 unpaved: 'Unpaved',
                                 approximateSeasonalClosure: 'Approximate Seasonal Closure',
                                 countryBorderCrossing: 'Country Border Crossing' }

    def initialize(options)
      @options = options
      @query_string = "key=#{Figaro.env.map_quest_key}&#{build_query}"
    end

    def route
      response = JSON.parse(RestClient.get("#{base_url}#{@query_string}"))
      return [] unless response['info']['statuscode'] == 0 # successful MapQuest request
      extract_routes(response)
    end

    private

    def base_url
      base_uri = 'http://www.mapquestapi.com/directions/v2/'

      return "#{base_uri}alternateroutes?" if @options[:waypoints].empty?

      @options[:optimize] ? "#{base_uri}optimizedroute?" : "#{base_uri}route?"
    end

    def build_query
      @options[:waypoints].any? ? build_json_query : build_standard_query
    end

    def build_json_query
      query = {
        locations: [@options[:origin],
                    *(@options[:waypoints].map { |waypoint| waypoint[:location] }),
                    @options[:destination]],
        options: {
          unit: 'k',
          fullShape: true,
          routeType: ROUTE_TYPES_TRANSLATION[@options[:mode].to_sym],
          avoids: @options[:avoid].map { |preference| AVOID_TYPES_TRANSLATIONS[preference.to_sym] }
        }
      }

      "json=#{query.to_json}"
    end

    def build_standard_query
      query = "unit=k&routeType=#{ROUTE_TYPES_TRANSLATION[@options[:mode].to_sym]}" \
              "&from=#{@options[:origin]}&to=#{@options[:destination]}" \
              '&fullShape=true&maxRoutes=3'

      @options[:avoid].each do |preference|
        query += "&avoids=#{AVOID_TYPES_TRANSLATIONS[preference.to_sym]}"
      end

      query
    end

    def extract_routes(response)
      routes = [format_route(response['route'])]

      return routes unless response['route']['alternateRoutes']

      response['route']['alternateRoutes'].each do |alternative_route|
        routes << format_route(alternative_route['route'])
      end

      routes
    end

    def format_route(route)
      route['provider'] = 'MapQuest'
      route['distance_to_text'] = "#{route['distance'].round(1)} km"
      route['duration_to_text'] = duration_to_text(route['formattedTime'])
      route['path'] = extract_path(route)
      route['legs'].map.with_index do |leg, index|
        format_leg(leg, route['locations'], index)
      end

      route
    end

    def format_leg(leg, locations, index)
      leg['distance'] = format_leg_distance(leg)
      leg['duration'] = format_leg_duration(leg)
      leg['start_address'] = format_address(locations[index])
      leg['end_address'] = format_address(locations[index + 1])

      leg
    end

    def format_leg_distance(leg)
      { text: "#{leg['distance'].round(1)} km", value: leg['distance'] }
    end

    def format_leg_duration(leg)
      { text: "#{duration_to_text(leg['formattedTime'])}", value: leg['time'] }
    end

    def duration_to_text(formatted_time)
      hours, minutes = formatted_time.split(':').map(&:to_i)
      days = hours / 24

      info = ''
      info += "#{days % 24} days " if days > 0
      info += "#{hours % 24} hours " if hours > 0
      info += "#{minutes} mins " if minutes > 0

      info
    end

    def format_address(location)
      [location['street'], location['adminArea5'], location['adminArea1']].compact.join(', ')
    end

    def extract_path(route)
      path = []

      route['shape']['shapePoints'].each_slice(2) { |pair| path << { lat: pair[0], lng: pair[1] } }

      path
    end
  end
end
