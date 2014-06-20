// jshint unused:false
(function(Base, Vector){

var sqrt = Math.sqrt,
	pow = Math.pow;

var Engine = Base.extend({

	particles: [],

	scale: 1,
	gravity: 1,
	smoothingRadius: 10,
	stiff: 1,

	restDensity: 1,

	run: function(delta){
		var particles = this.particles,
			pairs = [],
			dt = delta,
			reuse = {
				x: 0,
				y: 0
			},
			scale = this.scale,
			particle, particle2,
			Q, pair, p, p2, len, press, pressN, displace,
			a2bN;

		// Iterate through particles, setup positions
		for (p = 0, len = particles.length; p < len; p++) {
			particle = particles[p];
			particle.vel.set(
				Vector.sub(
					particle.pos,
					particle.posOld
				).div(dt)
			);
			particle.posOld.set(particle.pos);
			reuse.x = 0;
			reuse.y = this.gravity * dt;
			particle.vel.add(reuse);
			particle.pos.add(
				particle.vel.mult(dt)
			);
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
			pair[0].dens += p.q2;
			pair[1].dens += p.q2;
			pair[0].densN += p.q3;
			pair[1].densN += p.q3;
		}

		// Iterate through particles, setup positions
		for (p = 0, len = particles.length; p < len; p++) {
			particle = particles[p];
			particle.press = this.stiff * (particle.dens - this.restDensity);
			particle.pressN = this.stiff * p.densN;
		}

		// Iterate through particle pairs
		for (p = 0, len = pairs.length; p < len; p++) {
			pair = pairs[p];
			press = pair[0].press + pair[1].press;
			pressN = pair[0].pressN + pair[1].pressN;
			displace = (press * pair.q2 + press * pair.q3) * (pow(dt, 2));
			a2bN = this.directionNormal(pair[0], pair[1]);
			reuse.x = displace + a2bN;
			reuse.y = displace + a2bN;
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
			if (particle.pos.y > this.height) {
				particle.pos.y = this.height;
			}
			if (particle.pos.x > this.width) {
				particle.pos.x = this.width;
			}
			if (particle.pos.x < 0) {
				particle.pos.x = 0;
			}

			particle.draw(this.context, scale);
		}

		particle = undefined;
		pair     = undefined;
		pairs    = undefined;
		reuse    = undefined;
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
		ctx.fillRect(
			this.pos.x * scale,
			this.pos.y * scale,
			10 * scale,
			10 * scale
		);
	}

};

})(window.Base, window.Vector);
