class Picker {
    /**
     * 
     * @param {HTML Element} element ピッカーを挿入する要素
     * @param {number} minValue 最小値
     * @param {number} maxValue 最大値
     * @param {boolean} zeroPadding 値をゼロ埋めするか
     * @param {boolean} loop 最大値の次に最小値に戻すか
     */
    constructor (args) {
        this.area = args['element']
        this.minValue = args['minValue']
        this.maxValue = args['maxValue']
        this.zeroPadding = args['zeroPadding']
        this.loop = args['loop']

        this.positions = [] // y座標を保持しておく
        this.isMouseDown = false
        this.value = 0
        
        this.startTime = 0 // フリックの速度を求めるために、タッチしてから指を離すまでの時間を計る

        this.area.addEventListener('touchstart', this.onTouchStart.bind(this), false)
        this.area.addEventListener('mousedown', this.onMouseDown.bind(this), false)
        this.area.addEventListener('touchmove', this.onTouchMove.bind(this), false)
        this.area.addEventListener('mousemove', this.onMouseMove.bind(this), false)
        this.area.addEventListener('touchend', this.flick.bind(this), false)
        this.area.addEventListener('mouseup', this.flick.bind(this), false)
        this.area.addEventListener('mouseleave', this.flick.bind(this), false)
        
        this.init()
    }

    init () {
        const ul = document.createElement('ul')
        let items = []
        if (this.loop) {
            ul.style.transform = 'translateY(-14rem)'
            // 現在の値から9個遡って項目を作る（そのうち7個は見えない）
            for (let i = 9; i > 0; i--) {
                let val = this.calcValue(this.value - i)
                items.push(val)
            }
            // 現在の値と、現在の値から9個項目を作る（そのうち7個は見えない）
            for (let i = 0; i < 10; i++) {
                let val = this.calcValue(this.value + i)
                items.push(val)
            }
        } else {
            // 最小値から最大値までの項目を作る。最初と最後に空の2項目を追加する
            items.push('-')
            items.push('-')
            for (let i = this.minValue; i < this.maxValue + 1; i++) {
                items.push(i)
            }
            items.push('-')
            items.push('-')
        }

        for (let i = 0, len = items.length; i < len; i++) {
            let li = this.makeItem(items[i])
            ul.appendChild(li)
        }
        
        this.area.appendChild(ul)
        this.addClassName()
    }

    set (value) {
        while (this.value < value) {
            this.up(1)
        }
        while (this.value > value) {
            this.down(1)
        }
    }

    get () {
        return this.value
    }

    makeItem (value) {
        let label = String(value)
        if (this.zeroPadding) {
            label = `${('00' + label).slice(-2)}`
        }
        let text = document.createTextNode(label)
        let li = document.createElement('li')
        li.className = `v${value}`
        li.appendChild(text)
        return li
    }

    calcValue (value) {
        if (this.loop) {
            if (value < this.minValue) {
                value = value + 1 + this.maxValue - this.minValue
            }
            if (value > this.maxValue) {
                value = value - 1 - this.maxValue + this.minValue
            }
        } else {
            if (value < this.minValue) {
                value = ""
            }
            if (value > this.maxValue) {
                value = ""
            }
        }
        
        return value
    }

    addClassName () {
        let list = ['prev2', 'prev1', 'current', 'next1', 'next2']
        for (let i = 0, len = list.length; i < len; i++) {
            let li = this.area.querySelector(`ul .${list[i]}`)
            if (li) li.classList.remove(`${list[i]}`)
        }
    
        const prev2 = this.area.querySelector(`ul .v${this.calcValue(this.value - 2)}`)
        const prev1 = this.area.querySelector(`ul .v${this.calcValue(this.value - 1)}`)
        const current = this.area.querySelector(`ul .v${this.value}`)
        const next1 = this.area.querySelector(`ul .v${this.calcValue(this.value + 1)}`)
        const next2 = this.area.querySelector(`ul .v${this.calcValue(this.value + 2)}`)

        if (prev2) prev2.classList.add('prev2')
        if (prev1) prev1.classList.add('prev1')
        if (current) current.classList.add('current')
        if (next1) next1.classList.add('next1')
        if (next2) next2.classList.add('next2')
    }

    scroll () {
        // ループしないときは単純に全体をずらすだけ
        const ul = this.area.querySelector('ul')
        let y = (this.value - this.minValue) * (-2) // 1項目の高さが2rem
        let duration = 200
        ul.style.transform = `translateY(${y}rem)`
        ul.style.transitionDuration = `${duration}ms`
        this.addClassName()
    }

