// See http://docs.sequelizejs.com/en/latest/docs/models-definition/
// for more of what you can do here.
import { DataTypes } from 'sequelize'

export default function (app) {
    const sequelizeClient = app.get('sequelizeClient')
    const cmsContactUs = sequelizeClient.define('cms_contact_us', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, allowNull: false, primaryKey: true, field: 'id' },
        firstName: { type: DataTypes.STRING, field: 'first_name' },
        lastName: { type: DataTypes.STRING, field: 'last_name' },
        designation: { type: DataTypes.STRING, field: 'designation' },
        industry: { type: DataTypes.STRING, field: 'industry' },
        email: { type: DataTypes.STRING, field: 'email' },
        contact: { type: DataTypes.STRING, field: 'contact' },
        message: { type: DataTypes.STRING, field: 'message' },
        createdAt: { type: DataTypes.DATE, field: 'created_at' },
    }, {
        hooks: {
            beforeCount(options) {
                options.raw = true
            }
        }
    })

    // eslint-disable-next-line no-unused-vars
    cmsContactUs.associate = function (models) {
        // Define associations here
        // See http://docs.sequelizejs.com/en/latest/docs/associations/
    }

    return cmsContactUs
}
