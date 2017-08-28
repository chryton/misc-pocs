var GAL = GAL || {};


GAL.lightbox = (function(GAL){

	var state = {
			isOpen: false,
			currentData: 0
		},
		// #CacheAllTheThings
		lbOverlay = document.querySelectorAll('.lightbox--overlay')[0],
		lbContent = document.querySelectorAll('.lightbox--content')[0],
		lbUrl = document.querySelectorAll('.url')[0],
		lbSource = document.querySelectorAll('.source')[0],
		lbRating = document.querySelectorAll('.rating')[0],
		lbClose = document.querySelectorAll('.lightbox--close')[0],
		lbPrevious = document.querySelectorAll('.lightbox--prev')[0],
		lbNext = document.querySelectorAll('.lightbox--next')[0],
		body = document.querySelectorAll('body')[0];


	/**
	 * Resets the lightbox content
	 * @return no return
	 */
	function reset() {

		///////////
		// Notes //
		///////////

		// Possible future state upgrades:
		// - Emit "reset" event for life-cycle hooks

		lbContent.style.backgroundImage = '';
		lbUrl.textContent = '';
		lbSource.textContent = '';
		lbRating.textContent = '';
		state.isOpen = false;

		console.info('Lightbox Reset');
	}


	/**
	 * Builds the lightbox content
	 * @param  {object} data     	Data to populate the lightbox
	 * @param  {integer} index    	The index of the element you are building
	 * @param  {function} complete 	Optional function to call on completion
	 * @return no return          
	 */
	function build(data, index, complete) {

		///////////
		// Notes //
		///////////

		// This is pretty tightly coupled to how Giphy returns data and 
		// the data scheme from the search gallery.
		// To remedy this, in the future I would definitely transform 
		// the data as it comes back from the API and further 
		// standardize this interface after a more nailed-down list of needs
		// is enumerated.
		// 
		// Possible future state upgrades:
		// - Emit "building" event for life-cycle hooks

		state.currentData = index;

		lbPrevious.innerHTML = "";
		lbNext.innerHTML = "";

		if (index > 0){
			lbPrevious.insertAdjacentHTML('beforeend', '<img src="' + GAL.search.data[index - 1].images.fixed_width_still.url + '">');
		}

		if (index < GAL.search.data.length - 1) {
			lbNext.insertAdjacentHTML('beforeend', '<img src="' + GAL.search.data[index + 1].images.fixed_width_still.url + '">');
		}

		lbContent.style.backgroundImage = "url(" + data.images.original.url + ")";
		lbUrl.textContent = (data.url.length) ? "URL: " + data.url : "";
		lbSource.textContent = (data.source.length) ? "Image Source: " + data.source : "";
		lbRating.textContent = (data.rating.length) ? "Rating: " + data.rating : "";


		if (typeof complete === "function") {
			complete();
		}
	}


	/**
	 * Opens the lightbox
	 * @return no return
	 */
	function open() {

		///////////
		// Notes //
		///////////

		// Possible future state upgrades:
		// - Emit "opening" event for life-cycle hooks

		body.classList.add('lightbox--open');

		state.isOpen = true;
	}


	/**
	 * Updates the content in the lightbox based on user interactions
	 * @param  {integer} direction 	The ammount to advance/retreat in the list of elements
	 * @return no return
	 */
	function changeContent(direction) {

		var newIndex = state.currentData + direction;

		if (newIndex >= GAL.search.data.length - 1){
			newIndex = GAL.search.data.length - 1;
		} else if (newIndex < 0) {
			newIndex = 0;
		}

		build(GAL.search.data[newIndex], newIndex);
	}


	/**
	 * Closes the lightbox
	 * @return no return
	 */
	function close() {

		///////////
		// Notes //
		///////////

		// Possible future state upgrades:
		// - Emit "closing" event for life-cycle hooks

		body.classList.remove('lightbox--open');
		state.isOpen = false;
	}


	/**
	 * List of events the lightbox requires
	 * @return no return
	 */
	function eventBindings() {

		//////////////////////////
		// Closing the lightbox //
		//////////////////////////

		lbOverlay.addEventListener('click', function(){
			close();
		});

		lbClose.addEventListener('click', function(){
			close();
		});


		////////////////////////////////////
		// Changing content from previews //
		////////////////////////////////////

		lbPrevious.addEventListener('click', function(){
			changeContent(-1);
		});

		lbNext.addEventListener('click', function(){
			changeContent(1);
		});


		////////////////////////
		// Keyboard Functions //
		////////////////////////

		document.addEventListener('keyup', function(e){
			if (e.key === "Escape" && state.isOpen) {
				close();
			} else if (e.key === "ArrowRight" && state.isOpen){
				changeContent(1);
			} else if (e.key === "ArrowLeft" && state.isOpen){
				changeContent(-1);
			}
		});
	}


	/**
	 * Kicks off the lightbox
	 * @return no return
	 */
	function init() {

		///////////
		// Notes //
		///////////

		// This would also be where I would set up any other options 
		// 
		// Possible future state upgrades:
		// - Allow for multiple lightboxes on a page
		// - Theme options (color, no border, no overlay, etc.)
		// - Custom event bindings
		// - URL state tracking
		// - Auto open on URL state
		// - Auto sizing based on content (this quickly becomes a bear due to some browser differences on what you can access of the image properties)

		eventBindings();

	}

	return {
		init: init,
		reset: reset,
		open: open,
		close: close,
		state: state,
		build: build
	};

})(GAL);


