import { IsIn } from 'class-validator';

export const KITCHEN_ORDER_STATUSES = [
  'new',
  'preparing',
  'ready',
  'delivered',
] as const;

export class UpdateKitchenOrderStatusDto {
  @IsIn(KITCHEN_ORDER_STATUSES)
  status!: (typeof KITCHEN_ORDER_STATUSES)[number];
}
