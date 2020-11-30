// See http://docs.sequelizejs.com/en/latest/docs/models-definition/
// for more of what you can do here.
import { DataTypes } from 'sequelize'

export default function (app) {
    const sequelizeClient = app.get('sequelizeClient')
    const resumeEditReason = sequelizeClient.define('resume_edit_reason', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, allowNull: false, primaryKey: true, field: 'id' },
        resumeId: { type: DataTypes.INTEGER, field: 'resume_id' },
        reason: { type: DataTypes.STRING, field: 'reason' },
        updatedBy: { type: DataTypes.UUID, allowNull: false, field: 'updated_by' },
        createdAt: { type: DataTypes.DATE, field: 'updated_at' }
    }, {
        hooks: {
            beforeCount(options) {
                options.raw = true
            }
        }
    })

    // eslint-disable-next-line no-unused-vars
    resumeEditReason.associate = function (models) {
        // Define associations here
        // See http://docs.sequelizejs.com/en/latest/docs/associations/
    }

    return resumeEditReason
}
