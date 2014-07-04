(function(
	Engine,
	Vector
){

Engine.Particle = function(x, y){
	this.pos = new Vector(x, y);
	this.posOld = this.pos.clone();
	this.vel = Vector.coerce(this.vel);
};

Engine.Particle.prototype = {

	pos: {
		x: 0,
		y: 0
	},

	posOld: {
		x: 0,
		y: 0
	},

	vel: {
		x: 0,
		y: 0
	},

	dens: 0,
	densN: 0,

	draw: function(ctx, radius, scale){
		ctx.beginPath();
		ctx.arc(
			this.pos.x * scale,
			this.pos.y * scale,
			radius * scale,
			0,
			Math.PI * 2,
			false
		);
		ctx.fill();
	}

};

})(
	window.Engine,
	window.Vector
);
