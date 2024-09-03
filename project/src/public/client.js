let store = Immutable.Map({
	rovers: Immutable.List(["Curiosity", "Opportunity", "Spirit"]),
	photos: Immutable.List(),
});

// add our markup to the page
const root = document.getElementById("root");

const updateStore = (newState) => {
	store = store.merge(newState);
	render(root, store);
};

const render = async (root, state) => {
	root.innerHTML = App();
	showRoverButtons(state.get("rovers"));
};

// create content
const App = () => {
	return `
		<main>
				<h1 class="title">Welcome to Mars dashboard</h1>
				<section>
						<h3 class="intro">Each rover has its own set of photos. Select one of them to see more details.</h3>
						<div id="rover-buttons"></div>
				</section>
		</main>
	`;
};

// listening for load event because page should load before any JS is called
window.addEventListener("load", () => {
	render(root, store);
});

/**
 * @description Higher-Order Function that adds a loading indicator while the async function is running
 * @param {Function} asyncMethod The asynchronous function to wrap with a loading indicator
 * @returns {Function} A new function that shows a loading indicator while the original function is running
 */
const showLoader =
	(asyncMethod) =>
	async (...args) => {
		const loadingElement = document.createElement("div");
		loadingElement.innerHTML = "<p>Loading...</p>";
		document.getElementById("root").appendChild(loadingElement);

		try {
			const result = await asyncMethod(...args);
			loadingElement.remove();
			return result;
		} catch (error) {
			loadingElement.remove();
			throw error;
		}
	};

/**
 * @description Higher-Order Function that adds error handling to an asynchronous function
 * @param {Function} asyncMethod The asynchronous function to wrap with error handling
 * @returns {Function} A new function that catches and logs errors, and returns an error message
 */
const showError =
	(asyncMethod) =>
	async (...args) => {
		try {
			return await asyncMethod(...args);
		} catch (error) {
			console.error("An error occurred: ", error);
			return `<div class="error">An error occurred: ${error.message}</div>`;
		}
	};

// ------------------------------------------------------  COMPONENTS

/**
 * @description Renders rover's information
 *
 * @param {string} name Name of the rover
 */
const showRoverInformation = async (name) => {
	const imageGallery = await ImageGallery(name);
	const galleryContainer = document.createElement("div");

	galleryContainer.id = "image-gallery-container";
	galleryContainer.innerHTML = imageGallery;

	const root = document.getElementById("root");

	root.appendChild(galleryContainer);
};

/**
 * @description Renders list of buttons to view selected rover's information
 *
 * @param {Array<string>} rovers List of rovers' names
 */
const showRoverButtons = (rovers) => {
	const buttonContainer = document.getElementById("rover-buttons");

	rovers.forEach((rover) => {
		const button = document.createElement("button");

		button.className = "btn-rover";
		button.textContent = rover;
		button.addEventListener("click", () => showRoverInformation(rover));
		buttonContainer.appendChild(button);
	});
};

/**
 * @description Renders image gallery of the selected rover
 *
 * @param {Array<object>} photos List of the selected rover's photos
 * @param {string} roverName The selected rover's name
 */
const showPhotoGallery = (photos, roverName) => {
	return photos
		.map(
			(photo) =>
				`
		<div class="photo-details-container">
			<p>Date photo were taken: ${photo.earth_date}</p>
			<img class="photo" alt="Photo taken by ${roverName} rover" src=${photo.img_src} loading="lazy" />
		</div>
		`
		)
		.join("");
};

/**
 * @description Renders image gallery of the selected rover
 *
 * @param {string} name Name of the rover
 */
const ImageGallery = showLoader(async (name) => {
	const galleryContainer = document.getElementById("image-gallery-container");

	if (galleryContainer) {
		// Clear existing image gallery before calling api
		galleryContainer.innerHTML = "";
	}

	await getRoverPhotos(name);

	const photos = store.get("photos");

	if (!photos?.size) {
		return "<p>No photos available for this rover.</p>";
	}

	const rover = photos.get(0).rover;

	return `
		<div class="image-gallery">
			<p>Name: ${name}</p>
			<p>Launch date: ${rover.launch_date}</p>
			<p>Landing date: ${rover.landing_date}</p>
			<p>Status: ${rover.status}</p>
			<div class="photo-grid">
				${showPhotoGallery(photos.toJS(), name)}
			</div>
		</div>		
	`;
});

// ------------------------------------------------------  API CALLS

/**
 * @description Gets photos of the selected rover
 *
 * @param {string} name Name of the rover
 * @param {number} sol Martian sol of the rover's mission
 */
const getRoverPhotos = showError(async (name, sol = 1000) => {
	const response = await fetch(
		`http://localhost:3000/rovers/${name}?sol=${sol}`
	);
	const data = await response.json();
	updateStore({photos: Immutable.List(data.photos)});
});
