const main = () => {
    console.log('main loaded')
    
    const storage = new Storage ('intervalTimer')

    const totalTimeLabel = document.getElementById('setting-total-label')
    const activityTimeLabel = document.getElementById('setting-activity-label')
    const intervalTimeLabel = document.getElementById('setting-interval-label')
    const setCountLabel = document.getElementById('setting-set-label')

    const activity =  document.getElementById('setting-activity')
    const interval =  document.getElementById('setting-interval')
    const set =  document.getElementById('setting-set')
    const lastInterval = document.getElementById('setting-has-last-interval')
    const sound = document.getElementById('setting-sound')

    // ローカルストレージの値を読み込む
    const readStorage = (storage) => {
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

        activity.value = activityTime
        interval.value = intervalTime
        set.value = setNumber
        lastInterval.checked = hasLastInterval
        sound.checked = useSound
        
    }

    // input要素の値の変更を画面に反映する
    const update = () => {
        activityTimeLabel.textContent = secToTimeLabel (activity.value)
        intervalTimeLabel.textContent = secToTimeLabel (interval.value) 
        setCountLabel.textContent = set.value

        let totalTime = Number(activity.value) * Number(set.value) + Number(interval.value) * (Number(set.value) - 1)
        if (lastInterval.checked) totalTime += Number(interval.value)
        totalTimeLabel.textContent = secToTimeLabel (totalTime)

    }

    // input要素の値を一時的に保存しておく
    const tempSetting = () => {
        let activityTime = activity.value
        let intervalTime = interval.value
        let setNumber = set.value
        let hasLastInterval = lastInterval.checked
        let useSound = sound.checked

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
        input.addEventListener('change', tempSetting, false)
    }

    readStorage (storage)
    update ()
    tempSetting ()

    // ページを離れるときにstorageの仮設定を保存する
    const saveSetting = () => {
        storage.save()
    }

    window.addEventListener('beforeunload', saveSetting, false)
}

window.addEventListener('load', main, false)