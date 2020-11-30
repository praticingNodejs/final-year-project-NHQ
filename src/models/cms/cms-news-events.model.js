// See http://docs.sequelizejs.com/en/latest/docs/models-definition/
// for more of what you can do here.
import { DataTypes } from 'sequelize'

export default function (app) {
    const sequelizeClient = app.get('sequelizeClient')
    const cmsNewsEvents = sequelizeClient.define('cms_news_events', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, allowNull: false, primaryKey: true, field: 'id' },
        imagePath: { type: DataTypes.STRING, field: 'image_path' },
        heading: { type: DataTypes.STRING, field: 'heading' },
        description: { type: DataTypes.STRING, field: 'description' },
        isActive: { type: DataTypes.SMALLINT, defaultValue: 1, field: 'is_active' },
        startDate: { type: DataTypes.DATE, field: 'start_date' },
        endDate: { type: DataTypes.DATE, field: 'end_date' },
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
    cmsNewsEvents.associate = function (models) {
        // Define associations here
        // See http://docs.sequelizejs.com/en/latest/docs/associations/
        cmsNewsEvents.belongsTo(models.users, { foreignKey: 'createdBy', targetKey: 'id', as: 'created_by' })
        cmsNewsEvents.belongsTo(models.users, { foreignKey: 'updatedBy', targetKey: 'id', as: 'updated_by' })
    }

    return cmsNewsEvents
}
