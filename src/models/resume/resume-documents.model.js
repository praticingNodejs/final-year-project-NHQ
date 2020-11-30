// See http://docs.sequelizejs.com/en/latest/docs/models-definition/
// for more of what you can do here.
import { DataTypes } from 'sequelize'

export default function (app) {
    const sequelizeClient = app.get('sequelizeClient')
    const resumeDocuments = sequelizeClient.define('resume_documents', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, allowNull: false, primaryKey: true, field: 'id' },
        resumeId: { type: DataTypes.INTEGER, allowNull: false, field: 'resume_id' },
        docPath: { type: DataTypes.STRING, field: 'doc_path' },
        docOriginalName: { type: DataTypes.STRING, field: 'doc_original_name' },
    }, {
        hooks: {
            beforeCount(options) {
                options.raw = true
            }
        }
    })

    // eslint-disable-next-line no-unused-vars
    resumeDocuments.associate = function (models) {
        // Define associations here
        // See http://docs.sequelizejs.com/en/latest/docs/associations/
    }

    return resumeDocuments
}
