// See http://docs.sequelizejs.com/en/latest/docs/models-definition/
import { DataTypes } from 'sequelize'

export default function (app) {
    const sequelizeClient = app.get('sequelizeClient')
    const companies = sequelizeClient.define('companies', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, allowNull: false, primaryKey: true, field: 'id' },
        name: { type: DataTypes.STRING, allowNull: false, unique: true, field: 'name' },
        website: { type: DataTypes.STRING, allowNull: false, field: 'website' },
        profile: { type: DataTypes.STRING, field: 'profile' },
        tbbplTerms: { type: DataTypes.STRING, defaultValue: '', field: 'tbbpl_terms' },
        tbbplQuotation: { type: DataTypes.STRING, defaultValue: '', field: 'tbbpl_quotation' },
        regNo: { type: DataTypes.STRING, field: 'reg_no' },
        agencyNo: { type: DataTypes.STRING, field: 'agency_no' },
        dataProtection: { type: DataTypes.STRING, field: 'data_protection' },
        businessTerm: { type: DataTypes.STRING, field: 'business_term' },
        footerEmailAddress: { type: DataTypes.STRING, field: 'footer_email_address' },
        hiringProtocol: { type: DataTypes.STRING, defaultValue: '', field: 'hiring_protocol' },
        weekWorkDay: { type: DataTypes.STRING, defaultValue: '', field: 'week_work_day' },
        weekWorkHours: { type: DataTypes.STRING, defaultValue: '', field: 'week_work_hours' },
        benefit: { type: DataTypes.STRING, field: 'benefit' },
        // rating: { type: DataTypes.INTEGER, defaultValue: 0, validate: { min: 0, max: 100 } },
        address1: { type: DataTypes.STRING, defaultValue: '', field: 'address1' },
        address2: { type: DataTypes.STRING, defaultValue: '', field: 'address2' },
        address3: { type: DataTypes.STRING, defaultValue: '', field: 'address3' },
        country: { type: DataTypes.STRING, field: 'country' },
        postalCode: { type: DataTypes.STRING(10), field: 'postal_code' },
        createdBy: { type: DataTypes.UUID, field: 'created_by' },
        createdAt: { type: DataTypes.DATE, field: 'created_at' },
        updatedBy: { type: DataTypes.UUID, field: 'updated_by' },
        updatedAt: { type: DataTypes.DATE, field: 'updated_at' },
        status: { type: DataTypes.INTEGER, defaultValue: 1, field: 'status' },
        primaryName: { type: DataTypes.STRING, allowNull: false, field: 'primary_name' },
        primaryUserId: { type: DataTypes.UUID, field: 'primary_user_id' },
        imagePath: { type: DataTypes.STRING, field: 'image_path' },
        isFeatured: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'is_featured' },
        description: { type: DataTypes.STRING, field: 'description' },
        isResumeSearchSubscribed: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'is_resume_search_subscribed' },
        sendGeneratedPdf: { type: DataTypes.BOOLEAN, field: 'send_generated_pdf' },
        subscriptionStartDate: { type: DataTypes.DATE, allowNull: false, field: 'subscription_start_date' },
        subscriptionEndDate: { type: DataTypes.DATE, allowNull: false, field: 'subscription_end_date' },
        isCRMSSubscribed: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'is_crms_subscribed' },
        companyUrl: { type: DataTypes.STRING, field: 'company_url' },
        contact: { type: DataTypes.STRING, field: 'contact' },
        dob: { type: DataTypes.STRING, field: 'dob' },
        epExpireDate: { type: DataTypes.STRING, field: 'ep_expire_date' },
        alternativeContactNo: { type: DataTypes.STRING, field: 'alternative_contact_no' },
        nationality: { type: DataTypes.INTEGER, field: 'nationality' },
        residentialStatus: { type: DataTypes.INTEGER, field: 'residential_status' },
        userStatus: { type: DataTypes.INTEGER, field: 'user_status' },
        creditLeft: { type: DataTypes.INTEGER, field: 'credit_left' },
        portalDateFrequency: { type: DataTypes.INTEGER, field: 'portal_date_frequency' },
        isBrandedFormat: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'is_branded_format' }
    }, {
        hooks: {
            beforeCount(options) {
                options.raw = true
            }
        }
    })

    // eslint-disable-next-line no-unused-vars
    companies.associate = function (models) {
        // Define associations here
        // See http://docs.sequelizejs.com/en/latest/docs/associations/
        companies.hasMany(models.jobs, { foreignKey: 'companyId', targetKey: 'id', as: 'jobs' })

        // companies.belongsTo(models.users, { foreignKey: 'createdBy', targetKey: 'id', as: 'created_by' })
        // companies.belongsTo(models.users, { foreignKey: 'updatedBy', targetKey: 'id', as: 'updated_by' })
    }

    return companies
}
