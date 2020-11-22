var express=require("express");
var app=express();
var bodyparser=require("body-parser");
var mongoose=require("mongoose");
var campground=require("./models/campground");
var seedDB=require("./seed");
var comment=require("./models/comment");
var passport=require("passport");
var loclaStrategy=require("passport-local");
var user=require("./models/user");





mongoose.connect('mongodb://localhost/yelp_camp',{
  useNewUrlParser: true,
  useUnifiedTopology: true
})

app.use(bodyparser.urlencoded({extended :true}));
app.use(express.static(__dirname+"/public"));


app.use(require("express-session")({
	secret:"yelpCampEncypt",
	resave:false,
	saveUninitialized:false
}));

app.use(passport.initialize());
app.use(passport.session());
passport.use(new loclaStrategy(user.authenticate()));
passport.serializeUser(user.serializeUser());
passport.deserializeUser(user.deserializeUser());
 
app.use(function(req,res,next){
	res.locals.currentUser=req.user;
	next();
})


app.get("/",function(req,res){
	res.render("landing.ejs");
})


app.get("/campgrounds",function(req,res){
		
	campground.find({},function(err,campgrounds){
		if(err){
			console.log("something went wrong");
			console.log(err);
		}
		else{
				res.render("campgrounds/index.ejs",{campgrounds:campgrounds})
		}
	})

})

app.post("/campgrounds",function(req,res){

	var name =req.body.name;	
	var image=req.body.image;
	var desc=req.body.description;
	var price=req.body.price;
	var newcamp={name:name,image:image,description:desc,price:price}
	campground.create(newcamp,function(err,newlyCreated){
		if(err){
			console.log(err);
		}
		else{
			res.redirect("/campgrounds")
		}
	})
	
})


app.get("/campgrounds/new",isLoggedIn,function(req,res){
	res.render("campgrounds/new.ejs");
})



app.get("/campgrounds/:id",function(req,res){
	campground.findById(req.params.id).populate("comments").exec(function(err,foundCampground){
		if(err){
			console.log(err);
		}
		else{
			
			res.render("campgrounds/show.ejs",{campground:foundCampground});
			
		}
	})
	
})




app.post("/campgrounds/:id/comments",isLoggedIn,function(req,res){
	campground.findById(req.params.id,function(err,campground){
		if (err){
			console.log(req.params.id)
			console.log(err);
			res.redirect("/campgrounds");
		}
		else{
			comment.create(req.body.comment,function(err,comment){
				if(err){
					console.log(err);
					console.log(typeof(route));
					redirect("/campgrounds");
				}
				else{
					campground.comments.push(comment);
					campground.save();
					
					res.redirect('/campgrounds/'+campground._id);
					
				}
			})
			
		}
	})
})


app.get("/campgrounds/:id/comments/new",isLoggedIn,function(req,res){
	campground.findById(req.params.id,function(err,campground){
		if(err){
			console.log(err);
		}
		else{
			
	res.render("comments/new.ejs",{campground:campground});
		}
	})
})


app.get("/register",function(req,res){
	res.render("register.ejs")
})

app.post("/register",function(req,res){
	user.register(new user({username:req.body.username}),req.body.password ,function(err,user){
		if(err){
			console.log(err);
			return res.render("register.ejs");
		}
		passport.authenticate("local")(req,res,function(){
			res.redirect("/campgrounds");
		})
	} )
})


app.get("/login",function(req,res){
	res.render("login.ejs");
})

app.post("/login",passport.authenticate("local",
{
	successRedirect:"/campgrounds",
	failureRedirect:"/login"
}),function(req,res){});

app.get("/logout",function(req,res){
	req.logout();
	res.redirect("/campgrounds");
})

function isLoggedIn(req,res,next){
	if(req.isAuthenticated()){
		return next();
	}
	else{
		res.redirect("/login");
	}
}

app.listen(3000,function(){
	console.log("yelp server has been started")
})