await load("./lib/socket.io.js");
await load("./lib/neodrag.js");

class PlaceAPI {
  constructor(pid, process) {
    this.baseURL = "https://place.uk.to/api/";
    this.socketUrl = "https://place.uk.to/";
    this.socket = null;
    this.canvas = null;
    this.selectedColor = null;
    this.selectX = 0;
    this.selectY = 0;
    this.pixelCanvas = [];
    this.appPreferences = null;
    this.userPreferences = null; // This should be set to the user preferences object from the app
    this.token = null;
    this.body = null;
    this.pid = pid;
    this.canvasID = "ArcOS";
    this.appCanvas;
    this.process = process;

    this.parent = handler.getProcess(pid);
    this.Log = this.parent.Log.bind(this.parent);
    this.clickOnce = false;
  }

  #selectedColor = null;

  async getPlaceData() {
    try {
      const response = await fetch(
        `${this.baseURL}/v1/get_pixel.sjs?canvas=${this.canvasID}`
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      this.pixelCanvas = data;
      return data;
    } catch (error) {
      console.error("Error fetching place data:", error);
      return [];
    }
  }

  async connectToSocketIo() {
    try {
      this.socket = io(this.socketUrl);
    } catch (error) {
      console.error("Error connecting to Socket.IO:", error);
    }
  }

  async init(canvas, body, userPreferences, appID, debug, disconnectedDiv) {
    this.appID = appID;
    this.Debug = debug;
    this.userPreferences = userPreferences;
    this.canvas = canvas;
    this.body = body;
    this.appCanvas = this.applyCanvas;
    let statusDiv = body.querySelector(".status");
    let currentStatusID = 0;

    let http = new XMLHttpRequest();
    http.open("GET", `${this.baseURL}/v3/status/`, true);
    http.onload = () => {
      if (http.status >= 200 && http.status < 300) {
        const statusInfo = JSON.parse(http.responseText);
        statusDiv.className = "status";
        let currentStatus = statusInfo[0] || {
          text: "Something went wrong whilst displaying statuses",
          severity: 2,
        };
        statusDiv.innerHTML = `<div>${currentStatus["text"] || ""}</div>`;
        if (currentStatus["severity"] === -1) {
          statusDiv.classList.add("green");
        } else if (currentStatus["severity"] === 1) {
          statusDiv.classList.add("yellow");
        } else if (currentStatus["severity"] === 2) {
          statusDiv.classList.add("red");
        }
        currentStatusID++;
        if (currentStatusID >= statusInfo.length - 1) currentStatusID = 0;
        setInterval(() => {
          statusDiv.className = "status";
          let currentStatus = statusInfo[currentStatusID] || {
            text: "Something went wrong whilst displaying statuses",
            severity: 2,
          };
          statusDiv.innerHTML = `<div>${currentStatus["text"] || ""}</div>`;
          if (currentStatus["severity"] === -1) {
            statusDiv.classList.add("green");
          } else if (currentStatus["severity"] === 1) {
            statusDiv.classList.add("yellow");
          } else if (currentStatus["severity"] === 2) {
            statusDiv.classList.add("red");
          }
          currentStatusID++;
          if (currentStatusID >= statusInfo.length - 1) currentStatusID = 0;
        }, 10000);
      }
    };
    http.send();

    body.querySelector("#authButton").addEventListener("click", () => {
      if (this.token && this.token !== "null") {
        this.settingsOverlay();
      } else {
        this.loginOverlay();
      }
    });

    body.querySelector("#placePixelButton").addEventListener("click", () => {
      this.placePixel();
    });

    this.token =
      this.userPreferences().appPreferences[this.appID].token || null;

    if (this.token)
      this.Log(this.token ? "Logged in!" : "No token found, please log in.");

    body.querySelectorAll(".color").forEach((color) => {
      color.addEventListener("click", () => {
        if (!color.className.includes("picker")) {
          this.#selectedColor = color.className.replace("color ", "");
        }
      });

      if (color.className.includes("picker")) {
        color.addEventListener("input", (event) => {
          this.#selectedColor = event.target.value;
        });
      }
    });
    canvas.style.scale = 1;
    canvas.style.width = "100%";
    canvas.style.height = "auto";

    new NeoDrag.Draggable(canvas);

    canvas.addEventListener("wheel", (event) => {
      event.preventDefault();

      const currentZoom =
        parseFloat(canvas.style.width.replace("%", "")) || 100;
      const rect = canvas.getBoundingClientRect();

      // Get cursor position relative to the canvas
      const canvasCursorX = event.clientX - rect.left;
      const canvasCursorY = event.clientY - rect.top;

      let newZoom = currentZoom;

      if (event.wheelDelta < 0 && currentZoom > 20) {
        // Zoom out
        newZoom = Math.floor(currentZoom / 1.1);
      } else if (event.wheelDelta > 0 && currentZoom < 1000) {
        // Zoom in
        newZoom = Math.floor(currentZoom * 1.1);
      }

      if (newZoom !== currentZoom) {
        // Get current transform values from NeoDrag
        const currentTransform = canvas.style.transform || "";
        const translateMatch = currentTransform.match(
          /translate\(([^,]+),\s*([^)]+)\)/
        );

        let currentTranslateX = 0;
        let currentTranslateY = 0;

        if (translateMatch) {
          currentTranslateX = parseFloat(translateMatch[1]) || 0;
          currentTranslateY = parseFloat(translateMatch[2]) || 0;
        }

        // Calculate the size change ratio
        const zoomRatio = newZoom / currentZoom;

        // Calculate new translate values to keep the cursor point fixed
        const newTranslateX =
          currentTranslateX + canvasCursorX - canvasCursorX * zoomRatio;
        const newTranslateY =
          currentTranslateY + canvasCursorY - canvasCursorY * zoomRatio;

        // Apply the new zoom and position
        canvas.style.width = newZoom + "%";
        canvas.style.transform = `translate(${newTranslateX}px, ${newTranslateY}px)`;
      }
    });

    canvas.addEventListener("mousedown", (event) => {
      if (event.button === 0) {
        // Left mouse button
        const rect = canvas.getBoundingClientRect(); // Actual rendered dimensions

        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        const clickX = (event.clientX - rect.left) * scaleX;
        const clickY = (event.clientY - rect.top) * scaleY;

        if (
          this.clickOnce == true &&
          this.selectX == Math.floor(clickX / 10) &&
          this.selectY == Math.floor(clickY / 10)
        ) {
          this.selectX = Math.floor(clickX / 10);
          this.selectY = Math.floor(clickY / 10);
          this.clickOnce = false;

          this.placePixel();
        } else {
          this.clickOnce = true;
          setTimeout(() => {
            this.clickOnce = false;
          }, 250);
        }
        let ctx = canvas.getContext("2d");
        ctx.fillStyle = "white"; // Clear the pixel
        ctx.fillRect(
          (this.selectX - 10) * 10,
          (this.selectY - 10) * 10,
          200,
          200
        );

        // select last pixel from the last selectX and selectY and draw the pixel again
        this.pixelCanvas.forEach((pixel) => {
          const ctx = canvas.getContext("2d");
          const x = pixel.x;
          const y = pixel.y;
          if (
            !(x < this.selectX + 15 && x > this.selectX - 15) ||
            !(y < this.selectY + 15 && y > this.selectY - 15)
          )
            return; // Skip if not the selected pixel
          if (x == this.selectX && y == this.selectY) {
            ctx.fillStyle = "white"; // Clear the pixel
            ctx.fillRect(x * 10, y * 10, 10, 10);
          }
          let color = pixel.color;

          if (color.startsWith("c")) {
            color = color.replace("c", "#");
          }

          ctx.fillStyle = `${color}`;
          ctx.fillRect(x * 10, y * 10, 10, 10);
        });

        this.selectX = Math.floor(clickX / 10);
        this.selectY = Math.floor(clickY / 10);

        ctx.strokeStyle = "#ff0000";
        ctx.lineWidth = 1; // 1 pixel outline
        ctx.strokeRect(this.selectX * 10 + 1, this.selectY * 10 + 1, 8, 8); // Draw outline
        // how do u center this?
        let usernameOverlayX = this.selectX * 10; // Center the username overlay

        let usernameOverlayY = this.selectY * 10 - 40; // Center the username overlay#
        let pixel = this.pixelCanvas.find(
          (pixel) => pixel.x === this.selectX && pixel.y === this.selectY
        );
        if (pixel == null || pixel == undefined) {
          console.error("No pixel found at the selected coordinates");
          return;
        }
        this.getUserFromUserID(pixel["userid"])
          .then((username) => {
            if (username) {
              ctx.font = "12px Arial"; // Font size and family
              console.log("Username:", username);
              let textLength =
                ctx.measureText("Placed by: u/" + username).width + 10; // Calculate text length with padding
              ctx.fillStyle = "rgba(0, 0, 0, 0.5)"; // Semi-transparent background
              ctx.fillRect(
                usernameOverlayX - Math.floor(textLength / 2) + 5,
                usernameOverlayY,
                textLength,
                20
              ); //
              ctx.fillStyle = "white"; // Text color
              ctx.fillText(
                `Placed by u/${username}`,
                usernameOverlayX - Math.floor(textLength / 2) + 10,
                usernameOverlayY + 15
              ); // Draw "Unknown User"
            } else {
              let username = "Unknown User";
              ctx.font = "12px Arial"; // Font size and family
              console.log("Username:", username);
              let textLength = ctx.measureText(username).width + 10; // Calculate text length with padding
              ctx.fillStyle = "rgba(0, 0, 0, 0.5)"; // Semi-transparent background
              ctx.fillRect(
                usernameOverlayX - Math.floor(textLength / 2) + 5,
                usernameOverlayY,
                textLength,
                20
              ); //
              ctx.fillStyle = "white"; // Text color
              ctx.fillText(
                `${username}`,
                usernameOverlayX - Math.floor(textLength / 2) + 10,
                usernameOverlayY + 15
              ); // Draw "Unknown User"
            }
          })
          .catch((error) => {
            console.error("Error fetching username:", error);
            this.showNotification(
              "error",
              "Error fetching username: " + error.message
            );
            let username = "Pre-Auth pixel";
            ctx.font = "12px Arial"; // Font size and family
            console.log("Username:", username);
            let textLength = ctx.measureText(username).width + 10; // Calculate text length with padding
            ctx.fillStyle = "rgba(0, 0, 0, 0.5)"; // Semi-transparent background
            ctx.fillRect(
              usernameOverlayX - Math.floor(textLength / 2) + 5,
              usernameOverlayY,
              textLength,
              20
            ); //
            ctx.fillStyle = "white"; // Text color
            ctx.fillText(
              `${username}`,
              usernameOverlayX - Math.floor(textLength / 2) + 10,
              usernameOverlayY + 15
            ); // Draw "Unknown User"
          });
      }
    });

    let test = await this.getPlaceData();

    await this.connectToSocketIo();

    this.socket.on("connect", () => {
      this.Log("Connected to Socket.IO");

      disconnectedDiv.classList.add("hidden");

      this.resetCanvas();
    });

    this.socket.on("disconnect", () => {
      this.Log("Socket.IO disconnected!");

      this.connectToSocketIo();
      disconnectedDiv.classList.remove("hidden");
    });

    this.socket.on("placePixel", (data) => {
      let { x, y, color } = data;

      let canvasID = data.canvas;
      if (canvasID !== this.canvasID) {
        // console.warn(`Received pixel for canvas ${canvasID}, but current canvas is ${this.canvasID}. Ignoring.`);
        return;
      }
      let ctx = canvas.getContext("2d");
      if (color.startsWith("c")) {
        color = color.replace("c", "#");
      }
      ctx.fillStyle = `${color}`;
      ctx.fillRect(x * 10, y * 10, 10, 10);

      this.pixelCanvas.push(data);
    });

    canvas.getContext("2d").fillStyle = "white";
    canvas.getContext("2d").fillRect(0, 0, canvas.width, canvas.height);

    test.forEach((pixel) => {
      const x = pixel.x;
      const y = pixel.y;
      let color = pixel.color;

      if (color.startsWith("c")) {
        color = color.replace("c", "#");
      }

      const ctx = canvas.getContext("2d");
      ctx.fillStyle = `${color}`;
      ctx.fillRect(x * 10, y * 10, 10, 10);
    });

    this.resetCanvas();
  }

