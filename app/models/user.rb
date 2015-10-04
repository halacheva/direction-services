class User < ActiveRecord::Base
  # Include default devise modules. Others available are:
  # :confirmable, :lockable, :timeoutable and :omniauthable
  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :trackable, :validatable

  has_many :evaluations
  has_many :routes, through: :evaluations

  def find_evaluation(evaluation_id)
    evaluations.where(route_id: evaluation_id).first_or_initialize
  end
end
