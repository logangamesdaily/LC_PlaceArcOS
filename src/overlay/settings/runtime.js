const html = await loadHtml("body.html");

class SettingsOverlayRuntime extends ThirdPartyAppProcess {
  /** @type {ThirdPartyAppProcess | undefined} */
  parent = undefined;

  constructor(handler, pid, parentPid, app, workingDirectory) {
    super(handler, pid, parentPid, app, workingDirectory);

    this.parent = this.handler.getProcess(parentPid);

    // console.log(this.parent.place);
  }

  async render() {
    const body = this.getBody();
    body.innerHTML = html;

    body.querySelector("#closeSettingsButton").addEventListener("click", () => {
      this.closeWindow();
    });

    body.querySelector("#logoutButton").addEventListener("click", () => {
      this.closeWindow();
      this.parent.place.token = null;
      this.parent.userPreferences.update((v) => {
        v.appPreferences[this.parent.app.id].token = null;
        return v; // <- DO NOT FORGET TO RETURN!!!!
      });
    });

    body.querySelector("#canvasSelect").addEventListener("change", () => {
      this.parent.place.canvasID = body.querySelector("#canvasSelect").value;
    });

    this.parent.place.getCanvasList().then((canvasses) => {
      const canvasSelect = body.querySelector("#canvasSelect");
      canvasses.forEach((canvas) => {
        const option = document.createElement("option");
        option.value = canvas.id;
        option.textContent = canvas.name;
        canvasSelect.appendChild(option);
      });

      // Set the current canvas as selected
      canvasSelect.value = this.parent.place.canvasID || canvasses[0].id;
    }).catch((error) => {
      console.error("Failed to load canvasses:", error);
      const canvasSelect = body.querySelector("#canvasSelect");
      const option = document.createElement("option");
      option.textContent = "Error loading canvasses";
      option.disabled = true;
      canvasSelect.appendChild(option);
    });
  }
}

runApp(SettingsOverlayRuntime, $METADATA, argv[0]);