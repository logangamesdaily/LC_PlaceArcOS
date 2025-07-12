const html = await loadHtml("body.html");

class SettingsOverlayRuntime extends ThirdPartyAppProcess {
  /** @type {ThirdPartyAppProcess | undefined} */
  parent = undefined;

  constructor(handler, pid, parentPid, app, workingDirectory) {
    super(handler, pid, parentPid, app, workingDirectory);

    this.parent = this.handler.getProcess(parentPid);

    this.baseURL;

    // console.log(this.parent.place);
  }

  async render() {
    const body = this.getBody();
    this.baseURL = this.parent.place.baseURL;
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
      this.parent.place.appCanvas(body.querySelector("#canvasSelect").value);
    });

    console.log(this.parent.place);

    this.getCanvasList().then((canvasList) => {
      // this just never runs wtf
      console.log("Canvas List:", canvasList);
      // why does this not work?
      const canvasSelect = body.querySelector("#canvasSelect");
      // returned canvases are like [{ "canvasString": "arcos", "canvasID": 1 }, ...]
      if (!canvasList || canvasList.length === 0) {
        console.error("No canvasses found or failed to load canvasses.");
        const canvasSelect = body.querySelector("#canvasSelect");
        const option = document.createElement("option");
        option.textContent = "No canvasses available";
        option.disabled = true;
        canvasSelect.appendChild(option);
      } else {
        canvasList.forEach((canvas) => {
          const option = document.createElement("option");
          option.value = canvas["canvasString"];
          option.textContent = canvas["canvasString"];
          canvasSelect.appendChild(option);
        })
        canvasSelect.value = this.parent.place.canvasID || "arcos"; // Set default to arcos if not set
      }
    });
  }

  
  async getCanvasList() {
  let http = new XMLHttpRequest();
  http.open("GET", `${this.baseURL}/v3/getPublicCanvasList`, false);



  return new Promise((resolve, reject) => {
    http.onload = () => {
      if (http.status >= 200 && http.status < 300) {
        let canvases = JSON.parse(http.responseText);
        let arcOSCanvas = this.getCanvasDetails("arcos").then((canvasDetails) => {
          canvases = [...canvases, canvasDetails];
          console.log("Fetched canvases:", canvases);
          resolve(canvases);
        });
      } else {
        console.error("Failed to fetch canvas list:", http.statusText);
        reject([]);
      }
    }
    http.send();
  })
}

  async getCanvasDetails(canvasID) {
  let http = new XMLHttpRequest();
  http.open("GET", `${this.baseURL}/v3/getCanvasInfo?canvas=${canvasID}`, true);

  return new Promise((resolve, reject) => {
    http.onload = () => {
      if (http.status >= 200 && http.status < 300) {
        const canvasInfo = JSON.parse(http.responseText)[0];
        resolve(canvasInfo);
      } else {
        console.error("Failed to fetch canvas details:", http.statusText);
        reject(new Error("Failed to fetch canvas details"));
      }
    };
    http.onerror = () => reject(new Error("Network error"));
    http.send();
  });
}
}

runApp(SettingsOverlayRuntime, $METADATA, argv[0]);