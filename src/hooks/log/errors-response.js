// Use this hook to manipulate incoming or outgoing data.
// For more information on hooks see: http://docs.feathersjs.com/api/hooks.html

// eslint-disable-next-line no-unused-vars
export const errorResponse = (options = {}) => {
    return async context => {
        context.error.errors = { body: [{ name: context.error.name, code: context.error.code, message: context.error.message }] }

        switch (context.error.message) {
            case 'jwt expired':
                context.error.message = 'SESSION_EXPIRED'
                break
            case 'email must be unique':
                context.error.message = 'EMAIL_EXISTED'
                break
            case 'Validation error':
                context.error.message = 'VALIDATION_ERROR'
                break
            case 'Invalid login':
                context.error.message = 'WRONG_EMAIL_PASSWORD'
                break
            case 'User not found.':
                context.error.message = 'USER_NOT_EXISTED'
                break
            case 'Password reset token has expired.':
                context.error.message = 'INVALID_RESET_TOKEN'
                break
            case 'Current password is incorrect.':
                context.error.message = 'CURRENT_PASSWORD_NOT_CORRECTED'
                break
            case 'User is not verified.':
                context.error.message = 'USER_IS_NOT_VERIFIED'
                break
            default:
                break
        }
        return context
    }
}
