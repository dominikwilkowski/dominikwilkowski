/***************************************************************************************************************************************************************
 *
 * App framework and settings
 *
 * Description of init process
 *
 **************************************************************************************************************************************************************/


var App = (function() {

	//------------------------------------------------------------------------------------------------------------------------------------------------------------
	// settings
	//------------------------------------------------------------------------------------------------------------------------------------------------------------
	return {
		DEBUG: true, //Enable/disable debugger


		//----------------------------------------------------------------------------------------------------------------------------------------------------------
		// initiate app
		//----------------------------------------------------------------------------------------------------------------------------------------------------------
		init: function() {

			console.log('%cDEBUGGING INFORMATION', 'font-size: 25px;');

			App.debugging( 'Getting paralax layers', 'report' );
			$('.js-headline1').plaxify({
				"xRange": 20,
				"yRange": 10,
			});

			$('.js-headline2').plaxify({
				"xRange": 30,
				"yRange": 15,
				"inverted": true,
			});

			App.debugging( 'Starting Plax', 'report' );
			$.plax.enable();

		},


		//----------------------------------------------------------------------------------------------------------------------------------------------------------
		// debugging prettiness
		//
		// text  string   Text to be printed to debugger
		// code  keyword  What kind of urgency: report,error,interaction
		//----------------------------------------------------------------------------------------------------------------------------------------------------------
		debugging: function( text, code ) {

			if( code === 'report' ) {
				if( App.DEBUG ) console.log('%c\u2611 ', 'color: green; font-size: 18px;', text);
			}

			else if( code === 'error' ) {
				if( App.DEBUG ) console.log('%c\u2612 ', 'color: red; font-size: 18px;', text);
			}

			else if( code === 'interaction' ) {
				if( App.DEBUG ) console.log('%c\u261C ', 'color: blue; font-size: 18px;', text);
			}

		}

	}

}());