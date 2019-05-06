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
        const files = ['count-down.mp3', 'count-up.mp3', 'finish.mp3']
        let audios = []
        for (let file of files) {
            let audio = new Audio()
            audio.src = `sound/${file}`
            audios.push(audio)
        }
        this.audios = audios
    }

    update (subtimer) {
        if (subtimer.currentTime <= 3 && subtimer.currentTime > 0) {
            let countDownSound = this.audios[0]
            countDownSound.play()
        }
    }

    /**
     * 特定の音声ファイルを再生する。0: count-down, 1: count-up, 2: finish
     * @param {number} index 
     */
    play (index) {
        let sound = this.audios[index]
        sound.play()
    }
}

/**
 * setIntervalで時間の経過を管理する。ObserverパターンのSubject役。
 * Observerとして、ReadyTimer, ActivitiTimer, IntervalTimerの３つのSubTimerと
 * TimeLabel, SetLabelの画面表示用のラベルを保持する。
 * タイマーの更新ごとに、各Observerに更新を通知する。
 */
class Timer {
    constructor (args) {
        this.totalTime = args['totalTime']
        this.currentTime = this.totalTime
        this.setNumber = args['setNumber']
        this.currentSetNumber = 0
        
        this.timeId = null   // setIntervalのID
        this.step = 0        // setIntervalごとにカウントアップし、一定値になったらcurrentTimeを減らす
        this.subtimers = []  // ReadyTimer, ActivityTimer, IntervalTimerを入れる
        this.index = 0       // 更新を通知するSubTimerを決める。
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
        this.timeId = window.setInterval (this.stepUp.bind(this),  25) // 1000/25 = 40 FPS
        this.subtimers[this.index].start()
    }

    // pauseBtnから呼ばれる。start()したタイマーを一時停止する。
    pause () {
        window.clearInterval(this.timeId)
        this.subtimers[this.index].pause()
    }

    // resetBtnから呼ばれる。
    reset () {
        window.clearInterval(this.timeId)
        this.subtimers[this.index].reset()
        this.currentTime = this.totalTime
        this.currentSetNumber = 0
        this.notify(this.labels)
        this.index = 0
        this.step = 0
    }

    // setIntervalごとに呼ばれる。stepが一定値になったらcountDown()を実行する。
    stepUp () {
        if (this.step < 40) {
            this.step += 1
        }

        if (this.step >= 40) {
            this.step = 0
            this.countDown()
        }
    }

    // stepが一定値になったら自身とSubTimerのcurrentTimeを減らす。
    countDown () {
        if (this.currentTime > 0) {
            if (this.index > 0) this.currentTime -= 1 // readyのときは総時間は減らさない

            this.subtimers[this.index].countDown(this)
            this.notify(this.labels)
        }

        // カウント0で完了
        if (this.currentTime <= 0) {
            window.clearInterval(this.timeId)

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
    }
}

/**
 * TimerのObserverのひとつであると同時に、Animator, TimeLabel, StyleLabelに対するSubjectでもある。
 * Timerが更新されると自身のObserverであるAnimator, TimeLabel, StyleLabelに通知する。
 */
class SubTimer {
    constructor (args) {
        this.totalTime = args['totalTime']
        this.currentTime = this.totalTime
        this.type = args['type'] // 'ready', 'activity', 'interval'
        this.animator = null
        this.labels = []
        this.soundPlayers = []
    }

    asignAnimator (animator) {
        this.animator = animator
    }

    addLabel (label) {
        this.labels.push(label)
    }

    addSoundPlayer (soundPlayer) {
        this.soundPlayers.push(soundPlayer)
    }

    // Observerに更新を通知する。引数にはthis.labelsを想定する。
    notify (observers) {
        observers.forEach (observer => observer.update(this)) 
    }

    // Timerから呼ばれる。アニメーションの開始をAnimatorに通知する。
    start () {
        this.notify (this.labels)
        if (this.animator) {
            this.animator.start()
            window.requestAnimationFrame(this.animate.bind(this))
        }
    }

    // Timerから呼ばれる。アニメーションの一時停止をAnimatorに通知する。
    pause () {
        if (this.animator) {
            this.animator.pause ()
        }
    }

