/**
 * body要素のheightを基準として各要素のサイズを決める。
 */
const init = () => {
    console.log('init loaded')
    const html = document.getElementsByTagName('html')[0]
    const body = document.getElementsByTagName('body')[0]
    const h1 = document.getElementsByTagName('h1')[0]
    const toSetting = document.getElementById('to-setting')
    const settingInfo = document.getElementById('setting-info')
    const indicator = document.getElementById('indicator')
    const buttons = document.getElementById('buttons')

    const resize = () => {
        const unitHeight = body.clientHeight * devicePixelRatio
            
        html.style.fontSize = `${unitHeight / 36}px`

        body.style.width = `${unitHeight * 9 / 16}px`

        const h1Heihgt = unitHeight * 8 / 100
        

        h1.style.height = `${h1Heihgt}px`
        h1.style.lineHeight = h1.style.height
        toSetting.style.width = `${h1Heihgt / 2}px`
        toSetting.style.height = toSetting.style.width
        toSetting.style.top = `${h1Heihgt / 4}px`
        settingInfo.style.height = `${unitHeight * 12 / 100}px`
        indicator.style.height = `${unitHeight * 50 / 100}px`
        buttons.style.height = `${unitHeight * 30 / 100}px`
    }

    resize()

    window.addEventListener('resize', resize, false)
}

window.addEventListener('load', init, false)