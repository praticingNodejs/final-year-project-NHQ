// Initializes the `resume` service on path `/resume`
import createService from 'feathers-sequelize'
import createModel from '../../models/resume/resume.model'
import hooks from './resume.hooks'

import ResumeParser from 'simple-resume-parser'
import { NotAuthenticated, GeneralError, BadRequest } from '@feathersjs/errors'
import multer from 'multer'
import JwtDecode from 'jwt-decode'
import fs from 'fs'
import _ from 'lodash'
import md5 from 'md5'
import moment from 'moment-timezone'
import neatCsv from 'neat-csv'
import path from 'path'
import ejs from 'ejs'
import imageToBase64 from 'image-to-base64'
import puppeteer from 'puppeteer'

import CONSTANT from '../../constant'
import {
    dynamicSort,
    s3Crms,
    s3Js as s3,
    pdf,
    docx,
    doc,
    filterSpecialCharacters,
} from '../../utils'
import { body, validationResult } from 'express-validator'

// import { parseDocx } from 'docx-parser'

export default function (app) {
    const options = {
        Model: createModel(app),
        paginate: app.get('paginate'),
        multi: ['patch']
    }

    async function checkRmsUser(app, decodeToken) {
        return await app.service('rms-users-info').findOne({
            query: {
                userId: decodeToken.userId,
                $select: ['id', 'userId', 'companyId']
            }
        }).catch(_e => { return 'USER_NOT_EXISTED' })
    }

    async function getFileOriginal(file, fileName) {
        // Get file original strip
        let fileType = file.originalname.split('.')
        fileType = fileType[fileType.length - 1]

        let originalResume
        try {
            switch (fileType) {
                case 'pdf':
                    originalResume = await pdf(file.buffer)
                    break
                case 'docx':
                    originalResume = await docx(fileName)
                    break
                case 'doc':
                    originalResume = await doc(fileName)
                    break
                default:
                    originalResume = null
                    break
            }
            return originalResume
        } catch (err) {
            return 'ERR_CONNECTION'
        }
    }

    function getSalutation(gender) {
        if (!gender) return 'Ms.'
        switch (gender.toLowerCase()) {
            case 'male':
                return 'Mr.'
            case 'female':
                return 'Mrs.'
            case 'prefer not to disclose':
                return 'Ms.'
            default:
                return 'Ms.'
        }
    }

    app.post('/resume/create', multer({}).single('file'), async (req, res) => {
        if (!req.headers['authorization']) return res.status(401).send(new NotAuthenticated('NOT_AUTHENTICATED'))

        let decodeToken
        if (req.feathers.headers.authorization) {
            try {
                decodeToken = JwtDecode(req.feathers.authentication.accessToken)
            } catch (err) {
                return res.status(401).send(new NotAuthenticated('INVALID_TOKEN'))
            }
        }

        const rmsUser = await app.service('rms-users-info').findOne({
            query: {
                userId: decodeToken.userId,
                $select: ['id', 'userId', 'companyId']
            }
        }).catch(_e => { return 'INVALID_TOKEN' })

        if (!rmsUser.companyId) return res.status(400).send(new BadRequest('ARMS_CANNOT_CREATE_RESUME'))
        if (!req.file) return res.status(400).send(new BadRequest('ORIGINAL_RESUME_NOT_FOUND'))

        let resumeId
        s3.createBucket(() => {
            const user = `${req.body.firstName} ${req.body.lastName}`
            const filePath = `${user}-${md5(Date.now())}.${req.file.originalname.split('.').pop()}`
            s3.upload({
                Bucket: CONSTANT.CRMS_BUCKET,
                Key: `${rmsUser.company.companyUrl}/${CONSTANT.RESUME_AWS_FOLDER}${filePath}`,
                Body: req.file.buffer
            }, async (err, _data) => {
                if (err) return res.status(500).send(new GeneralError('ERR_CONNECTION'))
                const newResume = {
                    firstName: req.body.firstName,
                    lastName: req.body.lastName,
                    gender: req.body.gender || 'Male',
                    dob: req.body.dob,
                    remarks: req.body.remarks,

                    residentialAddress: req.body.residentialAddress,
                    rankId: req.body.rankId,
                    disciplineId: req.body.disciplineId,
                    roleId: req.body.designationId,
                    nationalityId: req.body.nationalityId,
                    nationalityOther: req.body.nationalityOther,
                    sgpResidentialStatus: req.body.sgpResidentialStatus,

                    empStatus: req.body.empStatus,
                    contractStart: req.body.contractStart,
                    contractEnd: req.body.contractEnd,
                    employmentDetail: req.body.employmentDetail,

                    currentLocationId: req.body.currentLocationId,
                    streetAddress: req.body.streetAddress,
                    profileStatus: req.body.profileStatus,
                    availability: req.body.availability,

                    salaryAmount: req.body.salaryAmount,
                    salaryFreq: req.body.salaryFreq,
                    salaryIsSgd: req.body.salaryIsSgd,
                    salaryCurrency: req.body.salaryCurrency,
                    otherBenefits: req.body.otherBenefits,

                    expSalaryAmount: req.body.expSalaryAmount,
                    expSalaryFreq: req.body.expSalaryFreq,
                    expSalaryIsSgd: req.body.expSalaryIsSgd,
                    expSalaryCurrency: req.body.expSalaryCurrency,
                    expOtherBenefits: req.body.expOtherBenefits,

                    otherRemarks: req.body.otherRemarks,
                    reasonLeaving: req.body.reasonLeaving,

                    expRmsSalaryMin: req.body.expRmsSalaryMin,
                    expRmsSalaryMax: req.body.expRmsSalaryMax,
                    expRmsIsNegotiable: req.body.expRmsIsNegotiable,

                    agencyRates: req.body.agencyRates,
                    agencyComments: req.body.agencyComments,
                    consultantsRemarks: req.body.consultantsRemarks,

                    educationId: req.body.educationId,
                    otherQualifications: req.body.otherQualifications,
                    careerSummary: req.body.careerSummary,

                    workExpTotal: req.body.workExpTotal,
                    workExpRelevant: req.body.workExpRelevant,

                    achievements: req.body.achievements,

                    resumeStripSearch: req.body.resumeStripSearch,

                    hiringType: req.body.hiringType,
                    educationalAward: req.body.educationalAward,
                    streetAddress2: req.body.streetAddress2,

                    resumePath: filePath,
                    originalResumeName: req.file.originalname,
                    resumeHashContent: md5(req.file.buffer),

                    companyId: rmsUser.companyId,
                    createdBy: rmsUser.userId,
                    updatedBy: rmsUser.userId
                }

                let resume = await app.service('resume').create(newResume).catch(_err => { return res.status(500).send(new GeneralError('ERR_CONNECTION')) })
                resumeId = resume.id
                try {
                    // resume/contacts
                    if ('contacts' in req.body)
                        JSON.parse(req.body.contacts).forEach(async contact => {
                            await app.service('resume/contacts').create({
                                resumeId,
                                ...contact
                            }).catch(_e => { return null })
                        })

                    // resume/sectors
                    if ('sectors' in req.body)
                        JSON.parse(req.body.sectors).forEach(async sectorId => {
                            await app.service('resume/sectors').create({
                                resumeId,
                                sectorId
                            }).catch(_e => { return null })
                        })
                    // resume/messengers
                    if ('messengers' in req.body)
                        JSON.parse(req.body.messengers).forEach(async messenger => {
                            await app.service('resume/messengers').create({
                                resumeId,
                                ...messenger
                            }).catch(_e => { return null })
                        })
                } catch (e) {
                    app.service('resume').remove(resume.id).catch(_e => { return true })
                    return res.status(500).send(new GeneralError('ERR_CONNECTION'))
                }

                if (resume) {
                    const sequelize = await app.get('sequelizeClient')
                    sequelize.query(`
                        UPDATE resume SET fts_strip_search = to_tsvector('simple',
                            (SELECT concat(
                                (SELECT email FROM users WHERE id = resume.user_id), ' ',
                                resume.first_name, ' ',
                                resume.last_name, ' ',
                                resume.resume_strip_search
                            ) as text)
                        ) WHERE id = ${resume.id}
                    `)
                }

                return res.status(200).send(resume)
            })
        })
    })

    app.get('/resume/branded-format/:resumeId', async (req, res) => {
        if (!req.headers['authorization']) return res.status(401).send(new NotAuthenticated('NOT_AUTHENTICATED'))

        let decodeToken
        try {
            decodeToken = JwtDecode(req.feathers.authentication.accessToken)
        } catch (err) {
            return res.status(401).send(new NotAuthenticated('INVALID_TOKEN'))
        }

        const resumeId = req.params.resumeId
        const resume = await app.service('resume').get(resumeId).catch(_e => { return res.status(400).send(new BadRequest('RESUME_NOT_EXISTED')) })

        if (!resume.companyId) {
            return res.status(400).send(new BadRequest('RESUME_NOT_ALLOWED'))
        }

        const currentUser = await app.service('rms-users-info').findOne({
            query: {
                userId: decodeToken.userId,
                $select: ['companyId']
            }
        }).catch(_e => { return res.status(400).send(new BadRequest('USER_NOT_ALLOWED')) })

        if (resume.companyId !== currentUser.companyId) return res.status(400).send(new BadRequest('USER_NOT_ALLOWED'))

        const company = await app.service('companies').get(resume.companyId).catch(_e => { return res.status(400).send(new BadRequest('RESUME_NOT_ALLOWED_BRANDED_FORMAT')) })
        const dateNow = moment(Date.now()).format('DD-MMM-YYYY')

        // header resume pdf
        let headerObj = {
            date: dateNow,
            refNo: resumeId,
            firstName: resume.firstName ? resume.firstName[0] : '',
            lastName: resume.lastName ? resume.lastName[0] : '',
            showCompanyLogo: true
        }

        if (company) {
            let url = await imageToBase64(`${process.env.AWS_ENDPOINT}/${CONSTANT.CRMS_BUCKET}/${company.companyUrl}${CONSTANT.AWS_COMPANY_LOGO}${company.imagePath}`).catch(_e => { return null })
            if (!url || !company.imagePath) headerObj.showCompanyLogo = false
            headerObj.companyLogo = `data:image/png;base64,${url}`
        }

        const resumeExpSalaryCurrency = (resume.expSalaryCurrencyObj && resume.expSalaryCurrencyObj.name) || '-'
        let resumeWorkExpTotal = resume.workExpTotal ? parseInt(resume.workExpTotal, 10) : '-'
        if (resumeWorkExpTotal % 12 === 0) {
            const workYears = Math.floor(resumeWorkExpTotal / 12)
            resumeWorkExpTotal = `${workYears} year${workYears > 1 ? 's' : ''}`
        } else {
            resumeWorkExpTotal = resumeWorkExpTotal + ' month(s)'
        }

        // body resume pdf
        let bodyObj = {
            companyName: company.name || '-',
            website: company.website || '-',
            regNo: company.regNo || '-',
            agencyNo: company.agencyNo || '-',
            companyDataProtection: company.dataProtection || '-',
            name: `${getSalutation(resume.gender)} ${resume.firstName || ''} ${resume.lastName || ''}`,
            shortName: `${resume.firstName ? resume.firstName[0] : ''}${resume.lastName ? resume.lastName[0] : ''}`,
            nationality: resume.nationality?.name || '-',
            sgpResidentStatus: resume.residentialStatus?.name || '-',
            age: resume.dob ? (new Date()).getFullYear() - parseInt(resume.dob.split('-')[0]) : null,
            // check = null first then check = 0
            availability: resume.availability === null || resume.availability === undefined ? '-' : resume.availability === 0 ? 'Immediate' : `${resume.availability} days`,
            education: (resume.education?.name || '-') + ' - ' + (resume.educationalAward || ''),
            // if(expShowSalary === 0) it will show the exp salary
            expSalaryCurrency: !resume.expShowSalary ? `${resume.expSalaryAmount || ''} ${resumeExpSalaryCurrency} ${CONSTANT.SALARY_PERIOD(resume.expSalaryFreq)}` : '-',
            countryOfResidence: resume.currentLocation?.name || '-',
            careerSummary: resume.careerSummary || '-',
            pastEmploymentHistory: resume.pastEmploymentHistory || '-',
            empStatus: CONSTANT.LAST_EMP_STATUS(resume.empStatus),
            otherQualifications: resume.otherQualifications || '-',
            achievements: resume.achievements || '-',
            sectors: resume.sectors ? resume.sectors : [],
            instNameLoc: resume.instNameLoc || '-',
            gradYear: resume.gradYear || '-',
            workExpTotal: resumeWorkExpTotal || '-',
            workExperiences: resume.workExperience.map(experience => {
                experience.periodFrom = experience.periodFrom ? moment(experience.periodFrom).format('DD-MMM-YYYY') : '-'
                experience.periodTo = experience.periodTo ? moment(experience.periodTo).format('DD-MMM-YYYY') : '-'
                return experience
            }),
            avatar: undefined,
            showImageInPdf: resume.showImageInPdf
        }

        if (resume.photoPath) {
            let urlAvatar = await imageToBase64(`${process.env.AWS_ENDPOINT}${CONSTANT.CRMS_BUCKET}/${resume.company.companyUrl}/${CONSTANT.RESUME_AWS_FOLDER}image/${resume.photoPath}`).catch(_e => { return null })
            bodyObj.avatar = `data:image/png;base64,${urlAvatar}`
        }
        // footer resume pdf
        let footerObj = {
            companyBusinessTerm: company.businessTerm,
            footerEmailAddress: company.footerEmailAddress
        }

        const resumeHeader = await ejs.renderFile(path.resolve(path.join('public', 'views') + CONSTANT.EMAIL_EJS_TEMPLATE.RESUME_PDF_TEMPLATE.HEADER), headerObj).catch(_e => { return '' })
        const resumeBody = await ejs.renderFile(path.resolve(path.join('public', 'views') + CONSTANT.EMAIL_EJS_TEMPLATE.RESUME_PDF_TEMPLATE.BODY), bodyObj).catch(_e => { return '' })
        const resumeFooter = await ejs.renderFile(path.resolve(path.join('public', 'views') + CONSTANT.EMAIL_EJS_TEMPLATE.RESUME_PDF_TEMPLATE.FOOTER), footerObj).catch(_e => { return '' })

        try {
            const browser = await puppeteer.launch({
                headless: true,
                args: [
                    '--no-sandbox',
                    '--disable-gpu',
                ]
            })
            const page = await browser.newPage()

            await page.setContent(resumeBody)

            const pathFileServer = `Ref-${resume.id}-${resume.firstName}-${resume.lastName}.pdf`
            await page.pdf({
                path: pathFileServer,
                format: 'A4',
                displayHeaderFooter: true,
                printBackground: true,
                margin: {
                    top: '120px',
                    bottom: '120px'
                },
                headerTemplate: resumeHeader,
                footerTemplate: resumeFooter
            }).then(buffer => {
                let pdfPath = CONSTANT.RESUME_BRANDED_FORMAT_NAME(resume)
                s3.upload({
                    Bucket: CONSTANT.CRMS_BUCKET,
                    Key: `${company.companyUrl}/${CONSTANT.RESUME_AWS_FOLDER}${pdfPath}`,
                    Body: buffer
                }, async (err, _data) => {
                    if (err) return res.status(500).send({ resume, msg: 'CANNOT_CREATE_PDF' })
                    await app.service('resume').patch(resume.id, {
                        resumePdfPath: pdfPath
                    }).catch(_e => { return null })
                    resume.resumePdfPath = pdfPath

                    if (req.query.download) {
                        try {
                            res.download(pathFileServer, () => {
                                fs.unlinkSync(pathFileServer)
                            })
                        } catch (_e) {
                            return true
                        }
                    } else {
                        try {
                            fs.unlinkSync(pathFileServer)
                        } catch (_e) {
                            return res.status(500).send({ resume, state: false, msg: 'ERR_GENERATE_PDF' })
                        }
                        return res.status(200).send({ resume, state: true, msg: 'GENERATE_PDF_SUCCESSFUL' })
                    }
                })
            })
            await browser.close()
        } catch (_e) {
            return res.status(500).send({ resume, state: false, msg: 'CANNOT_CREATE_PDF' })
        }
    })

    app.get('/resume/branded-format-jobs-resume', async (req, res) => {
        if (!req.headers['authorization']) return res.status(401).send(new NotAuthenticated('NOT_AUTHENTICATED'))

        let decodeToken
        try {
            decodeToken = JwtDecode(req.feathers.authentication.accessToken)
        } catch (err) {
            return res.status(401).send(new NotAuthenticated('INVALID_TOKEN'))
        }

        if (!req.query.resumeId || !req.query.jobId)
            return res.status(400).send(new BadRequest('MISSING_REQUIRED_FIELD'))

        const resumeId = req.query.resumeId
        const resume = await app.service('resume').get(req.query.resumeId).catch(_e => { return res.status(400).send(new BadRequest('RESUME_NOT_EXISTED')) })
        const job = await app.service('jobs').get(req.query.jobId).catch(_e => { return res.status(400).send(new BadRequest('JOB_NOT_EXISTED')) })

        if (!resume.companyId) {
            return res.status(400).send(new BadRequest('RESUME_NOT_ALLOWED'))
        }

        const currentUser = await app.service('rms-users-info').findOne({
            query: {
                userId: decodeToken.userId,
                $select: ['companyId']
            }
        }).catch(_e => { return res.status(400).send(new BadRequest('USER_NOT_ALLOWED')) })

        if (resume.companyId !== currentUser.companyId) return res.status(400).send(new BadRequest('USER_NOT_ALLOWED'))

        const company = await app.service('companies').get(resume.companyId).catch(_e => { return res.status(400).send(new BadRequest('RESUME_NOT_ALLOWED_BRANDED_FORMAT')) })
        const dateNow = moment(Date.now()).format('DD-MMM-YYYY')

        // header resume pdf
        let headerObj = {
            date: dateNow,
            refNo: resumeId,
            jobRef: job.id,
            firstName: resume.firstName ? resume.firstName[0] : '',
            lastName: resume.lastName ? resume.lastName[0] : '',
            showCompanyLogo: true
        }

        if (company) {
            let url = await imageToBase64(`${process.env.AWS_ENDPOINT}/${CONSTANT.CRMS_BUCKET}/${company.companyUrl}${CONSTANT.AWS_COMPANY_LOGO}${company.imagePath}`).catch(_e => { return null })
            if (!url || !company.imagePath) headerObj.showCompanyLogo = false
            headerObj.companyLogo = `data:image/png;base64,${url}`
        }

        const resumeExpSalaryCurrency = (resume.expSalaryCurrencyObj && resume.expSalaryCurrencyObj.name) || '-'
        let resumeWorkExpTotal = resume.workExpTotal ? parseInt(resume.workExpTotal, 10) : '-'
        if (resumeWorkExpTotal % 12 === 0) {
            const workYears = Math.floor(resumeWorkExpTotal / 12)
            resumeWorkExpTotal = `${workYears} year(s)`
        } else {
            resumeWorkExpTotal = resumeWorkExpTotal + ' month(s)'
        }

        // body resume pdf
        let bodyObj = {
            companyName: company.name || '-',
            position: job.position,
            website: company.website || '-',
            regNo: company.regNo || '-',
            agencyNo: company.agencyNo || '-',
            companyDataProtection: company.dataProtection || '-',
            name: `${getSalutation(resume.gender)} ${resume.firstName || ''} ${resume.lastName || ''}`,
            shortName: `${resume.firstName ? resume.firstName[0] : ''}${resume.lastName ? resume.lastName[0] : ''}`,
            nationality: resume.nationality?.name || '-',
            sgpResidentStatus: resume.residentialStatus?.name || '-',
            age: resume.dob ? (new Date()).getFullYear() - parseInt(resume.dob.split('-')[0]) : null,
            // check = null first then check = 0
            availability: resume.availability === null || resume.availability === undefined ? '-' : resume.availability === 0 ? 'Immediate' : `${resume.availability} days`,
            education: (resume.education?.name || '-') + ' - ' + (resume.educationalAward || ''),
            // if(expShowSalary === 0) it will show the exp salary
            expSalaryCurrency: !resume.expShowSalary ? `${resume.expSalaryAmount || ''} ${resumeExpSalaryCurrency} ${CONSTANT.SALARY_PERIOD(resume.expSalaryFreq)}` : '-',
            countryOfResidence: resume.currentLocation?.name || '-',
            careerSummary: resume.careerSummary || '-',
            pastEmploymentHistory: resume.pastEmploymentHistory || '-',
            empStatus: CONSTANT.LAST_EMP_STATUS(resume.empStatus),
            otherQualifications: resume.otherQualifications || '-',
            achievements: resume.achievements || '-',
            sectors: resume.sectors ? resume.sectors : [],
            instNameLoc: resume.instNameLoc || '-',
            gradYear: resume.gradYear || '-',
            workExpTotal: resumeWorkExpTotal || '-',
            workExperiences: resume.workExperience.map(experience => {
                experience.periodFrom = experience.periodFrom ? moment(experience.periodFrom).format('DD-MMM-YYYY') : '-'
                experience.periodTo = experience.periodTo ? moment(experience.periodTo).format('DD-MMM-YYYY') : '-'
                return experience
            }),
            avatar: undefined,
            showImageInPdf: resume.showImageInPdf
        }

        if (resume.photoPath) {
            let urlAvatar = await imageToBase64(`${process.env.AWS_ENDPOINT}${CONSTANT.CRMS_BUCKET}/${resume.company.companyUrl}/${CONSTANT.RESUME_AWS_FOLDER}image/${resume.photoPath}`).catch(_e => { return null })
            bodyObj.avatar = `data:image/png;base64,${urlAvatar}`
        }
        // footer resume pdf
        let footerObj = {
            companyBusinessTerm: company.businessTerm,
            footerEmailAddress: company.footerEmailAddress
        }

        const resumeHeader = await ejs.renderFile(path.resolve(path.join('public', 'views') + CONSTANT.EMAIL_EJS_TEMPLATE.RESUME_PDF_TEMPLATE.HEADER), headerObj).catch(_e => { return '' })
        const resumeBody = await ejs.renderFile(path.resolve(path.join('public', 'views') + CONSTANT.EMAIL_EJS_TEMPLATE.RESUME_PDF_TEMPLATE.BODY), bodyObj).catch(_e => { return '' })
        const resumeFooter = await ejs.renderFile(path.resolve(path.join('public', 'views') + CONSTANT.EMAIL_EJS_TEMPLATE.RESUME_PDF_TEMPLATE.FOOTER), footerObj).catch(_e => { return '' })

        try {
            const browser = await puppeteer.launch({
                headless: true,
                args: [
                    '--no-sandbox',
                    '--disable-gpu',
                ]
            })
            const page = await browser.newPage()

            await page.setContent(resumeBody)

            const pathFileServer = `Ref-${resume.id}-${resume.firstName}-${resume.lastName}.pdf`
            await page.pdf({
                path: pathFileServer,
                format: 'A4',
                displayHeaderFooter: true,
                printBackground: true,
                margin: {
                    top: '120px',
                    bottom: '120px'
                },
                headerTemplate: resumeHeader,
                footerTemplate: resumeFooter
            }).then(buffer => {
                let pdfPath = CONSTANT.RESUME_BRANDED_FORMAT_NAME(resume)
                s3.upload({
                    Bucket: CONSTANT.CRMS_BUCKET,
                    Key: `${company.companyUrl}/${CONSTANT.RESUME_AWS_FOLDER}${pdfPath}`,
                    Body: buffer
                }, async (err, _data) => {
                    if (err) return res.status(500).send({ resume, msg: 'CANNOT_CREATE_PDF' })
                    await app.service('resume').patch(resume.id, {
                        resumePdfPath: pdfPath
                    }).catch(_e => { return null })
                    resume.resumePdfPath = pdfPath

                    if (req.query.download) {
                        try {
                            res.download(pathFileServer, () => {
                                fs.unlinkSync(pathFileServer)
                            })
                        } catch (_e) {
                            return true
                        }
                    } else {
                        try {
                            fs.unlinkSync(pathFileServer)
                        } catch (_e) {
                            return res.status(500).send({ resume, state: false, msg: 'ERR_GENERATE_PDF' })
                        }
                        return res.status(200).send({ resume, state: true, msg: 'GENERATE_PDF_SUCCESSFUL' })
                    }
                })
            })
            await browser.close()
        } catch (_e) {
            return res.status(500).send({ resume, state: false, msg: 'CANNOT_CREATE_PDF' })
        }
    })

    app.post('/resume/search', async (req, res) => {
        if (!req.headers['authorization']) res.status(401).send(new NotAuthenticated('NOT_AUTHENTICATED'))

        let decodeToken
        if (req.feathers.headers.authorization) {
            try {
                decodeToken = JwtDecode(req.feathers.authentication.accessToken)
            } catch (err) {
                return res.status(401).send(new NotAuthenticated('INVALID_TOKEN'))
            }
        }

        await checkRmsUser(app, decodeToken).catch(err => {
            return res.status(401).send(new NotAuthenticated(err))
        })

        const sequelize = app.get('sequelizeClient')
        const limit = req.query.$limit ? req.query.$limit : 10
        const skip = req.query.$skip ? req.query.$skip : 0

        let ftsConditional
        if (req.body.s) {
            let search = req.body.s
                .replace(/[\\(]/g, '( ') // separate single word from "(" and ")" to regex
                .replace(/[\\)]/g, ' )')
                .replace(CONSTANT.REGEX_IT, CONSTANT.REPLACING_FTS_IT) // replacing value it

            ftsConditional = search
                .replace(CONSTANT.REGEX_IN_DOUBLE_QUOTE, (match, key) => { // get word in double quotes
                    key = key.replace(CONSTANT.REGEX_SPACING, CONSTANT.REPLACING_FTS_SPACING)
                    if (key.split('').pop() === '*')
                        key = key.substring(0, key.length - 1) + CONSTANT.REPLACING_FTS_MATCH_ALL // replace * with :*
                    return `(fts_strip_search @@ ${CONSTANT.PHRASE_TS_QUERY}('simple','${key}'))`
                })
                .replace(CONSTANT.REGEX_SINGLE_WORD, (match, _key) => { // get single word
                    return match.toUpperCase() === CONSTANT.QUERY_AND.trim() || match.toUpperCase() === CONSTANT.QUERY_OR.trim() || match.toUpperCase() === CONSTANT.QUERY_NOT.trim() ?
                        match.toUpperCase() : `(fts_strip_search @@ ${CONSTANT.TEXT_TS_QUERY}('simple', '${match}'))`
                })
        }

        let query = CONSTANT.QUERY_WHERE, condition = ''
        if (ftsConditional) {
            query += `(${ftsConditional})`
            condition = CONSTANT.QUERY_AND
        }

        if (req.body.refNo && Array.isArray(req.body.refNo)) {
            query += condition + `id IN (${req.body.refNo.join(',')})`
            condition = CONSTANT.QUERY_AND
        }

        if (req.body.isActive !== null && req.body.isActive !== undefined) {
            const isActive = filterSpecialCharacters(req.body.isActive)
            query += condition + `is_active = ${isActive}`
            condition = CONSTANT.QUERY_AND
        }

        if (req.body.name && Array.isArray(req.body.name)) {
            for (let name of req.body.name) {
                query += condition + `(CONCAT(first_name, ' ', last_name) iLike '%${name}%')`
                condition = CONSTANT.QUERY_AND
            }
        }

        if (req.body.gender) {
            const gender = filterSpecialCharacters(req.body.gender)
            query += condition + `gender iLike '${gender}'`
            condition = CONSTANT.QUERY_AND
        }

        if (req.body.age && Array.isArray(req.body.age)) {
            let queryAge = []
            req.body.age.map(age => {
                const yearNow = (new Date()).getFullYear()
                const monthDate = moment(new Date()).format('MM-DD')
                const minAge = CONSTANT.RESUME_SEARCH_FILTER_AGE[age - 1].min
                const maxAge = CONSTANT.RESUME_SEARCH_FILTER_AGE[age - 1].max
                if (!isNaN(age) && age <= CONSTANT.RESUME_SEARCH_FILTER_AGE.length && age > 0) {
                    let filter = age === CONSTANT.RESUME_SEARCH_FILTER_AGE.length ?
                        `(dob < '${yearNow - minAge}-${monthDate}')` : `(dob < '${yearNow - minAge}-${monthDate}' AND dob > '${yearNow - maxAge}-${monthDate}')`
                    queryAge.push(filter)
                }
            })
            queryAge = queryAge.length > 1 ? `(${queryAge.join(' OR ')})` : queryAge[0]
            if (queryAge) {
                query += condition + queryAge
                condition = CONSTANT.QUERY_AND
            }
        }

        if (req.body.yearExperience) {
            const yearExperience = filterSpecialCharacters(req.body.yearExperience)
            query += condition + `work_exp_total = ${yearExperience}`
            condition = CONSTANT.QUERY_AND
        }

        if (req.body.educationId && Array.isArray(req.body.educationId)) {
            query += condition + `education_id IN (${req.body.educationId.join(',')})`
            condition = CONSTANT.QUERY_AND
        }

        if (req.body.sgpResidentialStatus && Array.isArray(req.body.sgpResidentialStatus)) {
            query += condition + `sgp_residential_status IN (${req.body.sgpResidentialStatus.join(',')})`
            condition = CONSTANT.QUERY_AND
        }

        if (req.body.nationalityId && Array.isArray(req.body.nationalityId)) {
            query += condition + `nationality_id IN (${req.body.nationalityId.join(',')})`
            condition = CONSTANT.QUERY_AND
        }

        if (req.body.designationId && Array.isArray(req.body.designationId)) {
            query += condition + `role_id IN (${req.body.designationId.join(',')})`
            condition = CONSTANT.QUERY_AND
        }

        if (req.body.disciplineId && Array.isArray(req.body.disciplineId)) {
            query += condition + `discipline_id IN (${req.body.disciplineId.join(',')})`
            condition = CONSTANT.QUERY_AND
        }

        if (req.body.rankId && Array.isArray(req.body.rankId)) {
            query += condition + `rank_id IN (${req.body.rankId.join(',')})`
            condition = CONSTANT.QUERY_AND
        }

        if (req.body.availability) {
            const availability = filterSpecialCharacters(req.body.availability)
            query += condition + `availability iLike '%${availability}%'`
            condition = CONSTANT.QUERY_AND
        }

        if (req.body.currentLocationId) {
            const currentLocationId = filterSpecialCharacters(req.body.currentLocationId)
            query += condition + `current_location_id = ${currentLocationId}`
            condition = CONSTANT.QUERY_AND
        }

        if (req.body.updatedRange) {
            let time = CONSTANT.UPDATED_RESUME_RANGE(req.body.updatedRange)
            if (time && time !== 0) {
                query += condition + `updated_at > '${moment(new Date(Date.now() - time)).format('YYYY-MM-DD')}'`
                condition = CONSTANT.QUERY_AND
            }
        }

        if (req.body.salaryRange) {
            let range = CONSTANT.SALARY_RESUME_RANGED(req.body.salaryRange)
            if (range && typeof range === 'object') {
                query += condition + ' '
                query += range.max === null ? `exp_salary_amount > ${range.min}` : `(exp_salary_amount >= ${range.min} AND exp_salary_amount <= ${range.max})`
                condition = CONSTANT.QUERY_AND
            }
        }

        if (req.body.sectorId && Array.isArray(req.body.sectorId)) {
            query += condition + `resume.id IN (SELECT resume_id FROM resume_sectors WHERE sector_id IN (${req.body.sectorId.join(',')}))`
            condition = CONSTANT.QUERY_AND
        }

        if (req.body.email && Array.isArray(req.body.email)) {
            let queryEmail = []
            req.body.email.map(email => {
                queryEmail.push(`'${email}'`)
            })
            query += condition + `
            (resume.id IN (
                SELECT resume_id FROM resume_contacts WHERE resume_contacts.category = 3 AND resume_contacts.value IN (${queryEmail.join(',')})
            ) OR resume.id IN (
                SELECT resume.id FROM resume INNER JOIN users ON users.id = resume.user_id WHERE users.email IN (${queryEmail.join(',')})
            ))` // 3: category = email
            condition = CONSTANT.QUERY_AND
        }

        if (req.body.mobile && Array.isArray(req.body.mobile)) {
            let queryMobile = []
            req.body.mobile.map(mobile => {
                queryMobile.push(`resume_contacts.value iLike '%${mobile}'`)
            })
            query += condition + `resume.id IN (SELECT resume_id FROM resume_contacts WHERE resume_contacts.category = 1 AND resume_contacts.value IN (${queryMobile.join(',')}))` // 3: category = email
            condition = CONSTANT.QUERY_AND
        }

        if (req.body.companyId) {
            const companyId = filterSpecialCharacters(req.body.companyId)
            if (req.body.isPortalResume) {
                // resume.company_id = ${companyId} at the end incase is_allow_search of cloned resume is sync to 0
                query += condition + `(((resume.company_id = ${companyId} OR resume.company_id IS NULL) AND resume.is_allow_search = 1)
                        OR
                    resume.company_id = ${companyId}
                )`
            } else {
                query += condition + `resume.company_id = ${companyId}`
            }
            condition = CONSTANT.QUERY_AND
        }

        // !sort by order
        let order = ''
        if (req.body.sortUpdateAt) {
            order = ` ORDER BY resume.updated_at ${req.body.sortUpdateAt === '-1' ? 'DESC' : 'ASC'}`
        }

        query = query === CONSTANT.QUERY_WHERE ? '' : query

        // count total
        const total = await sequelize.query(`SELECT COUNT(*) FROM resume ${query}`).then(result => {
            return result[0][0]
        }).catch(_err => {
            console.log(_err)
            return res.status(500).send(new GeneralError('WRONG_SEARCH_FORMAT'))
        })
        // raw query
        sequelize.query(`SELECT id
            ,user_id as "userId"
            ,first_name as "firstName"
            ,last_name as "lastName"
            ,contact_home as "contactHome"
            ,residential_address as "residentialAddress"
            ,company_id as "companyId"
            ,is_blacklisted as "isBlacklisted"
            ,blacklist_reason as "blacklistReason"
            ,gender
            ,dob
            ,nationality_id as "nationalityId"
            ,nationality_other as "nationalityOther"
            ,sgp_residential_status as "sgpResidentialStatus"
            ,current_location_id as "currentLocationId"
            ,salary_amount as "salaryAmount"
            ,salary_freq as "salaryFreq"
            ,salary_is_sgd as "salaryIsSgd"
            ,salary_currency as "salaryCurrency"
            ,exp_salary_amount as "expSalaryAmount"
            ,exp_salary_freq as "expSalaryFreq"
            ,exp_salary_is_sgd as "expSalaryIsSgd"
            ,exp_salary_currency as "expSalaryCurrency"
            ,show_salary as "showSalary"
            ,is_active as "isActive"
            ,is_portal_resume as "isPortalResume"
            ,accept_term_date as "acceptTermDate"
            ,past_employment_history as "pastEmploymentHistory"
            ,original_resume_name as "originalResumeName"
            ,created_by as "createdBy"
            ,updated_by as "updatedBy"
            ,created_at as "createdAt"
            ,updated_at as "updatedAt"
        FROM resume ${query} ${order} LIMIT ${limit} OFFSET ${skip};`).then(async searchResult => {
            let data = []
            const mapResume = searchResult[0].map(async resume => {
                resume.currentLocation = resume.currentLocationId ? await app.service('locations').get(resume.currentLocationId, {
                    query: {
                        $select: ['id', 'name', 'abbreviation']
                    }
                }).catch(_e => { return null }) : null

                resume.nationality = resume.nationalityId ? await app.service('nationalities').get(resume.nationalityId, {
                    query: {
                        $select: ['id', 'name']
                    }
                }).catch(_e => { return null }) : null

                resume.residentialStatus = resume.sgpResidentialStatus ? await app.service('sgp-residential-status').get(resume.sgpResidentialStatus, {
                    query: {
                        $select: ['id', 'name']
                    }
                }).catch(_e => { return null }) : null

                resume.user = resume.userId ? await app.service('users').get(resume.userId, {
                    query: {
                        $select: ['id', 'email']
                    }
                }).catch(_e => { return null }) : null

                resume.updatedBy = resume.updatedBy ? await app.service('users').get(resume.updatedBy, {
                    query: {
                        $select: ['id', 'email']
                    }
                }).catch(_e => { return null }) : null

                resume.contacts = await app.service('resume/contacts').find({
                    query: {
                        resumeId: resume.id,
                        $select: ['id', 'category', 'value'],
                        $sort: {
                            id: 1
                        }
                    },
                    paginate: false
                }).catch(_e => { return null })

                resume.salaryCurrencyObj = resume.salaryCurrency ? await app.service('currencies').findOne({
                    query: {
                        id: resume.salary_currency,
                        $select: ['id', 'name', 'status']
                    }
                }).catch(_e => { return null }) : null

                resume.expSalaryCurrencyObj = resume.expSalaryCurrency ? await app.service('currencies').findOne({
                    query: {
                        id: resume.exp_salary_currency,
                        $select: ['id', 'name', 'status']
                    }
                }).catch(_e => { return null }) : null

                resume.workExperience = await app.service('resume/work-experience').find({
                    query: {
                        resumeId: resume.id,
                        $select: ['id', 'periodFrom', 'periodTo', 'presentDate', 'company', 'division', 'divisionApplicable', 'position', 'duties', 'countInRelatedExp'],
                        $sort: {
                            periodTo: -1
                        }
                    },
                    paginate: false
                }).catch(_e => { return [] })

                data.push(resume)
            })

            await Promise.all(mapResume)

            res.status(200).send({
                total: parseInt(total.count, 10),
                limit: parseInt(limit, 10),
                skip: parseInt(skip, 10),
                data: data.sort(dynamicSort(req.body.sortUpdateAt === '-1' ? '-updatedAt' : 'updatedAt'))
            })
        }).catch(_err => {
            console.log(_err)
            return res.status(500).send(new GeneralError('ERR_CONNECTION'))
        })
    })

    app.post('/upload-cv/:resumeId', multer({}).single('file'), async (req, res) => {
        const resume = await app.service('resume').get(req.params.resumeId).catch(_err => { return res.status(400).send(new BadRequest('RESUME_NOT_EXISTED')) })

        let bucket = CONSTANT.BUCKET
        let key = CONSTANT.RESUME_AWS_FOLDER

        if (resume.companyId) {
            bucket = CONSTANT.CRMS_BUCKET
            key = `${resume.company.companyUrl}/${CONSTANT.RESUME_AWS_FOLDER}`
        }

        // get Resume original
        const fileName = `${md5(Date.now())}.upload.${req.file.originalname}`
        const filePath = `${CONSTANT.PATH_TO_RESUME_FILE}${fileName}`

        let originalResume
        try {
            if (!fs.existsSync(CONSTANT.PATH_TO_RESUME_FILE)) {
                fs.mkdirSync(CONSTANT.PATH_TO_RESUME_FILE)
            }

            fs.writeFileSync(filePath, req.file.buffer)

            originalResume = await getFileOriginal(req.file, fileName).catch(err => {
                return res.status(500).send(new GeneralError(err))
            })

            fs.unlinkSync(filePath)
        } catch (_err) {
            return res.status(500).send(new GeneralError('ERR_CONNECTION'))
        }

        s3.createBucket(() => {
            const user = `${resume.firstName} ${resume.lastName}`
            const filePath = `${user}-${md5(Date.now())}.${req.file.originalname.split('.').pop()}`
            s3.upload({
                Bucket: bucket,
                Key: `${key}${filePath}`,
                Body: req.file.buffer
            }, async (err, _data) => {
                if (err) return res.status(500).send(new GeneralError('ERR_CONNECTION'))
                const patchResume = {
                    resumePath: filePath,
                    resumeStripSearch: originalResume,
                    originalResumeName: req.file.originalname,
                    resumeHashContent: md5(req.file.buffer),
                    updatedAt: new Date()
                }
                await app.service('resume').patch(resume.id, patchResume).catch(_err => { return res.status(500).send(new GeneralError('ERR_CONNECTION')) })

                if (!resume.companyId) {
                    const listResumeClone = await app.service('resume').find({
                        query: {
                            companyId: {
                                $ne: null
                            },
                            rootResumeId: req.params.resumeId,
                            $select: ['id', 'companyId']
                        },
                        paginate: false
                    }).catch(_err => {
                        return res.status(500).send(new GeneralError('ERR_CONNECTION'))
                    })

                    await app.service('resume').patch(null, patchResume, {
                        query: {
                            id: {
                                $in: listResumeClone.map(({ id }) => id)
                            }
                        }
                    })

                    listResumeClone.map(async cloneResume => {
                        if (cloneResume.company.companyUrl)
                            await s3Crms.upload({
                                Bucket: CONSTANT.CRMS_BUCKET,
                                Key: `${cloneResume.company.companyUrl}/${CONSTANT.RESUME_AWS_FOLDER}${filePath}`,
                                Body: req.file.buffer
                            }).promise()
                    })
                }

                return res.status(200).send(JSON.stringify({
                    state: true,
                    originalResumeName: req.file.originalname,
                    resumePath: filePath
                }))
            })
        })
    })

    app.get('/download-cv/company-user/:resumeId', async (req, res) => {
        if (!req.headers['authorization']) res.status(401).send(new NotAuthenticated('NOT_AUTHENTICATED'))

        let decodeToken
        try {
            decodeToken = JwtDecode(req.feathers.authentication.accessToken)
        } catch (err) {
            return res.status(401).send(new NotAuthenticated('INVALID_TOKEN'))
        }

        const rmsUser = await app.service('rms-users-info').findOne({
            query: {
                userId: decodeToken.userId,
                $select: ['userId', 'companyId']
            }
        }).catch(_e => { return res.status(401).send(new BadRequest('USER_NOT_EXISTED')) })

        const resume = await app.service('resume').get(req.params.resumeId, {
            query: {
                $select: ['id', 'resumePath', 'originalResumeName', 'resumePdfPath', 'companyId', 'userId']
            }
        }).catch(_err => { return res.status(400).send(new BadRequest('RESUME_NOT_EXISTED')) })

        const { company } = rmsUser
        if (!company)
            res.status(500).send(new BadRequest('USER_NOT_ALLOWED'))
        if (_.intersection(rmsUser.user.role, CONSTANT.VALIDATE_ROLE_CRMS).length > 0) {
            if (resume.companyId === company.id) {
                const resumeS3 = req.query.isBrandedFormat ? resume.resumePdfPath : resume.resumePath
                const resumeName = req.query.isBrandedFormat ? resume.resumePdfPath : resume.originalResumeName
                return s3Crms.getObject({
                    Bucket: CONSTANT.CRMS_BUCKET,
                    Key: `${company.companyUrl}/${CONSTANT.RESUME_AWS_FOLDER}${resumeS3}`
                }, async (err, data) => {
                    if (err) return res.status(500).send(new BadRequest(err.message === 'The specified key does not exist.' ? 'FILE_NOT_EXISTED' : 'ERR_CONNECTION'))
                    try {
                        fs.writeFileSync(resumeName, data.Body)
                        res.download(resumeName, () => {
                            fs.unlinkSync(resumeName)
                        })
                    } catch (_e) {
                        return true
                    }
                })
            } else
                return res.status(500).send(new BadRequest('USER_NOT_ALLOWED'))
        } else {
            return res.status(500).send(new BadRequest('USER_NOT_ALLOWED'))
        }
    })

    app.get('/download-cv/job-seeker/:userId', async (req, res) => {
        if (!req.headers['authorization']) res.status(401).send(new NotAuthenticated('NOT_AUTHENTICATED'))

        let decodeToken
        try {
            decodeToken = JwtDecode(req.feathers.authentication.accessToken)
        } catch (err) {
            return res.status(401).send(new NotAuthenticated('INVALID_TOKEN'))
        }

        const resume = await app.service('resume').findOne({
            query: {
                userId: req.params.userId,
                resumePath: { $ne: null },
                companyId: null
            }
        }).catch(_e => { return res.status(400).send(new BadRequest('RESUME_NOT_EXISTED')) })

        if (!resume)
            return res.status(400).send(new BadRequest('RESUME_PATH_NOT_EXISTED'))

        const rmsUser = await app.service('rms-users-info').findOne({
            query: {
                userId: decodeToken.userId
            }
        }).catch(_e => { return null })

        if (
            decodeToken.userId === req.params.userId ||
            _.intersection(rmsUser.user.role, CONSTANT.VALIDATE_ROLE_ARMS).length > 0 ||
            _.intersection(rmsUser.user.role, CONSTANT.VALIDATE_ROLE_CRMS).length > 0
        ) {
            return s3.getObject({
                Bucket: CONSTANT.BUCKET,
                Key: `${CONSTANT.RESUME_AWS_FOLDER}${resume.resumePath}`
            }, async (err, data) => {
                if (err) return res.status(500).send(new GeneralError('FILE_NOT_EXISTED'))
                try {
                    fs.writeFileSync(resume.originalResumeName, data.Body)
                    res.download(resume.originalResumeName, () => {
                        fs.unlinkSync(resume.originalResumeName)
                    })
                } catch (_e) {
                    return true
                }
            })
        } else
            return res.status(500).send(new BadRequest('USER_NOT_ALLOWED'))
    })

    app.delete('/remove-cv/:resumeId', async (req, res) => {
        if (!req.headers['authorization']) return res.status(401).send(new NotAuthenticated('NOT_AUTHENTICATED'))
        const resume = await app.service('resume').get(req.params.resumeId).catch(_e => { return null })
        if (resume.resumePath !== null)
            await s3.deleteObject({
                Bucket: CONSTANT.BUCKET,
                Key: `${CONSTANT.RESUME_AWS_FOLDER}${resume.resumePath}`
            }, async (err, _data) => {
                if (err) return res.status(500).send(new GeneralError('ERR_CONNECTION'))
                await app.service('resume').patch(resume.id, {
                    resumePath: null,
                    resumeHashContent: null,
                    originalResumeName: null,
                    updatedAt: new Date()
                }).catch(_err => { return res.status(500).send(new GeneralError('ERR_CONNECTION')) })
                res.status(200).send(JSON.stringify({ state: true }))
            })
    })

    app.post('/resume/parsing-cv', multer({}).array('files'), async (req, res) => {
        if (!req.headers['authorization']) return res.status(401).send(new NotAuthenticated('NOT_AUTHENTICATED'))

        let decodeToken
        if (req.feathers.headers.authorization) {
            try {
                decodeToken = JwtDecode(req.feathers.authentication.accessToken)
            } catch (err) {
                return res.status(401).send(new NotAuthenticated('INVALID_TOKEN'))
            }
        }

        if (!req.files) return res.status(400).send(new BadRequest('FILE_NOT_EXISTED'))
        const rmsUser = await app.service('rms-users-info').findOne({
            query: {
                userId: decodeToken.userId
            }
        }).catch(err => {
            return res.status(401).send(new NotAuthenticated(err))
        })

        try {
            let stripResumeOjb = []
            const allFile = await req.files.map(async (file, index) => {
                const resumeHashContent = await app.service('resume').findOne({
                    query: {
                        companyId: rmsUser.companyId,
                        resumeHashContent: md5(file.buffer)
                    }
                }).catch(_e => { return null })
                // check duplicate resume
                let checkDuplicateEmail = false

                // create folder to store resume to parse if exist
                if (!fs.existsSync(CONSTANT.PATH_TO_RESUME_FILE)) {
                    fs.mkdirSync(CONSTANT.PATH_TO_RESUME_FILE)
                }

                const fileName = `${md5(Date.now())}.${file.originalname}`
                const filePath = `${CONSTANT.PATH_TO_RESUME_FILE}${fileName}`

                let resume
                let stripData
                try {
                    fs.writeFileSync(filePath, file.buffer)

                    if (!fs.existsSync(`${filePath}`)) {
                        return res.status(500).send(new GeneralError('ERR_CONNECTION'))
                    }

                    // strip data
                    resume = new ResumeParser(filePath)

                    stripData = await resume.parseToJSON()
                        .then(data => {
                            console.log(data)
                            return data.parts
                        })
                        .catch(err => {
                            console.log(err)
                            return res.status(500).send(new GeneralError('ERR_CONNECTION'))
                        })
                } catch (err) {
                    return res.status(500).send(new GeneralError('ERR_CONNECTION'))
                }

                let originalResume = await getFileOriginal(file, fileName).catch(err => {
                    return res.status(500).send(new GeneralError(err))
                })

                let originalToStrip = originalResume.toLowerCase()
                originalToStrip = filterSpecialCharacters(originalToStrip)
                originalToStrip = originalToStrip.replace(/ +(?= )/g, '')

                const csvRenderFile = fs.readFileSync('./src/data/dictionary.csv', 'utf8')
                const csv = await neatCsv(csvRenderFile)

                stripData.email = stripData.email || null
                // eslint-disable-next-line no-control-regex
                originalResume.replace(CONSTANT.REGEX.EMAIL, match => {
                    stripData.email = match
                    return match
                })

                stripData.name = file.originalname.split('.')[0]

                stripData.phone = stripData.phone || null
                originalResume.replace(CONSTANT.REGEX.PHONE, match => {
                    stripData.phone = match
                    return match
                })

                stripData.gender = null
                originalToStrip.replace(/(?<=\b(gender|sex)\s)(.\w+)/, match => {
                    stripData.gender = (match.toLowerCase() === 'male' || match.toLowerCase() === 'm') ? 0 : 1
                    return match
                })

                stripData.nationality = null
                originalToStrip.replace(/(?<=\b(nationality|nationalities|citizen|citizenship)\s)(.\w+)/, async match => {
                    stripData.nationality = match
                    return match
                })

                stripData.nationality = stripData.nationality ? await app.service('nationalities').findOne({
                    query: {
                        name: {
                            $iLike: `%${stripData.nationality}%`
                        },
                        $select: ['id']
                    }
                }).then(result => {
                    return result ? result.id : null
                }).catch(_e => { return null }) : null

                stripData.skills = []
                csv.map(({ skill }) => {
                    originalToStrip.replace(skill, match => {
                        if (match !== '')
                            stripData.skills.push(match)
                        return match
                    })
                })

                let listMatchEmail = []
                if (stripData.email) {
                    listMatchEmail = await app.service('resume/contacts').find({
                        query: {
                            category: 3,
                            value: stripData.email
                        },
                        paginate: false
                    }).then(result => {
                        return result.map(({ resumeId }) => resumeId)
                    }).catch(_e => { return [] })

                    await app.service('resume').find({
                        query: {
                            id: {
                                $in: listMatchEmail
                            },
                            companyId: rmsUser.companyId,
                            $select: ['id']
                        },
                        paginate: false
                    }).then(result => {
                        if (result.length > 0)
                            checkDuplicateEmail = true
                    })

                    const user = await app.service('users').findOne({
                        query: {
                            email: stripData.email
                        }
                    }).catch(_e => { return null })

                    if (user) {
                        const userResumeId = await app.service('resume').findOne({
                            query: {
                                userId: user.id,
                                companyId: rmsUser.companyId,
                                $select: ['id']
                            }
                        }).then(result => {
                            if (result)
                                checkDuplicateEmail = true
                            return result ? result.id : null
                        }).catch(_e => { return null })
                        listMatchEmail.push(userResumeId)
                    }
                }

                const resumeMatched = await app.service('resume').find({
                    query: {
                        id: {
                            $in: listMatchEmail
                        },
                        companyId: rmsUser.companyId
                    },
                    paginate: false
                }).catch(_e => { return [] })

                stripResumeOjb.push({
                    index,
                    fileName: file.originalname,
                    strip: stripData,
                    stripOriginal: originalResume,
                    isDuplicateEmail: checkDuplicateEmail,
                    isDuplicateContent: resumeHashContent ? true : false,
                    resume: resumeHashContent ? [resumeHashContent] : resumeMatched
                })

                fs.unlinkSync(filePath)
            })

            await Promise.all(allFile)

            return res.status(200).send(JSON.stringify({ state: true, total: stripResumeOjb.length, data: stripResumeOjb.sort(dynamicSort('index')) }))
        } catch (err) {
            fs.readdir(CONSTANT.PATH_TO_RESUME_FILE, (err, files) => {
                if (err) throw err

                for (const file of files) {
                    if (file !== 'index.js')
                        fs.unlink(path.join(CONSTANT.PATH_TO_RESUME_FILE, file), err => {
                            if (err) throw err
                        })
                }
            })
            return res.status(500).send(new GeneralError('ERR_CONNECTION'))
        }
    })

    app.post('/resume/sync-rms-upload', [
        body('resumeOriginalId').notEmpty().withMessage('MISSING_FIELD_REQUIRED'),
        body('resumeCloneId').notEmpty().withMessage('MISSING_FIELD_REQUIRED'),
        body('resumeSyncId').notEmpty().withMessage('MISSING_FIELD_REQUIRED')
    ], async (req, res) => {
        // validate field
        const errors = await validationResult(req).errors

        if (errors.length > 0)
            return res.status(400).send(new BadRequest(errors[0].msg))

        // validate roles
        if (!req.headers['authorization']) return res.status(401).send(new NotAuthenticated('NOT_AUTHENTICATED'))

        let decodeToken
        try {
            decodeToken = JwtDecode(req.feathers.authentication.accessToken)
        } catch (err) {
            return res.status(401).send(new NotAuthenticated('INVALID_TOKEN'))
        }

        // validate role ARMS
        const rmsUser = await app.service('rms-users-info').findOne({
            query: {
                userId: decodeToken.userId,
                $select: ['id', 'userId']
            }
        }).catch(_err => { return res.status(401).send(new NotAuthenticated('USER_NOT_EXISTED')) })
        if (_.intersection(CONSTANT.VALIDATE_ROLE_CRMS, rmsUser.user.role).length === 0) return res.status(400).send(new BadRequest('USER_NOT_ALLOWED'))

        const { resumeOriginalId, resumeCloneId, resumeSyncId } = req.body

        // 1. replace root resumeId (resumeOriginalId) in resumeSyncId (resumeSync will be the clone of the original)
        await app.service('resume').patch(resumeSyncId, {
            rootResumeId: resumeOriginalId
        }).catch(_e => { return true })
        // 2. replace all resume clone -> resumeSyncId (resumeClone will be removed)
        await app.service('jobs/resume').patch(null, {
            resumeId: resumeSyncId
        }, {
            query: {
                resumeId: resumeCloneId
            }
        }).catch(_e => { return true })
        // 3. remove resume clone
        await app.service('resume').remove(resumeCloneId).catch(_e => { return true })

        res.status(200).send({ msg: 'Sync Successful!' })
    })

    app.patch('/resume/reset-term', async (req, res) => {
        if (!req.headers['authorization']) return res.status(401).send(new NotAuthenticated('NOT_AUTHENTICATED'))

        let decodeToken
        try {
            decodeToken = JwtDecode(req.feathers.authentication.accessToken)
        } catch (err) {
            return res.status(401).send(new NotAuthenticated('INVALID_TOKEN'))
        }

        const rmsUser = await app.service('rms-users-info').findOne({
            query: {
                userId: decodeToken.userId,
                $select: ['userId']
            }
        }).catch(_err => { return res.status(401).send(new NotAuthenticated('USER_NOT_EXISTED')) })
        if (!rmsUser) return res.status(401).send(new NotAuthenticated('USER_NOT_EXISTED'))
        if(_.intersection(rmsUser.user.role, CONSTANT.VALIDATE_ROLE_ARMS).length === 0)
            return res.status(400).send(new NotAuthenticated('USER_NOT_ALLOWED'))

        const sequelize = await app.get('sequelizeClient')
        sequelize.query('UPDATE resume SET accept_term_date = null WHERE accept_term_date is not null').catch(_e => {
            return true
        })
        return res.status(200).send({state: true, message: 'UPDATE_SUCCESSFUL'})
    })

    // Initialize our service with any options it requires
    app.use('/resume', createService(options))

    // Get our initialized service so that we can register hooks
    const service = app.service('resume')

    service.hooks(hooks)
}