GAL.search = (function(GAL){

	///////////
	// Notes //
	///////////

	// This could possibly be better if set to a more global variable 
	// but that would depend on future needs so merely exposing it as part 
	// of the module will work for now.
	// 
	// If I was using something like Vue, `searchEngines` would actually populate 
	// the select dropdown rather than being losely-tied to it but for expediency 
	// and stability I have chose not to.
	// 
	// Possible future state upgrades:
	// - URL state tracking
	// - Autosearch based on query params

	var currentEngine = "",
		data = {},
		searchEngines = {
			giphy: {
				name: "Giphy",
				isValid: true,
				urlBase: "http://api.giphy.com",
				key: "",
				endpoints: {
					random: {
						path: "/v1/gifs/random",
						verb: "GET"
					},
					search: {
						path: "/v1/gifs/search",
						verb: "GET"
					},
					trending: {
						path: "/v1/gifs/trending",
						verb: "GET"
					}
				}
			},
			imgur: {
				name: "Imgur",
				isValid: false
			},
			flickr: {
				name: "Flickr",
				isValid: false
			},
			google: {
				name: "Google",
				isValid: false
			},
			placeCage: {
				name: "PlaceCage",
				isValid: false
			}
		};


	/**
	 * Builds out the results grid
	 * @param  {object} results The body of data returned from the search query, not transformed
	 * @return no return
	 */
	function buildResults(results) {

		var galleryElement = document.querySelectorAll('.gallery_grid')[0];

		GAL.search.data = results.data;

		document.querySelectorAll('body')[0].classList.add("searched");

		galleryElement.innerHTML = "";

		for (var i = results.data.length - 1; i >= 0; i--) {
			var galleryTemplate = `
				<div class="gallery_image_wrapper image_lightbox" data-index="${ i }">
					<img src="${ results.data[i].images.fixed_height_small.url }" alt="" class="gallery_image">
				</div>
			`;

			galleryElement.insertAdjacentHTML('afterbegin', galleryTemplate);
		}

		galleryElement.addEventListener('click', function(e){

			var index = parseInt(e.target.parentNode.dataset.index, 10); // Yes, this will be NaN if clicking on empty space

			if (index > -1){

				GAL.lightbox.build(GAL.search.data[index], index, GAL.lightbox.open());
				
			}

		}, true);

	}


	/**
	 * AJAX Request wrapper for search
	 * @param  {string} query What you are searching
	 * @return no return
	 */
	function search(query) {

		var searchReq = new XMLHttpRequest(),
			reqUrl = searchEngines[currentEngine].urlBase + searchEngines[currentEngine].endpoints.search.path;

		reqUrl += "?api_key=" + searchEngines[currentEngine].key + "&q=" + query;

		searchReq.addEventListener("load", function(){
			buildResults(JSON.parse(this.response));
		});

		searchReq.addEventListener("error", function(res){
			console.error(res);
			alert("We're sorry but something happened while we tried to make that search. Please try again in a moment.");
		});		

		searchReq.open("GET", reqUrl);
		searchReq.send();
	}


	/**
	 * List of events the search requires
	 * @return no return
	 */
	function eventBindings() {

		///////////////////////
		// Triggering Search //
		///////////////////////

		var searchForm = document.getElementById('search--form');
		
		searchForm.addEventListener('submit', function(e){

			var searchQuery = document.getElementById('search--query_field').value;

			e.stopImmediatePropagation();
			e.preventDefault();

			currentEngine = document.getElementById('search--image_engine').value;

			if (searchEngines[currentEngine].isValid && searchQuery.length){
				search(searchQuery);
			} else {
				alert("We're sorry, this service is not yet available. We have to have it up soon.");
			}

		}, true);
	}


	/**
	 * Kicks off the search functions
	 * @return no return
	 */
	function init() {

		///////////
		// Notes //
		///////////

		// Possible future state upgrades:
		// - Lazy-load capabilities


		eventBindings();

		GAL.lightbox.init();

	}

	return {
		init: init,
		availableEngines: searchEngines,
		data: data
	};

})(GAL);


GAL.router = (function(GAL){

	function init() {

		//////////////
		// AUTOBOOT //
		//////////////

		if (document.querySelectorAll('.gallery_grid').length){
			GAL.search.init();
		}

	}

	return {
		init: init
	};

})(GAL);

GAL.router.init();
