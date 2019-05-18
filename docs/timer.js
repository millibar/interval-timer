/**
 * 時間を画面に表示する。
 * Timer, ActivityTimer, IntervalTimerのObserverのひとつ。
 */
class TimeLabel {
    constructor (element) {
        this.element = element
    }
    update (timer) {
        let timeLabel = secToTimeLabel(timer.currentTime)
        this.element.textContent = timeLabel
        this.element.classList.remove('invisible')
    }
}

/**
 * セット数を画面に表示する。
 * TimerのObserverのひとつ。
 */
class SetLabel {
    constructor (element) {
        this.element = element
    }
    update (timer) {
        this.element.textContent = `${timer.currentSetNumber}/${timer.setNumber}`
    }
}

/**
 * Readyのときの時間を画面に表示する。
 * ReadyTimerのObserverのひとつ。
 */
class ReadyLabel {
    constructor (element) {
        this.element = element
    }
    update (timer) {
        this.element.textContent = timer.currentTime
        this.element.classList.add('ready-count')
    }
}

/**
 * #setting-infoのActivityとIntervalのスタイルを切り替える。
 * ActivityTimer, IntervalTimerのObserverのひとつ。
 */
class StyleLabel {
    constructor (element) {
        this.element = element
    }
    update (timer) {
        if (timer.currentTime > 0) {
            this.element.classList.remove('disabled')
        } else {
            this.element.classList.add('disabled')
        }
    }
}

/**
 * 音声ファイルを再生する。
 * SubTimerのObserverのひとつ。
 * 引数を与えることで、特定の音声ファイルを再生させることも出来る。
 */
class SoundPlayer {
    constructor () {
        this.audioPlayer = null
    }

    asignAudioPlayer (audioPlayer) {
        this.audioPlayer = audioPlayer
    }

    update (subtimer) {
        if (subtimer.currentTime <= 3 && subtimer.currentTime > 0) {
            this.play(0)
        }
    }

    /**
     * 特定の音声ファイルを再生する。0: count-down, 1: count-up, 2: finish
     * @param {number} index 
     */
    play (index) {
        switch (index) {
            case 0:
                this.audioPlayer.play('sound/count-down.mp3')
                break
            case 1:
                this.audioPlayer.play('sound/count-up.mp3')
                break
            case 2:
                this.audioPlayer.play('sound/finish.mp3')
                break
            default:
                break
        }
    }
}

/**
 * SoundPlayer内で使われる。
 */
class WebAudioPlayer {
    constructor () {
        window.AudioContext = window.AudioContext || window.webkitAudioContext
        this.context = new AudioContext()
        this.context.createBufferSource().start(0)
    }
    
    play (url) {
        const request = new XMLHttpRequest()
        request.open('GET', url, true)
        request.responseType = 'arraybuffer'
        request.onload = () => {
            const source = this.context.createBufferSource()
            this.context.decodeAudioData(request.response, buffer => {
                source.buffer = buffer
                source.loop = false
                source.connect(this.context.destination)
                source.start()
            })
        }
        request.send()
    }
}

/**
 * SubTimerのObserver役。
 * ReadyTimer, ActivitiTimer, IntervalTimerの３つのSubTimerから通知を受けて値を更新する。
 * 
 * LabelのSubject役でもある。
 * 自身の更新をTimeLabel, SetLabelの画面表示用のラベルに通知する。
 */
class Timer {
    constructor (args) {
        this.totalTime = args['totalTime']
        this.currentTime = this.totalTime
        this.setNumber = args['setNumber']
        this.currentSetNumber = 0
        
        this.subtimers = []  // ReadyTimer, ActivityTimer, IntervalTimerを入れる
        this.index = 0       // アクティブなSubTimerを決める。
        this.labels = []     // TimeLabel, SetLabelを入れる。
    }

    addSubtimer (subtimer) {
        this.subtimers.push(subtimer)
    }

    addLabel (label) {
        this.labels.push(label)
    }

    // Observerに更新を通知する。引数にはthis.labelsを想定する。
    notify (observers) {
        observers.forEach (observer => observer.update(this)) 
    }

    // タイマーを開始する。pause()が呼ばれると、タイマーは一時停止する。
    start () {
        this.subtimers[this.index].start()
    }

    // pauseBtnから呼ばれる。start()したタイマーを一時停止する。
    pause () {
        this.subtimers[this.index].pause()
    }

    // resetBtnから呼ばれる。
    reset () {
        this.subtimers[this.index].reset()
        this.currentTime = this.totalTime
        this.currentSetNumber = 0
        this.index = 0
        this.notify(this.labels)
    }

