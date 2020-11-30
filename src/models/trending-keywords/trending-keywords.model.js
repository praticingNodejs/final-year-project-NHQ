// See http://docs.sequelizejs.com/en/latest/docs/models-definition/
// for more of what you can do here.
import { DataTypes } from 'sequelize'

export default function (app) {
    const sequelizeClient = app.get('sequelizeClient')
    const trendingKeywords = sequelizeClient.define('trending_keywords', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, allowNull: false, primaryKey: true, field: 'id' },
        text: { type: DataTypes.STRING, field: 'text', unique: true },
        count: { type: DataTypes.INTEGER, defaultValue: 1, allowNull: false, field: 'count' },
        isActive: { type: DataTypes.SMALLINT, field: 'is_active', defaultValue: 1 },
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
    trendingKeywords.associate = function (models) {
        // Define associations here
        // See http://docs.sequelizejs.com/en/latest/docs/associations/
    }

    return trendingKeywords
}
