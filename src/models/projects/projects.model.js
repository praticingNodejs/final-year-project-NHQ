// See http://docs.sequelizejs.com/en/latest/docs/models-definition/
// for more of what you can do here.
import { DataTypes } from 'sequelize'

export default function (app) {
    const sequelizeClient = app.get('sequelizeClient')
    const projects = sequelizeClient.define('projects', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, allowNull: false, primaryKey: true, field: 'id' },
        name: { type: DataTypes.STRING, field: 'name' },
        website: { type: DataTypes.STRING, field: 'website' },
        profile: { type: DataTypes.STRING, field: 'profile' },
        tbbplTerms: { type: DataTypes.STRING, field: 'tbbpl_terms' },
        tbbplQuotation: { type: DataTypes.STRING, field: 'tbbpl_quotation' },
        hiringProtocol: { type: DataTypes.STRING, field: 'hiring_protocol' },
        weekWorkDay: { type: DataTypes.STRING, field: 'week_work_day' },
        weekWorkHours: { type: DataTypes.STRING, field: 'week_work_hours' },
        otherBenefits: { type: DataTypes.STRING, field: 'other_benefits' },
        address1: { type: DataTypes.STRING, field: 'address1' },
        address2: { type: DataTypes.STRING, field: 'address2' },
        address3: { type: DataTypes.STRING, field: 'address3' },
        locationId: { type: DataTypes.INTEGER, field: 'location_id' },
        postalCode: { type: DataTypes.STRING, field: 'postal_code' },
        streetAddress: { type: DataTypes.STRING, field: 'street_address' },
        streetAddress2: { type: DataTypes.STRING, field: 'street_address_2' },
        phone: { type: DataTypes.STRING, field: 'phone' },
        status: { type: DataTypes.SMALLINT, defaultValue: 1, field: 'status' },
        primaryName: { type: DataTypes.STRING, field: 'primary_name' },
        primaryUserId: { type: DataTypes.UUID, field: 'primary_user_id' },
        imagePath: { type: DataTypes.STRING, field: 'image_path' },
        isFeatured: { type: DataTypes.INTEGER, field: 'is_featured' },
        oldHiringProtocol: { type: DataTypes.STRING, field: 'old_hiring_protocol' },
        aboutMe: { type: DataTypes.STRING, field: 'about_me' },
        companyId: { type: DataTypes.INTEGER, field: 'company_id' },
        totalWorkingHours: { type: DataTypes.STRING, field: 'total_working_hours' },
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
    projects.associate = function (models) {
        // Define associations here
        // See http://docs.sequelizejs.com/en/latest/docs/associations/
        projects.belongsTo(models.locations, { foreignKey: 'locationId', targetKey: 'id', as: 'locations' })
        projects.belongsTo(models.companies, { foreignKey: 'companyId', targetKey: 'id', as: 'company' })
        projects.belongsTo(models.users, { foreignKey: 'primaryUserId', targetKey: 'id', as: 'primary_user_id' })
        projects.belongsTo(models.users, { foreignKey: 'createdBy', targetKey: 'id', as: 'created_by' })
        projects.belongsTo(models.users, { foreignKey: 'updatedBy', targetKey: 'id', as: 'updated_by' })
    }

    return projects
}
