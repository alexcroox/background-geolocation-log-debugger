let logParser = new ParseLog()
let map = new Map()

// Load local log file automatically so we don't have
// to manually drag it onto the file picker everytime...
if (window.location.search === "?debug") {
  $.ajax({
    method: "GET",
    url: "background-geolocation.log",
    dataType: "text"
  }).done(response => {
    logParser.load(response)
    logParser.run()
      .then(() => { logParser.render() })
  })
}

// Regular local file drop
let filesInput = document.getElementById('file')

filesInput.addEventListener('change', event => {
  console.log('Reading file...')
  $('.file-field').hide()
  $('#parse-progress').show()

  let files = event.target.files
  let file = files[0]
  let reader = new FileReader()

  reader.addEventListener('load', event => {
    let textFile = event.target
    logParser.load(textFile.result)
    logParser.run()
      .then(() => { logParser.render() })
      .catch(() => {
        $('.file-field').show().find('#upload-error').show()
        $('#parse-progress').hide()
      })
  })

  reader.readAsText(file)
})

// Make sidebar draggable, persist chosen width
let savedMapWidth = localStorage.getItem('mapWidth')

if (savedMapWidth)
  $('#map').width(`${savedMapWidth}px`)

$('#map').resizable({
  handleSelector: '#column-resize',
  resizeHeight: false,
  onDragEnd: () => {
    localStorage.setItem('mapWidth', $('#map').width())
    map.handler.invalidateSize()
  }
})

$('.modal').modal()
