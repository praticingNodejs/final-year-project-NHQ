// See http://docs.sequelizejs.com/en/latest/docs/models-definition/
// for more of what you can do here.
import { DataTypes } from 'sequelize'

export default function (app) {
    const sequelizeClient = app.get('sequelizeClient')
    const cmsContactDetail = sequelizeClient.define('cms_contact_detail', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, allowNull: false, primaryKey: true, field: 'id' },
        email: { type: DataTypes.STRING, unique: true, field: 'email' },
        faxNo: { type: DataTypes.STRING, field: 'fax_no' },
        telNo: { type: DataTypes.STRING, field: 'tel_no' },
        address: { type: DataTypes.STRING, field: 'address' }
    }, {
        hooks: {
            beforeCount(options) {
                options.raw = true
            }
        }
    })

    // eslint-disable-next-line no-unused-vars
    cmsContactDetail.associate = function (models) {
        // Define associations here
        // See http://docs.sequelizejs.com/en/latest/docs/associations/
    }

    return cmsContactDetail
}
