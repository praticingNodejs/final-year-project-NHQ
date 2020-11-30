// Initializes the `authManagement` service on path `/auth-management`
import authManagement from 'feathers-authentication-management'
import notifier from './notifier'

export default function (app) {
    // Initialize our service with any options it requires
    app.configure(authManagement({
        service: '/users',
        path: '/users/auth-management',
        notifier: function (type, user, notifierOptions) {
            if (type === 'sendResetPwd') {
                app.service('users').patch(user.id, {
                    resetPasswordTokenUrl: user.resetToken
                }).catch(_e => { return null })
            }

            if (type === 'resetPwdLong') {
                app.service('users').patch(user.id, {
                    resetPasswordTokenUrl: null
                }).catch(_e => { return null })
            }
            notifier(type, user, notifierOptions, app)
        },
        resetDelay: 1000 * 60 * 60 * 2
    }))

}
