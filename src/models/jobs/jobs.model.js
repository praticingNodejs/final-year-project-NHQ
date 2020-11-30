// See http://docs.sequelizejs.com/en/latest/docs/models-definition/
// for more of what you can do here.
import { DataTypes } from 'sequelize'

export default function (app) {
    const sequelizeClient = app.get('sequelizeClient')
    const jobs = sequelizeClient.define('jobs', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, allowNull: false, primaryKey: true, field: 'id' },
        hiringType: { type: DataTypes.INTEGER, field: 'hiringType' },
        isPlacement: { type: DataTypes.INTEGER, field: 'isPlacement' },
        contractDuration: { type: DataTypes.STRING, field: 'contractDuration' },
        projectId: { type: DataTypes.INTEGER, allowNull: false, field: 'projectId' },
        projects: { type: DataTypes.STRING, field: 'projects' },
        contactPersonId: { type: DataTypes.INTEGER, field: 'contactPersonId' },
        nationalityId: { type: DataTypes.TEXT, field: 'nationalityId' },
        prefResidentialStatus: { type: DataTypes.SMALLINT, field: 'prefResidentialStatus' },
        prefGender: { type: DataTypes.STRING, field: 'prefGender' },
        remarks: { type: DataTypes.STRING, field: 'remarks' },
        assignedTo: { type: DataTypes.UUID, field: 'assignedTo' },
        interviewerProfile: { type: DataTypes.STRING, field: 'interviewerProfile' },
        tipsForCandidate: { type: DataTypes.STRING, field: 'tipsForCandidate' },
        position: { type: DataTypes.STRING, field: 'position' },
        rankId: { type: DataTypes.INTEGER, field: 'rankId' },
        disciplineId: { type: DataTypes.INTEGER, field: 'disciplineId' },
        designationId: { type: DataTypes.INTEGER, field: 'designationId' },
        sectorId: { type: DataTypes.INTEGER, field: 'sectorId' },
        sectorOther: { type: DataTypes.STRING, field: 'sectorOther' },
        salaryAmount: { type: DataTypes.STRING, field: 'salaryAmount' },
        salaryFreq: { type: DataTypes.SMALLINT, field: 'salaryFreq' },
        salaryIsSgd: { type: DataTypes.SMALLINT, field: 'salaryIsSgd' },
        salaryCurrency: { type: DataTypes.INTEGER, field: 'salaryCurrency' },
        otherBenefits: { type: DataTypes.STRING, field: 'otherBenefits' },
        otherRates: { type: DataTypes.SMALLINT, defaultValue: 1, field: 'otherRates' },
        commencementDate: { type: DataTypes.DATE, field: 'commencementDate' },
        educationId: { type: DataTypes.INTEGER, field: 'educationId' },
        workCountry: { type: DataTypes.INTEGER, field: 'workCountry' },
        jobResponsibilities: { type: DataTypes.STRING, defaultValue: '', field: 'jobResponsibilities' },
        jobRequirement: { type: DataTypes.STRING, defaultValue: '', field: 'jobRequirement' },
        otherComments: { type: DataTypes.STRING, defaultValue: '', field: 'otherComments' },
        isHotJob: { type: DataTypes.INTEGER, allowNull: false, field: 'isHotJob' },
        experience: { type: DataTypes.STRING, field: 'experience' }, // min -exp
        roleId: { type: DataTypes.INTEGER, field: 'roleId' },
        statusId: { type: DataTypes.INTEGER, allowNull: false, field: 'statusId' },
        isActive: { type: DataTypes.SMALLINT, field: 'isActive' },
        statusReason: { type: DataTypes.STRING, field: 'statusReason' },
        statusDate: { type: DataTypes.DATE, field: 'statusDate' },
        reopenDate: { type: DataTypes.DATE, field: 'reopenDate' },
        emailAlert: { type: DataTypes.STRING, field: 'emailAlert' },
        otherRole: { type: DataTypes.STRING, field: 'otherRole' },
        oldId: { type: DataTypes.INTEGER, field: 'oldId' },
        oldJobId: { type: DataTypes.STRING, field: 'oldJobId' },
        isApproved: { type: DataTypes.BOOLEAN, field: 'isApproved' },
        isFrontend: { type: DataTypes.BOOLEAN, field: 'isFrontend' },
        showInPortal: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'showInPortal' },
        weekWorkDay: { type: DataTypes.TEXT, defaultValue: '', field: 'weekWorkDay' },
        weekWorkHours: { type: DataTypes.TEXT, defaultValue: '', field: 'weekWorkHours' },
        clientOtherBenefits: { type: DataTypes.STRING, field: 'clientOtherBenefits' },
        profile: { type: DataTypes.STRING, field: 'profile' },
        minSalary: { type: DataTypes.FLOAT, defaultValue: 0, field: 'minSalary' },
        maxSalary: { type: DataTypes.FLOAT, defaultValue: 0, field: 'maxSalary' },
        salaryNotShow: { type: DataTypes.INTEGER, field: 'salaryNotShow' },
        newSalCurrency: { type: DataTypes.STRING, field: 'newSalCurrency' },
        portalDate: { type: DataTypes.DATE, field: 'portalDate' },
        locationId: { type: DataTypes.INTEGER, field: 'locationId' },
        clientHiringProtocol: { type: DataTypes.TEXT, field: 'clientHiringProtocol' },
        positionRequired: { type: DataTypes.TEXT, field: 'positionRequired' },
        oldSalaryCurrency: { type: DataTypes.STRING, field: 'oldSalaryCurrency' },
        lastPostedDate: { type: DataTypes.DATE, field: 'lastPostedDate' },
        hits: { type: DataTypes.BIGINT, field: 'hits' },
        expiryDate: { type: DataTypes.DATE, field: 'expiryDate' },
        isPortalJob: { type: DataTypes.INTEGER, field: 'isPortalJob' },
        isAllowEmails: { type: DataTypes.INTEGER, field: 'isAllowEmails' },
        isAnonymousEmployer: { type: DataTypes.BOOLEAN, allowNull: false, field: 'isAnonymousEmployer' },
        createdByRms: { type: DataTypes.UUID, field: 'createdByRms' },
        companyId: { type: DataTypes.INTEGER, field: 'companyId' },
        portalNewDate: { type: DataTypes.DATE, allowNull: false, field: 'portalNewDate' },
        moderationStatus: { type: DataTypes.INTEGER, field: 'moderationStatus' },
        flag: { type: DataTypes.STRING, field: 'flag' },
        immediateCommencement: { type: DataTypes.BOOLEAN, field: 'immediateCommencement' },
        openDate: {type: DataTypes.DATE, field: 'openDate'},
        createdBy: { type: DataTypes.UUID, field: 'createdBy' },
        updatedBy: { type: DataTypes.UUID, field: 'updatedBy' },
        createdAt: { type: DataTypes.DATE, field: 'createdAt' },
        updatedAt: { type: DataTypes.DATE, field: 'updatedAt' }
    }, {
        hooks: {
            beforeCount(options) {
                options.raw = true
            }
        }
    })

    // eslint-disable-next-line no-unused-vars
    jobs.associate = function (models) {
        // Define associations here
        // See http://docs.sequelizejs.com/en/latest/docs/associations/
        jobs.belongsTo(models.users, { foreignKey: 'createdBy', targetKey: 'id', as: 'created_by' })
        jobs.belongsTo(models.users, { foreignKey: 'updatedBy', targetKey: 'id', as: 'updated_by' })
        jobs.belongsTo(models.projects, { foreignKey: 'projectId', targetKey: 'id', as: 'project' })
        jobs.belongsTo(models.locations, { foreignKey: 'workCountry', targetKey: 'id', as: 'workCountryLocation' })
        jobs.belongsTo(models.locations_sub, { foreignKey: 'locationId', targetKey: 'id', as: 'locationsSub' })
        jobs.belongsTo(models.companies, { foreignKey: 'companyId', targetKey: 'id', as: 'company_id' })
        jobs.belongsTo(models.sectors, { foreignKey: 'sectorId', targetKey: 'id', as: 'sectors' })
        jobs.belongsTo(models.currencies, { foreignKey: 'salaryCurrency', targetKey: 'id', as: 'currencies' })
        jobs.belongsTo(models.job_statuses, { foreignKey: 'statusId', targetKey: 'id', as: 'jobStatuses' })
        jobs.belongsTo(models.nationalities, { foreignKey: 'nationalityId', targetKey: 'id', as: 'nationalities' })
        jobs.belongsTo(models.educations, { foreignKey: 'educationId', targetKey: 'id', as: 'educations' })
        jobs.hasMany(models.jobs_resume, { foreignKey: 'id', targetKey: 'jobId', as: 'jobsResume' })
    }

    return jobs
}
