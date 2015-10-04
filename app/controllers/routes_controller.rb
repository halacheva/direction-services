class RoutesController < ApplicationController
  def index
  end

  def find
    options = JSON.parse(params[:options], symbolize_names: true)
    routes = []
    routes += run_google(options) unless skip_google(options)
    routes += run_yours(options) unless skip_yours(options)
    routes += run_map_quest(options)

    render json: routes
  end

  def evaluate
    if current_user
      evaluation = current_user.find_evaluation(params[:route_id])
      evaluation.positive = params[:positive]
      evaluation.save

      render json: { evaluations: evaluation.route.format_evaluations }
    else
      render json: { error_message: 'Please, log into your account to evaluate the route.' }
    end
  end

  private

  def skip_google(options)
    only_map_quest_available = %w(unpaved approximateSeasonalClosure countryBorderCrossing)
    only_map_quest_available.any? { |preference| options[:avoid].include?(preference) }
  end

  def skip_yours(options)
    options[:avoid].any? || options[:optimize]
  end

  def run_google(options)
    google = Routers::GoogleDirections.new(options)
    google.route
  end

  def run_yours(options)
    yours = Routers::YOURS.new(options)
    yours.route
  end

  def run_map_quest(options)
    map_quest = Routers::MapQuest.new(options)
    map_quest.route
  end
end
