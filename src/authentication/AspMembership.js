
import { LocalStrategy } from '@feathersjs/authentication-local'

import { NotAuthenticated } from '@feathersjs/errors'

import { aspHashPassword } from '../utils'

class AspMembership extends LocalStrategy {
    constructor(app) {
        super(app)

    }

    async getEntityQuery(query, _params) {
        return {
            ...query,
            $limit: 1
        }
    }

    async comparePassword(entity, password) {
        let user = await this.app.service('users').findOne({
            query: {
                email: entity.email,
                $select: ['id', 'passwordSalt']
            }
        })

        let aspPasswordHash = aspHashPassword(password, user.passwordSalt)
        let localPasswordHash = await this.hashPassword(password)

        if (entity.password === aspPasswordHash) {
            this.app.service('users').patch(user.id, {
                password: localPasswordHash,
                passwordSalt: null,
                isAspMembership: false
            })
            return entity
        } else {
            throw new NotAuthenticated('WRONG_EMAIL_PASSWORD')
        }
    }

}

export default AspMembership
