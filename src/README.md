# Place for ArcOS!
This is an **official** client for Logan's Place website, which is accessible [here](https://place.uk.to/)

# How to use?
First, you need a Rise account. You can sign up on the website [place.uk.to](https://place.uk.to/), and then you can sign in to the app using your username/email and password.

# Are there any limitations compared to using the web app?
This app is styled to fit within ArcOS rather than on it's own, so there isn't any theme selection like the site, and you can't *currently* register an account through the app. You also *currently* cannot view which user has placed pixels, but there are no ads from me (Kofi ad, Rise ads etc.)
There are also no "ads" on Place or Place 2 at the moment.

# Is this related to the Place website client?
Well yes, but actually no. This app was a complete rewrite from scratch whilst using the same endpoints and servers as the main site, but **does not share any code**, really. It is also open source, and since I've written the PlaceAPI in a certain way, if you remove the ArcOS specific bits for saving your token to ArcOS, it is completely portable, incase you want to make your *own client*. I'm also planning to completely open source everything else relating to place in the following weeks, and add a custom server selector to ArcOS' official place client. Stay tuned!
This client is available [here](https://github.com/An-Unnamed-Developer/LC_PlaceArcOS/)


# Changelog
- 1.1.2
> fix bug regarding this.showNotification causing the app to crash. added site banner compatibility.
- 1.1.1
> add user indicator
- 1.1.0
> add multi canvas
- 1.0.7
> i actually fixed double clicking this time 
- 1.0.6
> fix double clicking again
- 1.0.5
> fix double clicking
- 1.0.4
> Add double clicking (Izaak Kuipers' suggestion)
- 1.0.3
> Change URL from temp one, some clean up
- 1.0.2
> fix logging (Committed by Izaak Kuipers)
- 1.0.1
> Move login and settings over to seperate overlays that run independently (Committed by Izaak Kuipers)
- 1.0.0
> Inital release
