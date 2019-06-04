class Picker {
    /**
     * 
     * @param {HTML Element} element ピッカーを挿入する要素
     * @param {number} minValue 最小値
     * @param {number} maxValue 最大値
     * @param {boolean} zeroPadding 値をゼロ埋めするか
     */
    constructor (element, minValue, maxValue, zeroPadding) {
        this.area = element
        this.positions = [] // y座標を保持しておく
        this.isMouseDown = false
        this.value = 0
        this.minValue = minValue
        this.maxValue = maxValue
        this.zeroPadding = zeroPadding
        
        this.startTime = 0 // フリックの速度を求めるために、タッチしてから指を離すまでの時間を計る

        this.area.addEventListener('touchstart', this.onTouchStart.bind(this), false)
        this.area.addEventListener('mousedown', this.onMouseDown.bind(this), false)
        this.area.addEventListener('touchmove', this.onTouchMove.bind(this), false)
        this.area.addEventListener('mousemove', this.onMouseMove.bind(this), false)
        this.area.addEventListener('touchend', this.flick.bind(this), false)
        this.area.addEventListener('mouseup', this.flick.bind(this), false)
        this.area.addEventListener('mouseleave', this.flick.bind(this), false)

        this.makeItems()
    }

    makeItems () {
        const ul = document.createElement('ul')

        const numOfItems = this.maxValue + 1
        for (let i = this.minValue; i < numOfItems; i++) {
            let li = document.createElement('li')
            let label = String(i)
            if (this.zeroPadding) {
                label = `${('00' + i).slice(-2)}`
            }
            let text = document.createTextNode(label)
            li.className = `v${i}`
            li.appendChild(text)
            ul.appendChild(li)
        }

        this.area.appendChild(ul)
    }

    set (value) {
        this.value = value
        this.scroll()
    }

    get () {
        return this.value
    }

    up (delta) {
        this.value += delta
        if (this.value > this.maxValue) {
            this.value = this.maxValue
        }
        this.scroll()
    }

    down (delta) {
        this.value -= delta
        if (this.value < this.minValue){
            this.value = this.minValue
        } 
        this.scroll()
    }

    scroll () {
        const ul = this.area.querySelector('ul')
        ul.style.transform =  `translateY(${(this.value -this.minValue) * -2}rem)`

        const items = ul.getElementsByTagName('li')
        for (let i = 0, len = items.length; i < len; i++) { // for ofだとiOS10のSafariで動かない
            items[i].classList.remove('current')
            items[i].classList.remove('two-before')
            items[i].classList.remove('two-after')
            items[i].style.marginTop = '0'
        }

        const currentItem = ul.querySelector(`.v${this.value}`)
        currentItem.classList.add('current')

        if (this.value === this.minValue) {
            currentItem.style.marginTop = '-0.5rem'
        }

        if (this.value === this.minValue + 1) {
            const prevItem = ul.querySelector(`.v${this.minValue}`)
            prevItem.style.marginTop = '-0.5rem'
        }

        if (this.value - 2 >= this.minValue) {
            const twoBeforeItem = ul.querySelector(`.v${this.value - 2}`)
            twoBeforeItem.classList.add('two-before')
        }

        if (this.value + 2 <= this.maxValue) {
            const twoAfterItem = ul.querySelector(`.v${this.value + 2}`)
            twoAfterItem.classList.add('two-after')
        }

    }

    onTouchStart (event) {
        event.preventDefault()
        let y = event.touches[0].pageY
        this.positions.push(y)
        this.startTime = performance.now()
    }

    onMouseDown (event) {
        event.preventDefault()
        let y = event.clientY - this.area.offsetTop
        this.positions.push(y)
        this.isMouseDown = true
        this.startTime = performance.now()
    }

    onTouchMove (event) {
        event.preventDefault()
        let y = event.changedTouches[0].pageY
        let prevY = this.positions[this.positions.length - 1]
        let dY = prevY - y

        if (dY > 5)  this.up(1)
        if (dY < -5) this.down(1)
        
        this.positions.push(y)
    }

    onMouseMove (event) {
        event.preventDefault()
        if (!this.isMouseDown) return

        let y = event.clientY - this.area.offsetTop
        let prevY = this.positions[this.positions.length - 1]
        let dY = prevY - y

        if (dY > 5)  this.up(1)
        if (dY < -5) this.down(1)
        
        this.positions.push(y)
    }

    // マウスアップまたは指が離れたとき、そのときの速度に応じてスクロールさせる
    flick () {
        this.isMouseDown = false

        // ここのロジックによって触り心地がかなり変わる。
        // 単純にタッチ開始から終了までの時間と移動距離から平均速度を求めている。
        let startY = this.positions[0]
        let endY = this.positions[this.positions.length - 1]
        let dY = startY - endY // y軸は下方向がプラス
        let dT = performance.now() - this.startTime

        let v = Math.round(dY * 1000/dT) // たいてい±50～1000くらいになる
        let delta = Math.abs(Math.round(v/100))

        console.log(`v: ${v}, delta: ${delta}`)

        if (delta === 0) {
            if (v > 0) this.up(1)
            if (v < 0) this.down(1)
        } else {
            if (v > 0) this.up(delta)
            if (v < 0) this.down(delta)
        }

        this.positions = []
    }
}