  async login(username, password) {
    try {
      const response = await fetch(
        `${this.baseURL}/v2/login.sjs?username=${username}&password=${password}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.token) {
        this.userPreferences.update((v) => {
          v.appPreferences[this.appID].token = data.token;

          return v; // <- DO NOT FORGET TO RETURN!!!!
        });
        this.token = data.token;
      } else {
        await MessageBox(
          {
            title: "Login failed!",
            message: `Your username or password might be incorrect.<br><br><b>Details</b>: ${
              data.message || "Unknown error"
            }`,
            image: icons.ErrorIcon,
            buttons: [
              {
                caption: "Okay",
                action: () => {
                  this.loginOverlay();
                },
                suggested: true,
              },
            ],
          },
          this.pid,
          true
        );
        console.error("Login failed:", data);
      }
    } catch (error) {
      await MessageBox(
        {
          title: "Login failed!",
          message: `Your username or password might be incorrect.<br><br><b>Details</b>: ${
            error || "Unknown error"
          }`,
          image: icons.ErrorIcon,
          buttons: [
            {
              caption: "Okay",
              action: () => {
                this.loginOverlay();
              },
              suggested: true,
            },
          ],
        },
        this.pid,
        true
      );
      console.error("Error during login:", error);
    }
  }

  async showNotification(type, message) {
    // let n = new Notification({
    //   title: type === "error" ? "Error" : "Info",
    //   message: message,
    //   timeout: 5000,
    // });
    //
    // this.process.userDaemon.sendNotification(n);
    // Attempted to send a system notification, but it doesn't work and isn't at all necessary.
  }

  async getUserFromUserID(userID) {
    let username;
    let http = new XMLHttpRequest();
    http.open(
      "GET",
      `https://place.uk.to/api/v2/getuserinfo.sjs?id=${userID}`,
      true
    );
    return new Promise((resolve, reject) => {
      http.onload = () => {
        if (http.status >= 200 && http.status < 300) {
          const data = JSON.parse(http.responseText);
          username = data.user || "Unknown User";
          resolve(username);
        } else {
          console.error("Failed to fetch user info:", http.statusText);
          reject(new Error("Failed to fetch user info"));
        }
      };
      http.onerror = () => reject(new Error("Network error"));
      http.send();
    });
  }

  async placePixel() {
    if (this.#selectedColor == null) {
      console.error("No color selected");
      return;
    }
    if (
      (!this.selectX || !this.selectY) &&
      this.selectX != 0 &&
      this.selectY != 0
    ) {
      console.error("No pixel selected");
      return;
    }

    const data = {
      x: this.selectX,
      y: this.selectY,
      color: this.#selectedColor,
      token: this.token,
      canvas: this.canvasID,
    };

    try {
      this.socket.emit("placePixel", data);
    } catch (error) {
      console.error("Error placing pixel:", error);
    }
  }

  async loginOverlay() {
    const path = util.join(workingDirectory, "overlay/login/login.tpa");

    const text = convert.arrayToText(await fs.readFile(path));
    const json = JSON.parse(text);

    if (typeof json !== "object") return;

    await daemon.spawnThirdParty(json, path, this.pid);
  }

  async settingsOverlay() {
    const path = util.join(workingDirectory, "overlay/settings/settings.tpa");

    const text = convert.arrayToText(await fs.readFile(path));
    const json = JSON.parse(text);

    if (typeof json !== "object") return;

    await daemon.spawnThirdParty(json, path, this.pid);
  }

  async resetCanvas() {
    let canvas = this.canvas;

    let http = new XMLHttpRequest();

    http.open(
      "GET",
      `${this.baseURL}/v3/getCanvasInfo?canvas=${this.canvasID}`,
      true
    );

    http.onload = async () => {
      if (http.status >= 200 && http.status < 300) {
        const canvasInfo1 = JSON.parse(http.responseText);
        console.log(canvasInfo1);
        if (!canvasInfo1 || canvasInfo1.length === 0) {
          console.error(
            "No canvas info found for the given ID:",
            this.canvasID
          );
          return;
        }
        const canvasInfo = canvasInfo1[0];
        canvas.width = Number.parseInt(canvasInfo["width"]) * 10; // Assuming each pixel is 10x10
        canvas.height = Number.parseInt(canvasInfo["height"]) * 10; // Assuming each pixel is 10x10

        let test = await this.getPlaceData();
        this.pixelCanvas = test;
        canvas.getContext("2d").fillStyle = "white";
        canvas.getContext("2d").fillRect(0, 0, canvas.width, canvas.height);

        test.forEach((pixel) => {
          const x = pixel.x;
          const y = pixel.y;
          let color = pixel.color;

          if (color.startsWith("c")) {
            color = color.replace("c", "#");
          }

          const ctx = canvas.getContext("2d");
          ctx.fillStyle = `${color}`;
          ctx.fillRect(x * 10, y * 10, 10, 10);
        });
      } else {
        console.error("Failed to fetch canvas info:", http.statusText);
        return;
      }
    };

    http.send();
  }

  // how do i expose this function to other files?
  async getCanvasList() {
    let http = new XMLHttpRequest();
    http.open("GET", `${this.baseURL}/v3/getPublicCanvasList`, true);

    http.onload = () => {
      if (http.status >= 200 && http.status < 300) {
        let canvases = JSON.parse(http.responseText)[0];
        let arcOSCanvas = this.getCanvasDetails("arcos");
        canvases.append(arcOSCanvas);
        return canvases;
      } else {
        console.error("Failed to fetch canvas list:", http.statusText);
        return [];
      }
    };
  }

  async applyCanvas(canvasID) {
    let http = new XMLHttpRequest();
    this.canvasID = canvasID;
    let canvas = this.canvas;

    http.open(
      "GET",
      `${this.baseURL}/v3/getCanvasInfo?canvas=${this.canvasID}`,
      true
    );

    http.onload = async () => {
      if (http.status >= 200 && http.status < 300) {
        const canvasInfo1 = JSON.parse(http.responseText);
        console.log(canvasInfo1);
        if (!canvasInfo1 || canvasInfo1.length === 0) {
          console.error(
            "No canvas info found for the given ID:",
            this.canvasID
          );
          return;
        }
        const canvasInfo = canvasInfo1[0];
        canvas.width = Number.parseInt(canvasInfo["width"]) * 10; // Assuming each pixel is 10x10
        canvas.height = Number.parseInt(canvasInfo["height"]) * 10; // Assuming each pixel is 10x10

        let test = await this.getPlaceData();
        this.pixelCanvas = test;
        canvas.getContext("2d").fillStyle = "white";
        canvas.getContext("2d").fillRect(0, 0, canvas.width, canvas.height);

        test.forEach((pixel) => {
          const x = pixel.x;
          const y = pixel.y;
          let color = pixel.color;

          if (color.startsWith("c")) {
            color = color.replace("c", "#");
          }

          const ctx = canvas.getContext("2d");
          ctx.fillStyle = `${color}`;
          ctx.fillRect(x * 10, y * 10, 10, 10);
        });
      } else {
        console.error("Failed to fetch canvas info:", http.statusText);
        return;
      }
    };

    http.send();
  }

  async getCanvasDetails(canvasID) {
    let http = new XMLHttpRequest();
    http.open(
      "GET",
      `${this.baseURL}/v3/getCanvasInfo?canvas=${canvasID}`,
      true
    );

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

return { PlaceAPI: PlaceAPI };
