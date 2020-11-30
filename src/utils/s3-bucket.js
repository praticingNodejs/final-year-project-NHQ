import AWS from 'aws-sdk'
import CONSTANT from '../constant'

let jsBucket = CONSTANT.JS_ACCESS_AWS
let crmsBucket = CONSTANT.CRMS_ACCESS_AWS

export const s3Js = new AWS.S3(jsBucket)
export const s3Crms = new AWS.S3(crmsBucket)