    // SubTimerのカウントが0になったときに呼ばれる
    goNext () {
        let subtimer = this.subtimers[this.index]
        switch (subtimer.type) {
            case 'ready':
                // readyLabelを隠す
                subtimer.labels[0].element.classList.add('invisible')
                break
            case 'activity':
                this.currentSetNumber += 1
                this.notify(this.labels)
                if (subtimer.soundPlayers.length > 0) {
                    subtimer.soundPlayers[0].play(1) // 1: count-up
                }
                const ddSetCount = document.getElementById('set-count') 
                ddSetCount.classList.toggle('set-up')
                break
            case 'interval':
                // 何もしない
                break
            default:
                break
        }
        // 次のSubTimerに進めるなら進む。進めないなら終了
        if (this.index + 1 < this.subtimers.length) {
            // ready以外なら、#count-downをひっくり返す
            if (this.index > 0) {
                let hasIntervalTimer = false
                for (let subtimer of this.subtimers) {
                    if (subtimer.type === 'interval') {
                        hasIntervalTimer = true
                        break
                    }
                }
                if (hasIntervalTimer) {
                    const countDownArea = document.getElementById('count-down')
                    countDownArea.classList.toggle('flip')
                }
            }
            this.index += 1
            this.subtimers[this.index].start()
        } else {
            this.finish()
        }
    }

    finish () {
        if (this.subtimers[0].soundPlayers[0]){
            const soundPlayer = this.subtimers[0].soundPlayers[0]
            soundPlayer.play(2) // 2: finish
        }
        
        const txtReady = document.getElementById('ready')
        const txtActivity = document.getElementById('activity')
        const txtInterval = document.getElementById('interval')
        const countDownArea = document.getElementById('count-down')
        txtActivity.classList.add('invisible')
        txtInterval.classList.add('invisible')
        txtReady.classList.remove('invisible')
        txtReady.classList.remove('ready-count')
        txtReady.textContent = 'Finish!'
        countDownArea.classList.remove('flip')
        txtReady.classList.add('rubberBand')

        const pauseBtn = document.getElementById('pause-btn')
        const resetBtn = document.getElementById('reset-btn')
        disableBtn (pauseBtn)
        enableBtn (resetBtn)
    }

    // SubTimerから呼ばれる
    countDown () {
        this.currentTime -= 1
        this.notify(this.labels)
    }
}

/**
 * ObserverパターンのSubject役。requestAnimationFrameごとに更新される。
 * 更新をObserverであるTimeLabel, StyleLabel, SoundPlayerに通知する。
 * また、currentTimeが0になったときはTimerに通知する
 */
class SubTimer {
    constructor (args) {
        this.totalTime = args['totalTime']
        this.currentTime = this.totalTime
        this.type = args['type'] // 'ready', 'activity', 'interval'

        this.timer = null
        this.labels = []
        this.soundPlayers = []

        this.reqId = null
        this.startTime = 0
        this.lapsedTime_ms = 0 // startしてからの経過時間
        this.timeOffset = 0 // pauseしたときの時刻を保持しておく
        this.drawer = null
    }

    assignTimer (timer) {
        this.timer = timer
    }

    addLabel (label) {
        this.labels.push(label)
    }

    addSoundPlayer (soundPlayer) {
        this.soundPlayers.push(soundPlayer)
    }

    assignDrawer (drawer) {
        this.drawer = drawer
    }

    // Observerに更新を通知する。
    notify (observers) {
        observers.forEach (observer => observer.update(this)) 
    }

    // Timerにカウントが0になったことを通知する
    goNext () {
        this.timer.goNext()
    }

    // Timerにカウントダウンを通知する
    countDown () {
        this.timer.countDown()
    }

    // Timerから呼ばれる。
    start () {
        this.notify(this.labels)
        this.reqId = window.requestAnimationFrame(this.update.bind(this))

        const pausedTime = this.timeOffset
        const timeSincePause = performance.now() - pausedTime
        this.timeOffset = 0
        this.startTime = timeSincePause
    }

    // Timerから呼ばれる。
    pause () {
        cancelAnimationFrame(this.reqId)

        const pausedTime = performance.now() - this.startTime
        this.timeOffset = pausedTime
    }

    // Timerから呼ばれる。
    reset () {
        cancelAnimationFrame(this.reqId)
        if (this.drawer) this.drawer.erase()
        this.currentTime = this.totalTime
        this.notify (this.labels)

        this.startTime = 0
        this.lapsedTime_ms = 0
        this.timeOffset = 0
    }

    // 進捗を求める
    getProgress (currentTime, startValue, endValue, totalTime) {
        let progress = 0
        
        if (currentTime < 0) return startValue
        if (currentTime > totalTime) return endValue

        progress = startValue + (endValue - startValue) * currentTime/totalTime

        return progress
    }

