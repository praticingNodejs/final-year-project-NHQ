import crypto from 'crypto'

export default (pass, salt) => {
    let bytes = new Buffer.from(pass || '', 'utf16le')
    let src = new Buffer.from(salt || '', 'base64')
    let dst = new Buffer.alloc(src.length + bytes.length)
    src.copy(dst, 0, 0, src.length)
    bytes.copy(dst, src.length, 0, bytes.length)

    return crypto.createHash('sha1').update(dst).digest('base64')
}