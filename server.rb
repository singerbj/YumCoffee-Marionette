#!/usr/bin/env ruby

require 'sinatra'
require 'active_support/all'
require 'pg'


puts "Starting server..."

configure do
    set :public_folder, '.'

    puts "Initializing database..."
    set :conn, PG::Connection.new(:dbname => 'yumcoffee', :host => 'localhost', :port => 5432, :user => 'postgres', :password => ENV['coffeePass'])
    settings.conn.exec("CREATE TABLE IF NOT EXISTS coffee " +
        "( " +
            " id BIGSERIAL PRIMARY KEY, " + 
            " brand varchar(100), " +
            " roast varchar(100) " +
        ");")
    settings.conn.exec("CREATE TABLE IF NOT EXISTS rating " +
        "( " +
            " id BIGSERIAL PRIMARY KEY, " + 
            " coffee_id bigint references coffee(id), " + 
            " rating varchar(1), " +
            " comment varchar(1000) " +
        ");")


    set :coffees, []
    set :ratings, []
end

class Coffee
    attr_accessor :brand, :roast
    def initialize(brand, roast)
        @brand = brand
        @roast = roast             
    end   
end    

class Rating
    attr_accessor :rating, :comment, :coffee_id
    def initialize(rating, comment, coffee_id)
        @rating = rating
        @comment = comment
        @coffee_id = coffee_id
    end   
end  

# ROOT #############################################################################

get "/" do
  send_file File.join(settings.public_folder, 'index.html')
end

####################################################################################

# coffee ###########################################################################

get '/coffee' do
    res = settings.conn.exec("Select * from coffee;")
    res.to_json
end

get '/coffeeAndRatings' do
    res = settings.conn.exec("select * from coffee join rating on coffee.id = rating.coffee_id;")
    res.to_json
end


get '/coffee/:id' do |id|        
    res = settings.conn.exec("Select * from coffee where id = #{id};")
    res.to_json
end

get '/coffee/:id/ratings' do |id|        
    res = settings.conn.exec("Select * from rating where coffee_id = #{id};")
    res.to_json
end

post '/coffee' do
    request.body.rewind
    rb = JSON.parse(request.body.read)
    res = settings.conn.exec("Insert into coffee (brand, roast) values ('#{rb["brand"].to_s}', '#{rb["roast"].to_s}') returning *;")
    res[0].to_json
end

put '/coffee/:id' do |id|
    request.body.rewind
    rb = JSON.parse(request.body.read)
    res = settings.conn.exec("Update coffee Set brand='#{rb["brand"].to_s}', roast='#{rb["roast"].to_s}' Where id = #{id} returning *;")
    res[0].to_json
end

delete '/coffee/:id' do |id|
    res = settings.conn.exec("delete from coffee where id = #{id} returning *;")
    res[0].to_json
end

####################################################################################

# ratings ##########################################################################

get '/rating' do
    res = settings.conn.exec("Select * from rating;")
    res.to_json
end

get '/rating/:id' do |id|        
    res = settings.conn.exec("Select * from rating where id = #{id};")
    res.to_json
end

post '/rating' do
    request.body.rewind
    rb = JSON.parse(request.body.read)
    res = settings.conn.exec("Insert into rating (coffee_id, rating, comment) values ('#{rb["coffee_id"].to_i}', '#{rb["rating"].to_i}', '#{rb["comment"].to_s}') returning *;")
    res[0].to_json
end

put '/rating/:id' do |id|
    request.body.rewind
    rb = JSON.parse(request.body.read)
    res = settings.conn.exec("Update rating Set coffee_id='#{rb["coffee_id"].to_i}', rating='#{rb["rating"].to_i}', comment='#{rb["comment"].to_s}' Where id = #{id} returning *;")
    res[0].to_json
end

delete '/rating/:id' do |id|
    res = settings.conn.exec("delete from rating where id = #{id} returning *;")
    res[0].to_json
end

####################################################################################

