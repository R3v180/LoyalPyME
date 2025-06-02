// backend/src/public/order.dto.ts
// Versión 1.6.16 (Ajuste para consistencia en AddItemsOrderItemDto)
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

// DTO para cada opción de modificador seleccionada DENTRO de un ítem de pedido
export class SelectedOrderModifierOptionDto {
  @IsString() // O IsUUID() si tus IDs de opción son UUIDs
  @IsNotEmpty({ message: 'modifierOptionId no puede estar vacío.'})
  modifierOptionId!: string;
}

// DTO para cada ítem de pedido en la creación
export class CreateOrderItemDto {
  @IsUUID()
  @IsNotEmpty({ message: 'El ID del artículo del menú no puede estar vacío al crear.' })
  menuItemId!: string;

  @IsNumber({}, { message: 'La cantidad debe ser un número al crear.' })
  @Min(1, { message: 'La cantidad debe ser como mínimo 1 al crear.' })
  quantity!: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsArray({ message: 'Los modificadores seleccionados deben ser un array al crear.' })
  @ValidateNested({ each: true }) 
  @Type(() => SelectedOrderModifierOptionDto) 
  selectedModifierOptions?: SelectedOrderModifierOptionDto[]; // Nombre consistente
}

// DTO principal para crear un pedido
export class CreateOrderDto {
  @IsOptional() 
  @IsString()   
  businessId?: string; 

  @IsString({ message: 'El identificador de mesa debe ser texto.' })
  @IsOptional()
  tableIdentifier?: string;

  @IsArray({ message: 'Los ítems deben ser un array al crear.' })
  @ValidateNested({ each: true, message: 'Cada ítem debe ser válido al crear.' })
  @Type(() => CreateOrderItemDto) 
  items!: CreateOrderItemDto[];

  @IsString({ message: 'Las notas del cliente deben ser texto.' })
  @IsOptional()
  customerNotes?: string; 

  @IsUUID()
  @IsOptional()
  customerId?: string;
}

// --- DTOs para AÑADIR ítems a un pedido existente ---

export class AddItemsOrderItemDto {
    @IsUUID()
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
    // CAMBIO AQUÍ para consistencia: de selectedModifiers a selectedModifierOptions
    selectedModifierOptions?: SelectedOrderModifierOptionDto[]; 
}

export class AddItemsToOrderDto {
    @IsArray({ message: 'Los ítems deben ser un array.' })
    @ValidateNested({ each: true, message: 'Cada ítem debe ser válido.' })
    @Type(() => AddItemsOrderItemDto) 
    items!: AddItemsOrderItemDto[];

    @IsString({ message: 'Las notas del cliente deben ser texto.' })
    @IsOptional()
    customerNotes?: string;
}