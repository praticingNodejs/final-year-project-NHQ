// See http://docs.sequelizejs.com/en/latest/docs/models-definition/
// for more of what you can do here.
import { DataTypes } from 'sequelize'

export default function (app) {
    const sequelizeClient = app.get('sequelizeClient')
    const resumeSectors = sequelizeClient.define('resume_sectors', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, allowNull: false, primaryKey: true, field: 'id' },
        resumeId: { type: DataTypes.INTEGER, allowNull: false, field: 'resume_id' },
        sectorId: { type: DataTypes.INTEGER, allowNull: false, field: 'sector_id' }
    }, {
        hooks: {
            beforeCount(options) {
                options.raw = true
            }
        }
    })

    // eslint-disable-next-line no-unused-vars
    resumeSectors.associate = function (models) {
        // Define associations here
        // See http://docs.sequelizejs.com/en/latest/docs/associations/
        resumeSectors.belongsTo(models.resume, { foreignKey: 'resumeId', targetKey: 'id', as: 'resume_id' })
        resumeSectors.belongsTo(models.sectors, { foreignKey: 'sectorId', targetKey: 'id', as: 'sector_id' })
    }

    return resumeSectors
}
