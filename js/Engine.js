(function(Base, Vector){

var sqrt, pow, Engine;

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

sqrt = Math.sqrt;
pow  = Math.pow;

Engine = Base.extend({

	scale: window.devicePixelRatio || 1,

	// Default settings
	gravity: 2000,
	smoothingRadius: 50,
	// stiff: 0.001,
	stiff: 200,
	stiffN: 2000,
	restDensity: 3,
	particles: null,
	totalParticles: 200,
	velocityLimit: 500,
	frameCounter: 0,
	radius: 6,

	constructor: function(id){
		var p, C, row, rowCount, mod, i, rand;

		this.canvas = document.getElementById(id);
		this.context = this.canvas.getContext('2d');

		this.resize = this.resize.bind(this);
		this.resize();
		window.addEventListener('resize', this.resize, false);

		this.controls = new Engine.Controls(this);

		// A hacky way to generate a safe-ish range of
		// particles, based on screensize.
		C = 20;
		this.totalParticles = (
			(window.innerWidth / 2 / C) * (window.innerHeight / 2 / C)
		) >> 0;

		this.totalParticles = Math.min(this.totalParticles, 400);

		i  = this.smoothingRadius / 2;
		rowCount = this.width / 2 / i >> 0;
		rand = Engine.getRandomArbitrary;

		this.particles = new Array(this.totalParticles);
		for (p = 0; p < this.particles.length; p++) {
			mod = p % rowCount;
			row = (p - mod) / rowCount;

			this.particles[p] = new Engine.Particle(
				(this.width / 4) + mod * i + (i / 4 - rand(0, i / 2)),
				row * i + (i / 4 - rand(0, i / 2)),
				this.radius
			);
		}

		this.controls.setTotalParticles(this.particles.length);

		window.ptest = this.particles[0];

		Engine.instance = this;

		this._last = Date.now();
		this.render = this.render.bind(this);

		this.setupFountain();
		this.render();
	},

	setupFountain: function(){
		var eventStart, eventEnd;

		if (
			'ontouchstart' in window ||
			(
				window.DocumentTouch &&
				document instanceof window.DocumentTouch
			)
		) {
			eventStart = 'touchstart';
			eventEnd   = 'touchend';
		} else {
			eventStart = 'mousedown';
			eventEnd   = 'mouseup';
		}

		this._handleMouseDown = this._handleMouseDown.bind(this);
		this.canvas.addEventListener(
			eventStart,
			this._handleMouseDown,
			false
		);

		this._handleMouseUp = this._handleMouseUp.bind(this);
		this.canvas.addEventListener(
			eventEnd,
			this._handleMouseUp,
			false
		);
	},

	_handleMouseDown: function(){
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

		this.context.fillStyle = '#3acaff';

		window.scrollTo(0, 0);
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

			if (particle.pos.y > this.height + this.radius) {
				particle.pos.y = this.height + this.radius;
				particle.vel.y = 0
			}

			if (particle.pos.y < -(this.radius)) {
				particle.pos.y = -(this.radius);
				particle.vel.y = 0
			}

			if (particle.pos.x > this.width + this.radius) {
				particle.pos.x = this.width + this.radius;
				particle.vel.x = 0
			}

			if (particle.pos.x < -this.radius) {
				particle.pos.x = -this.radius;
				particle.vel.x = 0
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
			press  = pair[0].press  + pair[1].press;
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

			particle.draw(this.context, this.radius, scale);
		}

		particle = undefined;
		pair     = undefined;
		pairs    = undefined;
		reuse    = undefined;

		this._last = now;

		this.frameCounter++;
		if (this.addParticle && this.frameCounter >= 5) {
			this.particles[this.particles.length] = new Engine.Particle(
				this.width / 2 + Engine.getRandomArbitrary(0, this.smoothingRadius) - this.smoothingRadius / 2,
				100 + Engine.getRandomArbitrary(0, this.smoothingRadius) - this.smoothingRadius / 2
			);
			this.controls.setTotalParticles(this.particles.length);
		}
		if (this.frameCounter >= 5) {
			this.frameCounter = 0;
		}

		window.requestAnimationFrame(this.render);
	},

	distanceBetween: function(p1, p2){
		var xd = (p1.pos.x) - (p2.pos.x);
		var yd = (p1.pos.y) - (p2.pos.y);
		return sqrt(xd * xd + yd * yd ) || 0.001;
	},

	directionNormal: function(p1, p2){
		return Vector.sub(p1.pos, p2.pos).normalize();
	}

});

Engine.getRandomArbitrary = function(min, max) {
    return Math.random() * (max - min) + min;
};

window.Engine = Engine;

})(window.Base, window.Vector);
