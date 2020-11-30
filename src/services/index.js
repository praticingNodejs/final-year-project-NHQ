/**
 * Common tools Service
 */
import certifications from './common-tools/certifications/certifications.service'
import currencies from './common-tools/currencies/currencies.service'
import designatedUsers from './common-tools/designated-users/designated-users.service'
import designations from './common-tools/designations/designations.service'
import disciplines from './common-tools/disciplines/disciplines.service'
import educations from './common-tools/educations/educations.service'
import expertises from './common-tools/expertises/expertises.service'
import faculties from './common-tools/faculties/faculties.service'
import jobStatuses from './common-tools/job-statuses/job-statuses.service'
import levels from './common-tools/levels/levels.service'
import locations from './common-tools/locations/locations.service'
import nationalities from './common-tools/nationalities/nationalities.service'
import profAffiliations from './common-tools/prof-affiliations/prof-affiliations.service'
import ranks from './common-tools/ranks/ranks.service'
import professionalRoles from './common-tools/professional-roles/professional-roles.service'
import sectorMappings from './common-tools/sector-mappings/sector-mappings.service'
import sectors from './common-tools/sectors/sectors.service'
import softwares from './common-tools/softwares/softwares.service'
import locationSub from './common-tools/locations/locations-sub/locations-sub.service'
import spgResidentialStatus from './common-tools/sgp-residential-status/sgp-residential-status.service'
import seo from './common-tools/seo/seo.service'

/**
 * Companies Service
 */
import companies from './companies/companies.service'
import companiesDisciplines from './companies/companies-common-tools/companies-disciplines/companies-disciplines.service'
import companiesSectors from './companies/companies-common-tools/companies-sectors/companies-sectors.service'
import companiesDesignations from './companies/companies-common-tools/companies-designations/companies-designations.service'
import companiesRanks from './companies/companies-common-tools/companies-ranks/companies-ranks.service'

/**
 * Jobs Service
 */
import jobs from './jobs/jobs.service'
import jobResume from './jobs/jobs-resume/jobs-resume.service'
import jobsAlerts from './jobs/jobs-alerts/jobs-alerts.service'
import jobsAlertsSchedule from './jobs/jobs-alerts/jobs-alerts-schedule/jobs-alerts-schedule.service'
import jobsAlertsSectors from './jobs/jobs-alerts/jobs-alerts-sectors/jobs-alerts-sectors.service'
import jobsAlertsPositions from './jobs/jobs-alerts/jobs-alerts-positions/jobs-alerts-positions.service.js'
import jobsLaterViews from './jobs/jobs-later-views/jobs-later-views.service'
import jobsUpdatedLogs from './jobs/jobs-updated-logs/jobs-updated-logs.service'
import jobCoowners from './jobs/jobs-coowners/jobs-coowners.service'
import jobsProjectContacts from './jobs/jobs-project-contacts/jobs-project-contacts.service'
import jobsResumeRemarks from './jobs/jobs-resume/jobs-resume-remarks/jobs-resume-remarks.service'
import jobsEducation from './jobs/jobs-educations/jobs-educations.service'
import jobsCredit from './jobs/jobs-credits/jobs-credits.service'
import jobSkills from './jobs/jobs-skills/jobs-skills.service'
import jobsSectorsFilter from './jobs/jobs-sectors-filter/jobs-sectors-filter.service'

import jobsResumeDocuments from './jobs/jobs-resume/jobs-resume-documents/jobs-resume-documents.service'
import jobsResumeAcknowledgements from './jobs/jobs-resume/jobs-resume-acknowledgements/jobs-resume-acknowledgements.service'
import jobsResumeNotifications from './jobs/jobs-resume/jobs-resume-notifications/jobs-resume-notifications.service'
import jobsResumeVisitor from './jobs/jobs-resume/jobs-resume-visitor/jobs-resume-visitor.service'
import jobsResumeInterview from './jobs/jobs-resume/jobs-resume-interview/jobs-resume-interview.service'

/**
 * Project Service
 */
import projects from './projects/projects.service'
import projectsContacts from './projects/projects-contacts/projects-contacts.service'
import projectsDocuments from './projects/projects-documents/projects-documents.service'
import projectsAccessLogs from './projects/projects-access-logs/projects-access-logs.service'

/**
 * Resumes Service
 */
import resume from './resume/resume.service'
import resumeContacts from './resume/resume-contacts/resume-contacts.service'
import resumeMessengers from './resume/resume-messengers/resume-messengers.service'
import resumeSectors from './resume/resume-sectors/resume-sectors.service'
import resumeWorkExperience from './resume/resume-work-experience/resume-work-experience.service'
import resumeEditReason from './resume/resume-edit-reason/resume-edit-reason.service'
import resumeDocuments from './resume/resume-documents/resume-documents.service'

/**
 * Trending keywords services
 */
import trendingKeywordsBlocked from './trending-keywords/blocked/trending-keywords-blocked.service'
import trendingKeywords from './trending-keywords/trending-keywords.service'
import trendingKeywordsAdd from './trending-keywords/add/add.service'

