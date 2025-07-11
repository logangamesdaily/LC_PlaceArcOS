const html = await loadHtml("body.html");

class LoginOverlayRuntime extends ThirdPartyAppProcess {
  /** @type {ThirdPartyAppProcess | undefined} */
  parent = undefined;

  constructor(handler, pid, parentPid, app, workingDirectory) {
    super(handler, pid, parentPid, app, workingDirectory);

    this.parent = this.handler.getProcess(parentPid);

    console.log(this.parent);
  }

  async render() {
    const body = this.getBody();
    body.innerHTML = html;

    body.querySelector("#loginButton").addEventListener("click", async () => {
      console.warn(this.parent.place);
      const username = body.querySelector("#username").value;
      const password = body.querySelector("#password").value;
      await this.parent.place.login(username, password);
      this.closeWindow();
    });

    body.querySelector("#closeButton").addEventListener("click", () => {
      this.closeWindow();
    });
  }
}

runApp(LoginOverlayRuntime, $METADATA, argv[0]);