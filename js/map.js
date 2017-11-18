class Map {
  constructor() {
    console.log('Rendering map')
    this.handler = L.map('map').setView([51.505, -0.09], 13)
  }
}
