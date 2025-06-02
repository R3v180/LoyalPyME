// Copia Gemini/backend/src/public/order.dto.ts
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

// DTO para representar un ítem de menú individual al añadirlo a un pedido (usado por AddItemsToOrderDto)
export class OrderItemDto {
  @IsUUID()
  @IsNotEmpty({ message: 'El ID del artículo del menú no puede estar vacío.' })
  menuItemId!: string;

  @IsNumber({}, { message: 'La cantidad debe ser un número.' })
  @Min(1, { message: 'La cantidad debe ser como mínimo 1.' })
  quantity!: number;

  @IsOptional()
  @IsArray({ message: 'Los modificadores seleccionados deben ser un array.' })
  // @ValidateNested({ each: true }) // Descomentar si tienes un SelectedModifierDto
  // @Type(() => SelectedModifierDto) // Descomentar si tienes un SelectedModifierDto
  selectedModifiers?: any[]; // Ajusta esto si tienes DTOs para modificadores
}

// DTO para la solicitud de añadir múltiples ítems a un pedido existente
export class AddItemsToOrderDto {
  @IsArray({ message: 'Los ítems deben ser un array.' })
  @ValidateNested({ each: true, message: 'Cada ítem debe ser válido.' })
  @Type(() => OrderItemDto)
  items!: OrderItemDto[];

  @IsString({ message: 'Las notas del cliente deben ser texto.' })
  @IsOptional()
  customerNotes?: string;
}

// --- DTOs para la CREACIÓN de un nuevo pedido ---
// (Estos son los que el OrderController espera para el endpoint de creación)

export class CreateOrderItemDto {
  @IsUUID()
  @IsNotEmpty({ message: 'El ID del artículo del menú no puede estar vacío al crear.' })
  menuItemId!: string;

  @IsNumber({}, { message: 'La cantidad debe ser un número al crear.' })
  @Min(1, { message: 'La cantidad debe ser como mínimo 1 al crear.' })
  quantity!: number;

  @IsNumber({}, { message: 'El precio de compra debe ser un número al crear.' })
  priceAtPurchase!: number; // Asumimos que este precio lo determina el frontend en el momento de la creación

  @IsOptional()
  @IsArray({ message: 'Los modificadores seleccionados deben ser un array al crear.' })
  // @ValidateNested({ each: true })
  // @Type(() => SelectedModifierDto)
  selectedModifiers?: any[];
}

export class CreateOrderDto {
  // Si necesitas que el businessId/businessSlug venga en el DTO desde el cliente:
  @IsUUID() // O @IsString() si es un slug
  @IsNotEmpty({ message: 'El ID o Slug del negocio es requerido en el DTO de creación.'})
  @IsOptional() // Hacemos opcional si el plan es obtenerlo de otra forma (ej. guardas)
                 // pero si el servicio NO lo recibe como parámetro aparte, debe estar aquí.
  businessId?: string; // O businessSlug?: string;

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

  // El customerId se puede añadir aquí si el frontend lo puede proveer,
  // o se puede tomar de req.user si el cliente está autenticado (manejado por el controller/servicio).
  @IsUUID()
  @IsOptional()
  customerId?: string;
}