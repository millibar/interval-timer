/**
 * body要素のheightを基準として各要素のサイズを決める。
 */
const init = () => {
    console.log('init loaded')
    const html = document.getElementsByTagName('html')[0]
    const body = document.getElementsByTagName('body')[0]
    const h1 = document.getElementsByTagName('h1')[0]
    const toTimer = document.getElementById('to-timer')

    const resize = () => {
        const unitHeight = body.clientHeight * devicePixelRatio
            
        html.style.fontSize = `${unitHeight / 36}px`

        body.style.width = `${unitHeight * 9 / 16}px`
        
        const h1Heihgt = unitHeight * 8 / 100
        

        h1.style.height = `${h1Heihgt}px`
        h1.style.lineHeight = h1.style.height
        
        toTimer.style.height = `${h1Heihgt}px`
        toTimer.style.lineHeight = h1.style.height
    }

    resize()

    window.addEventListener('resize', resize, false)
}

window.addEventListener('load', init, false)