class ParseLog {

  constructor(dataString) {
    this.data = {}
    this.selectedDateData = []
    this.userAppSettings = {}
    this.clusterize = null
    // Is the current line a new date/time entry?
    // Match example: 11-15 13:48:10
    this.findDate = /^\d\d-\d\d\s\d\d:\d\d:\d\d/
    // Find event e.g "TSLocationManager onSingleLocationResult"
    this.findEvent = /[^[]+(?=])/

    this.addHandlers()
  }

  addHandlers() {
    // View events for a different day
    $('body').on('change', '#choose-date', e => {
      setTimeout(() => {
        this.renderDataList()
      }, 500)
    })

    // Expand event in sidebar
    $('body').on('click', '#data-list .collection-item', e => {
      e.preventDefault()

      $(e.target).find('.collection-item-expand').toggleClass('collection-item-expand-show')
    })

    $('body').on('click', '#view-configs', e => {
      e.preventDefault()

      let $button = $(e.target)

      if (!$button.hasClass('active')) {
        this.showOnlySettingsEvents()
        $button.addClass('active')
      } else {
        this.renderDataList()
        $button.removeClass('active')
      }
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
          let foundEvent = line.match(this.findEvent)
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
          this.data[lastDateKey][this.data[lastDateKey].length - 1].data.push(line)
        }
      })

      console.log(this.data)

      resolve()
    })
  }

  render() {
    $('#setup').hide()
    $('#data').show()

    _.each(this.data, (data, date) => {
      $('#choose-date').append(`<option value="${date}">${dateFormat(date, 'dddd, mmmm dS')}</option>`)
    })

    $('#choose-date').material_select()

    this.renderDataList()
  }

  renderDataList(data = []) {

    if (!data.length) {
      this.selectedDateData = this.data[$('#choose-date').val()]
      data = this.selectedDateData
    }

    console.log(data)
    console.log(data.length)

    if (this.clusterize) {
      this.clusterize.destroy()
    }

    $('#data-list-content').html('')

    _.each(data, (entry, index) => {

      let additionalDebug = _.escape(entry.raw)

      _.each(entry.data, line => {
        additionalDebug += `<br>${_.escape(line)}`
      })

      $('#data-list-content').append(`
        <div data-index="${index}" class="collection-item active">
          <span class="collection-item-time">
            ${entry.time}<span>.${entry.accurateTime}</span>
          </span>
          ${entry.event.service} → ${entry.event.method}
          <span class="collection-item-expand" data-index="${index}">${additionalDebug}</span>
        </div>`)
    })

    this.clusterize = new Clusterize({
      scrollId: 'data-list-scroll',
      contentId: 'data-list-content'
    });
  }

  showOnlySettingsEvents() {

    let filteredData = []

    _.each(this.selectedDateData, (entry, index) => {
      if (entry.isSettings !== -1) {
        filteredData.push(entry)
      }
    })

    this.renderDataList(filteredData)

    setTimeout(() => {
      $('.collection-item').first().click()
    }, 1500)
  }
}