    // 自身のrequestAnimationFrameごとに呼ばれる。
    update () {
        this.reqId = window.requestAnimationFrame(this.update.bind(this))
        this.lapsedTime_ms = performance.now() - this.startTime
        console.log(`経過時間：${this.lapsedTime_ms}ms`)
        
        // 円を描くアニメーションを更新する
        if (this.drawer) {
            const startValue = -90
            const endValue = 270
            const duration_ms = this.totalTime * 1000
            const angle = this.getProgress(this.lapsedTime_ms, startValue, endValue, duration_ms)
            this.drawer.draw(angle)
        }

        // カウントを進める
        const currentTime = this.totalTime - Math.round(this.lapsedTime_ms/1000)
        if (this.currentTime - currentTime >= 1) {
            this.currentTime = currentTime
            this.notify(this.labels)
            if (this.soundPlayers.length > 0) {
                this.notify(this.soundPlayers)
            }
            this.countDown()
        }
        
        // カウントが0になったらTimerに通知する。カウントを戻す。
        if (this.currentTime <= 0) {
            this.reset()
            this.goNext()
        }
    }
}


/**
 * 円を描く。Animatorから呼ばれる。
 */
class CircleDrawer {
    constructor (canvas, startAngle, endAngle, color) {
        this.canvas = canvas
        this.startAngle = startAngle
        this.endAngle = endAngle
        this.color = color
    }

    draw (angle) {
        const context = this.canvas.getContext('2d')
        const centerX = this.canvas.width/2
        const centerY = this.canvas.height/2
        const radius = this.canvas.width * 0.4

        let startRad
        if (this.startAngle === undefined) {
            startRad = angle * Math.PI/180
        } else {
            startRad = this.startAngle * Math.PI/180
        }

        let endRad
        if (this.endAngle === undefined) {
            endRad = angle * Math.PI/180
        } else {
            endRad = this.endAngle * Math.PI/180
        }

        context.clearRect(0, 0, this.canvas.width, this.canvas.height)
        context.beginPath()
        context.arc(centerX, centerY, radius, startRad, endRad, false)
        context.strokeStyle = this.color
        context.lineWidth = radius/4
        context.lineCap = 'round';
        context.stroke();
    }

    erase () {
        const context = this.canvas.getContext('2d')
        context.clearRect(0, 0, this.canvas.width, this.canvas.height)
    }
}

/**
 * メインの処理
 */
