export default (obj, props) => {
    let clone = JSON.parse(JSON.stringify(obj))
    for (let key in obj) {
        if (props.includes(key)) {
            delete clone[key]
            continue
        }
    }
    return clone
}