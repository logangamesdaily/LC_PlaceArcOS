await load("./lib/socket.io.js");
await load("./lib/neodrag.js");
console.log(io);
console.log(NeoDrag);


class PlaceAPI {
    constructor() {
        this.baseURL = 'https://placepixel.online/api/';
        this.socketUrl = 'https://placepixel.online/socket.io/';
        this.socket = null;
        this.canvas = null;
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

    async initialPixelGrab() {
        let http = new XMLHttpRequest();
        http.open("GET", `${this.baseURL}v1/get_pixel.sjs`, true);

        http.onload = () => {
            if (http.status >= 200 && http.status < 300) {
                const data = JSON.parse(http.responseText);
                console.log('Initial pixel data:', data);
                return data; 
            } else {
                console.error('Failed to fetch initial pixel data:', http.statusText);
                return null;
            }
        };

        http.send();
    }

    async init(canvas) {
        this.canvas = canvas;
        if (!this.socket) {
            await this.connectToSocketIo();
        }

        this.socket.on('connect', () => {
            console.log('Connected to Socket.IO');
        });

        // this.socket.on
    }
}

return { PlaceAPI: PlaceAPI };