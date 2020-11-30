// See http://docs.sequelizejs.com/en/latest/docs/models-definition/
// for more of what you can do here.
import { DataTypes } from 'sequelize'

export default function (app) {
    const sequelizeClient = app.get('sequelizeClient')
    const tbbDocuments = sequelizeClient.define('tbb_documents', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, allowNull: false, primaryKey: true, field: 'id' },
        documentName: { type: DataTypes.STRING, field: 'document_name' },
        documentPath: { type: DataTypes.STRING, field: 'document_file_path' },
        documentOriginalFileName: { type: DataTypes.STRING, field: 'document_original_file_name' },
        companyId: { type: DataTypes.INTEGER, field: 'company_id' },
        folderName: { type: DataTypes.STRING, field: 'folder_name' },
        folderPath: { type: DataTypes.STRING, field: 'folder_path' }, // hash md5 from client
        isRootFolder: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'is_root_folder' },
        createdAt: { type: DataTypes.DATE, field: 'created_at' }
    }, {
        hooks: {
            beforeCount(options) {
                options.raw = true
            }
        }
    })

    // eslint-disable-next-line no-unused-vars
    tbbDocuments.associate = function (models) {
        // Define associations here
        // See http://docs.sequelizejs.com/en/latest/docs/associations/
        tbbDocuments.belongsTo(models.companies, { foreignKey: 'companyId', targetKey: 'id', as: 'company_id' })
    }

    return tbbDocuments
}
