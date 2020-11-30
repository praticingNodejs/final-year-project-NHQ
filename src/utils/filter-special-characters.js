export default (str, _props) => {
    str = String(str)
    const regex = /[^\p{L}\p{N}]+/gu
    let result = str.replace(regex, ' ')
    return result
}
