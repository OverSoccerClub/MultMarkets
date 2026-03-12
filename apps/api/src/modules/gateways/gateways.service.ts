import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { GatewayType, GatewayEnvironment } from '@prisma/client';

@Injectable()
export class GatewaysService {
    private readonly logger = new Logger(GatewaysService.name);

    constructor(private prisma: PrismaService) {}

    async findAll() {
        return this.prisma.paymentGateway.findMany({
            orderBy: { createdAt: 'desc' },
        });
    }

    async findOne(id: string) {
        const gateway = await this.prisma.paymentGateway.findUnique({
            where: { id },
        });
        if (!gateway) throw new NotFoundException('Gateway não encontrado');
        return gateway;
    }

    async create(data: any) {
        return this.prisma.paymentGateway.create({
            data: {
                name: data.name,
                type: data.type || GatewayType.PIX,
                provider: data.provider,
                config: data.config,
                isActive: data.isActive || false,
                environment: data.environment || GatewayEnvironment.SANDBOX,
            }
        });
    }

    async update(id: string, data: any) {
        // If setting this one as active, we might want to deactivate others of the same type
        if (data.isActive) {
            const gateway = await this.findOne(id);
            await this.prisma.paymentGateway.updateMany({
                where: { type: gateway.type, id: { not: id } },
                data: { isActive: false },
            });
        }

        return this.prisma.paymentGateway.update({
            where: { id },
            data,
        });
    }

    async remove(id: string) {
        return this.prisma.paymentGateway.delete({
            where: { id },
        });
    }

    async getActiveGateway(type: GatewayType) {
        const gateway = await this.prisma.paymentGateway.findFirst({
            where: { type, isActive: true },
        });
        
        if (!gateway) {
            // Fallback to first available if none active? 
            // Or throw error to force admin to configure
            throw new NotFoundException(`Nenhum gateway ${type} ativo encontrado.`);
        }
        
        return gateway;
    }
}
