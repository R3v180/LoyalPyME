// backend/src/config/swagger.config.ts
// Version: 1.0.0 (Extracted from index.ts)

import {
    UserRole,
    TierCalculationBasis,
    TierDowngradePolicy,
    BenefitType,
    OrderItemStatus,
    OrderStatus
} from '@prisma/client';

const port = process.env.PORT || 3000;

// Definición de la configuración de Swagger
export const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'LoyalPyME API',
      version: '1.17.0',
      description: 'API REST para la plataforma de fidelización LoyalPyME. Permite gestionar clientes, puntos, niveles, recompensas, historial, subidas de archivos, autenticación, funcionalidades de Super Administrador, administración del Módulo Camarero (gestión de carta, KDS, interfaz de camarero), y visualización de menú público y creación de pedidos.',
      contact: { name: 'Olivier Hottelet', email: 'olivierhottelet1980@gmail.com' },
      license: { name: 'Software Propietario. Copyright (c) 2024-2025 Olivier Hottelet', url: 'LICENSE.MD' }
    },
    servers: [
        { url: `http://localhost:${port}/api`, description: 'Servidor de Desarrollo Local (API Protegida)', },
        { url: `http://localhost:${port}/public`, description: 'Servidor de Desarrollo Local (API Pública)', },
    ],
    components: {
        securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', } },
        schemas: {
             ActivityLogItem: { type: 'object', properties: { id: { type: 'string', format: 'uuid', readOnly: true }, type: { type: 'string', enum: ['POINTS_EARNED_QR', 'POINTS_REDEEMED_REWARD', 'GIFT_REDEEMED', 'POINTS_ADJUSTED_ADMIN'], readOnly: true }, pointsChanged: { type: 'integer', nullable: true, readOnly: true, description: 'Cambio en puntos (+/-), null si no aplica.' }, description: { type: 'string', nullable: true, readOnly: true, description: 'Descripción del evento.' }, createdAt: { type: 'string', format: 'date-time', readOnly: true, description: 'Fecha y hora del evento.' } } },
             PaginatedActivityResponse: { type: 'object', properties: { logs: { type: 'array', items: { '$ref': '#/components/schemas/ActivityLogItem' } }, totalPages: { type: 'integer', example: 5 }, currentPage: { type: 'integer', example: 1 }, totalItems: { type: 'integer', example: 73 } } },
             LoginCredentials: { type: 'object', required: ['email', 'password'], properties: { email: { type: 'string', format: 'email'}, password: { type: 'string', format: 'password'} }, example: { email: 'user@example.com', password: 'password123' } },
             RegisterUserDto: { type: 'object', required: ['email', 'password', 'phone', 'documentId', 'documentType', 'businessId', 'role'], properties: { email: { type: 'string', format: 'email'}, password: { type: 'string', format: 'password', minLength: 6 }, name: { type: 'string', nullable: true }, phone: { type: 'string', example: '+34612345678' }, documentId: { type: 'string'}, documentType: { type: 'string', enum: ['DNI', 'NIE', 'PASSPORT', 'OTHER']}, businessId: { type: 'string', format: 'uuid'}, role: { type: 'string', enum: ['CUSTOMER_FINAL']} } },
             RegisterBusinessDto: { type: 'object', required: ['businessName', 'adminEmail', 'adminPassword'], properties: { businessName: { type: 'string', minLength: 2 }, adminEmail: { type: 'string', format: 'email'}, adminPassword: { type: 'string', format: 'password', minLength: 6 }, adminName: { type: 'string', nullable: true } } },
             ForgotPasswordDto: { type: 'object', required: ['email'], properties: { email: { type: 'string', format: 'email'} } },
             ResetPasswordDto: { type: 'object', required: ['password'], properties: { password: { type: 'string', format: 'password', minLength: 6 } } },
             UserResponse: { type: 'object', properties: { id: { type: 'string', format: 'uuid'}, email: { type: 'string', format: 'email'}, name: { type: 'string', nullable: true }, role: { type: 'string', enum: ['BUSINESS_ADMIN', 'CUSTOMER_FINAL', 'SUPER_ADMIN', 'WAITER', 'KITCHEN_STAFF', 'BAR_STAFF']}, businessId: { type: 'string', format: 'uuid', nullable: true}, points: { type: 'integer'}, createdAt: { type: 'string', format: 'date-time'}, isActive: { type: 'boolean'}, isFavorite: { type: 'boolean', nullable: true }, currentTierId: { type: 'string', format: 'uuid', nullable: true }, tierAchievedAt: { type: 'string', format: 'date-time', nullable: true } } },
             LoginResponse: { type: 'object', properties: { token: { type: 'string'}, user: { '$ref': '#/components/schemas/UserResponse' } } },
             SuccessMessage: { type: 'object', properties: { message: { type: 'string'} }, example: { message: 'Operación completada con éxito.'} },
             ErrorResponse: { type: 'object', properties: { message: { type: 'string'}, error: { type: 'string', nullable: true } }, example: { message: 'Error de validación.', error: 'El campo email es inválido.'} },
             RewardBase: { type: 'object', properties: { id: { type: 'string', format: 'uuid', readOnly: true }, name_es: { type: 'string', nullable: true}, name_en: { type: 'string', nullable: true}, description_es: { type: 'string', nullable: true }, description_en: { type: 'string', nullable: true }, pointsCost: { type: 'integer', format: 'int32', minimum: 0 }, isActive: { type: 'boolean'}, businessId: { type: 'string', format: 'uuid', readOnly: true }, createdAt: { type: 'string', format: 'date-time', readOnly: true }, updatedAt: { type: 'string', format: 'date-time', readOnly: true }, imageUrl: { type: 'string', format: 'url', nullable: true } } },
             CreateRewardDto: { type: 'object', required: ['name_es', 'name_en', 'pointsCost'], properties: { name_es: { type: 'string', example: 'Café Gratis' }, name_en: { type: 'string', example: 'Free Coffee' }, description_es: { type: 'string', nullable: true, example: 'Un café espresso o americano.' }, description_en: { type: 'string', nullable: true, example: 'One espresso or americano coffee.' }, pointsCost: { type: 'integer', format: 'int32', minimum: 0, example: 100 }, imageUrl: { type: 'string', format: 'url', nullable: true } } },
             UpdateRewardDto: { type: 'object', properties: { name_es: { type: 'string'}, name_en: { type: 'string'}, description_es: { type: 'string', nullable: true }, description_en: { type: 'string', nullable: true }, pointsCost: { type: 'integer', format: 'int32', minimum: 0 }, isActive: { type: 'boolean'}, imageUrl: { type: 'string', format: 'url', nullable: true } } },
             RewardListResponse: { type: 'array', items: { '$ref': '#/components/schemas/RewardBase' } },
             DeletedRewardResponse: { type: 'object', properties: { message: { type: 'string'}, deletedReward: { '$ref': '#/components/schemas/RewardBase' } } },
             GenerateQrDto: { type: 'object', required: ['amount', 'ticketNumber'], properties: { amount: { type: 'number', format: 'float', minimum: 0.01 }, ticketNumber: { type: 'string'} } },
             QrDataResponse: { type: 'object', properties: { qrToken: { type: 'string', format: 'uuid'}, amount: { type: 'number', format: 'float'} } },
             ValidateQrDto: { type: 'object', required: ['qrToken'], properties: { qrToken: { type: 'string', format: 'uuid'} } },
             PointsEarnedResponse: { type: 'object', properties: { message: { type: 'string'}, pointsEarned: { type: 'integer'}, user: { '$ref': '#/components/schemas/UserResponse' } }, example: { message: '...', pointsEarned: 7, user: { } } },
             RedeemRewardResult: { type: 'object', properties: { message: { type: 'string'}, newPointsBalance: { type: 'integer'} }, example: { message: '...', newPointsBalance: 930 } },
             RewardInfoForGift: { type: 'object', properties: { id: { type: 'string', format: 'uuid', readOnly: true }, name_es: { type: 'string', nullable: true, readOnly: true }, name_en: { type: 'string', nullable: true, readOnly: true }, description_es: { type: 'string', nullable: true, readOnly: true }, description_en: { type: 'string', nullable: true, readOnly: true }, imageUrl: { type: 'string', format: 'url', nullable: true, readOnly: true } } },
             AssignerInfo: { type: 'object', properties: { name: { type: 'string', nullable: true, readOnly: true }, email: { type: 'string', format: 'email', readOnly: true } } },
             BusinessInfoForGift: { type: 'object', properties: { name: { type: 'string', readOnly: true } } },
             GrantedReward: { type: 'object', properties: { id: { type: 'string', format: 'uuid', readOnly: true }, status: { type: 'string', enum: ['PENDING', 'REDEEMED', 'EXPIRED'], readOnly: true }, assignedAt: { type: 'string', format: 'date-time', readOnly: true }, redeemedAt: { type: 'string', format: 'date-time', nullable: true, readOnly: true }, reward: { '$ref': '#/components/schemas/RewardInfoForGift' }, assignedBy: { '$ref': '#/components/schemas/AssignerInfo', nullable: true }, business: { '$ref': '#/components/schemas/BusinessInfoForGift', nullable: true } } },
             GrantedRewardListResponse: { type: 'array', items: { '$ref': '#/components/schemas/GrantedReward' } },
             RedeemedGiftResponse: { type: 'object', properties: { message: { type: 'string'}, grantedRewardId: { type: 'string', format: 'uuid'}, rewardId: { type: 'string', format: 'uuid'}, redeemedAt: { type: 'string', format: 'date-time'} } },
             TierBenefitBase: { type: 'object', properties: { id: { type: 'string', format: 'uuid', readOnly: true }, type: { type: 'string', enum: Object.values(BenefitType) }, value: { type: 'string'}, description: { type: 'string', nullable: true }, isActive: { type: 'boolean'} } },
             TierWithBenefits: { type: 'object', properties: { id: { type: 'string', format: 'uuid', readOnly: true }, name: { type: 'string'}, level: { type: 'integer'}, minValue: { type: 'number'}, description: { type: 'string', nullable: true }, benefitsDescription: { type: 'string', nullable: true }, isActive: { type: 'boolean'}, benefits: { type: 'array', items: { '$ref': '#/components/schemas/TierBenefitBase' } } } },
             TierListResponse: { type: 'array', items: { '$ref': '#/components/schemas/TierWithBenefits' } },
             TierConfigResponse: { type: 'object', properties: { tierSystemEnabled: { type: 'boolean' }, tierCalculationBasis: { type: 'string', enum: Object.values(TierCalculationBasis), nullable: true }, tierCalculationPeriodMonths: { type: 'integer', nullable: true, minimum: 0 }, tierDowngradePolicy: { type: 'string', enum: Object.values(TierDowngradePolicy) }, inactivityPeriodMonths: { type: 'integer', nullable: true, minimum: 1 } } },
             TierConfigUpdateDto: { type: 'object', properties: { tierSystemEnabled: { type: 'boolean'}, tierCalculationBasis: { type: 'string', enum: Object.values(TierCalculationBasis), nullable: true }, tierCalculationPeriodMonths: { type: 'integer', nullable: true, minimum: 0 }, tierDowngradePolicy: { type: 'string', enum: Object.values(TierDowngradePolicy) }, inactivityPeriodMonths: { type: 'integer', nullable: true, minimum: 1 } } },
             TierBase: { type: 'object', properties: { id: { type: 'string', format: 'uuid', readOnly: true }, name: { type: 'string'}, level: { type: 'integer', minimum: 0 }, minValue: { type: 'number', minimum: 0 }, description: { type: 'string', nullable: true }, benefitsDescription: { type: 'string', nullable: true }, isActive: { type: 'boolean'}, businessId: { type: 'string', format: 'uuid', readOnly: true }, createdAt: { type: 'string', format: 'date-time', readOnly: true }, updatedAt: { type: 'string', format: 'date-time', readOnly: true } } },
             CreateTierDto: { type: 'object', required: ['name', 'level', 'minValue'], properties: { name: { type: 'string'}, level: { type: 'integer', minimum: 0 }, minValue: { type: 'number', minimum: 0 }, description: { type: 'string', nullable: true }, benefitsDescription: { type: 'string', nullable: true }, isActive: { type: 'boolean', default: true } } },
             UpdateTierDto: { type: 'object', properties: { name: { type: 'string'}, level: { type: 'integer', minimum: 0 }, minValue: { type: 'number', minimum: 0 }, description: { type: 'string', nullable: true }, benefitsDescription: { type: 'string', nullable: true }, isActive: { type: 'boolean'} } },
             AdminTierListResponse: { type: 'array', items: { '$ref': '#/components/schemas/TierWithBenefits' } },
             DeletedTierResponse: { type: 'object', properties: { message: { type: 'string'}, deletedTier: { '$ref': '#/components/schemas/TierBase' } } },
             TierBenefitListResponse: { type: 'array', items: { '$ref': '#/components/schemas/TierBenefitBase' } },
             CreateTierBenefitDto: { type: 'object', required: ['type', 'value'], properties: { type: { type: 'string', enum: Object.values(BenefitType) }, value: { type: 'string'}, description: { type: 'string', nullable: true }, isActive: { type: 'boolean', default: true } } },
             UpdateTierBenefitDto: { type: 'object', properties: { type: { type: 'string', enum: Object.values(BenefitType) }, value: { type: 'string'}, description: { type: 'string', nullable: true }, isActive: { type: 'boolean'} } },
             DeletedTierBenefitResponse: { type: 'object', properties: { message: { type: 'string'}, deletedBenefit: { '$ref': '#/components/schemas/TierBenefitBase' } } },
             AdminStatsOverviewResponse: { type: 'object', properties: { totalActiveCustomers: { type: 'integer'}, newCustomersLast7Days: { type: 'integer'}, newCustomersPrevious7Days: { type: 'integer'}, pointsIssuedLast7Days: { type: 'integer'}, pointsIssuedPrevious7Days: { type: 'integer'}, rewardsRedeemedLast7Days: { type: 'integer'}, rewardsRedeemedPrevious7Days: { type: 'integer'} } },
             CustomerListItem: { type: 'object', properties: { id: { type: 'string', format: 'uuid' }, name: { type: 'string', nullable: true }, email: { type: 'string', format: 'email' }, points: { type: 'integer' }, createdAt: { type: 'string', format: 'date-time' }, isActive: { type: 'boolean' }, isFavorite: { type: 'boolean', nullable: true }, currentTier: { type: 'object', nullable: true, properties: { id: { type: 'string', format: 'uuid' }, name: { type: 'string' }, level: { type: 'integer' } } } } },
             AdminCustomerListResponse: { type: 'object', properties: { items: { type: 'array', items: { '$ref': '#/components/schemas/CustomerListItem' } }, totalPages: { type: 'integer' }, currentPage: { type: 'integer' }, totalItems: { type: 'integer' } } },
             CustomerDetailsResponse: { allOf: [ { '$ref': '#/components/schemas/UserResponse' }, { type: 'object', properties: { adminNotes: { type: 'string', nullable: true } } } ] },
             UpdateCustomerNotesDto: { type: 'object', properties: { notes: { type: 'string', nullable: true } } },
             AdjustPointsDto: { type: 'object', required: ['amount'], properties: { amount: { type: 'number', not: { const: 0 } }, reason: { type: 'string', nullable: true } } },
             ChangeCustomerTierDto: { type: 'object', properties: { tierId: { type: 'string', format: 'uuid', nullable: true } } },
             AssignRewardDto: { type: 'object', required: ['rewardId'], properties: { rewardId: { type: 'string', format: 'uuid' } } },
             CustomerActionResponse: { type: 'object', properties: { message: { type: 'string' }, customer: { type: 'object', properties: { id: { type: 'string', format: 'uuid' }, points: { type: 'integer' }, currentTierId: { type: 'string', format: 'uuid', nullable: true }, tierAchievedAt: { type: 'string', format: 'date-time', nullable: true }, isFavorite: { type: 'boolean' }, isActive: { type: 'boolean' } }, additionalProperties: false } } },
             GrantedRewardIdResponse: { type: 'object', properties: { message: { type: 'string' }, grantedRewardId: { type: 'string', format: 'uuid' } } },
             BulkCustomerIdListDto: { type: 'object', required: ['customerIds'], properties: { customerIds: { type: 'array', items: { type: 'string', format: 'uuid' }, minItems: 1 } } },
             BulkStatusUpdateDto: { type: 'object', required: ['customerIds', 'isActive'], properties: { customerIds: { type: 'array', items: { type: 'string', format: 'uuid' }, minItems: 1 }, isActive: { type: 'boolean'} } },
             BulkPointsAdjustDto: { type: 'object', required: ['customerIds', 'amount'], properties: { customerIds: { type: 'array', items: { type: 'string', format: 'uuid' }, minItems: 1 }, amount: { type: 'number', not: { const: 0 } }, reason: { type: 'string', nullable: true } } },
             BulkOperationResponse: { type: 'object', properties: { message: { type: 'string' }, count: { type: 'integer'} } },
             ImageUploadResponse: { type: 'object', properties: { url: { type: 'string', format: 'url', description: 'URL de la imagen subida a Cloudinary.' } } },
             // DTOs para Camarero Staff
             ReadyPickupItemDto: { 
                type: 'object',
                properties: {
                    orderItemId: { type: 'string', format: 'uuid', description: "ID del OrderItem" },
                    orderId: { type: 'string', format: 'uuid', description: "ID del Order al que pertenece" },
                    orderNumber: { type: 'string', description: "Número legible del Order" },
                    orderCreatedAt: { type: 'string', format: 'date-time', description: "Fecha de creación del Order" },
                    tableIdentifier: { type: 'string', nullable: true, description: "Identificador de la mesa" },
                    itemNameSnapshot_es: { type: 'string', nullable: true, description: "Nombre del ítem en español (snapshot)" },
                    itemNameSnapshot_en: { type: 'string', nullable: true, description: "Nombre del ítem en inglés (snapshot)" },
                    quantity: { type: 'integer', description: "Cantidad del ítem" },
                    itemNotes: { type: 'string', nullable: true, description: "Notas específicas del OrderItem" },
                    kdsDestination: { type: 'string', nullable: true, description: "Destino KDS (COCINA, BARRA)" },
                    selectedModifiers: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                optionName_es: { type: 'string', nullable: true },
                                optionName_en: { type: 'string', nullable: true },
                            }
                        }
                    },
                    currentOrderItemStatus: { type: 'string', enum: Object.values(OrderItemStatus) }
                }
             },
             MarkOrderItemServedPayloadDto: { 
                type: 'object',
                required: ['newStatus'],
                properties: {
                    newStatus: { type: 'string', enum: [OrderItemStatus.SERVED], description: 'Debe ser "SERVED"' }
                }
             },
             OrderItemStatusUpdateResponseDto: { 
                type: 'object',
                properties: {
                    message: { type: 'string' },
                    orderItemId: { type: 'string', format: 'uuid' },
                    newStatus: { type: 'string', enum: Object.values(OrderItemStatus) },
                    orderStatus: { type: 'string', enum: Object.values(OrderStatus), nullable: true }
                }
             }
         }
    },
    security: [{ bearerAuth: [] }],
  },
  apis: [
    './src/routes/*.ts', 
    './src/auth/*.ts', 
    './src/admin/*.ts', 
    './src/camarero/*.ts', 
    './src/public/*.ts',
    './src/rewards/*.ts',
    './src/points/*.ts',
    './src/customer/*.ts',
    './src/tiers/*.ts',
    './src/uploads/*.ts',
    './src/superadmin/*.ts',
  ], 
};