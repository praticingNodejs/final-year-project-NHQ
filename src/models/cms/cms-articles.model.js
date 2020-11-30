// See http://docs.sequelizejs.com/en/latest/docs/models-definition/
// for more of what you can do here.
import { DataTypes } from 'sequelize'

export default function (app) {
    const sequelizeClient = app.get('sequelizeClient')
    const cmsArticles = sequelizeClient.define('cms_articles', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, allowNull: false, primaryKey: true, field: 'id' },
        title: { type: DataTypes.STRING, field: 'title' },
        content: { type: DataTypes.STRING, field: 'content' },
        imagePath: { type: DataTypes.STRING, field: 'image_path' },
        articleLink: { type: DataTypes.STRING, field: 'article_link' },
        createdAt: { type: DataTypes.DATE, field: 'created_at'},
        updatedAt: { type: DataTypes.DATE, field: 'updated_at' }
    }, {
        hooks: {
            beforeCount(options) {
                options.raw = true
            }
        }
    })

    // eslint-disable-next-line no-unused-vars
    cmsArticles.associate = function (models) {
        // Define associations here
        // See http://docs.sequelizejs.com/en/latest/docs/associations/
    }

    return cmsArticles
}
