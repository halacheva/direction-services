class MapQuest
  def intialize
    @default_params = {
      key: Figaro.env.map_quest_key,
      unit: 'k'
    }
  end

  def make_request(params)
    params = @default_params.merge params
    response = RestClient.get base_url, params: params
  end

  private

  def base_url
    'http://www.mapquestapi.com/directions/v2/route?'
  end

  def format_response

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


# drivingStyle
# Integer or String Driving style to be used when calculating fuel usage.
# 1 or cautious - Assume a cautious driving style.
# 2 or normal - Assume a normal driving style. This is the default.
# 3 or aggressive - Assume an aggressive driving style.


# locations
# optimized
