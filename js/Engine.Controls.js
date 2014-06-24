(function(
	Engine,
	Base
){

if (!String.prototype.substitute) {
	String.prototype.substitute = function(object, regexp){
		return String(this).replace(regexp || (/\\?\{([^{}]+)\}/g), function(match, name){
			if (match.charAt(0) == '\\') return match.slice(1);
			return (object[name] !== null) ? object[name] : '';
		});
	};
}

Engine.Controls = Base.extend({

	constructor: function(engine){
		this.engine = engine;

		this.container = document.createElement('div');
		this.container.className = 'controls';

		this.generateControls();

		this.attach();
	},

	generateControls: function(){
		var html = '<h1>Environment Settings</h1>';

		Engine.Controls.Ranges.forEach(function(obj){
			obj.value = this.engine[obj.id];
			html += Engine.Controls.ControlTemplate.substitute(obj);
		}, this);

		html += '<div>Total Particles: <span id="total-particles">0</span></div>';

		this.container.innerHTML += html;

		document.body.appendChild(this.container);

		this.totalParticle = document.getElementById('total-particles');
	},

	setTotalParticles: function(total){
		this.totalParticle.innerHTML = total || 0;
		return this;
	},

	attach: function(){
		this.container.addEventListener(
			'touchmove',
			this.stopPropagation,
			false
		);

		this.container.addEventListener(
			'input',
			this._handleChange.bind(this),
			false
		);
	},

	_handleChange: function(event){
		var target = event.target,
			key = target.id,
			value = parseFloat(target.value) || 0;

		this.engine[key] = value;

		document.getElementById(key + '_value').innerHTML = value;
	},

	stopPropagation: function(event){
		event.stopPropagation();
	}

});

Engine.Controls.Ranges = [
	{
		id    : 'gravity',
		label : 'Gravity',
		min   : 0,
		max   : 1400,
		step  : 1
	}, {
		id    : 'smoothingRadius',
		label : 'Smoothing Radius',
		min   : 1,
		max   : 100,
		step  : 1
	}, {
		id    : 'stiff',
		label : 'Stiffness',
		min   : 1,
		max   : 10000,
		step  : 1
	}, {
		id    : 'stiffN',
		label : 'Stiffness Near',
		min   : 1,
		max   : 10000,
		step  : 1
	}, {
		id    : 'restDensity',
		label : 'Rest Density',
		min   : 1,
		max   : 40,
		step  : 1
	}
];

Engine.Controls.ControlTemplate = [
	'<label for="{id}">',
		'{label}: ',
		'<span id="{id}_value">{value}</span>',
	'</label>',
	'<input ',
		'type="range" ',
		'id="{id}" ',
		'min="{min}" ',
		'max="{max}" ',
		'step="{step}" ',
		'value="{value}" ',
	'/>'
].join('');

})(
	window.Engine,
	window.Base
);
