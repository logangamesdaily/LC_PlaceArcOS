# Place for ArcOS!
This is an **official** client for Logan's Place website, which is accessible [here](https://place.uk.to/)

# How to use?
First, you need a Rise account. You can sign up on the website [place.uk.to](https://place.uk.to/), and then you can sign in to the app using your username/email and password.

# Are there any limitations compared to using the web app?
This app is styled to fit within ArcOS rather than on it's own, so there isn't any theme selection like the site, and you can't *currently* register an account through the app. You also *currently* cannot view which user has placed pixels, but there are no ads from me (Kofi ad, Rise ads etc.)

# Is this related to the Place website client?
Well yes, but actually no. This app was a complete rewrite from scratch whilst using the same endpoints and servers as the main site, but **does not share any code**, really. It is also open source, and since I've written the PlaceAPI in a certain way, if you remove the ArcOS specific bits for saving your token to ArcOS, it is completely portable, incase you want to make your *own client*. I'm also planning to completely open source everything else relating to place in the following weeks, and add a custom server selector to ArcOS' official place client. Stay tuned!
This client is available [here](https://github.com/An-Unnamed-Developer/LC_PlaceArcOS/)