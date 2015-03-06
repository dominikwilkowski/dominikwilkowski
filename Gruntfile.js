'use strict';

/*******************************************************************************************************
 *
 *  FOLDER STRUCTURE
 *
 * dev                              // files in root just move to ./prod/ and *.html files will look for grunt-includes directives
 * ├── HTMLincludes                 // HTML snippets included by grunt-includes
 * │   └── windows.html
 * ├── fonts                        // files will simply be moved to ./prod/fonts/
 * │   └── font.woff2
 * ├── img                          // images will be minified and moved to ./prod/img/
 * │   └── image.jpg
 * ├── index.html
 * ├── js                           // javascript files will be concatenated and minified by file naming order
 * │   ├── 010-first-file.js
 * │   ├── 020-second-file.js
 * │   └── libs                     // files will simply be moved to ./prod/js/libs
 * ├── php                          // files will simply be moved to ./prod/php/
 * │   └── script.php
 * ├── stylus                       // in this folder only the site.styl will be compiled into css and copied to .prod/css/
 * │   ├── base
 * │   │   └── normalise.styl
 * │   ├── module
 * │   │   └── module1.styl
 * │   └── site.styl
 * └── svg                          // all svg files will be minified and run through grunt-grunticon to ./prod/css/
 *     └── symbole.svg
 *
 *******************************************************************************************************/