    // Timerから呼ばれる。
    reset () {
        if (this.animator) {
            this.animator.reset ()
        }
        this.currentTime = this.totalTime
        this.notify (this.labels)
    }

    // TimerのcountDownごとに呼ばれる。
    countDown (timer) {
        if (this.currentTime > 0) {
            this.currentTime -= 1
            this.notify (this.labels)
            if (this.soundPlayers.length > 0) {
                this.notify (this.soundPlayers)
            }
        }

        // カウンタが0になっていればカウンタを戻し、Timerのインデックスを進めて次のSubTimerをstartする
        if (this.currentTime <= 0) {
            this.currentTime = this.totalTime
            
            if (timer.index + 1 < timer.subtimers.length) {

                // ready以外なら、#count-downをひっくり返す
                if (timer.index > 0) {
                    let hasIntervalTimer = false
                    for (let subtimer of timer.subtimers) {
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

                timer.index += 1
                timer.subtimers[timer.index].start()
            }
            switch (this.type) {
                case 'ready':
                    // readyLabelを隠す
                    this.labels[0].element.classList.add('invisible')
                    break
                case 'activity':
                    timer.currentSetNumber += 1
                    if (this.soundPlayers.length > 0) {
                        this.soundPlayers[0].play(1) // 1: count-up
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
        }
    }

    // 自身のrequestAnimationFrameごとに呼ばれる。Animatorに更新を通知する。
    animate () {
        this.animator.reqId = window.requestAnimationFrame(this.animate.bind(this))
        this.animator.update()
    }

}

/**
 * SubTimerのObserverのひとつ。requestAnimationFrameのリクエストごとにSubTimerから呼ばれる。
 */
class Animator {
    constructor (drawer, duration) {
        this.startTime = 0
        this.timeOffset = 0 // pauseしたときの時刻を保持しておく
        this.reqId = null
        this.drawer = drawer
        this.duration = duration
    }

    // アニメーション開始。前回の一時停止時からの経過時間を保持しておく。
    start () {
        const pausedTime = this.timeOffset
        const timeSincePause = performance.now() - pausedTime
        
        this.timeOffset = 0
        this.startTime = timeSincePause
    }

    // アニメーション一時停止。アニメーション開始時からの一時停止までの経過時間を保持しておく。
    pause () {
        const pausedTime = performance.now() - this.startTime

        this.timeOffset = pausedTime
        cancelAnimationFrame(this.reqId)
    }

    // 情報をリセットする。
    reset () {
        this.drawer.erase()
        this.startTime = 0
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

    // 描画ごとにここが呼ばれる
    update () {
        const currentTime = performance.now() - this.startTime
        const startValue = -90
        const endValue = 270
        const duration_ms = this.duration * 1000
        
        const angle = this.getProgress(currentTime, startValue, endValue, duration_ms)

        this.drawer.draw(angle)

        if (angle >= endValue) {
            cancelAnimationFrame(this.reqId)
            this.drawer.erase()
            //console.log('円を描くアニメ終わり')
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
    console.log('main loaded')
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
        canvas.width = maxWidth * devicePixelRatio
        canvas.height = maxWidth * devicePixelRatio

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

    // 総時間を計算する。readyTimeは含めない
    let totalTime = activityTime * setNumber + intervalTime * (setNumber - 1)
    if (hasLastInterval) totalTime += intervalTime

    console.log(`totalTime = ${totalTime}, readyTime = ${readyTime}`)

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

    // AnimatorにCicleDrawerを登録する
    const acivityAnimator = new Animator(activityDrawer, activityTime)
    const intervalAnimator = new Animator(intervalDrawer, intervalTime)

    // SubTimerにAnimatorを登録する
    activityTimer.asignAnimator(acivityAnimator)
    intervalTimer.asignAnimator(intervalAnimator)   

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

    startBtn.addEventListener('touchstart', start, false)
    pauseBtn.addEventListener('touchstart', pause, false)
    resetBtn.addEventListener('touchstart', reset, false)




}

window.addEventListener('load', main, false)