// See http://docs.sequelizejs.com/en/latest/docs/models-definition/
// for more of what you can do here.
import { DataTypes } from 'sequelize'

export default function (app) {
    const sequelizeClient = app.get('sequelizeClient')
    const cmsBanner = sequelizeClient.define('cms_banner', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, allowNull: false, primaryKey: true, field: 'id' },
        imagePath: { type: DataTypes.STRING, field: 'image_path' },
        isActive: { type: DataTypes.SMALLINT, defaultValue: 0, field: 'is_active' },
        startDate: { type: DataTypes.DATE, field: 'start_date' },
        endDate: { type: DataTypes.DATE, field: 'end_date' },
        description: { type: DataTypes.STRING, field: 'description' },
        createdBy: { type: DataTypes.UUID, field: 'created_by' },
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
    cmsBanner.associate = function (models) {
        // Define associations here
        // See http://docs.sequelizejs.com/en/latest/docs/associations/
    }

    return cmsBanner
}
