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

        activityDetail.classList.toggle('open')
        intervalDetail.classList.remove('open')
        setDetail.classList.remove('open')
    }, false)

    const intervalSummary = document.querySelector('#setting-interval summary')
    intervalSummary.addEventListener('click', (event) => {
        activityDetail.removeAttribute('open')
        setDetail.removeAttribute('open')

        intervalDetail.classList.toggle('open')
        activityDetail.classList.remove('open')
        setDetail.classList.remove('open')
    }, false)

    const setSummary = document.querySelector('#setting-set summary')
    setSummary.addEventListener('click', (event) => {
        activityDetail.removeAttribute('open')
        intervalDetail.removeAttribute('open')

        setDetail.classList.toggle('open')
        activityDetail.classList.remove('open')
        intervalDetail.classList.remove('open')
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