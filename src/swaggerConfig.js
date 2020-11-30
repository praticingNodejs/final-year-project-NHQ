import { JsonSchemaManager, OpenApi3Strategy, } from '@alt3/sequelize-to-json-schemas'

const sequelizeToJsonSchemas = (app) => {
    const schemaManager = new JsonSchemaManager({
        absolutePaths: true,
    })

    const openApi3Strategy = new OpenApi3Strategy()

    app.set('jsonSchemaManager', schemaManager)
    app.set('openApi3Strategy', openApi3Strategy)
}

const swaggerConfig = (app) => ({
    openApiVersion: 3,
    uiIndex: true,
    specs: {
        info: {
            title: 'BlueBox API Documentation',
            description: 'Documentation for using BlueBox APIs',
            version: '1.0.0',
        },
        tags: [
            {
                name: 'authentication',
                description: 'Authentication for login and logout'
            },
            {
                name: 'users',
                description: 'Users service'
            },
            {
                name: 'sectors',
                description: 'Sectors service'
            }
        ],
        components: {
            securitySchemes: {
                BearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                }
            },
            schemas: {
                userAuthentication: {
                    type: 'object',
                    required: ['email', 'password'],
                    properties: {
                        email: {
                            type: 'string',
                            description: 'Username used to log in'
                        },
                        password: {
                            type: 'string',
                            description: 'Password for the specific user'
                        },
                        strategy: {
                            type: 'string',
                            description: 'Strategy to login',
                            enum: ['local', 'google', 'facebook', 'ath0']
                        }
                    }
                },
                userAuthenticationResponse: {
                    type: 'object',
                    properties: {
                        accessToken: {
                            type: 'string',
                            description: 'Token used to access restricted resource'
                        },
                        expiresIn: {
                            type: 'string',
                            description: 'Expiration date of the token'
                        }
                    }
                },
                userLogout: {
                    type: 'object',
                    required: ['accessToken'],
                    properties: {
                        accessToken: {
                            type: 'string',
                            description: 'Access Token'
                        }
                    }
                },
                userLogoutResponse: {
                    type: 'object',
                    properties: {
                        accessToken: {
                            type: 'string',
                        },
                        authentication: {
                            type: 'string'
                        }
                    }
                },
                authManagement: {
                    type: 'object',
                    properties: {
                        action: {
                            type: 'string',
                            enum: ['checkUnique', 'verifySignupLong', 'resendVerifySignup', 'sendResetPwd', 'resetPwdLong', 'passwordChange', 'identityChange']
                        },
                        value: {
                            type: 'object',
                        }
                    }
                },
                trendingKeyword: {
                    type: 'object',
                    properties: {
                        text: {
                            type: 'string',
                        }
                    }
                }
            }
        },
        paths: {
            '/authentication': {
                post: {
                    tags: ['authentication'],
                    summary: 'Get new JWT',
                    description: 'Generate a new JWT',
                    responses: {
                        201: {
                            description: 'JWT returned',
                            content: {
                                'application/json': {
                                    schema: {
                                        $ref: '#/components/schemas/userAuthenticationResponse'
                                    }
                                }
                            }
                        },
                        401: {
                            description: 'Unauthorized'
                        }
                    },
                    requestBody: {
                        description: 'User information for login',
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: '#/components/schemas/userAuthentication'
                                }
                            }
                        },
                    },
                },
            },
            '/authentication/': {
                delete: {
                    security: {
                        bearerFormat: []
                    },
                    tags: ['authentication'],
                    summary: 'Log out API',
                    description: 'Pass in Bearer token in Header, will remove token in database',
                    responses: {
                        201: {
                            description: 'Logged out',
                            content: {
                                'application/json': {
                                    schema: {
                                        $ref: '#/components/schemas/userLogoutResponse'
                                    }
                                }
                            }
                        },
                        401: {
                            description: 'Unauthorized'
                        }
                    },
                },
            },
            '/users/auth-management': {
                post: {
                    externalDocs: 'https://github.com/feathers-plus/feathers-authentication-management/blob/master/docs.md',
                    tags: ['users'],
                    summary: 'Authentication management for reset password, change password, change email, verify signup',
                    description: 'Available options: checkUnique, verifySignupLong, resendVerifySignup, sendResetPwd, resetPwdLong, passwordChange, identityChange. See documation to know what to pass in the value field: https://github.com/feathers-plus/feathers-authentication-management/blob/master/docs.md',
                    responses: {
                        201: {
                            description: '',
                            content: {
                                'application/json': {
                                    schema: {
                                        $ref: '#/components/schemas/authManagementResponse'
                                    }
                                }
                            }
                        },
                        401: {
                            description: 'Unauthorized'
                        }
                    },
                    requestBody: {
                        description: 'Include options and accordingly values',
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: '#/components/schemas/authManagement'
                                }
                            }
                        },
                    },
                },
            },
            '/sectors/public': {
                get: {
                    tags: ['sectors'],
                    summary: 'Public API for sectors',
                    description: 'Public API for sectors',
                    parameters: [
                        {
                            name: 'limit',
                            in: 'query',
                            description: 'Limit the result, default 10, -1 to skip limit',
                            type: 'string'
                        }
                    ],
                    responses: {
                        200: {
                            'data': [],
                            description: 'return sectors sucess'
                        },
                        500: {
                            description: 'Bad request'
                        }
                    }
                }
            },
            '/ping': {
                get: {
                    tags: ['ping'],
                    summary: 'Ping server',
                    description: 'Ping server',
                    responses: {
                        201: {
                            description: 'Sever online',
                        },
                        500: {
                            description: 'Bad request'
                        }
                    }
                }
            },
            '/trending-keywords/add': {
                post: {
                    tags: ['trending-keywords'],
                    summary: 'Add a new trending keyword',
                    description: 'Add a new trending keyword',
                    responses: {
                        201: {
                            description: '',
                            content: {
                                'application/json': {
                                    schema: {
                                        $ref: '#/components/schemas/trendingKeyword'
                                    }
                                }
                            }
                        },
                        406: {
                            description: 'Contains blocked keyword'
                        }
                    },
                    requestBody: {
                        description: 'Add a new trending keyword',
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: '#/components/schemas/trendingKeyword'
                                }
                            }
                        },
                    },
                }
            }
        },
    },
    ignore: {
        paths: ['users/auth-management', 'mailer', 'ping', 'trending-keywords/add']
    },
    idType: 'string',
    defaults: {
        schemasGenerator(service, model, modelName) {
            if (!(service.options?.Model?.sequelize)) {
                return {}
            }
            const modelSchema = app
                .get('jsonSchemaManager')
                .generate(
                    service.options.Model,
                    app.get('openApi3Strategy'),
                    service.options.Model.options.jsonSchema
                )
            return {
                [model]: modelSchema,
                securities: ['create', 'update', 'patch', 'remove'],
                [`${model}_list`]: {
                    title: `${modelName} list`,
                    type: 'array',
                    items: { $ref: `#/components/schemas/${model}` }
                }
            }
        }
    }
})

export { swaggerConfig, sequelizeToJsonSchemas }