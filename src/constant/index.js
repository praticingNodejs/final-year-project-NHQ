export default {
    PREFIX: '/api/v1',
    BUCKET: 'bbportal',
    S3_URL_EXPIRE: 60 * 60 * 24 * 7, // by sec - expires in 1 week
    CRMS_BUCKET: 'bb-crms-production',
    AVATAR_AWS_FOLDER: 'profile_pics/',
    RESUME_AWS_FOLDER: 'resume/',
    RESUME_PDF_AWS_FOLDER: 'resume/pdfs/',
    PROJECT_DOCS_AWS_FOLDER: 'project_docs/',
    PATH_RETURN_IMG: '...',
    JS_ACCESS_AWS: {
        endpoint: process.env.AWS_ENDPOINT,
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    },
    FROM_EMAIL: {
        DEFAULT: 'Bluebox ',
        JOB_ALERT: 'Bluebox.Jobs Job Alert <notification@bluebox.jobs>',
        NEWS_EVENT: 'Bluebox.Jobs News Event <notification@bluebox.jobs>',
    },
    CRMS_ACCESS_AWS: {
        endpoint: process.env.AWS_ENDPOINT,
        accessKeyId: process.env.AWS_CRMS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_CRMS_SECRET_ACCESS_KEY
    },
    GET_USER_SIGN: (currentUser) => {
        return currentUser.emailSign || `${currentUser.firstName || ''} ${currentUser.lastName || ''} (${currentUser.company.name})`
    },
    RESUME_BRANDED_FORMAT_NAME: (resume) => {
        return `${resume.firstName} ${resume.lastName} - Ref: ${resume.id}.pdf`
    },
    ROOT_AWS_PATH: 'https://s3-ap-southeast-1.amazonaws.com/',
    AWS_COMPANY_LOGO: '/client/image/',
    EMAIL_EJS_TEMPLATE: {
        JOB_PORTAL_TEMPLATE: '/job-portal-email-template.ejs',
        CREATE_NEW_CRMS: '/crms-new-user-template.ejs',
        JR_NOTIFICATION: {
            JOB_RESUME_NOTIFICATION: '/jobs-resume-notification/jobs-resume-notification.ejs',
            NOT_SHORTLISTED_NOTIFICATION: '/jobs-resume-notification/not-shortlisted-jobs-resume.ejs',
            INTERVIEW_AND_FAILED: '/jobs-resume-notification/interview-and-failed.ejs',
            INTERVIEW_SCHEDULE: '/jobs-resume-notification/interview-schedule.ejs',
            CONSENT_NOTIFICATION: '/jobs-resume-notification/consent-notification.ejs',
        },
        RESUME_PDF_TEMPLATE: {
            HEADER: '/resume-pdf-template/resume-pdf-header.ejs',
            BODY: '/resume-pdf-template/resume-pdf-content.ejs',
            FOOTER: '/resume-pdf-template/resume-pdf-footer.ejs'
        },
        RMS_RULES: {
            UPDATE_JOB: '/email-template-rules/update-job.ejs',
            UPDATE_JOB_STATUS: '/email-template-rules/update-job-status.ejs',
            ADD_JOB: '/email-template-rules/add-job.ejs',
            UPDATE_JOB_RESUME: '/email-template-rules/update-job-resume.ejs'
        },
        ALERTS: {
            JOB_ALERT: '/alerts/job-alert.ejs',
            CUSTOM_EMAIL: '/alerts/custom-email.ejs',
            NEWS_EVENT_ALERT: '/alerts/news-event-alert.ejs'
        }
    },
    LOGO: {
        EDM_LOGO: 'https://recruiter.bluebox.jobs/images_new/EDM_logo.png',
        EDM1: 'https://recruiter.bluebox.jobs/images_new/EDM1.png',
        EDM2: 'https://recruiter.bluebox.jobs/images_new/EDM2.png',
        EDM3: 'https://recruiter.bluebox.jobs/images_new/EDM3.png',
        EDM_LOGO_BLUE: 'https://recruiter.bluebox.jobs/images_new/EDM_logoblue.png',
        LINKEDIN_URL: 'https://www.linkedin.com/company/the-blue-barrel-pte-ltd?trk=cp_followed_name_the-blue-barrel-pte-ltd',
        DEFAULT_COMPANY_IMG: 'https://recruiter.bluebox.jobs/images_new/EDM2.png',
    },
    CUSTOM_EMAIL_TYPE: (type) => {
        switch(type) {
            case 1:
                return 'Job Alerts'
            case 2:
                return 'Newsletters & Events'
            case 3:
                return 'Profile Update Reminder'
            default:
                return 'The Bluebox'
        }
    },
    CUSTOM_USER_TYPE: (type) => {
        const userType = parseInt(type, 10)
        switch(userType) {
            case 1: // Active User
            case 3: // Inactive User
                return [2]
            case 2: // RmsUser
                return [7, 8, 10, 11]
            case 4: // All user
                return [2, 7, 8, 10, 11]
            default:
                return [2, 7, 8, 10, 11]
        }
    },
    FLAG_STATUS: {
        RED: [6, 7],
        BLUE: [4],
        GREY: [5, 8, 9]
    },
    JOBS_RESUME_STATUS: (type) => {
        switch (type) {
            case 1: return 'Open'
            case 2: return 'Commenced'
            case 3: return 'Not Short Listed'
            case 4: return 'Interview'
            case 5: return 'Interviewed And Failed'
            case 6: return 'Successful'
            case 7: return 'Job Offered'
            case 8: return 'Withdrawn from Interview/Rejected Offer'
            case 9: return 'Job Offer Withdrawn'
            default: return null
        }
    },
    RMS_USER_EMAIL_RULE: (status) => {
        switch (status) {
            case 2: return 2 // status = 2 return email_rule 2
            case 4: return 3
            case 7: return 8
            case 8: return 9
            case 9: return 12
            default: return null
        }
    },
    INTERVIEW_MODE: (type) => {
        switch (type) {
            case '1':
                return 'In Person'
            case '2':
                return 'Phone'
            case '3':
                return 'Video Conference'
            case '4':
                return 'Others'
            default: return '-'
        }
    },
    JOBS_HIRING_TYPE: (type) => {
        switch (type) {
            case 1:
                return 'Direct Hire'
            case 2:
                return 'Agency Outsource'
            default: return null
        }
    },
    LAST_EMP_STATUS: (type) => {
        switch (type) {
            case 1:
                return 'Contract'
            case 2:
                return 'Permanent'
            case 3:
                return 'Others'
            default: return '-'
        }
    },
    RESUME_SEARCH_FILTER_AGE: [{
        min: 0, max: 25
    }, {
        min: 25, max: 35
    }, {
        min: 35, max: 45
    }, {
        min: 45, max: 55
    }, {
        min: 55, max: 65
    }, {
        min: 65, max: null
    }],
    UPDATED_RESUME_RANGE: (type) => {
        let time = 0
        type = parseInt(type, 10)
        switch (type) {
            case 3: time = 1000 * 60 * 60 * 24 * 30; break // 3 months
            case 6: time = 1000 * 60 * 60 * 24 * 30 * 6; break // 6 months
            case 12: time = 1000 * 60 * 60 * 24 * 30 * 12; break // 1 year
            case 24: time = 1000 * 60 * 60 * 24 * 30 * 12 * 2; break // 2 years
            default:
                time = 0
                break
        }
        return time
    },
    SALARY_RESUME_RANGED: (type) => {
        let range = null
        type = parseInt(type, 10)
        switch (type) {
            case 1: range = { min: 0, max: 5000 }; break
            case 2: range = { min: 5000, max: 10000 }; break
            case 3: range = { min: 10000, max: 15000 }; break
            case 4: range = { min: 15000, max: 20000 }; break
            case 5: range = { min: 20000, max: null }; break
            default:
                range = null
                break
        }
        return range
    },
    SALARY_PERIOD: (type) => {
        switch (type) {
            case 1:
                return 'Per Hour'
            case 2:
                return 'Per Day'
            case 3:
                return 'Per Month'
            case 4:
                return 'Per Annum'
            default:
                return '-'
        }
    },
    VALIDATE_ROLE_ARMS: ['arms admin'],
    VALIDATE_ROLE_CRMS: [
        'account administrator',
        'human resource staff',
        // 'hiring manager'
    ],
    VALIDATE_ROLE_JS: ['jobseeker'],
    VALIDATE_CREATE_USER: function () {
        const ALLOW_CREATE_CRMS = this.VALIDATE_ROLE_CRMS
        return [{
            role: 'arms admin',
            allowCreate: [...this.VALIDATE_ROLE_ARMS, ...this.VALIDATE_ROLE_CRMS]
        }, {
            role: 'account administrator',
            allowCreate: [...ALLOW_CREATE_CRMS]
        }]
    },
    RESUME_CONTACTS: {
        PHONE: 1,
        OFFICE_NO: 2,
        EMAIL: 3,
        CONTACT_NO: 4
    },
    REGEX_IN_DOUBLE_QUOTE: /"([^"]+)"/g,
    REGEX_SPACING: /\s/g,
    REGEX_SINGLE_WORD: /(?<=^|\s)[A-Za-z||0-9]+(?=\W*(?:\s*$|\s))/g,
    REGEX_IT: /(\s|\b)it(\s|\b)/g,
    REGEX_CAMEL_CASE: /_([a-z])/g,
    REPLACING_FTS_IT: 'information technology',
    REPLACING_FTS_SPACING: '<->',
    REPLACING_FTS_MATCH_ALL: ':*',
    TEXT_TS_QUERY: 'to_tsquery',
    PHRASE_TS_QUERY: 'phraseto_tsquery',
    QUERY_WHERE: ' WHERE ',
    QUERY_AND: ' AND ',
    QUERY_OR: ' OR ',
    QUERY_NOT: ' NOT ',
    QUERY_ORDER: '  ORDER BY ',
    ORDER_DESC: ' DESC ',
    ORDER_ASC: ' ASC ',
    PATH_TO_RESUME_FILE: './public/resume-upload-file/',
    PATH_TO_RESUME_STRIP_PY: './src/utils/stripCv/strip.py',
    LOGIN_PORTAL: {
        JOB_SEEKER: 'jobPortal',
        CRMS: 'crms',
        ARMS: 'arms'
    },
    TOKEN_SECRET: process.env.TOKEN_SECRET,
    TOKEN_OPTIONS: {
        PATCH_JOB_RESUME_TOKEN: {
            algorithm: 'HS256',
            expiresIn: '1w'
        }
    },
    REGEX: {
        // eslint-disable-next-line no-control-regex
        EMAIL: /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/,
        PHONE: /([+]?\d{1,2}[.-\s]?)?(\d{3}[.(-\s)]?){2}\d{4}/
    },
    GET_REPORT_GRAPH_SCHEDULE: (type) => {
        switch (type) {
            case '1':
                return 1000 * 60 * 60 * 24 * 14 // last 3 months -> 2 weeks each
            case '2':
                return 1000 * 60 * 60 * 24 * 30 // 6 months -> 1 month each
            case '3':
                return 1000 * 60 * 60 * 24 * 30 * 2 // last 1 year -> 2 months each
            default:
                return 1000 * 60 * 60 * 24 * 14 // last 3 months -> 2 weeks each
        }
    }
}
