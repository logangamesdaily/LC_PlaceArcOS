const html = await loadHtml("body.html");

class SettingsOverlayRuntime extends ThirdPartyAppProcess {
  /** @type {ThirdPartyAppProcess | undefined} */
  parent = undefined;

  constructor(handler, pid, parentPid, app, workingDirectory) {
    super(handler, pid, parentPid, app, workingDirectory);

    this.parent = this.handler.getProcess(parentPid);

    console.log(this.parent.place);
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
  }
}

runApp(SettingsOverlayRuntime, $METADATA, argv[0]);