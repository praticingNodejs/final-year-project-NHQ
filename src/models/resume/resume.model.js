// See http://docs.sequelizejs.com/en/latest/docs/models-definition/
// for more of what you can do here.
import { DataTypes } from 'sequelize'

export default function (app) {
    const sequelizeClient = app.get('sequelizeClient')
    const resume = sequelizeClient.define('resume', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, allowNull: false, primaryKey: true, field: 'id' },
        userId: { type: DataTypes.UUID, field: 'user_id' },
        firstName: { type: DataTypes.STRING, allowNull: false, field: 'first_name' },
        lastName: { type: DataTypes.STRING, field: 'last_name' },
        contactHome: { type: DataTypes.STRING, field: 'contact_home' },
        residentialAddress: { type: DataTypes.STRING, field: 'residential_address' },
        gender: { type: DataTypes.STRING, default: 'Male', field: 'gender' },
        dob: { type: DataTypes.DATE, field: 'dob' },
        passportNo: { type: DataTypes.STRING, field: 'passport_no' },
        nationalityId: { type: DataTypes.INTEGER, field: 'nationality_id' },
        nationalityOther: { type: DataTypes.STRING, field: 'nationality_other' },
        sgpResidentialStatus: { type: DataTypes.INTEGER, field: 'sgp_residential_status' },
        currentLocationId: { type: DataTypes.INTEGER, field: 'current_location_id' }, //old db: current_location
        empStatus: { type: DataTypes.INTEGER, field: 'emp_status' },
        availability: { type: DataTypes.INTEGER, field: 'availability' },
        salaryAmount: { type: DataTypes.INTEGER, field: 'salary_amount' },
        salaryFreq: { type: DataTypes.INTEGER, field: 'salary_freq' },
        salaryIsSgd: { type: DataTypes.INTEGER, field: 'salary_is_sgd' },
        salaryCurrency: { type: DataTypes.INTEGER, field: 'salary_currency' },
        otherBenefits: { type: DataTypes.STRING, field: 'other_benefits' },
        expSalaryAmount: { type: DataTypes.INTEGER, field: 'exp_salary_amount' },
        expSalaryFreq: { type: DataTypes.INTEGER, field: 'exp_salary_freq' },
        expSalaryIsSgd: { type: DataTypes.INTEGER, field: 'exp_salary_is_sgd' },
        expSalaryCurrency: { type: DataTypes.INTEGER, field: 'exp_salary_currency' },
        showSalary: { type: DataTypes.SMALLINT, defaultValue: 0, field: 'show_salary' },
        expOtherBenefits: { type: DataTypes.STRING, field: 'exp_other_benefits' },
        otherRemarks: { type: DataTypes.STRING, field: 'other_remarks' },
        remarks: { type: DataTypes.STRING, field: 'remarks' },
        educationId: { type: DataTypes.INTEGER, field: 'education_id' },
        educationalAward: { type: DataTypes.STRING, field: 'educational_award' },
        postalCode: { type: DataTypes.STRING, field: 'postal_code' },
        streetAddress: { type: DataTypes.STRING, field: 'street_address' },
        streetAddress2: { type: DataTypes.STRING, field: 'street_address_2' },
        instNameLoc: { type: DataTypes.STRING, field: 'inst_name_loc' },
        gradYear: { type: DataTypes.INTEGER, field: 'grad_year' },
        facultyId: { type: DataTypes.INTEGER, field: 'faculty_id' },
        awards: { type: DataTypes.STRING, field: 'awards' },
        otherQualifications: { type: DataTypes.STRING, field: 'other_qualifications' },
        careerSummary: { type: DataTypes.STRING, field: 'career_summary' },
        achievements: { type: DataTypes.STRING, field: 'achievements' },
        workExpTotal: { type: DataTypes.INTEGER, field: 'work_exp_total' },
        workExpRelevant: { type: DataTypes.STRING, field: 'work_exp_relevant' },
        resumeDetail: { type: DataTypes.JSON(), field: 'resume_detail' },
        resumePath: { type: DataTypes.STRING, field: 'resume_path' },
        resumePdfPath: { type: DataTypes.STRING, field: 'resume_pdf_path' }, // oldDb: resume_path_1
        resumeHashContent: { type: DataTypes.STRING, field: 'resume_hash_content' },
        referResume: { type: DataTypes.INTEGER, field: 'refer_resume' },
        photoPath: { type: DataTypes.STRING, field: 'photo_path' },
        isApproved: { type: DataTypes.SMALLINT, defaultValue: 0, field: 'is_approved' },
        policyAccepted: { type: DataTypes.INTEGER, field: 'policy_accepted' },
        originalResumeName: { type: DataTypes.STRING, field: 'original_resume_name' },
        resumeStripSearch: { type: DataTypes.STRING, field: 'resume_strip_search' },
        ftsStripSearch: { type: DataTypes.TEXT, field: 'fts_strip_search' },
        registerDeviceType: { type: DataTypes.STRING, field: 'register_device_type' },
        isPolicyApproved: { type: DataTypes.INTEGER, defaultValue: 0, field: 'is_policy_approved' },
        isUnsubscribe: { type: DataTypes.INTEGER, defaultValue: 0, field: 'is_unsubscribe' },
        employmentDetail: { type: DataTypes.STRING, field: 'employment_detail' },
        employmentRemark: { type: DataTypes.STRING, field: 'employment_remark' },
        unsubscribedOn: { type: DataTypes.DATE, field: 'unsubscribed_on' },
        profileStatus: { type: DataTypes.INTEGER, field: 'profile_status' },
        deactivationReason: { type: DataTypes.INTEGER, field: 'deactivation_reason' },
        deactivationComments: { type: DataTypes.STRING, field: 'deactivation_comments' },
        isProfileComplete: { type: DataTypes.INTEGER, defaultValue: 0, field: 'is_profile_complete' },
        isNewsLetterSubscribe: { type: DataTypes.INTEGER, defaultValue: 0, field: 'is_news_letter_subscribe' },
        isJobAlertsSubscribe: { type: DataTypes.INTEGER, defaultValue: 0, field: 'is_job_alerts_subscribe' },
        isProfileUpdateAlertSubscribe: { type: DataTypes.INTEGER, defaultValue: 1, field: 'is_profile_update_alert_subscribe' },
        isMyProfileViewsAlertSubscribe: { type: DataTypes.INTEGER, defaultValue: 1, field: 'is_my_profile_views_alert_subscribe' },
        isAllowSearch: { type: DataTypes.INTEGER, defaultValue: 1, field: 'is_allow_search' },
        linkedIn: { type: DataTypes.STRING, field: 'linkedin' },
        facebook: { type: DataTypes.STRING, field: 'facebook' },
        twitter: { type: DataTypes.STRING, field: 'twitter' },
        regLoginUserType: { type: DataTypes.INTEGER, field: 'reg_login_user_type' },
        isPushNotificationsSubscribed: { type: DataTypes.INTEGER, defaultValue: 1, field: 'is_push_notifications_subscribed' },
        expShowSalary: { type: DataTypes.INTEGER, defaultValue: 0, field: 'exp_show_salary' },
        expRmsSalaryMin: { type: DataTypes.INTEGER, field: 'exp_rms_salary_min' },
        expRmsSalaryMax: { type: DataTypes.INTEGER, field: 'exp_rms_salary_max' },
        expRmsIsNegotiable: { type: DataTypes.INTEGER, field: 'exp_rms_is_negotiable' },
        reasonLeaving: { type: DataTypes.STRING, field: 'reason_leaving' },
        contractStart: { type: DataTypes.DATE, field: 'contract_start' },
        contractEnd: { type: DataTypes.DATE, field: 'contract_end' },
        isBlacklisted: { type: DataTypes.SMALLINT, field: 'is_blacklisted' },
        blacklistReason: { type: DataTypes.STRING, field: 'blacklist_reason' },
        hiringType: { type: DataTypes.INTEGER, field: 'hiring_type' },
        isActive: { type: DataTypes.SMALLINT, defaultValue: 1, field: 'is_active' },
        showImageInPdf: { type: DataTypes.SMALLINT, defaultValue: 1, field: 'show_image_in_pdf' },
        agencyRates: { type: DataTypes.STRING, field: 'agency_rates' },
        agencyComments: { type: DataTypes.STRING, field: 'agency_comments' },
        consultantsRemarks: { type: DataTypes.STRING, field: 'consultants_remarks' },
        companyId: { type: DataTypes.INTEGER, field: 'company_id' },
        roleId: { type: DataTypes.INTEGER, field: 'role_id' },
        disciplineId: { type: DataTypes.INTEGER, field: 'discipline_id' },
        rankId: { type: DataTypes.INTEGER, field: 'rank_id' },
        createdBy: { type: DataTypes.UUID, field: 'created_by' },
        updatedBy: { type: DataTypes.UUID, field: 'updated_by' },
        createdAt: { type: DataTypes.DATE, field: 'created_at' },
        updatedAt: { type: DataTypes.DATE, field: 'updated_at' },
        rootResumeId: { type: DataTypes.INTEGER, field: 'root_resume_id' },
        pastEmploymentHistory: { type: DataTypes.STRING, field: 'past_employment_history' },
        isPortalResume: { type: DataTypes.BOOLEAN, defaultValue: true, field: 'is_portal_resume' },
        acceptTermDate: {type: DataTypes.DATE, field: 'accept_term_date'}
    }, {
        hooks: {
            beforeCount(options) {
                options.raw = true
            }
        }
    })

    // eslint-disable-next-line no-unused-vars
    resume.associate = function (models) {
        // Define associations here
        // See http://docs.sequelizejs.com/en/latest/docs/associations/
        resume.belongsTo(models.locations, { foreignKey: 'currentLocationId', targetKey: 'id', as: 'current_location_id' })
        resume.belongsTo(models.users, { foreignKey: 'userId', targetKey: 'id', as: 'users' })
        resume.belongsTo(models.users, { foreignKey: 'updatedBy', targetKey: 'id', as: 'updated_by' })
        resume.belongsTo(models.nationalities, { foreignKey: 'nationalityId', targetKey: 'id', as: 'nationality' })
        resume.belongsTo(models.disciplines, { foreignKey: 'disciplineId', targetKey: 'id', as: 'discipline' })
        resume.belongsTo(models.professional_roles, { foreignKey: 'roleId', targetKey: 'id', as: 'role' })
        resume.belongsTo(models.ranks, { foreignKey: 'rankId', targetKey: 'id', as: 'rank' })
        resume.belongsTo(models.companies, { foreignKey: 'companyId', targetKey: 'id', as: 'company' })
        resume.belongsTo(models.faculties, { foreignKey: 'facultyId', targetKey: 'id', as: 'faculty' })
        resume.belongsTo(models.educations, { foreignKey: 'educationId', targetKey: 'id', as: 'education' })
        resume.belongsTo(models.sgp_residential_status, { foreignKey: 'sgpResidentialStatus', targetKey: 'id', as: 'residentialStatus' })
        resume.hasMany(models.resume_contacts, { foreignKey: 'resumeId', as: 'resumeContacts' })
    }

    return resume
}
