module.exports = function(grunt) {
	// Add the grunt-mocha-test tasks.
	grunt.loadNpmTasks('grunt-mocha-test');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	// Configure a mochaTest task.
	grunt.initConfig({
		mochaTest: {
			test: {
				options: {
					reporter: 'spec',
					require: [
						'test-suite/assist/config_chai.js'
					]
				},
				src: ['test-suite/unit/**/*.js']
			}
		},
		mochaIntegrationTest: {
			test: {
				options: {
					reporter: 'spec',
					require: [
						'test-suite/assist/config_chai.js'
					]
				},
				src: ['test-suite/integration/**/*.js']
			}
		},
		jshint: {
			options: {
				reporter: require('jshint-stylish'),
				devel: true,
				curly: true,
				freeze: true,
				latedef: true,
				maxdepth: 4,
				nonew: true,
				undef: true,
				unused: true,
				eqeqeq: true,
				esnext: true,
				node: true,
				sub: true,
				//varstmt: true,
				globals: {
					"process": true, 
					"require": true, 
					"global": true,
					"module": true
				}
			},
		    target: ['Gruntfile.js', 'Cortex.js', 'InitializeCortex.js', 'modules/**/*.js']
		}
	});
	grunt.registerTask('default', ['jshint','mochaTest']);
	grunt.registerTask('full', ['jshint','mochaTest', 'mochaIntegrationTest']);
	grunt.registerTask('unittest', ['mochaUnitTest']);
	grunt.registerTask('integration', ['mochaIntegrationTest']);
	grunt.registerTask('lint', ['jshint']);	
};