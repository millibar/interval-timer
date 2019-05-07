const main = () => {
    console.log('main loaded')
    
    const storage = new Storage ('intervalTimer')

    const totalTimeLabel = document.getElementById('setting-total-label')
    const activityTimeLabel = document.getElementById('setting-activity-label')
    const intervalTimeLabel = document.getElementById('setting-interval-label')
    const setCountLabel = document.getElementById('setting-set-label')

    const inputActivity_min =  document.getElementById('setting-activity-min')
    const inputInterval_min =  document.getElementById('setting-interval-min')
    const inputActivity_sec =  document.getElementById('setting-activity-sec')
    const inputInterval_sec =  document.getElementById('setting-interval-sec')
    const inputSet =  document.getElementById('setting-set')
    const inputLastInterval = document.getElementById('setting-has-last-interval')
    const inputSound = document.getElementById('setting-sound')

    // ローカルストレージの値を読み込む。値がなければデフォルト値
    let activityTime = Number(storage.getItem('activityTime')) || 20
    let intervalTime = Number(storage.getItem('intervalTime')) || 10
    let setNumber = Number(storage.getItem('setNumber')) || 8
    
    let hasLastInterval = storage.getItem('hasLastInterval')
    if (hasLastInterval === undefined) {
        hasLastInterval = inputLastInterval.checked
    }

    let useSound = storage.getItem('useSound')
    if (useSound === undefined) {
        useSound = inputSound.checked
    }

    // input要素にローカルストレージから取り出した値をセットする
    let activity_sec = activityTime % 60
    let activity_min = activityTime - activity_sec
    let interval_sec = intervalTime % 60
    let interval_min = intervalTime - interval_sec

    inputActivity_min.value = activity_min
    inputActivity_sec.value = activity_sec
    inputInterval_min.value = interval_min
    inputInterval_sec.value = interval_sec
    inputSet.value = setNumber
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

    // input要素の値の変更を画面に反映し、ローカルストレージに仮設定する
    const update = () => {
        let activityTime = Number(inputActivity_min.value) * 60 + Number(inputActivity_sec.value)
        let intervalTime = Number(inputInterval_min.value) * 60 + Number(inputInterval_sec.value)
        let setNumber = Number(inputSet.value)
        let hasLastInterval = inputLastInterval.checked
        let useSound = inputSound.checked

        if (activityTime === 0) {
            activityTime = 1
            inputActivity_sec.value = 1
        }

        activityTimeLabel.textContent = secToTimeLabel (activityTime)
        intervalTimeLabel.textContent = secToTimeLabel (intervalTime) 
        setCountLabel.textContent = setNumber

        let totalTime = activityTime * setNumber + intervalTime * (setNumber - 1)
        if (hasLastInterval) totalTime += intervalTime
        totalTimeLabel.textContent = secToTimeLabel (totalTime)

        storage.setItem('activityTime', activityTime)
        storage.setItem('intervalTime', intervalTime)
        storage.setItem('setNumber', setNumber)
        storage.setItem('hasLastInterval', hasLastInterval)
        storage.setItem('useSound', useSound)
    }

    // input要素の値が変更されたら画面に反映し、storageに仮設定する
    const inputs = document.getElementsByTagName('input')
    for (let input of inputs) {
        input.addEventListener('change', update, false)
    }

    update ()

    // ページを離れるときにstorageの仮設定を保存する
    const saveSetting = () => {
        storage.save()
    }

    window.addEventListener('beforeunload', saveSetting, false)
}

window.addEventListener('load', main, false)