const main = () => {
    // ボタン
    const startBtn = document.getElementById('start-btn')
    const pauseBtn = document.getElementById('pause-btn')
    const resetBtn = document.getElementById('reset-btn')

    // メインのカウントダウン表示
    const indicator = document.getElementById('indicator')
    const countDownArea = document.getElementById('count-down')
    const canvas = document.createElement('canvas')
    
    // #setting-info内のdt, dd
    const dtAtcivity = document.getElementById('activity-label')
    const dtInterval = document.getElementById('interval-label')
    const ddTotalTime = document.getElementById('total-time')
    const ddSetCount = document.getElementById('set-count')
    const ddActivityTime = document.getElementById('activity-time')
    const ddIntervalTime = document.getElementById('interval-time')

    // #count-down内のspan
    const txtReady = document.getElementById('ready')
    const txtActivity = document.getElementById('activity')
    const txtInterval = document.getElementById('interval')

    const resizeCanvas = () =>{
        let maxWidth = Math.min(indicator.clientWidth, indicator.clientHeight)
        canvas.width = maxWidth //* devicePixelRatio
        canvas.height = maxWidth//* devicePixelRatio
    }
    resizeCanvas ()

    window.addEventListener('resize', resizeCanvas, false)

    indicator.appendChild(canvas)

    // 色を決める
    const readyColor = '#c8c8c8'
    const activityColor = '#42a4f4'
    const intervalColor = '#42f4a4'

    // ローカルストレージからパラメータを読み込む
    const storage = new Storage ('intervalTimer')
    const readyTime = 5
    let activityTime = Number(storage.getItem('activityTime')) || 20
    let intervalTime = Number(storage.getItem('intervalTime')) || 10
    let setNumber = Number(storage.getItem('setNumber')) || 8

    let hasLastInterval = storage.getItem('hasLastInterval')
    if (hasLastInterval === undefined) {
        hasLastInterval = true
    }
        
    let useSound = storage.getItem('useSound')
    if (useSound === undefined) {
        useSound = true
    }

    // 総時間を計算する
    let totalTime = readyTime + activityTime * setNumber + intervalTime * (setNumber - 1)
    if (hasLastInterval) totalTime += intervalTime

    // TimerとSubTimerをインスタンス化する
    const timer = new Timer ({
        'totalTime': totalTime,
        'setNumber': setNumber
    })

    const readyTimer = new SubTimer ({
        'totalTime': readyTime,
        'type': 'ready'
    })

    const activityTimer = new SubTimer ({
        'totalTime': activityTime,
        'type': 'activity'
    })
    
    const intervalTimer = new SubTimer ({
        'totalTime': intervalTime,
        'type': 'interval'
    })
     
    // CircleDrawerを用意する
    const activityDrawer = new CircleDrawer(canvas, -90, undefined, activityColor)
    const intervalDrawer = new CircleDrawer(canvas, undefined, 270, intervalColor)

    // SubTimerにTimerを登録する
    readyTimer.assignTimer(timer)
    activityTimer.assignTimer(timer)
    intervalTimer.assignTimer(timer)

    // SubTimerにCicleDrawerを登録する
    activityTimer.assignDrawer(activityDrawer)
    intervalTimer.assignDrawer(intervalDrawer)

    // TimeLabel, SetLabel, ReadyLabelを用意する
    const totalTimeLabel = new TimeLabel (ddTotalTime)
    const setLabel = new SetLabel (ddSetCount)
    const readyLabel = new ReadyLabel (txtReady)
    const activityLabel = new TimeLabel (txtActivity) 
    const intrvalLabel = new TimeLabel (txtInterval)

    // StyleLabelを用意する
    const dtActivityLabel = new StyleLabel (dtAtcivity)
    const ddActivityLabel = new StyleLabel (ddActivityTime)
    const dtIntervalLabel = new StyleLabel (dtInterval)
    const ddIntervalLabel = new StyleLabel (ddIntervalTime)

    // SubTimerにObserverを追加する
    readyTimer.addLabel(readyLabel)
    activityTimer.addLabel(activityLabel)
    activityTimer.addLabel(dtActivityLabel)
    activityTimer.addLabel(ddActivityLabel)
    intervalTimer.addLabel(intrvalLabel)
    intervalTimer.addLabel(dtIntervalLabel)
    intervalTimer.addLabel(ddIntervalLabel)
    if (useSound) {
        const soundPlayer = new SoundPlayer ()
        readyTimer.addSoundPlayer(soundPlayer)
        activityTimer.addSoundPlayer(soundPlayer)
        intervalTimer.addSoundPlayer(soundPlayer)
        // iOSでAudio再生のアンロックのため、ユーザーイベントでインスタンスを作成
        startBtn.addEventListener('click', function() {
            const audio = new WebAudioPlayer ()
            soundPlayer.asignAudioPlayer(audio)
        })
    }
    
    // TimerにObserverを追加する
    timer.addLabel(totalTimeLabel)
    timer.addLabel(setLabel)
    
    // TimerにSubTimerを追加する
    timer.addSubtimer(readyTimer)
    for (let i = 0; i < setNumber - 1; i++) {
        timer.addSubtimer(activityTimer)
        if (intervalTime > 0) timer.addSubtimer(intervalTimer)
    }
    if (hasLastInterval) {
        timer.addSubtimer(activityTimer)
        if (intervalTime > 0) timer.addSubtimer(intervalTimer)
    } else {
        timer.addSubtimer(activityTimer)
    }

    

    const init = () => {
        let totalTimeLabel = secToTimeLabel(totalTime)
        let activityTimeLabel = secToTimeLabel(activityTime)
        let intervalTimeLabel = secToTimeLabel(intervalTime)

        ddTotalTime.textContent = totalTimeLabel
        ddSetCount.textContent = `0/${setNumber}`
        ddActivityTime.textContent = activityTimeLabel
        ddIntervalTime.textContent = intervalTimeLabel

        txtReady.textContent = 'Ready'
        txtActivity.textContent = activityTimeLabel
        txtInterval.textContent = intervalTimeLabel

        countDownArea.classList.remove('flip')
        txtReady.classList.remove('invisible')
        txtReady.classList.remove('rubberBand')
        txtReady.classList.remove('ready-count')
        txtActivity.classList.add('invisible')
        txtInterval.classList.add('invisible')

        dtAtcivity.classList.add('disabled')
        ddActivityTime.classList.add('disabled')
        dtInterval.classList.add('disabled')
        ddIntervalTime.classList.add('disabled')
        
        disableBtn (pauseBtn)
        disableBtn (resetBtn)
        enableBtn (startBtn)
    }

    init ()
    
    
    const start = () => {
        console.log('start clicked')
        timer.start()
        disableBtn (startBtn)
        enableBtn (pauseBtn)
        disableBtn (resetBtn)
    }

    
    const pause = () => {
        console.log('pause clicked')
        timer.pause()
        disableBtn (pauseBtn)
        enableBtn (startBtn)
        enableBtn (resetBtn)
    }


    const reset = () => {
        console.log('reset clicked')
        timer.reset()
        init()
    }
    
    startBtn.addEventListener('click', start, false)
    pauseBtn.addEventListener('click', pause, false)
    resetBtn.addEventListener('click', reset, false)
}

window.addEventListener('load', main, false)