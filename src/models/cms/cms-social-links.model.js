// See http://docs.sequelizejs.com/en/latest/docs/models-definition/
// for more of what you can do here.
import { DataTypes } from 'sequelize'

export default function (app) {
    const sequelizeClient = app.get('sequelizeClient')
    const cmsSocialLinks = sequelizeClient.define('cms_social_links', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, allowNull: false, primaryKey: true, field: 'id' },
        name: { type: DataTypes.STRING, field: 'name' },
        socialLink: { type: DataTypes.STRING, field: 'social_link' },
        imagePath: { type: DataTypes.STRING, field: 'image_path' },
        isActive: { type: DataTypes.SMALLINT, defaultValue: 1, field: 'is_active' },
        companyId: { type: DataTypes.INTEGER, field: 'company_id' },
        addedByCrms: { type: DataTypes.BOOLEAN, field: 'added_by_crms' },
        updatedBy: { type: DataTypes.UUID, field: 'updated_by' },
        updatedAt: { type: DataTypes.DATE, field: 'updated_at' }
    }, {
        hooks: {
            beforeCount(options) {
                options.raw = true
            }
        }
    })

    // eslint-disable-next-line no-unused-vars
    cmsSocialLinks.associate = function (models) {
        // Define associations here
        // See http://docs.sequelizejs.com/en/latest/docs/associations/
        cmsSocialLinks.belongsTo(models.users, { foreignKey: 'updatedBy', targetKey: 'id', as: 'updated_by' })
    }

    return cmsSocialLinks
}
