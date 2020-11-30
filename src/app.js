/**
 * Environment configuration
 */
import './env'

import path from 'path'
import favicon from 'serve-favicon'
import compress from 'compression'
import helmet from 'helmet'
import cors from 'cors'
import logger from './logger'

import feathers from '@feathersjs/feathers'
import configuration from '@feathersjs/configuration'
import express from '@feathersjs/express'
import socketio from '@feathersjs/socketio'
import swagger from 'feathers-swagger'

import { Pool } from 'pg'
import session from 'express-session'
const pgSession = require('connect-pg-simple')(session)

import log from 'morgan'
import bodyParser from 'body-parser'
import cookieParser from 'cookie-parser'
import findOne from 'feathers-findone'

import middleware from './middleware'
import services from './services'
import appHooks from './app.hooks'
import channels from './channels'
import { swaggerConfig, sequelizeToJsonSchemas } from './swaggerConfig'

import authentication from './authentication'

import sequelize from './sequelize'

const app = express(feathers())

// Load app configuration
app.configure(configuration())
app.configure(sequelizeToJsonSchemas)

app.use(log('dev'))

/*
 * Add the cookie parser to GET routes
 */
app.get('*', cookieParser())
/*
 * Add the cookie parser to POST routes
 */

app.post('*', cookieParser())

app.use(cookieParser())

// allow CORS
app.all('*', function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*')
    res.header('Access-Control-Allow-Credentials', true)
    res.header('Access-Control-Allow-Methods', 'GET, PUT, PATCH, POST, DELETE, OPTIONS')
    res.header('Access-Control-Allow-Headers', 'Content-type, Authorization, Accept, X-Access-Token, X-Key')
    if (req.method == 'OPTIONS') {
        res.status(200).end()
    } else {
        next()
    }
})

// Enable security, CORS, compression, favicon and body parsing
app.use(helmet())
app.use(cors())
app.use(compress())
app.use(bodyParser.json({ limit: '300mb' }))
app.use(bodyParser.urlencoded({ limit: '300mb', extended: true }))
// app.use(expressValidator())
app.use(favicon(path.join(app.get('public'), 'favicon.ico')))
// Host the public folder
app.use('/', express.static(app.get('public')))

// Set up Plugins and providers
app.configure(express.rest())
app.configure(socketio(io => io.sockets.setMaxListeners(555)))

//feathers sequelize find-one
app.configure(findOne())

app.configure(sequelize)

// Configure other middleware (see `middleware/index.js`)
app.configure(middleware)
app.configure(authentication)

// Set up swagger
app.configure(swagger(swaggerConfig(app)))

// Set up our services (see `services/index.js`)
app.configure(services)

// Set up event channels (see channels.js)
app.configure(channels)

const pgPool = new Pool({
    connectionString: app.get('postgres')
})

app.use(session({
    store: new pgSession({
        pool : pgPool,                // Connection pool
        tableName : 'session'   // Use another table-name than the default "session" one
    }),
    saveUninitialized: true,
    secret: 'TEST',
    resave: false,
    cookie: { maxAge: 30 * 24 * 60 * 60 * 1000 } // 30 days
}))

app.use((req, res, next) => {
    req.feathers.ip = req.ip
    req.feathers.headers = req.headers
    next()
})

// Configure a middleware for 404s and the error handler
app.use(express.notFound())
app.use(express.errorHandler({ logger }))

app.hooks(appHooks)

export default app
