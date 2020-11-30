import dotenv from 'dotenv'
import path from 'path'

/**
 * Initialize environment variables.
 */
if (process.env.NODE_ENV === 'production') {
    dotenv.config({ path: path.resolve(process.cwd(), '.env.production') })
} else {
    dotenv.config({ path: '.env' })
}