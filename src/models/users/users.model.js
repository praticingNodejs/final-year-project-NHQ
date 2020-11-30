// See http://docs.sequelizejs.com/en/latest/docs/models-definition/
// for more of what you can do here.

import { Sequelize, DataTypes } from 'sequelize'

export default function (app) {
    const sequelizeClient = app.get('sequelizeClient')
    const users = sequelizeClient.define('users', {
        id: { type: DataTypes.UUID, defaultValue: Sequelize.UUIDV4, allowNull: false, primaryKey: true, field: 'id' },
        email: { type: DataTypes.STRING, allowNull: false, unique: true, field: 'email' },
        googleId: { type: DataTypes.STRING, field: 'google_id' },
        facebookId: { type: DataTypes.STRING, field: 'facebook_id' },
        linkedinId: { type: DataTypes.STRING, field: 'linkedin_id' },
        password: { type: DataTypes.STRING, field: 'password' },
        passwordSalt: { type: DataTypes.STRING, field: 'password_salt' },
        passwordToken: { type: DataTypes.STRING, field: 'password_token' },
        refreshToken: { type: DataTypes.STRING, field: 'refresh_token' },
        isActive: { type: DataTypes.SMALLINT, defaultValue: 1, field: 'is_active' },
        isAspMembership: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'is_asp_membership' },
        createdAt: { type: DataTypes.DATE, field: 'created_at' },
        updatedAt: { type: DataTypes.DATE, field: 'updated_at' },
        isVerified: { type: DataTypes.BOOLEAN, field: 'is_verified' },
        verifyToken: { type: DataTypes.STRING, field: 'verify_token' },
        verifyExpires: { type: DataTypes.DATE, field: 'verify_expires' },
        verifyChanges: { type: DataTypes.JSON(), field: 'verify_changes' },
        resetToken: { type: DataTypes.STRING, field: 'reset_token' },
        resetExpires: { type: DataTypes.DATE, field: 'reset_expires' },
        resetPasswordTokenUrl: { type: DataTypes.STRING, field: 'reset_password_token_url' }
    }, {
        hooks: {
            beforeCount(options) {
                options.raw = true
            }
        }
    })

    // eslint-disable-next-line no-unused-vars
    users.associate = function (models) {
        // Define associations here
        // See http://docs.sequelizejs.com/en/latest/docs/associations/
        users.hasOne(models.rms_users_info, { foreignKey: 'userId', targetKey: 'userId', as: 'rmsUser' })
    }

    return users
}
