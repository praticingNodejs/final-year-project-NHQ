/* eslint-disable no-prototype-builtins */
// Use this hook to manipulate incoming or outgoing data.
// For more information on hooks see: http://docs.feathersjs.com/api/hooks.html

import JwtDecode from 'jwt-decode'
import { BadRequest, NotAuthenticated } from '@feathersjs/errors'

// eslint-disable-next-line no-unused-vars
export const createNewTbb = (options = {}) => {
    return async context => {
        let decodeToken
        try {
            decodeToken = JwtDecode(context.params.authentication.accessToken)
        } catch (err) {
            throw new NotAuthenticated('INVALID_TOKEN')
        }

        const rmsUser = await context.app.service('rms-users-info').findOne({
            query: {
                userId: decodeToken.userId,
                $select: ['id', 'userId', 'companyId']
            }
        })

        context.params.rmsUser = rmsUser
        context.data.companyId = rmsUser.companyId || null

        return context
    }
}

// eslint-disable-next-line no-unused-vars
export const checkDuplicateFolder = (options = {}) => {
    return async context => {
        if(!context.data.documentOriginalFileName && !context.data.documentName) {
            const checkFolder = await context.app.service('tbb-documents').findOne({
                query: {
                    documentName: null,
                    documentPath: null,
                    documentOriginalFileName: null,
                    folderPath: context.data.folderPath
                }
            })

            if(checkFolder)
                throw new BadRequest('FOLDER_EXISTED')
        }

        return context
    }
}

// eslint-disable-next-line no-unused-vars
export const searchDocsByCompany = (options = {}) => {
    return async context => {
        let decodeToken
        try {
            decodeToken = JwtDecode(context.params.authentication.accessToken)
        } catch (err) {
            throw new NotAuthenticated('INVALID_TOKEN')
        }

        const rmsUser = await context.app.service('rms-users-info').findOne({
            query: {
                userId: decodeToken.userId,
                $select: ['id', 'userId', 'companyId']
            }
        })

        if (rmsUser.companyId)
            context.params.query.companyId = rmsUser?.companyId
    }
}
