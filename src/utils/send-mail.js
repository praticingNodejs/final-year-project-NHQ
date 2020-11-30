import AWS from 'aws-sdk'
import app from '../app'

// AWS.config.update({
//     accessKeyId: process.env.SES_SMTP_USER_NAME,
//     secretAccessKey: process.env.SES_SMTP_PASSWORD,
//     region: process.env.SES_REGION
// })

export default (mailObject) => {
    const { to, subject, html, from, replyTo, bcc } = mailObject

    const toUser = Array.isArray(to) ? [...to] : [to]
    const bccUser = bcc ? Array.isArray(bcc) ? [...bcc] : [bcc] : []
    const params = {
        Destination: {
            ToAddresses: [...toUser],
            CcAddresses: [...bccUser]
        },
        Message: {
            Body: {
                Html: {
                    Charset: 'UTF-8',
                    Data: html
                },
            },
            Subject: {
                Charset: 'UTF-8',
                Data: subject
            }
        },
        Source: from,
        ReplyToAddresses: [replyTo]
    }

    const sesPromise = new AWS.SES({
        accessKeyId: process.env.SES_SMTP_USER_NAME,
        secretAccessKey: process.env.SES_SMTP_PASSWORD,
        region: process.env.SES_REGION,
        apiVersion: '2010-12-01'
    }).sendEmail(params).promise()

    let mailLogData = {
        fromUser: from,
        toUser: Array.isArray(to) ? to.join(',') : to,
        bcc: bcc && bcc.length > 0 ? bcc.join(',') : null,
        subject: subject,
        content: html,
        status: 'success',
        sentCount: 1
    }

    sesPromise
        .then(res => {
            mailLogData.status = 'success'
            app.service('mail-logs').create(mailLogData)
            return res
        })
        .catch(err => {
            mailLogData.status = 'error'
            mailLogData.content = err.stack
            app.service('mail-logs').create(mailLogData)
            return err
        })
    return sesPromise
}
