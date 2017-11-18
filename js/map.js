class Map {

  constructor() {

    // Render the world map and zoom out to show all continents
    this.handler = L.map('map', {
      zoomControl: false,
      zoomAnimation: true,
      fadeAnimation: true
    }).setView([5.61598581915534, -27.24609375], 2)

    // Add custom map tiles
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

    this.locationLayer = new L.FeatureGroup().addTo(this.handler)
    this.addHandlers()
  }

  addHandlers() {

    // Development debug only
    this.handler.on('zoomend', e => {
      console.log('Zoom', e.target._zoom)
      console.log('Center', this.handler.getCenter())
    })
  }

  clearAllLocations() {
    console.log('Clearing map')
    this.locationLayer.clearLayers()
  }

  addLocation(location, time, modalTitle, modalBody) {

    let marker = L.circle(location.position, {
      radius: location.accuracy,
      fill: false,
      weight: 3
    }).bindTooltip(time, {
      interactive: false,
      permanent: false,
      className: 'map-tooltip',
      direction: 'right'
    })

    marker.on('click', e => {
      console.log('Location clicked', e)

      //$('#location-overview .modal-title').text(modalTitle)
      //$('#location-overview .modal-body').html(modalBody)
      //$('#location-overview').modal('open')
    })

    this.locationLayer.addLayer(marker)
  }

  fitToBounds() {
    let bounds = this.locationLayer.getBounds()
    this.handler.fitBounds(bounds)
  }
}
