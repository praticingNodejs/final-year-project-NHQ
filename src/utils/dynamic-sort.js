// Key in one object
export const dynamicSort = (property) => {

    let sortOrder = 1
    if (property[0] === '-') {
        sortOrder = -1
        property = property.substr(1)
    }
    return (a, b) => {
        let result = (a[property] < b[property]) ? -1 : (a[property] > b[property]) ? 1 : 0
        return result * sortOrder
    }
}

export const dynamicSortMultiple = (...args) => {

    let props = args
    return (obj1, obj2) => {
        let i = 0, result = 0, numberOfProperties = props.length
        while (result === 0 && i < numberOfProperties) {
            result = dynamicSort(props[i])(obj1, obj2)
            i++
        }
        return result
    }
}


/**
 * Deep level sort. Sort an array of objects based on a value of field in deep level
 * @param {String} property
 * Example:
 * arr = [{user: {id: 1, name:'AAAAA}}, {user: {id: 1, name:'BBBBB'}}]
 * arr.sort(dynamicSort('user.name'))
 */
export const dynamicSortMultilevel = (property) => {

    let sortOrder = 1
    if (property[0] === '-') {
        sortOrder = -1
        property = property.substr(1)
    }
    let destructuredProperty
    if (property.includes('.')) {
        destructuredProperty = property.split('.')
    } else {
        destructuredProperty = property
    }

    return (a, b) => {
        a = destructuredProperty.reduce((acc, next) => {
            acc = acc[next]
            return acc
        }, a)

        b = destructuredProperty.reduce((acc, next) => {
            acc = acc[next]
            return acc
        }, b)

        if (typeof a === 'string') a = a.toLowerCase()
        if (typeof b === 'string') b = b.toLowerCase()
        let result = (a < b) ? -1 : (a > b) ? 1 : 0
        return result * sortOrder
    }

}
