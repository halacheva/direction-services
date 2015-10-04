class CreateEvaluations < ActiveRecord::Migration
  def change
    create_table :evaluations do |t|
      t.integer :user_id, null: false
      t.integer :route_id, null: false
      t.boolean :positive, null: false

      t.timestamps
    end
  end
end
