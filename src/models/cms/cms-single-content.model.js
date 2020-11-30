// See http://docs.sequelizejs.com/en/latest/docs/models-definition/
// for more of what you can do here.
import { DataTypes } from 'sequelize'

export default function (app) {
    const sequelizeClient = app.get('sequelizeClient')
    const cmsSingleContent = sequelizeClient.define('cms_single_content', {
        category: { type: DataTypes.STRING, allowNull: false, primaryKey: true, field: 'category' },
        content: { type: DataTypes.STRING, field: 'content' },
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
    cmsSingleContent.associate = function (models) {
        // Define associations here
        // See http://docs.sequelizejs.com/en/latest/docs/associations/
        cmsSingleContent.belongsTo(models.users, { foreignKey: 'updatedBy', targetKey: 'id', as: 'updated_by' })
    }

    return cmsSingleContent
}
