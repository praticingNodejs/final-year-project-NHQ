// See http://docs.sequelizejs.com/en/latest/docs/models-definition/
// for more of what you can do here.
import { DataTypes } from 'sequelize'

export default function (app) {
    const sequelizeClient = app.get('sequelizeClient')
    const emailRmsUsers = sequelizeClient.define('email_rms_users', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, allowNull: false, primaryKey: true, field: 'id' },
        emailRuleId: { type: DataTypes.INTEGER, allowNull: false, field: 'email_rule_id' },
        userId: { type: DataTypes.UUID, allowNull: false, field: 'user_id' },
        companyId: { type: DataTypes.INTEGER, field: 'company_id' }
    }, {
        hooks: {
            beforeCount(options) {
                options.raw = true
            }
        }
    })

    // eslint-disable-next-line no-unused-vars
    emailRmsUsers.associate = function (models) {
        // Define associations here
        // See http://docs.sequelizejs.com/en/latest/docs/associations/
    }

    return emailRmsUsers
}
