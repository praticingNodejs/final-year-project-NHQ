// See http://docs.sequelizejs.com/en/latest/docs/models-definition/
// for more of what you can do here.
import { DataTypes } from 'sequelize'

export default function (app) {
    const sequelizeClient = app.get('sequelizeClient')
    const resumeWorkExperience = sequelizeClient.define('resume_work_experience', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, allowNull: false, primaryKey: true, field: 'id' },
        resumeId: { type: DataTypes.INTEGER, allowNull: false, field: 'resume_id' },
        periodFrom: { type: DataTypes.DATE, field: 'period_from' },
        periodTo: { type: DataTypes.DATE, field: 'period_to' },
        presentDate: { type: DataTypes.INTEGER, field: 'present_date' },
        company: { type: DataTypes.STRING, field: 'company' },
        division: { type: DataTypes.STRING, field: 'division' },
        divisionApplicable: { type: DataTypes.INTEGER, field: 'division_applicable' },
        position: { type: DataTypes.STRING, field: 'position' },
        duties: { type: DataTypes.STRING, field: 'duties' },
        countInRelatedExp: { type: DataTypes.INTEGER, field: 'count_in_related_exp' }
    }, {
        hooks: {
            beforeCount(options) {
                options.raw = true
            }
        }
    })

    // eslint-disable-next-line no-unused-vars
    resumeWorkExperience.associate = function (models) {
        // Define associations here
        // See http://docs.sequelizejs.com/en/latest/docs/associations/
        resumeWorkExperience.belongsTo(models.resume, { foreignKey: 'resumeId', targetKey: 'id', as: 'resume_id' })
    }

    return resumeWorkExperience
}
