class RoutesController < ApplicationController
  def index
  end

  def find
    options = JSON.parse(params[:options], symbolize_names: true)
    google = Routers::GoogleDirections.new(options)
    render json: google.route
  end
end
