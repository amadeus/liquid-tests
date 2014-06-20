(function(Base, Physics){

var Tester = Base.extend({

	scale: window.devicePixelRatio || 1,

	gravity: 0.5,
	mass: 4,
	radius: 1,
	strength: 0.01,
	drag: 0.1,
	rest: 20,
	burp: 1,

	particles: new Array(100),

	constructor: function(id){
		var p, pa, particle, len;
		this.canvas = document.getElementById(id);

		this.resize = this.resize.bind(this);
		this.resize();
		window.addEventListener('resize', this.resize, false);

		this.context = this.canvas.getContext('2d');
		this.context.fillStyle = '#333';

		this.physics = new Physics(this.gravity);

		for (p = 0; p < this.particles.length; p++) {
			this.particles[p] = this.physics.makeParticle(
				this.mass,
				Tester.getRandomArbitrary(0, this.width),
				Tester.getRandomArbitrary(0, this.height)
			);
		}

		// Make all particles attract...
		// for (p = 0, len = this.particles.length; p < this.particles.length; p++) {
		//     particle = this.particles[p];
		//     for (pa = p + 1; pa < len; pa++) {
		//         this.s = this.physics.makeSpring(
		//             particle,
		//             this.particles[pa],
		//             this.strength,
		//             this.drag,
		//             this.rest,
		//             this.burp
		//         );
		//         this.s.ml = 30;
		//     }
		// }

		this.physics.onUpdate(this.render.bind(this));
		this.physics.toggle();

		dbg.log(this);
		window.durp = this;
	},

	resize: function(){
		this.width  = window.innerWidth;
		this.height = window.innerHeight;

		this.canvas.width  = this.width  * this.scale;
		this.canvas.height = this.height * this.scale;
	},

	render: function(){
		var scl = this.scale,
			ctx = this.context,
			particles = this.particles,
			particle,
			p;

		this.context.clearRect(
			0,
			0,
			this.width  * scl,
			this.height * scl
		);

		for (p = 0; p < particles.length; p++) {
			particle = this.particles[p];

			if (particle.position.y > this.height - this.radius * particle.mass) {
				particle.position.set(
					particle.position.x,
					this.height - this.radius * particle.mass
				);
				particle.velocity.y = -(particle.velocity.y * 0.3);
			}

			ctx.beginPath();
			ctx.arc(
				particle.position.x * scl,
				particle.position.y * scl,
				this.radius * particle.mass * scl,
				0,
				Math.PI * 2,
				false
			);
			ctx.fill();
		}

	}

});

Tester.getRandomArbitrary = function(min, max) {
    return Math.random() * (max - min) + min;
};

window.Tester = Tester;

})(window.Base, window.Physics);
