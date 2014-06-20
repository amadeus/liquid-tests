(function(Base, Vector){


if (!window.requestAnimationFrame) {
	window.requestAnimationFrame = (function(){
		return  window.requestAnimationFrame   ||
			window.webkitRequestAnimationFrame ||
			window.mozRequestAnimationFrame    ||
			function( callback ){
				window.setTimeout(callback, 1000 / 60);
			};
	})();
}

var sqrt = Math.sqrt,
	pow = Math.pow;

var Engine = Base.extend({

	scale: window.devicePixelRatio || 1,

	// gravity: 400,
	// smoothingRadius: 30,
	// stiff: 3000,
	// stiffN: 100000,
	// restDensity: 0,

	gravity: 900,
	smoothingRadius: 50,
	stiff: 80,
	stiffN: 80,
	restDensity: 4,

	particles: null,

	totalParticles: 400,

	velocityLimit: 500,

	frameCounter: 0,

	constructor: function(id){
		var p;

		this.canvas = document.getElementById(id);

		this.resize = this.resize.bind(this);
		this.resize();
		window.addEventListener('resize', this.resize, false);

		this.context = this.canvas.getContext('2d');
		this.context.fillStyle = '#000';

		this.particles = new Array(this.totalParticles);
		for (p = 0; p < this.particles.length; p++) {
			this.particles[p] = new Engine.Particle(
				Engine.getRandomArbitrary(0, 200),
				Engine.getRandomArbitrary(0, this.height / 2) - this.height / 2
			);
		}

		window.ptest = this.particles[0];

		Engine.instance = this;

		this._last = Date.now();
		this.render = this.render.bind(this);

		this._handleMouseDown = this._handleMouseDown.bind(this);
		this.canvas.addEventListener(
			'mousedown',
			this._handleMouseDown,
			false
		);

		this._handleMouseUp = this._handleMouseUp.bind(this);
		this.canvas.addEventListener(
			'mouseup',
			this._handleMouseUp,
			false
		);

		this.render();
	},

	_handleMouseDown: function(){
		dbg.log('mouse down');
		this.addParticle = true;
	},

	_handleMouseUp: function(){
		this.addParticle = false;
	},

	resize: function(){
		this.width  = window.innerWidth;
		this.height = window.innerHeight;

		this.canvas.width  = this.width  * this.scale;
		this.canvas.height = this.height * this.scale;
	},

	render: function(){
		var particles = this.particles,
			pairs = [],
			now = Date.now(),
			dt = (now - this._last) / 1000,
			reuse = {
				x: 0,
				y: 0
			},
			scale = this.scale,
			particle, particle2,
			Q, pair, p, p2, len, press, pressN, displace,
			a2bN;

		dt = Math.min(dt, 0.017);
		// Iterate through particles, setup positions
		for (p = 0, len = particles.length; p < len; p++) {
			particle = particles[p];
			particle.vel.set(
				Vector.sub(
					particle.pos,
					particle.posOld
				).div(dt)
			);

			if (particle.pos.y > this.height - 10) {
				particle.pos.y = this.height - 10;
				particle.vel.y = -(particle.vel.y * 0.3);
			}
			if (particle.pos.x > this.width - 10) {
				particle.pos.x = this.width - 10;
				particle.vel.x = -(particle.vel.x * 0.1);
			}
			if (particle.pos.x < 10) {
				particle.pos.x = 10;
				particle.vel.x = -(particle.vel.x * 0.1);
			}

			particle.posOld.set(particle.pos);
			reuse.x = 0;
			reuse.y = this.gravity * dt;
			particle.vel.add(reuse);
			particle.pos.add(
				particle.vel.mult(dt)
			);
			particle.dens = 0;
			particle.densN = 0;
		}

		// Find pairs of particles
		for (p = 0, len = particles.length; p < len; p++) {
			particle = particles[p];
			for (p2 = p + 1; p2 < len; p2++) {
				particle2 = particles[p2];
				if (this.distanceBetween(particle, particle2) < this.smoothingRadius) {
					pairs.push([particle, particle2]);
				}
			}
		}

		// Iterate through particle pairs
		for (p = 0, len = pairs.length; p < len; p++) {
			pair = pairs[p];
			Q = 1 - this.distanceBetween(pair[0], pair[1]) / this.smoothingRadius;
			pair.q2 = pow(Q, 2);
			pair.q3 = pow(Q, 3);
			pair[0].dens += pair.q2;
			pair[1].dens += pair.q2;
			pair[0].densN += pair.q3;
			pair[1].densN += pair.q3;
		}

		// Iterate through particles, setup positions
		for (p = 0, len = particles.length; p < len; p++) {
			particle = particles[p];
			particle.press  = this.stiff  * (particle.dens - this.restDensity);
			particle.pressN = this.stiffN * particle.densN;
		}


		// Iterate through particle pairs
		for (p = 0, len = pairs.length; p < len; p++) {
			pair = pairs[p];
			press = pair[0].press + pair[1].press;
			pressN = pair[0].pressN + pair[1].pressN;
			displace = (press * pair.q2 + pressN * pair.q3) * (pow(dt, 2));
			a2bN = this.directionNormal(pair[0], pair[1]);
			reuse.x = displace * a2bN.x;
			reuse.y = displace * a2bN.y;
			pair[0].pos.add(reuse);
			pair[1].pos.sub(reuse);
		}

		this.context.clearRect(
			0,
			0,
			this.width  * scale,
			this.height * scale
		);

		// Iterate through particles and draw them
		for (p = 0, len = particles.length; p < len; p++) {
			particle = particles[p];

			particle.draw(this.context, scale);
		}

		particle = undefined;
		pair     = undefined;
		pairs    = undefined;
		reuse    = undefined;

		this._last = now;

		this.frameCounter++;
		if (this.addParticle && this.frameCounter >= 5) {
			this.particles.push(new Engine.Particle(this.width / 2 - 10, 100));
			this.particles.push(new Engine.Particle(this.width / 2, 100));
			this.particles.push(new Engine.Particle(this.width / 2 + 10, 100));
		}
		if (this.frameCounter >= 5) {
			this.frameCounter = 0;
		}

		window.requestAnimationFrame(this.render);
	},

	distanceBetween: function(p1, p2){
		var xd = (p1.pos.x) - (p2.pos.x);
		var yd = (p1.pos.y) - (p2.pos.y);
		return sqrt(xd * xd + yd * yd );
	},

	directionNormal: function(p1, p2){
		return Vector.sub(p1.pos, p2.pos).normalize();
	}

});

Engine.getRandomArbitrary = function(min, max) {
    return Math.random() * (max - min) + min;
};

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

	draw: function(ctx, scale){
		ctx.beginPath();
		ctx.arc(
			this.pos.x * scale,
			this.pos.y * scale,
			2 * scale,
			0,
			Math.PI * 2,
			false
		);
		ctx.fill();
		// ctx.fillRect(
		//     this.pos.x * scale,
		//     this.pos.y * scale,
		//     2 * scale,
		//     2 * scale
		// );
	}

};

window.Engine = Engine;

})(window.Base, window.Vector);
