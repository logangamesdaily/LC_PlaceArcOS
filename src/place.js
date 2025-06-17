await load("./lib/socket.io.js");
await load("./lib/neodrag.js");
await load
console.log(io);
console.log(NeoDrag);


class PlaceAPI {
    constructor() {
        this.baseURL = 'https://placepixel.online/api/';
        this.socketUrl = 'https://placepixel.online/socket.io/';
        this.socket = null;
        this.canvas = null;
        this.selectedColor = null;
        this.selectX = 0;
        this.selectY = 0;
        this.pixelCanvas = [];
    }
    
    async getPlaceData() {
        try {
            const response = await fetch(`${this.baseURL}/v1/get_pixel.sjs`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
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

    async init(canvas, body) {
        this.canvas = canvas;
        body.querySelectorAll(".color").forEach(color => {
            color.addEventListener('click', (event) => {
                if (!color.className.includes('picker')) {
                    this.selectedColor = color.className.replace('color ', '');
                    console.log(`Selected color: ${this.selectedColor}`);
                }
            })

            if (color.className.includes('picker')) {
                color.addEventListener('input', (event) => {
                    this.selectedColor = event.target.value;
                    console.log(`Selected color: ${this.selectedColor}`);
                });
            }
        })
        canvas.style.scale = 1;
        canvas.style.width = "100%";
        canvas.style.height = "auto";

        const options = {
            bounds: "parent",
        }

        var drag = new NeoDrag.Draggable(canvas)

        canvas.addEventListener('wheel', (event) => {
            event.preventDefault();
            let zoom = parseFloat(canvas.style.width.replace("%","")) || 100;
            console.log(`Current zoom: ${zoom}%`);
            if (event.wheelDelta > 0 && parseFloat(canvas.style.width.replace("%","")) > 20) {
                let newZoomNum = Math.floor(zoom / 1.1);
                console.log(`New zoom: ${newZoomNum}`);
                let newZoom = (newZoomNum) + "%";
                console.log(`New zoom: ${newZoom}`);
                canvas.style.width = newZoom;
            } else if (event.wheelDelta < 0 && parseFloat(canvas.style.width.replace("%","")) < 500) {
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

        this.selectX = Math.floor(clickX);
        this.selectY = Math.floor(clickY);

        console.log(`Clicked at: (${this.selectX}, ${this.selectY})`);

        let ctx = canvas.getContext('2d');

        ctx.strokeStyle = '#ff0000';
        ctx.fillRect = '#ff0000';
        ctx.lineWidth = 0.2;

        ctx.strokeRect(this.selectX, this.selectY, 1, 1);
    }
});

        let test = await this.getPlaceData();

        console.log(test);

        if (!this.socket) {
            await this.connectToSocketIo();
        }

        this.socket.on('connect', () => {
            console.log('Connected to Socket.IO');
        });

        canvas.getContext('2d').fillStyle = 'white';
        canvas.getContext('2d').fillRect(0, 0, canvas.width, canvas.height);

        test.forEach(pixel => {
            const x = pixel.x;
            const y = pixel.y;
            let color = pixel.color;

            if (color.startsWith('c')) {
                color = color.replace("c", "#");
            }

            const ctx = canvas.getContext('2d');
            ctx.fillStyle = `${color}`;
            ctx.fillRect(x, y, 1, 1);
        });

        // this.socket.on
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
            } else {
                console.error('Login failed:', data);
            }
        } catch (error) {
            console.error('Error during login:', error);
        }
    }
}

return { PlaceAPI: PlaceAPI };