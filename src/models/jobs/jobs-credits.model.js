// See http://docs.sequelizejs.com/en/latest/docs/models-definition/
// for more of what you can do here.
import { DataTypes } from 'sequelize'

export default function (app) {
    const sequelizeClient = app.get('sequelizeClient')
    const jobsCredits = sequelizeClient.define('jobs_credits', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, allowNull: false, primaryKey: true, field: 'id' },
        companyId: { type: DataTypes.INTEGER, field: 'company_id' },
        creditPoints: { type: DataTypes.INTEGER, defaultValue: 100, field: 'credit_points' },
        creditUsages: { type: DataTypes.INTEGER, defaultValue: 0, field: 'credit_usages' }
    }, {
        hooks: {
            beforeCount(options) {
                options.raw = true
            }
        }
    })

    // eslint-disable-next-line no-unused-vars
    jobsCredits.associate = function (models) {
        // Define associations here
        // See http://docs.sequelizejs.com/en/latest/docs/associations/
    }

    return jobsCredits
}
