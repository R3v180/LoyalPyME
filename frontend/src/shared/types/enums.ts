// frontend/src/shared/types/enums.ts

export enum RewardType {
  MENU_ITEM = 'MENU_ITEM',
  DISCOUNT_ON_ITEM = 'DISCOUNT_ON_ITEM',
  DISCOUNT_ON_TOTAL = 'DISCOUNT_ON_TOTAL',
  GENERIC_FREE_PRODUCT = 'GENERIC_FREE_PRODUCT', // <-- LÍNEA AÑADIDA
}

export enum DiscountType {
  PERCENTAGE = 'PERCENTAGE',
  FIXED_AMOUNT = 'FIXED_AMOUNT',
}