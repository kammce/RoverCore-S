module.exports = function(grunt) {
	// Add the grunt-mocha-test tasks.
	grunt.loadNpmTasks('grunt-mocha-test');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	// Configure a mochaTest task.
	grunt.initConfig(
	{
		jshint:
		{
			options:
			{
				reporter: require('jshint-stylish'),
				devel: true, 	// Defines console & alert as global objects
				curly: true, 	// Requires curly braces around blocks and loops
				freeze: true, 	// Prohibits overwriting prototypes of native objects such as Array, Date
				latedef: true, 	// Prohibits the use of a variable before it was defined
				nonew: true, 	// Does not allow new MyConstructor(); without returning to variable
				undef: true, 	// Prohibits the use of explicitly undeclared variables
				unused: true, 	// Warns when you define and never use your variables
				eqeqeq: true, 	// Prohibits the use of == and != in favor of === and !==
				esnext: true, 	// Tells JSHint that your code uses ECMAScript 6 specific syntax
				node: true, 	// Defines globals available when your code is running inside of the Node
				sub: true, 	// suppresses warnings about using [] notation when it can be expressed in dot notation: person['name'] vs. person.name.
				expr: true,
				globals:  	// Predefine these so that JSHint does not complain about them
				{
					"process": true,
					"require": true,
					"global": true,
					"module": true,
					"should": true,
					"expect": true,
					"describe": true,
					"it": true,
					"before": true,
					"after": true,
					"beforeEach": true,
					"afterEach": true,
					"sinon": true
				}
			},
		    target: ['Gruntfile.js', 'modules/**/*.js', 'utilities/**/*.js', 'test/core/*.js', 'test/modules/*.js', 'test/libraries/*.js']
		},
		mochaTest:
		{
			test:
			{
				options:
				{
					reporter: 'spec',
					require: [ '.config_tests.js' ]
				},
				//// Removed libraries because those tests are system specific
				src: ['test/core/*.js', /*'tests/librarie/*.js',*/ 'test/modules/**/*.js']
			}
		}
	});
	grunt.registerTask('default', ['jshint','mochaTest']);
	grunt.registerTask('unittest', ['mochaTest']);
	grunt.registerTask('lint', ['jshint']);
};