module.exports = function(grunt) {

	//dependencies
	grunt.loadNpmTasks('grunt-contrib-stylus');
	grunt.loadNpmTasks('grunt-contrib-connect');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-includes');
	grunt.loadNpmTasks('grunt-text-replace');
	grunt.loadNpmTasks('grunt-autoprefixer');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-imagemin');
	grunt.loadNpmTasks('grunt-grunticon');
	grunt.loadNpmTasks('grunt-svgmin');
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-bumpup');
	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-mkdir');
	grunt.loadNpmTasks('grunt-font');
	grunt.loadNpmTasks('grunt-wakeup');


	grunt.initConfig({

		pkg: grunt.file.readJSON('package.json'),
		currentVersion: '<%= pkg.name  %>.<%= pkg.version %>',

		//----------------------------------------------------------------------------------------------------------------------------------------------------------
		// clean task
		//----------------------------------------------------------------------------------------------------------------------------------------------------------
		clean: {
			pre: ['temp', 'prod'], //delete before running
			post: ['tmp'], //delete after running
		},


		//----------------------------------------------------------------------------------------------------------------------------------------------------------
		// scaffold all directories
		//----------------------------------------------------------------------------------------------------------------------------------------------------------
		mkdir: {
			scaffold: {
				options: {
					create: [
						'./dev/HTMLincludes',
						'./dev/fonts',
						'./dev/img',
						'./dev/js/libs',
						'./dev/php',
						'./dev/stylus/base',
						'./dev/stylus/module',
						'./dev/svg',
					],
				}
			},
		},


		//----------------------------------------------------------------------------------------------------------------------------------------------------------
		// includes task
		//----------------------------------------------------------------------------------------------------------------------------------------------------------
		includes: {
			files: {
				cwd: 'dev/',
				src: ['*.html'], // Source files
				dest: 'tmp/',
				options: {
					flatten: true,
					includePath: 'dev/HTMLincludes/',
				},
			},
		},


		//----------------------------------------------------------------------------------------------------------------------------------------------------------
		// replace task
		//----------------------------------------------------------------------------------------------------------------------------------------------------------
		replace: {
			currentVersion: {
				src: ['tmp/*.html'],
				overwrite: true,
				replacements: [{
					from: '--currentVersion--',
					to: '<%= currentVersion %>',
				}],
			},
		},


		//----------------------------------------------------------------------------------------------------------------------------------------------------------
		// stylus task
		//----------------------------------------------------------------------------------------------------------------------------------------------------------
		stylus: {
			site: {
				options: {
					compress: true,
				},
				files: {
					'prod/css/<%= currentVersion  %>.min.css': 'dev/stylus/site.styl',
				},
			},
		},


		//----------------------------------------------------------------------------------------------------------------------------------------------------------
		// vendor prefixes
		//----------------------------------------------------------------------------------------------------------------------------------------------------------
		autoprefixer: {
			Prefix: {
				src: 'prod/css/<%= currentVersion  %>.min.css',
				dest: 'prod/css/<%= currentVersion  %>.min.css',
			},
		},


		//----------------------------------------------------------------------------------------------------------------------------------------------------------
		// JS minification
		//----------------------------------------------------------------------------------------------------------------------------------------------------------
		uglify: {
			js: {
				files: {
					'prod/js/<%= currentVersion  %>.min.js': ['dev/js/*.js'],
				},
			},
		},


		//----------------------------------------------------------------------------------------------------------------------------------------------------------
		// minify svgs
		//----------------------------------------------------------------------------------------------------------------------------------------------------------
		svgmin: {
			dist: {
				files: [{
					expand: true,
					cwd: 'dev/svg/',
					src: ['*.svg'],
					dest: 'temp/svg/',
				}],
			},
		},


		//----------------------------------------------------------------------------------------------------------------------------------------------------------
		// grunticon
		//----------------------------------------------------------------------------------------------------------------------------------------------------------
		grunticon: {
			myIcons: {
				files: [{
					expand: true,
					cwd: 'temp/svg',
					src: '*.svg',
					dest: 'prod/css',
				}],
				options: {
					datasvgcss: 'symbols.data.svg.css',
					datapngcss: 'symbols.data.png.css',
					urlpngcss: 'symbols.fallback.css',
					cssprefix: '.symbol-',
					customselectors: {
						// 'radio-on': ['input[type="radio"]:checked + label'],
						// 'radio-off': ['.radio label', '.radio-inline label'],
						// 'checkbox-on': ['input[type="checkbox"]:checked + label'],
						// 'checkbox-off': ['.checkbox label', '.checkbox-inline label']
					},
				},
			},
		},


		//----------------------------------------------------------------------------------------------------------------------------------------------------------
		// minify images
		//----------------------------------------------------------------------------------------------------------------------------------------------------------
		imagemin: {
			images: {
				options: {
					optimizationLevel: 4,
				},
				files: [{
					expand: true,
					cwd: 'dev/img',
					src: ['**/*.{png,jpg,gif}'],
					dest: 'prod/img/',
				}],
			},
		},


		//----------------------------------------------------------------------------------------------------------------------------------------------------------
		// copy all files to prod
		//----------------------------------------------------------------------------------------------------------------------------------------------------------
		copy: {

			//js folder
			JS: {
				files: [{
					expand: true,
					cwd: './dev/js/libs',
					src: ['**/*'],
					dest: './prod/js/libs/',
					filter: 'isFile',
				}]
			},

			//fonts
			Fonts: {
				files: [{
					expand: true,
					cwd: './dev/fonts',
					src: ['**/*'],
					dest: './prod/fonts/',
					filter: 'isFile',
				}],
			},

			//html template
			Templates: {
				files: [{
					expand: true,
					cwd: './tmp',
					src: ['*.html'],
					dest: './prod/',
					filter: 'isFile',
				}],
			},

			//php files
			PHP: {
				files: [{
					expand: true,
					cwd: './dev/php/**',
					src: ['*.php'],
					dest: './prod/php/',
					filter: 'isFile',
				}],
			},
		},


		//----------------------------------------------------------------------------------------------------------------------------------------------------------
		// bum version
		//----------------------------------------------------------------------------------------------------------------------------------------------------------
		bumpup: {
			files: 'package.json',
		},


		//----------------------------------------------------------------------------------------------------------------------------------------------------------
		// server
		//----------------------------------------------------------------------------------------------------------------------------------------------------------
		connect: {
			server: {
				options: {
					open: false,
					port: 1337,
				},
			},
		},


		//----------------------------------------------------------------------------------------------------------------------------------------------------------
		// wake up
		//----------------------------------------------------------------------------------------------------------------------------------------------------------
		wakeup: {
			wakeme: {},
		},


		//----------------------------------------------------------------------------------------------------------------------------------------------------------
		// banner font
		//----------------------------------------------------------------------------------------------------------------------------------------------------------
		font: {
			dev: {
				text: " Welcome",
				options: {
					colors: ['magenta', 'red'],
				},
			},
		},


		//----------------------------------------------------------------------------------------------------------------------------------------------------------
		// watch for changes
		//----------------------------------------------------------------------------------------------------------------------------------------------------------
		watch: {
			files: [
				'dev/**/*',
			],
			tasks: ['build'],
		},

	});


	//------------------------------------------------------------------------------------------------------------------------------------------------------------
	// TASKS
	//------------------------------------------------------------------------------------------------------------------------------------------------------------
	grunt.registerTask('build', [
		'clean:pre',
		'includes',
		'replace',
		'stylus',
		'autoprefixer',
		'uglify',
		'svgmin',
		'grunticon',
		'imagemin',
		'copy',
		'clean:post',
		'font',
		'wakeup',
	]);


	grunt.registerTask('bump', ['bumpup', 'build']);  // bump up to new version
	grunt.registerTask('scaffold', ['mkdir', 'wakeup']);  // create basic folder structure
	grunt.registerTask('default', ['connect', 'build', 'watch']);  // work
};