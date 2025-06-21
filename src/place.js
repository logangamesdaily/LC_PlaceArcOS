await load("./lib/socket.io.js");
await load("./lib/neodrag.js");
await load
console.log(io);
console.log(NeoDrag);


class PlaceAPI {
    constructor() {
        this.baseURL = 'https://placepixel.online/api/';
        this.socketUrl = 'https://placepixel.online/';
        this.socket = null;
        this.canvas = null;
        this.selectedColor = null;
        this.selectX = 0;
        this.selectY = 0;
        this.pixelCanvas = [];
        this.appPreferences = null;
        this.userPreferences = null; // This should be set to the user preferences object from the app
        this.token = null;
    }

    #selectedColor = null;

    async getPlaceData() {
        try {
            const response = await fetch(`${this.baseURL}/v1/get_pixel.sjs`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            this.pixelCanvas = data;
            return data;
        }
        catch (error) {
            console.error('Error fetching place data:', error);
        }
    }

    async connectToSocketIo() {
        try {
            this.socket = io(this.socketUrl);
        } catch (error) {
            console.error('Error connecting to Socket.IO:', error);
        }
    }

    async init(canvas, body, userPreferences, appID, debug) {
        this.appID = appID;
        this.Debug = debug;
        this.userPreferences = userPreferences;
        this.canvas = canvas;



        canvas.getContext('2d').fillStyle = 'white';
        canvas.getContext('2d').fillRect(0, 0, canvas.width, canvas.height);

        body.querySelector("#authButton").addEventListener('click', () => {
            this.Debug("no settings");
        });

        body.querySelector("#placePixelButton").addEventListener('click', () => {
            this.placePixel();
        });

        this.token = this.userPreferences().appPreferences[this.appID].token || null;
        body.querySelectorAll(".color").forEach(color => {
            color.addEventListener('click', (event) => {
                if (!color.className.includes('picker')) {
                    this.#selectedColor = color.className.replace('color ', '');
                    console.log(`Selected color: ${this.#selectedColor}`);
                }
            })

            if (color.className.includes('picker')) {
                color.addEventListener('input', (event) => {
                    this.#selectedColor = event.target.value;
                    console.log(`Selected color: ${this.#selectedColor}`);
                });
            }
        })
        canvas.style.scale = 1;
        body.querySelector("#canvasContainer").style.width = "100%";
        body.querySelector("#canvasContainer").style.height = "auto";

        const options = {
            bounds: "parent",
        }

        var drag = new NeoDrag.Draggable(body.querySelector("#canvasContainer"));

        canvas.addEventListener('wheel', (event) => {
            event.preventDefault();
            let canvas = body.querySelector("#canvasContainer");
            let zoom = parseFloat(canvas.style.width.replace("%", "")) || 100;
            console.log(`Current zoom: ${zoom}%`);
            if (event.wheelDelta < 0 && parseFloat(canvas.style.width.replace("%", "")) > 20) {
                let newZoomNum = Math.floor(zoom / 1.1);
                console.log(`New zoom: ${newZoomNum}`);
                let newZoom = (newZoomNum) + "%";
                console.log(`New zoom: ${newZoom}`);
                canvas.style.width = newZoom;
            } else if (event.wheelDelta > 0 && parseFloat(canvas.style.width.replace("%", "")) < 500) {
                let newZoomNum = Math.floor(zoom * 1.1);
                console.log(`New zoom: ${newZoomNum}`);
                let newZoom = (newZoomNum) + "%";
                console.log(`New zoom: ${newZoom}`);
                canvas.style.width = newZoom;
            }
            console.log(`New zoom: ${canvas.style.width}`);
        })

        canvas.addEventListener('mousedown', (event) => {
            if (event.button === 0) { // Left mouse button
                const rect = canvas.getBoundingClientRect(); // Actual rendered dimensions

                const scaleX = canvas.width / rect.width;
                const scaleY = canvas.height / rect.height;

                const clickX = (event.clientX - rect.left) * scaleX;
                const clickY = (event.clientY - rect.top) * scaleY;

                // select last pixel from the last selectX and selectY and draw the pixel again
                if (this.selectX && this.selectY) {
                    const ctx = canvas.getContext('2d');
                    let drewPixel = false;
                    // Check if the pixel exists in the pixelCanvas
                    this.pixelCanvas.forEach(pixel => {
                        if (pixel.x === this.selectX && pixel.y === this.selectY) {
                            let color = pixel.color;
                            if (color.startsWith('c')) {
                                color = color.replace("c", "#");
                            }
                            ctx.fillStyle = `${color}`;
                            ctx.fillRect(this.selectX * 10, this.selectY * 10, 10, 10); // Draw the pixel again
                            console.log(`Redrawing pixel at: (${this.selectX}, ${this.selectY}) with color: ${color}`);
                            drewPixel = true;
                        }
                    })
                    if (!drewPixel) {
                        ctx.fillStyle = `#FFFFFF`;
                        ctx.fillRect(this.selectX * 10, this.selectY * 10, 10, 10); // Draw the pixel again
                    }
                }

                this.selectX = Math.floor(clickX / 10);
                this.selectY = Math.floor(clickY / 10);

                console.log(`Clicked at: (${this.selectX}, ${this.selectY})`);

                let ctx = canvas.getContext('2d');

                ctx.strokeStyle = '#ff0000';
                ctx.fillRect = '#ff0000';
                ctx.lineWidth = 0.2;

                ctx.strokeRect(this.selectX, this.selectY, 1, 1);

                let test = this.getPlaceData();

                console.log(test);


                this.connectToSocketIo();


                this.socket.on('connect', () => {
                    console.log('Connected to Socket.IO');
                });

                this.socket.on('disconnect', () => {
                    console.log('Disconnected from Socket.IO');
                    this.connectToSocketIo();
                });

                this.socket.on('placePixel', (data) => {
                    console.log('Received placePixel event:', data);
                    let { x, y, color } = data;
                    let ctx = canvas.getContext('2d');
                    if (color.startsWith('c')) {
                        color = color.replace("c", "#");
                    }
                    ctx.fillStyle = `${color}`;
                    ctx.fillRect(x * 10, y * 10, 10, 10);

                    this.pixelCanvas.push(data);
                    console.log(`Placed pixel at: (${x}, ${y}) with color: ${color}`);
                });

                console.log(canvas);

                test.forEach(pixel => {
                    const x = pixel.x;
                    const y = pixel.y;
                    let color = pixel.color;

                    if (color.startsWith('c')) {
                        color = color.replace("c", "#");
                    }

                    const ctx = canvas.getContext('2d');
                    ctx.fillStyle = `${color}`;
                    ctx.fillRect(x * 10, y * 10, 10, 10);
                });

                this.login("ArcOS", "ArcOS test account")
                this.Debug("We are logging you in under the ArcOS test account. This will NOT make it to prod.")
            }
        })
    }

    async login(username, password) {
        try {
            const response = await fetch(`${this.baseURL}/v2/login.sjs?username=${username}&password=${password}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            if (data.token) {
                console.log('Login successful');
                this.userPreferences.update((v) => {
                    this.userPreferences().appPreferences[this.appID].token = data.token;

                    return v; // <- DO NOT FORGET TO RETURN!!!!
                })

            } else {
                console.error('Login failed:', data);
            }
        } catch (error) {
            console.error('Error during login:', error);
        }
    }

    async placePixel() {
        console.log(this.#selectedColor)
        if (this.#selectedColor == null) {
            console.error('No color selected');
            return;
        }
        if (!this.selectX || !this.selectY) {
            console.error('No pixel selected');
            return;
        }

        const data = {
            x: this.selectX,
            y: this.selectY,
            color: this.#selectedColor,
            token: this.token
        };

        try {
            this.socket.emit('placePixel', data);
            console.log(`Placing pixel at (${this.selectX}, ${this.selectY}) with color ${this.#selectedColor}`);
        } catch (error) {
            console.error('Error placing pixel:', error);
        }
    }
}

return { PlaceAPI: PlaceAPI };