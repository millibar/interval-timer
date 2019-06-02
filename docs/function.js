/**
 * 数値（秒）をmm:ss形式の文字列に変換する
 * @param {number} t 秒
 * @return {string} mm:ss形式の文字列。たとえば　95 => 01:35
 */
const secToTimeLabel = (t) => {
    let sec = t % 60
    let min = (t - sec) / 60
    if (min < 100) {
        return `${('00' + min).slice(-2)}:${('00' + sec).slice(-2)}`
    } else {
        return `${min}:${('00' + sec).slice(-2)}`
    }
    
}
/*
var testCase = {0:'00:00', 1:'00:01', 59:'00:59', 60:'01:00', 61:'01:01', 95:'01:35', 681:'11:21', 5999:'99:59', 7200:'120:00', 37180:'619:40'}

for (let key in testCase) {
    let result = secToTimeLabel(key)
    let expected = testCase[key]
    if (result !== expected) {
        console.log(`secToTimeLabel (${key}): result: ${result}, expected: ${expected}`)
    }
}
*/

/**
 * ボタンを無効化する
 * @param {HTMLelement} button 
 */
const disableBtn = (button) => {
    button.disabled = 'disabled'
    button.classList.add('disabled')
}

/**
 * ボタンを有効化する
 * @param {HTMLelement} button 
 */
const enableBtn = (button) => {
    button.disabled = null
    button.classList.remove('disabled')
}