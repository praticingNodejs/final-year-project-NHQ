// See http://docs.sequelizejs.com/en/latest/docs/models-definition/
import { DataTypes } from 'sequelize'

export default function (app) {
    const sequelizeClient = app.get('sequelizeClient')
    const rmsUsersInfo = sequelizeClient.define('rms_users_info', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, allowNull: false, primaryKey: true, field: 'id' },
        userId: { type: DataTypes.UUID, allowNull: false, field: 'user_id' },
        firstName: { type: DataTypes.STRING, field: 'first_name' },
        lastName: { type: DataTypes.STRING, field: 'last_name' },
        contact: { type: DataTypes.STRING, field: 'contact' },
        status: { type: DataTypes.SMALLINT, defaultValue: 1, field: 'status' },
        emailSign: { type: DataTypes.STRING, field: 'email_sign' },
        emailSign1: { type: DataTypes.STRING, field: 'email_sign1' },
        signEmail: { type: DataTypes.STRING, field: 'sign_email' },
        signEmail1: { type: DataTypes.STRING, field: 'sign_email1' },
        dob: { type: DataTypes.DATE, field: 'dob' },
        epExpireDate: { type: DataTypes.DATE, field: 'ep_expire_date' },
        alternativeContact: { type: DataTypes.STRING, field: 'alternative_contact' },
        nationalityId: { type: DataTypes.INTEGER, field: 'nationality_id' },
        sgpResidentialStatus: { type: DataTypes.INTEGER, field: 'sgp_residential_status' },
        accountManagerName: { type: DataTypes.STRING, field: 'account_manager_name' },
        companyId: { type: DataTypes.INTEGER, field: 'company_id' },
        locationId: { type: DataTypes.INTEGER, field: 'location_id' },
        isFirstTimeLogin: { type: DataTypes.BOOLEAN, defaultValue: true, field: 'is_first_time_login' },
        lastLoggedInTime: { type: DataTypes.DATE, field: 'last_logged_in_time' },
        createdAt: { type: DataTypes.DATE, field: 'created_at' }
    }, {
        hooks: {
            beforeCount(options) {
                options.raw = true
            }
        }
    })

    // eslint-disable-next-line no-unused-vars
    rmsUsersInfo.associate = function (models) {
        // Define associations here
        // See http://docs.sequelizejs.com/en/latest/docs/associations/
        rmsUsersInfo.belongsTo(models.users, { foreignKey: 'userId', targetKey: 'id', as: 'user_id' })
        rmsUsersInfo.belongsTo(models.locations, { foreignKey: 'locationId', targetKey: 'id', as: 'location_id' })
        rmsUsersInfo.belongsTo(models.companies, { foreignKey: 'companyId', targetKey: 'id', as: 'company_id' })
        rmsUsersInfo.belongsTo(models.nationalities, { foreignKey: 'nationalityId', targetKey: 'id', as: 'nationality_id' })
        rmsUsersInfo.belongsTo(models.sgp_residential_status, { foreignKey: 'sgpResidentialStatus', targetKey: 'id', as: 'residentialStatus' })
    }

    return rmsUsersInfo
}
