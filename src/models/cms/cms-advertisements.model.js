// See http://docs.sequelizejs.com/en/latest/docs/models-definition/
// for more of what you can do here.
import { DataTypes } from 'sequelize'

export default function (app) {
    const sequelizeClient = app.get('sequelizeClient')
    const cmsAdvertisements = sequelizeClient.define('cms_advertisements', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, allowNull: false, primaryKey: true, field: 'id' },
        imagePath: { type: DataTypes.STRING, field: 'image_path' },
        url: { type: DataTypes.STRING, field: 'url' },
        isActive: { type: DataTypes.SMALLINT, field: 'is_active' },
        isSideBarAd: { type: DataTypes.SMALLINT, field: 'is_side_bar_ad' },
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
    cmsAdvertisements.associate = function (models) {
        // Define associations here
        // See http://docs.sequelizejs.com/en/latest/docs/associations/
        cmsAdvertisements.belongsTo(models.users, { foreignKey: 'createdBy', targetKey: 'id', as: 'created_by' })
        cmsAdvertisements.belongsTo(models.users, { foreignKey: 'updatedBy', targetKey: 'id', as: 'updated_by' })
    }

    return cmsAdvertisements
}
