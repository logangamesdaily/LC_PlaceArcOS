const html = await loadHtml("body.html");
const { PlaceAPI } = await load("./place.js");

class proc extends ThirdPartyAppProcess {
	constructor(handler, pid, parentPid, app, workingDirectory, ...args) {
		super(handler, pid, parentPid, app, workingDirectory);
	}

	async render() {
		const body = this.getBody();
		body.innerHTML = html;

		/* Do some interesting stuff here */
		this.myAmazingFunction();
	}

	myAmazingFunction() {
		let placeAPI = new PlaceAPI();
		let body = this.getBody();
		let canvas = body.querySelector("#canvas");

		const preferences = this.userPreferences();

		if (!preferences.appPreferences[app.id]) {
			this.userPreferences.update((v) => {
				v.appPreferences[app.id] = {};

				return v;
			});
		}

		// Check if the process is disposed at the top of every method. This makes sure the process has the least amount of lasting effects.
		if (this._disposed) return;

		console.log(canvas)

		placeAPI.init(canvas, body, this.userPreferences, this.app.id, Debug);

		Debug("Working!");
	}
}

return { proc };