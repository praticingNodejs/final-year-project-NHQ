// See http://docs.sequelizejs.com/en/latest/docs/models-definition/
// for more of what you can do here.
import { DataTypes } from 'sequelize'

export default function (app) {
    const sequelizeClient = app.get('sequelizeClient')
    const resumeContacts = sequelizeClient.define('resume_contacts', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, allowNull: false, primaryKey: true, field: 'id' },
        resumeId: { type: DataTypes.INTEGER, allowNull: false, field: 'resume_id' },
        category: { type: DataTypes.INTEGER, field: 'category' },
        value: { type: DataTypes.STRING, field: 'value' },
    }, {
        hooks: {
            beforeCount(options) {
                options.raw = true
            }
        }
    })

    // eslint-disable-next-line no-unused-vars
    resumeContacts.associate = function (models) {
        // Define associations here
        // See http://docs.sequelizejs.com/en/latest/docs/associations/
        resumeContacts.belongsTo(models.resume, { foreignKey: 'resumeId', targetKey: 'id', as: 'resumeContact' })
    }

    return resumeContacts
}