    up (step) {
        if (this.loop) {
            this.value = this.calcValue(this.value + step)
        } else {
            if (this.value + step > this.maxValue) {
                step = this.maxValue - this.value
                this.value = this.maxValue
            } else {
                this.value += step
            }
            this.scroll()
            return
        }
        
        const ul = this.area.querySelector('ul')
        let y = (7 + step) * (-2) // 見えない部分に7項目あり、1項目の高さが2rem
        let duration = 200
        ul.style.transform = `translateY(${y}rem)`
        ul.style.transitionDuration = `${duration}ms`

        setTimeout( _ => {
            // 先頭からstep分のリスト項目を削除する
            for (let i = 0; i < step; i++) {
                ul.removeChild(ul.firstChild)
            }
            
            // 後ろにstep分のリスト項目を追加する
            let lastVal = Number(ul.lastChild.textContent)
            let items = []
            for (let i = 1; i < step + 1; i++) {
                let val = this.calcValue(lastVal + i)
                items.push(val)
            }
            let frag = document.createDocumentFragment()
            for (let i = 0; i < step; i++) {
                let li = this.makeItem(items[i])
                frag.appendChild(li)
            }
            ul.appendChild(frag)
            
            ul.style.transform = 'translateY(-14rem)' // 7 x 2 = 14
            ul.style.transitionDuration = '0s'
            this.addClassName()
        }, duration)
    }

    down (step) {
        if (this.loop) {
            this.value = this.calcValue(this.value - step)
        } else {
            if (this.value - step < this.minValue) {
                step = this.value - this.minValue
                this.value = this.minValue
            } else {
                this.value -= step
            }
            this.scroll()
            return
        }
        
        const ul = this.area.querySelector('ul')
        let y = (-7 + step) * 2 // 見えない部分に7項目あり、1項目の高さが2rem
        let duration = 200
        ul.style.transform = `translateY(${y}rem)`
        ul.style.transitionDuration = `${duration}ms`

        setTimeout( _ => {
            // 後ろからstep分のリスト項目を削除する
            for (let i = 0; i < step; i++) {
                ul.removeChild(ul.lastChild)
            }
            
            // 先頭にstep分のリスト項目を追加する
            let firstVal = Number(ul.firstChild.textContent)
            let items = []
            for (let i = step; i > 0; i--) {
                let val = this.calcValue(firstVal - i)
                items.push(val)
            }
            let frag = document.createDocumentFragment()
            for (let i = 0; i < step; i++) {
                let li = this.makeItem(items[i])
                frag.appendChild(li)
            }
            ul.insertBefore(frag, ul.firstChild)

            ul.style.transform = 'translateY(-14rem)' // 7 x 2 = 14
            ul.style.transitionDuration = '0s'
            this.addClassName()
        }, duration)

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
        let step = Math.abs(Math.round(v/100)) // たいてい0～8くらいになる

        console.log(`v: ${v}, step: ${step}`)

        if (step > 7) step = 7

        if (step > 0) {
            if (v > 0) this.up(step)
            if (v < 0) this.down(step)
        } else {
            if (v > 0) this.up(1)
            if (v < 0) this.down(1)
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
            activityPicker_sec.up(1)
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
    const setPicker = new Picker ({
        'element': setPickerArea,
        'minValue': 1,
        'maxValue': 20,
        'zeroPadding': false,
        'loop': false
    })
    setPicker.set(setNumber)
    
    setPickerArea.addEventListener('mouseup', update, false)
    setPickerArea.addEventListener('mouseleave', update, false)
    setPickerArea.addEventListener('touchend', update, false)

    // Activity_minピッカーを追加
    const activityPickerArea_min = document.getElementById('picker-activity-min')
    const activityPicker_min = new Picker ({
        'element': activityPickerArea_min,
        'minValue': 0,
        'maxValue': 30,
        'zeroPadding': false,
        'loop': false
    })
    activityPicker_min.set(activity_min)
    
    activityPickerArea_min.addEventListener('mouseup', update, false)
    activityPickerArea_min.addEventListener('mouseleave', update, false)
    activityPickerArea_min.addEventListener('touchend', update, false)

    // Activity_secピッカーを追加
    const activityPickerArea_sec = document.getElementById('picker-activity-sec')
    const activityPicker_sec = new Picker ({
        'element': activityPickerArea_sec,
        'minValue': 0,
        'maxValue': 59,
        'zeroPadding': true,
        'loop': true
    })
    activityPicker_sec.set(activity_sec)

    activityPickerArea_sec.addEventListener('mouseup', update, false)
    activityPickerArea_sec.addEventListener('mouseleave', update, false)
    activityPickerArea_sec.addEventListener('touchend', update, false)

    // Interval_minピッカーを追加
    const intervalPickerArea_min = document.getElementById('picker-interval-min')
    const intervalPicker_min = new Picker ({
        'element': intervalPickerArea_min,
        'minValue': 0,
        'maxValue': 30,
        'zeroPadding': false,
        'loop': false
    })
    intervalPicker_min.set(interval_min)

    intervalPickerArea_min.addEventListener('mouseup', update, false)
    intervalPickerArea_min.addEventListener('mouseleave', update, false)
    intervalPickerArea_min.addEventListener('touchend', update, false)

    // Interval_secピッカーを追加
    const intervalPickerArea_sec = document.getElementById('picker-interval-sec')
    const intervalPicker_sec = new Picker ({
        'element': intervalPickerArea_sec,
        'minValue': 0,
        'maxValue': 59,
        'zeroPadding': true,
        'loop': true
    })
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