module Routers
  class MapQuest
    ROUTE_TYPES_TRANSLATION = {
      driving: 'fastest',
      walking: 'pedestrian',
      bicycling: 'bicycle',
      transit: 'multimodal'
    }

    AVOID_TYPES_TRANSLATIONS = {
      highways: 'Limited Access',
      tolls: 'Toll Road',
      ferries: 'Ferry',
      unpaved: 'Unpaved',
      approximateSeasonalClosure: 'Approximate Seasonal Closure',
      countryBorderCrossing: 'Country Border Crossing'
    }

    def initialize(options)
      # @options = {
      #   key: Figaro.env.map_quest_key,
      #   unit: 'k',
      #   routeType: ROUTE_TYPES_TRANSLATION[options[:mode].to_sym],
      #   from: options[:origin],
      #   to: options[:destination]
      # }
      @query_parameters = "key=#{Figaro.env.map_quest_key}" \
                          '&unit=k' \
                          '&fullShape=true' \
                          "&routeType=#{ROUTE_TYPES_TRANSLATION[options[:mode].to_sym]}" \
                          "&from=#{options[:origin]}" \
                          "&to=#{options[:destination]}" \

      avoid_preferences(options[:avoid])
      # consider_waypoints(options[:waypoints], options[:optimize])
    end

    def route
      @response = JSON.parse(RestClient.get("#{base_url}#{@query_parameters}"))
      return [] unless @response['statuscode'] == 0 # successful MapQuest request
      format_route
      [@response['route']]
    end

    private

    def base_url(optimized = false)
      if optimized
        'http://www.mapquestapi.com/directions/v2/optimizedroute?'
      else
        'http://www.mapquestapi.com/directions/v2/route?'
      end
    end

    def avoid_preferences(avoid_options)
      avoid_options.each do |key, value|
        # @options[:avoid] = AVOID_TYPES_TRANSLATIONS[key.to_sym] if value
        @query_parameters += "&avoids=#{AVOID_TYPES_TRANSLATIONS[key.to_sym]}" if value
      end
    end

    def format_route
      @response['route']['provider'] = 'MapQuest'
      @response['route']['distance_to_text'] = "#{@response['route']['distance'].round(1)} km"
      @response['route']['duration_to_text'] = duration_to_text(@response['route']['formattedTime'])
      @response['route']['path'] = extract_path
      format_legs
    end

    def format_legs
      @response['route']['legs'].each_with_index do |leg, index|
        leg['distance'] = format_distance(leg)
        leg['duration'] = format_duration(leg)
        leg['start_location'] = leg['maneuvers'].first['startPoint']
        leg['end_location'] = leg['maneuvers'].last['startPoint']
        leg['start_address'] = extract_address(index)
        leg['end_address'] = extract_address(index + 1)
      end
    end

    def format_distance(leg)
      { text: "#{leg['distance'].round(1)} km", value: leg['distance'] }
    end

    def format_duration(leg)
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

    def extract_address(index)
      address_data = @response['route']['locations'][index]

      info = ''
      info += "#{address_data['street']}, " unless address_data['street'].blank?
      info += "#{address_data['adminArea5']}, " unless address_data['adminArea5'].blank?
      info += "#{address_data['adminArea1']}" unless address_data['adminArea1'].blank?

      info
    end

    def extract_path
      path = []

      @response['route']['shape']['shapePoints'].each_slice(2) do |pair|
        path << { lat: pair[0], lng: pair[1] }
      end

      path
    end
  end
end
# routeType
# Specifies the type of route wanted. Acceptable values are:
# fastest - Quickest drive time route.
# shortest - Shortest driving distance route.
# pedestrian - Walking route; Avoids limited access roads; Ignores turn restrictions.
# multimodal - Combination of walking and (if available) Public Transit.
# bicycle - Will only use roads on which bicycling is appropriate.
# Default = 'fastest'

# avoids
# Attribute flags of roads to try to avoid. The available attribute flags depend on the data set. This does not guarantee roads with these attributes will be avoided if alternate route paths are too lengthy or not possible or roads that contain these attributes are very short.

# Available choices:
# Limited Access (highways)
# Toll Road
# Ferry
# Unpaved
# Approximate Seasonal Closure (Seasonal roads may not be selected with 100% accuracy)
# Country Border Crossing

# locations
# optimized
