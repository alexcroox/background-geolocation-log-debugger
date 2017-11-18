class ParseLog {

  constructor(dataString) {
    this.data = {}
    this.selectedDateData = []
    this.clusterize = null
    this.keyUpTimer = null
    // Is the current line a new date/time entry?
    // Match example: 11-15 13:48:10
    this.findDate = /^\d\d-\d\d\s\d\d:\d\d:\d\d/
    // Find event e.g "TSLocationManager onSingleLocationResult"
    this.findBetweenSquareBrackets = /[^[]+(?=])/

    this.addHandlers()
  }

  addHandlers() {
    // View events for a different day
    $('body').on('change', '#choose-date', e => {
      setTimeout(() => {

        this.renderDataList([], true)
        this.populateServiceFilters()
      }, 500)
    })

    // Change event filters
    $('body').on('change', '#filter', e => {
      setTimeout(() => {
        this.filterEvents()
      }, 500)
    })

    $('body').on('keyup', '#search', e => {

      clearTimeout(this.keyUpTimer)

      this.keyUpTimer = setTimeout(() => {
        this.search($(e.target).val())
      }, 500)
    })

    // Expand all checkbox
    $('body').on('change', '#expand-all', e => {
      this.expandAll()
    })

    // Expand event in sidebar
    $('body').on('click', '#data-list .collection-item', e => {
      e.preventDefault()

      $(e.target).find('.collection-item-expand').toggleClass('collection-item-expand-show')
    })

    $('body').on('click', '#load-new', e => {
      e.preventDefault()

      map.clearAllLocations()
      this.data = {}
      this.selectedDateData = []
      $('.file-field').show().find('#upload-error').hide()
      $('#parse-progress').hide()
      $('#setup').show()
      $('#data').hide()
    })
  }

  load(dataString) {
    this.rawData = dataString
  }

  run() {
    return new Promise((resolve, reject) => {
      let lines = this.rawData.split('\n')
      let loopingDate = null
      let lastDateKey = null
      let loopingThroughDateLines = false

      // Check first line for valid log data
      if (!this.findDate.test(lines[0])) {
        return reject()
      }

      _.each(lines, line => {
        //line = line.trim()

        if (this.findDate.test(line)) {
          let thisDate = line.substr(0, 5)
          let month = line.substr(0, 2)
          let day = line.substr(3, 2)
          let time = line.substr(6, 8)
          let accurateTime = line.substr(15, 3)
          let year = (new Date()).getFullYear()
          lastDateKey = thisDate

          if (thisDate != loopingDate) {
            this.data[lastDateKey] = []
            loopingDate = thisDate
          }

          let stringAsArray = line.split(" ")
          let logType = stringAsArray[2]
          let foundEvent = line.match(this.findBetweenSquareBrackets)
          let eventCombined = (foundEvent.length) ? foundEvent[0] : 'unknown unknown'
          let eventCombinedAsArray = eventCombined.split(" ")

          //console.log('Time', `${year}-${month}-${day} ${time}`)

          this.data[lastDateKey].push({
            dateTime: new Date(`${year}-${month}-${day} ${time}`),
            time,
            accurateTime,
            logType,
            eventCombined,
            event: {
              service: _.escape(eventCombinedAsArray[0]),
              method: _.escape(eventCombinedAsArray[1])
            },
            isSettings: line.indexOf('Settings print'),
            raw: line,
            data: []
          })

        } else {
          // Check for location e.g ╟─ Location[fused 50.791404,-1.094596 acc=18 et=+28m48s885ms alt=54.29999923706055], age: 99ms
          if(line.indexOf('Location[fused') > 1) {
            let findLocationData = line.match(this.findBetweenSquareBrackets)

            if(findLocationData.length) {
              let locationData = findLocationData[0].split(" ")
              let positionArray = locationData[1].split(",")

              this.data[lastDateKey][this.data[lastDateKey].length - 1].location = {
                position: [positionArray[0], positionArray[1]],
                accuracy: locationData[2].substr(4, 2)
              }
            }
          }

          this.data[lastDateKey][this.data[lastDateKey].length - 1].data.push(line)
        }
      })

      console.log('All parsed data:', this.data)

      resolve()
    })
  }

  render() {
    $('#setup').hide()
    $('#data').show()

    $('#choose-date').html('')

    _.each(this.data, (data, date) => {
      $('#choose-date').append(`<option value="${date}">${dateFormat(date, 'dddd, mmmm dS')}</option>`)
    })

    $('#choose-date').select()

    this.renderDataList([], true)
    this.populateServiceFilters()
  }

  renderDataList(data = [], changeMap = false, allowEmpty = false) {

    if (!data.length && !allowEmpty) {
      this.selectedDateData = this.data[$('#choose-date').val()]
      data = this.selectedDateData
    }

    if(changeMap)
      map.clearAllLocations()

    //console.log('Filtered data: ', data)

    let rows = []

    _.each(data, (entry, index) => {

      let additionalDebug = _.escape(entry.raw)

      _.each(entry.data, line => {
        additionalDebug += `<br>${_.escape(line)}`
      })

      let expandClass = (entry.expandForSearch)? 'collection-item-expand-show' : ''

      rows.push(`
        <div data-index="${index}" class="collection-item active">
          <span class="collection-item-time">
            ${entry.time}<span>.${entry.accurateTime}</span>
          </span>
          ${entry.event.service} → ${entry.event.method}
          <span class="collection-item-expand ${expandClass}" data-index="${index}">${additionalDebug}</span>
        </div>`)

      if(changeMap && entry.location) {
        let modalTitle = `${entry.event.service} → ${entry.event.method}`
        let modalBody = `${entry.time}.${entry.accurateTime}<br>`
        map.addLocation(entry.location, entry.time, modalTitle, modalBody)
      }
    })

    if (!this.clusterize) {
      this.clusterize = new Clusterize({
        rows,
        scrollId: 'data-list-scroll',
        contentId: 'data-list-content'
      });
    } else {
      this.clusterize.update(rows)
    }

    if(changeMap)
      map.fitToBounds()
  }

  search(searchTerm) {

    searchTerm = searchTerm.trim()

    if(searchTerm == '') {
      return this.renderDataList(this.selectedDateData)
    }

    searchTerm = searchTerm.toLowerCase()

    console.log('Searching for', searchTerm)

    let filteredData = []
    // We want a seperate copy because we are going to mutate it for search expansion
    let selectedDataCopy = {...this.selectedDateData}

    _.each(selectedDataCopy, (entry, index) => {

      let entryFound = false
      let subEntryFound = false

      if (entry.raw.toLowerCase().indexOf(searchTerm) > -1) {
        entryFound = true
      }

      _.each(entry.data, (data, index) => {
        if (data.toLowerCase().indexOf(searchTerm) > -1) {
          entryFound = true
          subEntryFound = true
        }
      })

      let filteredEntry = {...entry}

      if(subEntryFound) {
        filteredEntry.expandForSearch = true
      }

      if(entryFound)
        filteredData.push(filteredEntry)
    })

    this.renderDataList(filteredData, false, true)
  }

  populateServiceFilters() {

    let filterOptions = []
    let hasServices = false

    _.each(this.selectedDateData, (entry, index) => {

      let service = entry.event.service

      // We want to be able to easily view settings so lets keep it at the top
      if (filterOptions.indexOf(service) === -1 && service !== 'Settings')
        filterOptions.push(service)

      if (service === 'Settings')
        hasServices = true
    })

    filterOptions.sort()

    $('#filter').html(`<option value="" disabled>Choose which events to filter by</option>`)

    if (hasServices)
      $('#filter').append(`<option value="Settings">Settings</option>`)

    _.each(filterOptions, filter => {
      $('#filter').append(`<option value="${filter}">${filter}</option>`)
    })

    $('#filter').select()
  }

  filterEvents() {
    let filters = $('#filter').val()

    let filteredData = []

    _.each(this.selectedDateData, (entry, index) => {
      if (filters.indexOf(entry.event.service) !== -1) {
        filteredData.push(entry)
      }
    })

    this.renderDataList(filteredData)
  }

  expandAll() {
    $('#data-list').toggleClass('expand-all')
    this.clusterize.refresh()
  }
}
