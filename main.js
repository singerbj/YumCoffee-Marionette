
var App = new Backbone.Marionette.Application();

var Coffee = Backbone.Model.extend({
        urlRoot: "/coffee",
        fetchCurrent: function (id, options) {
            options = options || {};
            if (options.url === undefined) {
                options.url = this.urlRoot + '/' + id + "/ratings";
            }

            return Backbone.Model.prototype.fetch.call(this, options);
        }
    });

var Coffees = Backbone.Collection.extend({
	model: Coffee,
    url: "/coffee"
});

var CoffeeView = Backbone.Marionette.ItemView.extend({
	template: "#coffeeTemplate",
	tagName: "tr",
	events: {
        'click #deleteCoffee': 'deleteCoffee',
        'click #editCoffee': 'editCoffee'
    },
	deleteCoffee: function(ev){
        if(window.confirm("Are you sure?")) {
            this.model.destroy({
                success: function () {                	
                    App.router.navigate('coffee', {trigger: true});
                },
                error: function () {
                    App.router.navigate('coffee', {trigger: true});
                }
            });
        }
    },
    editCoffee: function(ev){
		App.router.navigate('coffee/edit/' + parseInt(this.model.attributes.id, 10), {trigger: true});            
    }
});

var NoCoffeeView = Backbone.Marionette.ItemView.extend({
	template: "#noCoffeeTemplate"
});

var CoffeesView = Backbone.Marionette.CompositeView.extend({
	tagName: "table",
	className: "table table-striped",
	template: "#coffeesTemplate",
	childView: CoffeeView,
	childViewContainer: "#tbody",
	emptyView: NoCoffeeView
});

var CoffeeFormView = Backbone.Marionette.ItemView.extend({
	template: "#coffeeFormTemplate",
	events: {
		'click button': 'createNewCoffee'
	},
	ui: {
		brand: '#brand',
		roast: '#roast',
		id: '#id'
	},
	createNewCoffee: function(){
		var coffee = new Coffee({
			brand: this.ui.brand.val(),
			roast: this.ui.roast.val(),
			id: this.ui.id.val()
		});
		var p = coffee.save();
        p.then(function(){
        	App.router.navigate('coffee', {trigger: true});
        });
	}
});

var Rating = Backbone.Model.extend({
    urlRoot: "/rating"
});

var Ratings = Backbone.Collection.extend({
	model: Rating,
	url: "/rating"
});

var RatingView = Backbone.Marionette.ItemView.extend({
	template: "#ratingTemplate",
	tagName: "tr",
	events: {
        'click #deleteRating': 'deleteRating',
        'click #editRating': 'editRating',
    },
	deleteRating: function(ev){
        if(window.confirm("Are you sure?")) {
            this.model.destroy({
                success: function () {
                    App.router.navigate('rating', {trigger: true});
                },
                error: function () {
                    App.router.navigate('rating', {trigger: true});
                }
            });
        }
    },
	editRating: function(ev){
		App.router.navigate('rating/edit/' + parseInt(this.model.attributes.id, 10), {trigger: true});            
    }
});

var NoRatingView = Backbone.Marionette.ItemView.extend({
	template: "#noRatingTemplate"
});

var RatingsView = Backbone.Marionette.CompositeView.extend({
	tagName: "table",
	className: "table table-striped",
	template: "#ratingsTemplate",
	childView: RatingView,
	childViewContainer: "#tbody",
	emptyView: NoRatingView
});

var RatingFormView = Backbone.Marionette.ItemView.extend({
	template: "#ratingFormTemplate",
	events: {
		'click button': 'createNewRating'
	},
	ui: {
		coffee_id: '#coffee_id',
		rating: '#rating',
		comment: '#comment',
		id: '#id'
	},
	createNewRating: function(){
		var rating = new Rating({
			coffee_id: this.ui.coffee_id.val(),
			rating: this.ui.rating.val(),
			comment: this.ui.comment.val(),
			id: this.ui.id.val()
		});
		var p = rating.save();
        p.then(function(){
        	App.router.navigate('rating', {trigger: true});
        });
	}
});

App.addRegions({
    page: "#page"
});
	
App.coffees = new Coffees();
App.ratings = new Ratings();

var Router = Backbone.Marionette.AppRouter.extend({
    routes: {
    	"": "home",
       	"coffee": "coffee",
       	"coffee/new": "editCoffee",
        "coffee/edit/:id": "editCoffee",
        "rating": "rating",
        "rating/new": "editRating",
        "rating/edit/:id": "editRating"
	},
	home: function(){
		App.router.navigate('coffee', {trigger: true});
	},
	coffee: function(){
		App.coffees.fetch({
            success: function(coffees){   
            	var promises = [];
                    coffees.forEach(function(coffee){
                        var deferred = Q.defer();
                        promises.push(deferred.promise);
                        coffee.fetchCurrent(coffee.id, {
                            success: function(ratings){
                                coffee.ratings = ratings.toJSON();

                                var sum = 0;
                                var totalRatings = 0;
                                _.forEach(coffee.ratings, function(rating){
                                    if(rating.rating){
                                        sum = sum + parseInt(rating.rating, 10);
                                        ++totalRatings;
                                    }
                                });

                                coffee.attributes.avgRating = Math.round(sum / totalRatings);
                                deferred.resolve();
                            }
                        });
                    });

                    Q.all(promises).spread(function () {
        				App.page.show(new CoffeesView({ collection: coffees }));
                    });
            }
        });	
	},
	editCoffee: function(id){
		if(id){
			var coffee = new Coffee({id: id}).fetch({
	            success: function(coffee) {
	            	window.coffee = coffee.toJSON()[0];
					App.page.show(new CoffeeFormView());
				}
			});
		}else{
			window.coffee = null;
			App.page.show(new CoffeeFormView());
		}
	},
	rating: function(){
		App.coffees.fetch({
            success: function(coffees){
                App.ratings.fetch({
                    success: function(ratings){
                        //create coffee map
                        var coffeeMap = {};
                        _.forEach(coffees.models, function(coffee){
                            coffeeMap[coffee.attributes.id] = coffee;                            
                        }); 
                        //apply coffee to each rating
                        _.forEach(ratings.models, function(rating) {
                            rating.attributes.coffee = coffeeMap[rating.attributes.coffee_id].attributes;
                            console.log(rating);
                        });
                       App.page.show(new RatingsView({ collection: ratings }));
                    }
                });
		    }
        });	
	},
	editRating: function(id){
		if(id){		
			var rating = new Rating({id: id}).fetch({
	            success: function(rating) {            	
	            	window.rating = rating.toJSON()[0];
	            	App.coffees.fetch({
			            success: function(coffees){
			        		window.coffees = coffees.toJSON();		        		
			        		App.page.show(new RatingFormView());
			            }
	        		});	
				}
			});
		}else{
			window.rating = null;
        	App.coffees.fetch({
	            success: function(coffees){
	        		window.coffees = coffees.toJSON();		        		
	        		App.page.show(new RatingFormView());
	            }
    		});	
		}
	}
});

App.router = new Router({ controller: App.controller });

Backbone.history.start();

App.start({});