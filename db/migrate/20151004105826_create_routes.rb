class CreateRoutes < ActiveRecord::Migration
  def change
    create_table :routes do |t|
      t.string :origin, null: false
      t.string :destination, null: false
      t.string :provider, null: false
      t.string :mode, null: false
      t.float :distance_in_meters, null: false
      t.float :duration_in_seconds, null: false
    end
  end
end
