class Map {
  constructor() {
    console.log('Rendering map')
    this.handler = L.map('map', {
      zoomControl: false,
      zoomAnimation: true,
      fadeAnimation: true
    }).setView([5.61598581915534, -27.24609375], 2)

    L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/toner-lite/{z}/{x}/{y}.{ext}', {
      attribution: `
        Map tiles <a href="http://stamen.com">Stamen Design</a>,
        <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>
        &mdash; Map data <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>
        &mdash; Web app <a href="https://github.com/alexcroox/background-geolocation-log-debugger">Alex Crooks</a>
      `,
      subdomains: 'abcd',
      minZoom: 2,
      maxZoom: 20,
      ext: 'png'
    }).addTo(this.handler)

    this.addHandlers()
  }

  addHandlers() {

    this.handler.on('zoomend', e => {

      console.log('Zoom', e.target._zoom)
      console.log('Center', this.handler.getCenter())
    })
  }
}
