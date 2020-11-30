// See http://docs.sequelizejs.com/en/latest/docs/models-definition/
// for more of what you can do here.
import { DataTypes } from 'sequelize'

export default function (app) {
    const sequelizeClient = app.get('sequelizeClient')
    const resumeMessengers = sequelizeClient.define('resume_messengers', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, allowNull: false, primaryKey: true, field: 'id' },
        resumeId: { type: DataTypes.INTEGER, allowNull: false, field: 'resume_id' },
        messengerType: { type: DataTypes.STRING, field: 'messenger_type' },
        messengerAccount: { type: DataTypes.STRING, field: 'messenger_account' },
    }, {
        hooks: {
            beforeCount(options) {
                options.raw = true
            }
        }
    })

    // eslint-disable-next-line no-unused-vars
    resumeMessengers.associate = function (models) {
        // Define associations here
        // See http://docs.sequelizejs.com/en/latest/docs/associations/
        resumeMessengers.belongsTo(models.resume, { foreignKey: 'resumeId', targetKey: 'id', as: 'resume_id' })
    }

    return resumeMessengers
}
