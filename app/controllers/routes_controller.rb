class RoutesController < ApplicationController
  def index
  end

  def find
    options = JSON.parse(params[:options], symbolize_names: true)
    routes = []
    routes += run_google_directions(options) unless skip_google(options)
    routes += run_map_quest(options)

    render json: routes
  end

  private

  def skip_google(options)
    only_map_quest_available = %w(unpaved approximateSeasonalClosure countryBorderCrossing)
    only_map_quest_available.any? { |preference| options[:avoid].include?(preference) }
  end

  def run_google_directions(options)
    google = Routers::GoogleDirections.new(options)
    google.route
  end

  def run_map_quest(options)
    map_quest = Routers::MapQuest.new(options)
    map_quest.route
  end
end