const main = () => {
    console.log('main loaded')
    
    const storage = new Storage ('intervalTimer')

    // HTML要素の取得
    const totalTimeLabel = document.querySelector('#setting-total .value')
    const activityTimeLabel = document.querySelector('#setting-activity .value')
    const intervalTimeLabel = document.querySelector('#setting-interval .value')
    const setNumberLabel = document.querySelector('#setting-set .value')
    const inputLastInterval = document.getElementById('setting-has-last-interval')
    const inputSound = document.getElementById('setting-sound')

    const activityDetail = document.querySelector('#setting-activity details')
    const intervalDetail = document.querySelector('#setting-interval details')
    const setDetail = document.querySelector('#setting-set details')

    const activitySummary = document.querySelector('#setting-activity summary')
    activitySummary.addEventListener('click', (event) => {
        intervalDetail.removeAttribute('open')
        setDetail.removeAttribute('open')
    }, false)

    const intervalSummary = document.querySelector('#setting-interval summary')
    intervalSummary.addEventListener('click', (event) => {
        activityDetail.removeAttribute('open')
        setDetail.removeAttribute('open')
    }, false)

    const setSummary = document.querySelector('#setting-set summary')
    setSummary.addEventListener('click', (event) => {
        activityDetail.removeAttribute('open')
        intervalDetail.removeAttribute('open')
    }, false)


    // ローカルストレージの値を読み込む。値がなければデフォルト値
    let activityTime = storage.getItem('activityTime') || 20
    let setNumber = storage.getItem('setNumber') || 8

    // intervalTimeには0が保存されることがある。↑の方法では0はfalseなので読み込めない
    // また、undefinedのときNumberでキャストするとNaNになるのでNumberはつけてはいけない
    let intervalTime = storage.getItem('intervalTime')
    if (intervalTime === undefined) {
        intervalTime = 10
    }
    
    let hasLastInterval = storage.getItem('hasLastInterval')
    if (hasLastInterval === undefined) {
        hasLastInterval = inputLastInterval.checked
    }

    let useSound = storage.getItem('useSound')
    if (useSound === undefined) {
        useSound = inputSound.checked
    }

    // input要素にローカルストレージから取り出した値をセットする
    if (hasLastInterval) {
        inputLastInterval.checked = true
    } else {
        inputLastInterval.checked = false
    }
    if (useSound) {
        inputSound.checked = true
    } else {
        inputSound.checked = false
    }

    let activity_sec = activityTime % 60
    let activity_min = (activityTime - activity_sec) / 60
    let interval_sec = intervalTime % 60
    let interval_min = (intervalTime - interval_sec) / 60

    // ユーザーの入力値を画面に反映し、ローカルストレージに保存する
    const update = () => {
        activity_min = activityPicker_min.get()
        activity_sec = activityPicker_sec.get()
        if (activity_sec + activity_min === 0) {
            activity_sec = 1
            activityPicker_sec.set(1)
        }
        activityTime = activity_min * 60 + activity_sec
        activityTimeLabel.textContent = secToTimeLabel (activityTime)
        storage.setItem('activityTime', activityTime)

        interval_min = intervalPicker_min.get()
        interval_sec = intervalPicker_sec.get()
        intervalTime = interval_min * 60 + interval_sec
        intervalTimeLabel.textContent = secToTimeLabel (intervalTime)
        storage.setItem('intervalTime', intervalTime)

        setNumber = setPicker.get()
        setNumberLabel.textContent = setNumber
        storage.setItem('setNumber', setNumber)

        hasLastInterval = inputLastInterval.checked
        storage.setItem('hasLastInterval', hasLastInterval)

        useSound = inputSound.checked
        storage.setItem('useSound', useSound)

        let totalTime = activityTime * setNumber + intervalTime * (setNumber - 1)
        if (hasLastInterval) totalTime += intervalTime
        totalTimeLabel.textContent = secToTimeLabel (totalTime)

        storage.save()
    }

    // Setピッカーを追加
    const setPickerArea = document.getElementById('picker-set')
    const setPicker = new Picker (setPickerArea, 1, 20, false)
    setPicker.set(setNumber)

    setPickerArea.addEventListener('mouseup', update, false)
    setPickerArea.addEventListener('mouseleave', update, false)
    setPickerArea.addEventListener('touchend', update, false)

    // Activity_minピッカーを追加
    const activityPickerArea_min = document.getElementById('picker-activity-min')
    const activityPicker_min = new Picker (activityPickerArea_min, 0, 30, false)
    activityPicker_min.set(activity_min)
    
    activityPickerArea_min.addEventListener('mouseup', update, false)
    activityPickerArea_min.addEventListener('mouseleave', update, false)
    activityPickerArea_min.addEventListener('touchend', update, false)

    // Activity_secピッカーを追加
    const activityPickerArea_sec = document.getElementById('picker-activity-sec')
    const activityPicker_sec = new Picker (activityPickerArea_sec, 0, 59, true)
    activityPicker_sec.set(activity_sec)

    activityPickerArea_sec.addEventListener('mouseup', update, false)
    activityPickerArea_sec.addEventListener('mouseleave', update, false)
    activityPickerArea_sec.addEventListener('touchend', update, false)

    // Interval_minピッカーを追加
    const intervalPickerArea_min = document.getElementById('picker-interval-min')
    const intervalPicker_min = new Picker (intervalPickerArea_min, 0, 30, false)
    intervalPicker_min.set(interval_min)

    intervalPickerArea_min.addEventListener('mouseup', update, false)
    intervalPickerArea_min.addEventListener('mouseleave', update, false)
    intervalPickerArea_min.addEventListener('touchend', update, false)

    // Interval_secピッカーを追加
    const intervalPickerArea_sec = document.getElementById('picker-interval-sec')
    const intervalPicker_sec = new Picker (intervalPickerArea_sec, 0, 59, true)
    intervalPicker_sec.set(interval_sec)

    intervalPickerArea_sec.addEventListener('mouseup', update, false)
    intervalPickerArea_sec.addEventListener('mouseleave', update, false)
    intervalPickerArea_sec.addEventListener('touchend', update, false)

    const inputs = document.getElementsByTagName('input')
    for (let i = 0, len = inputs.length; i < len; i++) {// for ofだとiOS10のSafariで動かない
        inputs[i].addEventListener('change', update, false)
    }

    update ()

}

window.addEventListener('load', main, false)