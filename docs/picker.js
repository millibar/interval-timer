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

        this.value = 0
        this.index = 0

        this.positions = [] // y座標を保持しておく
        this.isMouseDown = false
        this.startTime = 0 // フリックの速度を求めるために、タッチしてから指を離すまでの時間を計る

        this.area.addEventListener('touchstart', this.onTouchStart.bind(this), false)
        this.area.addEventListener('mousedown', this.onMouseDown.bind(this), false)
        this.area.addEventListener('touchmove', this.onTouchMove.bind(this), false)
        this.area.addEventListener('mousemove', this.onMouseMove.bind(this), false)
        this.area.addEventListener('touchend', this.flick.bind(this), false)
        this.area.addEventListener('mouseup', this.flick.bind(this), false)
        this.area.addEventListener('mouseleave', this.flick.bind(this), false)
        
        // 正12角柱をリスト要素で作り、各面に値を表示する
        const ul = document.createElement('ul')
        const n = 12
        const apex_deg = 360/n
        const base_rad = (180 - apex_deg)/2 * Math.PI/180
        const h = Math.tan(base_rad)

        for (let i = 0; i < n; i++) {
            // 先頭から6個、末尾から6個ラベルを生成する
            let value
            if (i < n - 6) {
                value = this.minValue + i
            } else {
                value = this.maxValue - (n - i - 1)
            }

            // ループしない場合、末尾から２つは値なし
            if (!this.loop && i >= n - 2) {
                value = undefined
            }

            let label = this.makeLabel(value)
            let li = document.createElement('li')
            let text = document.createTextNode(label)
            li.appendChild(text)
            li.classList.add(`i${i}`)
            li.style.transform = `rotateX(${-i * apex_deg}deg) translate3d(0, 0, ${h}em)`
            ul.appendChild(li)
        }
        this.area.appendChild(ul)

        this.apex_deg = apex_deg
    }

    set (value) {
        if (value > this.maxValue || value < this.minValue) {
            console.log('setした値が範囲を超えています')
            return
        } 

        for (let i = 0; i < this.maxValue; i++) { // indexとvalueのずれを解消する
            this.up()
        }

        while (this.value > value) {
            this.down()
        }
    }

    get () {
        return this.value
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
                value = undefined
            }
            if (value > this.maxValue) {
                value = undefined
            }
        }
        
        return value
    }

    calcIndex (index) {
        if (index < 0) {
            index %= 12
            index += 12
        }
        if (index > 11) {
            index %= 12
        }
        return index
    }

    makeLabel (value) {
        if (value === undefined) {
            return ""
        }
        if (this.zeroPadding) {
            value = `${('00' + value).slice(-2)}`
        }
        return String(value)
    }

    up () {
        let li = this.area.querySelector(`ul .i${this.calcIndex(this.index + 6)}`)
        let value = this.calcValue(this.value + 6)
        li.textContent = this.makeLabel(value)

        this.index += 1 // 無限に増加しうる
        this.value = this.calcValue(this.value + 1)

        if (!this.loop && this.value === undefined) {
            this.value = this.maxValue
            this.index -= 1
        }

        this.rotate()
    }

    down () {
        let li = this.area.querySelector(`ul .i${this.calcIndex(this.index - 6)}`)
        let value = this.calcValue(this.value - 6)
        li.textContent = this.makeLabel(value)

        this.index -= 1 // 無限に減少しうる
        this.value = this.calcValue(this.value - 1)

        if (!this.loop && this.value === undefined) {
            this.value = this.minValue
            this.index += 1
        }

        this.rotate()
    }

    rotate() {
        const ul = this.area.querySelector('ul')
        ul.style.transform = `rotateX(${this.apex_deg * this.index}deg)`

        for (let i = 0; i < 12; i++) {
            let li = ul.querySelector(`ul .i${i}`)
            if (this.value === Number(li.textContent)) {
                li.classList.add('current')
            } else {
                li.classList.remove('current')
            }
        }

        console.log(`value: ${this.value}, index: ${this.index}`)
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

        if (dY > 10)  this.up()
        if (dY < -10) this.down()
        
        this.positions.push(y)
    }

    onMouseMove (event) {
        event.preventDefault()
        if (!this.isMouseDown) return

        let y = event.clientY - this.area.offsetTop
        let prevY = this.positions[this.positions.length - 1]
        let dY = prevY - y

        if (dY > 5)  this.up()
        if (dY < -5) this.down()
        
        this.positions.push(y)
    }

    // マウスアップまたは指が離れたとき、そのときの速度に応じてスクロールさせる
    flick () {
        this.isMouseDown = false

        // タッチ開始から終了までの時間と移動距離から平均速度を求める
        let startY = this.positions[0]
        let endY = this.positions[this.positions.length - 1]
        let dY = startY - endY // y軸は下方向がプラス
        let dT = performance.now() - this.startTime

        this.positions = []

        if (dT > 500) return

        let v = Math.round(dY * 1000/dT) // たいてい±(50～1000)くらいになる
        let step = Math.abs(Math.round(v/100)) // たいてい0～8くらいになる

        console.log(`dT: ${dT}, v: ${v}, step: ${step}`)

        if (step > 0) {
            if (v > 0) this.up()
            if (v < 0) this.down()
        }       
    }
}