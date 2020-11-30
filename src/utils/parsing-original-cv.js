import path from 'path'
import pdfParser from 'pdf-parse'
import mammoth from 'mammoth'
import WordExtractor from 'word-extractor'

const getFilePath = (name) => {
    return path.resolve(
        path.join('public', 'resume-upload-file') + '/' + name
    )
}

export const pdf = async (buffer) => {
    const original = await pdfParser(buffer).catch(err => {
        return err
    })
    return original.text
}

export const docx = async (name) => {
    const filePath = getFilePath(name)

    const original = await mammoth.extractRawText({ path: filePath }).then(result => {
        const finalResume = []
        const text = result.value // raw value
        let textLines = text.split('\n')

        for (let i = 0; i < textLines.length; i++) {
            //this prints all the data in separate lines
            finalResume.push(textLines[i])
        }

        return finalResume.join('\n')
    }).catch(err => { return err })

    return original
}

export const doc = async (name) => {
    const filePath = getFilePath(name)

    const extractor = new WordExtractor()
    return await extractor.extract(filePath).then(result => {
        return result.getBody()
    }).catch(err => {
        return err
    })
}
