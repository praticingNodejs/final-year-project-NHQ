import { Sequelize, Op } from 'sequelize'

const operatorsAliases = {
    $eq: Op.eq,
    $ne: Op.ne,
    $gte: Op.gte,
    $gt: Op.gt,
    $lte: Op.lte,
    $lt: Op.lt,
    $not: Op.not,
    $in: Op.in,
    $notIn: Op.notIn,
    $is: Op.is,
    $like: Op.like,
    $notLike: Op.notLike,
    $iLike: Op.iLike,
    $notILike: Op.notILike,
    $regexp: Op.regexp,
    $notRegexp: Op.notRegexp,
    $iRegexp: Op.iRegexp,
    $notIRegexp: Op.notIRegexp,
    $between: Op.between,
    $notBetween: Op.notBetween,
    $overlap: Op.overlap,
    $contains: Op.contains,
    $contained: Op.contained,
    $adjacent: Op.adjacent,
    $strictLeft: Op.strictLeft,
    $strictRight: Op.strictRight,
    $noExtendRight: Op.noExtendRight,
    $noExtendLeft: Op.noExtendLeft,
    $and: Op.and,
    $or: Op.or,
    $any: Op.any,
    $all: Op.all,
    $values: Op.values,
    $col: Op.col
}

const timezone = '+07:00'

export default function (app) {
    const connectionString = app.get('postgres')
    const sequelize = new Sequelize(connectionString, {
        dialect: 'postgres',
        sql: true,
        logging: false,
        // dialectOptions: {
        //     ssl: {
        //         rejectUnauthorized: false
        //     },
        // },
        define: {
            createdAt: true,
            updatedAt: true,
            underscored: true,
            freezeTableName: true,
            charset: 'utf8',
            timestamps: false,
            timezone
        },
        timezone,
        operatorsAliases
    })
    const oldSetup = app.setup

    app.set('sequelizeClient', sequelize)

    app.setup = function (...args) {
        const result = oldSetup.apply(this, args)

        // Set up data relationships
        const models = sequelize.models
        Object.keys(models).forEach(name => {
            if ('associate' in models[name]) {
                models[name].associate(models)
            }
        })

        // Sync to the database
        app.set('sequelizeSync', sequelize.sync())

        return result
    }
}
