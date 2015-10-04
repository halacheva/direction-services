class Route < ActiveRecord::Base
  class << self
    def find_or_create(route)
      where(attributes(route)).first_or_create.id
    end

    private

    def attributes(route)
      {
        provider: route['provider'].downcase,
        origin: route['origin'].downcase,
        destination: route['destination'].downcase,
        mode: route['mode'].downcase,
        distance_in_meters: calculate_distance_in_meters(route),
        duration_in_seconds: calculate_duration_in_seconds(route)
      }
    end

    def calculate_distance_in_meters(route)
      route['legs'].sum { |leg| leg['distance']['value'] }
    end

    def calculate_duration_in_seconds(route)
      route['legs'].sum { |leg| leg['duration']['value'] }
    end
  end
end
