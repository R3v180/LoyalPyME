// backend/src/services/table.service.ts (o backend/src/camarero/table.service.ts si prefieres)
import {
    PrismaClient,
    Prisma,
    Table,
    TableStatus,
} from '@prisma/client';
import {
    Logger,
    NotFoundException,
    InternalServerErrorException,
} from '@nestjs/common';

export class TableService {
    private readonly logger = new Logger(TableService.name);

    /**
     * Encuentra una mesa por su identificador y el ID del negocio.
     *
     * @param tx - Cliente Prisma de la transacción actual.
     * @param businessId - ID del negocio.
     * @param tableIdentifier - Identificador de la mesa (ej. "M1", "T2").
     * @returns El objeto Table si se encuentra, o null si no.
     */
    async findTableByIdentifier(
        tx: Prisma.TransactionClient,
        businessId: string,
        tableIdentifier: string
    ): Promise<Table | null> {
        this.logger.log(`[TableService] Finding table with identifier '${tableIdentifier}' for business '${businessId}'.`);
        try {
            const table = await tx.table.findUnique({
                where: {
                    businessId_identifier: {
                        businessId: businessId,
                        identifier: tableIdentifier,
                    },
                },
            });
            if (table) {
                this.logger.log(`[TableService] Table '${tableIdentifier}' found with ID '${table.id}'.`);
            } else {
                this.logger.warn(`[TableService] Table '${tableIdentifier}' not found for business '${businessId}'.`);
            }
            return table;
        } catch (error) {
            this.logger.error(`[TableService] Error finding table '${tableIdentifier}':`, error);
            throw new InternalServerErrorException('Error al buscar la mesa en la base de datos.');
        }
    }

    /**
     * Actualiza el estado de una mesa específica.
     *
     * @param tx - Cliente Prisma de la transacción actual.
     * @param tableId - ID de la mesa a actualizar.
     * @param newStatus - El nuevo TableStatus para la mesa.
     * @returns El objeto Table actualizado.
     * @throws NotFoundException si la mesa no existe.
     */
    async updateTableStatus(
        tx: Prisma.TransactionClient,
        tableId: string,
        newStatus: TableStatus
    ): Promise<Table> {
        this.logger.log(`[TableService] Updating status of table '${tableId}' to '${newStatus}'.`);
        try {
            // Primero, verificar si la mesa existe para dar un error más claro si no.
            // Esto podría ser redundante si la operación que llama ya verificó, pero es una salvaguarda.
            const existingTable = await tx.table.findUnique({ where: { id: tableId }, select: { id: true } });
            if (!existingTable) {
                this.logger.warn(`[TableService] Table with ID '${tableId}' not found for status update.`);
                throw new NotFoundException(`Mesa con ID '${tableId}' no encontrada.`);
            }

            const updatedTable = await tx.table.update({
                where: { id: tableId },
                data: { status: newStatus },
            });
            this.logger.log(`[TableService] Table '${tableId}' status successfully updated to '${newStatus}'.`);
            return updatedTable;
        } catch (error) {
            if (error instanceof NotFoundException) throw error; // Relanzar si es nuestro error específico
            
            this.logger.error(`[TableService] Error updating status for table '${tableId}':`, error);
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
                // P2025 = "An operation failed because it depends on one or more records that were required but not found."
                // (Registro para actualizar no encontrado)
                throw new NotFoundException(`Mesa con ID '${tableId}' no encontrada al intentar actualizar estado.`);
            }
            throw new InternalServerErrorException('Error al actualizar el estado de la mesa.');
        }
    }

    // --- Podrías añadir más métodos aquí si son necesarios, como: ---
    // async getTableById(tx: Prisma.TransactionClient, tableId: string): Promise<Table | null> { ... }
    // async createTable(tx: Prisma.TransactionClient, businessId: string, data: Prisma.TableCreateWithoutBusinessInput): Promise<Table> { ... }
    // etc.
}