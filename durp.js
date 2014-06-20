(function() {

	// Three.js variables, i.e: Rendering variables

	var canvas = document.getElementById('splash'),
	renderer,
	resolution = 32,
	amount = 35; // How many marbles are there?

	// Attempted rendering degradation.
	if ((canvas.getContext('webgl')
		|| canvas.getContext('experimental-webgl'))) {
			renderer = new THREE.WebGLRenderer({
				canvas: canvas,
				antialias: true
			});
		} else {
			resolution = 4;
			amount = 25;
			renderer = new THREE.CanvasRenderer({
				canvas: canvas
			});
		}

		var width = renderer.domElement.width;
		var height = renderer.domElement.height;
		var center = new Physics.Vector(width / 2, height / 2);

		var scene = new THREE.Scene();
		var camera = new THREE.OrthographicCamera(0, width, 0, height, -10000);

		var reflection = new THREE.CubeCamera(1, 1000, 256);
		reflection.renderTarget.minFilter = THREE.LinearMipMapLinearFilter;

		var light = new THREE.SpotLight(0xffffff, 10, 0, Math.PI, 10);
		light.position.set(center.x, center.y, -250);
		light.target.position.set(center.x, center.y, 0);

		var spheres = [];

		scene.add(camera);
		scene.add(reflection);
		scene.add(light);

		// Physics related constants

		var mass = 1, // What's the mass of each marble?
		radius = 50, // What's the radius of each marble?
		strength = 100000, // What's the strength of the attraction between each marble and the beacon?
		diameter = radius * 2; // Save the diameter for distance checking later.

		var physics = new Physics();

		// Create the fixed point light / anchor that is selectable,
		// we'll call it a beacon.

		var anchor = physics.makeParticle(mass, center.x, center.y);
		anchor.makeFixed();

		var beacon = {
			color: 0xff0000,
			particle: anchor
		};
		beacon.maxIntensity = 5;
		beacon.light = new THREE.PointLight(beacon.color, beacon.maxIntensity, radius * 4);

		// The innards of the beacon.
		// We need to make sure it doesn't inhabit the same surface is the reflection.
		beacon.mesh = new THREE.Mesh(new THREE.SphereGeometry(radius - 1, resolution, resolution), new THREE.MeshPhongMaterial({
			transparent: true,
			blending: THREE.AdditiveBlending,
			shininess: 0,
			color: beacon.color,
			shading: THREE.SmoothShading,
		}));

		// The outer shell.
		beacon.reflection = new THREE.Mesh(new THREE.SphereGeometry(radius, resolution, resolution), new THREE.MeshBasicMaterial({
			opacity: 0.75,
			blending: THREE.AdditiveBlending,
			envMap: reflection.renderTarget
		}));

		beacon.radius = radius;

		// Add to scene and spheres.
		scene.add(beacon.light);
		scene.add(beacon.mesh);
		scene.add(beacon.reflection);
		spheres.push(beacon);

		// Create all other marbles.
		for (var i = 0; i < amount; i++) {
			addSphere();
		}

		// Set the size of the renderer, same as our canvas.
		renderer.setSize(width, height);

		// This is like our draw loop
		physics.onUpdate(function() {

			for (var i = 0, l = spheres.length; i < l; i++) {

				// Set the position of the mesh to the position of the particle

				var sphere = spheres[i];
				var particle = sphere.particle;
				var mesh = sphere.mesh;

				var position = mesh.position.clone(); // Store the previous position
				var theta = 360 / (Math.PI * diameter); // Convert distance to revolutions

				for (var j = i; j < l; j++) {

					if (j == i) {
						continue;
					}

					var a = particle;
					var b = spheres[j].particle;
					var d = a.distanceTo(b);

					// Collision for same mass particles
					// http://en.wikipedia.org/wiki/Elastic_collision

					if (d <= diameter) {

						var v = a.velocity.clone();
						a.velocity.copy(b.velocity).multiplyScalar(0.75);
						b.velocity.copy(v).multiplyScalar(0.75);

						if (d < diameter) {

							// Force particles to be tangential.
							// i.e: No sphere is ever within another sphere.

							var makeup = (diameter - d) / 2;
							var angle = Math.atan2(b.position.y - a.position.y, b.position.x - a.position.x);

							b.position.x += makeup * Math.cos(angle);
							b.position.y += makeup * Math.sin(angle);

							angle += Math.PI;

							a.position.x += makeup * Math.cos(angle);
							a.position.y += makeup * Math.sin(angle);

						}

					}

				}

				// Set the new position of the marble
				mesh.position.x = particle.position.x;
				mesh.position.y = particle.position.y;

				// Calculate the "spin" of the marble
				mesh.rotation.x += theta * (particle.position.y - position.y) / 60;
				mesh.rotation.z += theta * (particle.position.x - position.x) / 60;

				// If this is the beacon update the position of the light and the
				// intensity based on how close it is from the center, aka the
				// point light.
				if (sphere.light) {

					var normal = sphere.particle.position.distanceTo(center) / (height / 2);
					sphere.light.position.set(particle.position.x, particle.position.y, 0);
					var clamp = Math.max(Math.min(1, 1 - normal), 0);
					sphere.light.intensity =  clamp * sphere.maxIntensity;

				}

			}

			// Update the beacon's environment map.
			// http://en.wikipedia.org/wiki/Reflection_mapping

			// Let's make sure the map doesn't include the beacon itself.
			beacon.mesh.visible = false;
			beacon.reflection.visible = false;

			// Make sure the reflection is in the right place.
			beacon.reflection.position.copy(beacon.mesh.position);
			reflection.position.copy(beacon.mesh.position);

			// Take a snapshot from the perspective of the beacon.
			reflection.updateCubeMap(renderer, scene);

			// Enable the beacon again so the viewer can see.
			beacon.mesh.visible = true;
			beacon.reflection.visible = true;

			// Render the scene and camera
			renderer.render(scene, camera);

		});

		// Let's kick off the calculations right away!
		physics.play();

		// Let's also add a mouse event bound to the beacon's location.
		var has = !!window.addEventListener;
		if (has) {
			window.addEventListener('mousemove', onWindowMouseMove);
		} else {
			window.attachEvent('onmousemove', onWindowMouseMove);
		}

		function onWindowMouseMove(e) {

			var x = e.clientX - renderer.domElement.getBoundingClientRect().left;
			var y = e.clientY;

			beacon.particle.position.set(x, y);

		}

		function addSphere() {

			var x = Math.random() * width * 4 - width;
			var y = Math.random() * height * 4 - height;

			// Create a Physics.Particle and Physics.Attraction to the center.
			var particle = physics.makeParticle(mass, x, y);
			var attraction = physics.makeAttraction(anchor, particle, strength, width);

			// Create a custom texture / pattern for the marble
			var texture = new THREE.Texture(getPattern());
			texture.needsUpdate = true;
			texture.anisotropy = renderer.getMaxAnisotropy();

			// Create the geometry and material for the mesh.

			var geometry = new THREE.SphereGeometry(radius, resolution, resolution);
			var material = new THREE.MeshPhongMaterial({
				transparent: true,
				shininess: 0,
				shading: THREE.SmoothShading,
				map: texture
			});

			// Create a mesh and add it to our scene
			var mesh = new THREE.Mesh(geometry, material);
			scene.add(mesh);

			// Expose a sphere object for accessing during render loop.
			spheres.push({
				particle: particle,
				geometry: geometry,
				material: material,
				mesh: mesh,
				radius: radius
			});

		}

		/**
		 * Make various stripe patterns in canvas 2d.
		 */
		function getPattern() {

			var possible = 10;

			var canvas = document.createElement('canvas');
			var ctx = canvas.getContext('2d');
			var orientation = Math.random() > 0.4 ? true: false;

			canvas.width = canvas.height = 128;

			ctx.fillStyle = 'white';
			ctx.strokeStyle = 'black';

			ctx.fillRect(0, 0, canvas.width, canvas.height);

			for (var i = 0, l = Math.round(Math.random() * possible / 2 + possible / 5); i < l; i++) {

				ctx.lineWidth = (l / possible) * canvas.height / l;

				var pct = i / l;

				var x1 = 0;
				var x2 = canvas.width;
				var y = pct * canvas.height;

				if (orientation) {

					ctx.beginPath();
					ctx.moveTo(x1, y);
					ctx.lineTo(x2, y);
					ctx.stroke();

				} else {

					ctx.beginPath();
					ctx.moveTo(y, x1);
					ctx.lineTo(y, x2);
					ctx.stroke();

				}

			}

			return canvas;

		}

})();
