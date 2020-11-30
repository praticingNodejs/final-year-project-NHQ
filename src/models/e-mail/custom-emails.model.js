// See http://docs.sequelizejs.com/en/latest/docs/models-definition/
// for more of what you can do here.
import { DataTypes } from 'sequelize'

export default function (app) {
    const sequelizeClient = app.get('sequelizeClient')
    const customEmails = sequelizeClient.define('custom_emails', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, allowNull: false, primaryKey: true, field: 'id' },
        emailType: { type: DataTypes.SMALLINT, field: 'email_type' },
        userType: { type: DataTypes.SMALLINT, field: 'user_type' },
        sentDate: { type: DataTypes.DATE, field: 'sent_date' },
        emailSubject: { type: DataTypes.STRING, field: 'email_subject' },
        emailContent: { type: DataTypes.TEXT, field: 'email_content' },
        sentBy: { type: DataTypes.UUID, field: 'sent_by' },
        emailFrom: { type: DataTypes.STRING, field: 'email_from' },
        createdBy: { type: DataTypes.UUID, field: 'created_by' },
        updatedBy: { type: DataTypes.UUID, field: 'updated_by' },
        createdAt: { type: DataTypes.DATE, field: 'created_at' },
        updatedAt: { type: DataTypes.DATE, field: 'updated_at' }
    }, {
        hooks: {
            beforeCount(options) {
                options.raw = true
            }
        }
    })

    // eslint-disable-next-line no-unused-vars
    customEmails.associate = function (models) {
        // Define associations here
        // See http://docs.sequelizejs.com/en/latest/docs/associations/
    }

    return customEmails
}
