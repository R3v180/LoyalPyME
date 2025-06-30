// backend/src/modules/camarero/public/order.dto.ts
import { Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';

// DTO para cada opción de modificador seleccionada
export class SelectedOrderModifierOptionDto {
  // --- CORRECCIÓN FINAL ---
  // Cambiado de @IsUUID a @IsString porque el ID de ModifierOption en Prisma es un cuid(), no un uuid().
  @IsString({ message: 'El ID de la opción de modificador debe ser un string válido.'})
  @IsNotEmpty({ message: 'El ID de la opción de modificador no puede estar vacío.'})
  modifierOptionId!: string;
}

// DTO para cada ítem de pedido en la creación
export class CreateOrderItemDto {
  @IsUUID('4', { message: 'El ID del artículo del menú debe ser un UUID válido.' })
  @IsNotEmpty({ message: 'El ID del artículo del menú no puede estar vacío.' })
  menuItemId!: string;

  @IsNumber({}, { message: 'La cantidad debe ser un número.' })
  @Min(1, { message: 'La cantidad debe ser como mínimo 1.' })
  quantity!: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsArray({ message: 'Los modificadores seleccionados deben ser un array.' })
  @ValidateNested({ each: true })
  @Type(() => SelectedOrderModifierOptionDto)
  selectedModifierOptions?: SelectedOrderModifierOptionDto[];

  @IsOptional()
  @IsString()
  redeemedRewardId?: string | null;
}

// DTO principal para crear un pedido
export class CreateOrderDto {
  @IsOptional()
  @IsString()
  businessId?: string; // Aunque no se usa directamente, lo mantenemos por si acaso

  @IsString({ message: 'El identificador de mesa debe ser texto.' })
  @IsOptional()
  tableIdentifier?: string;

  @IsArray({ message: 'Los ítems deben ser un array.' })
  @ValidateNested({ each: true, message: 'Cada ítem debe ser válido.' })
  @Type(() => CreateOrderItemDto)
  items!: CreateOrderItemDto[];

  @IsString({ message: 'Las notas del cliente deben ser texto.' })
  @IsOptional()
  customerNotes?: string;

  @IsString()
  @IsOptional()
  customerId?: string;
  
  @IsOptional()
  @IsString() // El ID de la recompensa es un CUID (string)
  appliedLcoRewardId?: string | null;
}

// DTOs para AÑADIR ítems a un pedido existente
export class AddItemsOrderItemDto {
    @IsUUID('4', { message: 'El ID del artículo del menú debe ser un UUID válido.' })
    @IsNotEmpty({ message: 'El ID del artículo del menú no puede estar vacío.' })
    menuItemId!: string;

    @IsNumber({}, { message: 'La cantidad debe ser un número.' })
    @Min(1, { message: 'La cantidad debe ser como mínimo 1.' })
    quantity!: number;

    @IsOptional()
    @IsString()
    notes?: string;
    
    @IsOptional()
    @IsArray({ message: 'Los modificadores seleccionados deben ser un array.' })
    @ValidateNested({ each: true })
    @Type(() => SelectedOrderModifierOptionDto)
    selectedModifierOptions?: SelectedOrderModifierOptionDto[];

    @IsOptional()
    @IsString()
    redeemedRewardId?: string | null;
}

export class AddItemsToOrderDto {
    @IsArray({ message: 'Los ítems deben ser un array.' })
    @ValidateNested({ each: true, message: 'Cada ítem debe ser válido.' })
    @Type(() => AddItemsOrderItemDto)
    items!: AddItemsOrderItemDto[];

    @IsString({ message: 'Las notas del cliente deben ser texto.' })
    @IsOptional()
    customerNotes?: string;

    @IsOptional()
    @IsString()
    appliedLcoRewardId?: string | null;
}

// DTO para solicitar la cuenta
export class RequestBillClientPayloadDto {
  @IsOptional()
  @IsString({ message: 'La preferencia de pago debe ser texto.' })
  paymentPreference?: string;
}

// DTO para aplicar una recompensa a un pedido.
export class ApplyRewardDto {
    @IsString()
    @IsNotEmpty({ message: 'Se requiere el ID del cupón (grantedRewardId).' })
    grantedRewardId!: string;
}