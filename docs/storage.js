/**
 * ローカルストレージ
 */
class Storage {
    constructor (app) {
        this.app = app // アプリ名
        this.storage = localStorage
        this.data = JSON.parse(this.storage[this.app]|| '{}')
    }

    getItem (key) {
        if (this.data[key] !== undefined) {
            return this.data[key]
        } else {
            return undefined
        }
    }
    
    setItem (key, value) {
        this.data[key] = value
    }

    save () {
        this.storage[this.app] = JSON.stringify(this.data)
    }
}