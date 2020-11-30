// See http://docs.sequelizejs.com/en/latest/docs/models-definition/
// for more of what you can do here.
import { DataTypes } from 'sequelize'

export default function (app) {
    const sequelizeClient = app.get('sequelizeClient')
    const mailLogs = sequelizeClient.define('mail_logs', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, allowNull: false, primaryKey: true, field: 'id' },
        fromUser: { type: DataTypes.STRING, allowNull: false, field: 'from_user' },
        toUser: { type: DataTypes.STRING, allowNull: false, field: 'to_user' },
        bcc: { type: DataTypes.STRING, field: 'bcc' },
        subject: { type: DataTypes.STRING, field: 'subject', allowNull: false },
        content: { type: DataTypes.TEXT, field: 'content' },
        status: { type: DataTypes.STRING, enum: ['reject', 'error', 'waiting', 'success'], defaultValue: 'waiting', field: 'status' },
        sentCount: { type: DataTypes.SMALLINT, defaultValue: 0, allowNull: false, field: 'sent_count' },
        lastSentAt: { type: DataTypes.DATE, allowNull: false, field: 'last_sent_at' },
        senderId: {type: DataTypes.UUID, field: 'sender_id'}
    }, {
        hooks: {
            beforeCount(options) {
                options.raw = true
            }
        }
    })

    // eslint-disable-next-line no-unused-vars
    mailLogs.associate = function (models) {
        // Define associations here
        // See http://docs.sequelizejs.com/en/latest/docs/associations/
    }

    return mailLogs
}