/**
 * User services
 */
import authManagement from './users/auth-management/auth-management.service'
import users from './users/users.service.js'
import systemRoles from './users/system-roles/system-roles.service.js'
import userSystemRoles from './users/users-system-roles/users-system-roles.service.js'
import rmsUsersInfo from './users/rms-users-info/rms-users-info.service.js'
import usersAccessLogs from './users/users-access-logs/users-access-logs.service'
import userBcc from './users/users-bcc/users-bcc.service'

/**
 * Email
 */
import customEmail from './e-mail/custom-emails/custom-emails.service'
import mailLogs from './e-mail/mail-logs/mail-logs.service'
import emailRules from './e-mail/email-rules/email-rules.service'
import emailRmsUsers from './e-mail/email-rms-users/email-rms-users.service'

/**
 * CMS
 */
import cmsSingleContent from './cms/cms-single-content/cms-single-content.service'
import cmsNewsEvents from './cms/cms-news-events/cms-news-events.service'
import cmsAdvertisements from './cms/cms-advertisements/cms-advertisements.service'
import cmsArticles from './cms/cms-articles/cms-articles.service'
import cmsSocialLinks from './cms/cms-social-links/cms-social-links.service'
import cmsContactDetail from './cms/cms-contact-us/cms-contact-detail/cms-contact-detail.service'
import cmsContactUs from './cms/cms-contact-us/cms-contact-us.service'
import cmsBanner from './cms/cms-banner/cms-banner.service'

/**
 * Other services
 */
import mailer from './e-mail/mailer/mailer.service'
import ping from './ping/ping.service'
import tbbDocuments from './common-tools/tbb-documents/tbb-documents.service'

// eslint-disable-next-line no-unused-vars
export default function (app) {

    /**
     * Common tools Service
     */
    app.configure(locationSub)
        .configure(certifications)
        .configure(currencies)
        .configure(designatedUsers)
        .configure(designations)
        .configure(disciplines)
        .configure(educations)
        .configure(expertises)
        .configure(faculties)
        .configure(jobStatuses)
        .configure(levels)
        .configure(locations)
        .configure(nationalities)
        .configure(profAffiliations)
        .configure(ranks)
        .configure(professionalRoles)
        .configure(sectorMappings)
        .configure(sectors)
        .configure(softwares)
        .configure(spgResidentialStatus)
        .configure(seo)

    /**
     * Companies Service
     */
    app.configure(companiesDisciplines)
        .configure(companiesSectors)
        .configure(companiesDesignations)
        .configure(companiesRanks)

    app.configure(companies)

    /**
     * Jobs Service
     */
    app.configure(jobsResumeNotifications)
        .configure(jobsResumeAcknowledgements)
        .configure(jobsResumeRemarks)
        .configure(jobsResumeDocuments)
        .configure(jobsResumeVisitor)
        .configure(jobsResumeInterview)
        .configure(jobResume)
        .configure(jobsSectorsFilter)
        .configure(jobSkills)

    app.configure(jobsAlertsSectors)
        .configure(jobsAlertsPositions)
        .configure(jobsEducation)
        .configure(jobsAlerts)
        .configure(jobsAlertsSchedule)
        .configure(jobsLaterViews)
        .configure(jobsUpdatedLogs)
        .configure(jobCoowners)
        .configure(jobsProjectContacts)
        .configure(jobsCredit)

    app.configure(jobs)

    /**
     * Project Service
     */
    app.configure(projectsAccessLogs)
        .configure(projectsContacts)
        .configure(projectsDocuments)

    app.configure(projects)


    /**
     * Resume Service
     */
    app.configure(resumeContacts)
        .configure(resumeMessengers)
        .configure(resumeSectors)
        .configure(resumeWorkExperience)
        .configure(resumeEditReason)
        .configure(resumeDocuments)

    app.configure(resume)

    /**
     * Trending keywords services
     */
    app.configure(trendingKeywordsBlocked)
        .configure(trendingKeywords)
        .configure(trendingKeywordsAdd)

    /**
     * User services
     */
    authManagement(app)
    app.configure(systemRoles)
        .configure(userSystemRoles)
        .configure(rmsUsersInfo)
        .configure(usersAccessLogs)
        .configure(userBcc)

    app.configure(users)

    /**
     * CMS services
     */
    app.configure(cmsSingleContent)
        .configure(cmsNewsEvents)
        .configure(cmsAdvertisements)
        .configure(cmsSocialLinks)
        .configure(cmsArticles)
        .configure(cmsContactDetail)
        .configure(cmsContactUs)
        .configure(cmsBanner)

    /**
     * Other Services
     */
    app.configure(mailer)
    app.configure(ping)
    app.configure(tbbDocuments)

    /**
     * Mail service
     */
    app.configure(customEmail)
        .configure(mailLogs)
        .configure(emailRules)
        .configure(emailRmsUsers)
}
