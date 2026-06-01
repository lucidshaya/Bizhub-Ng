import { SetMetadata } from '@nestjs/common';

export const IS_BILLING_KEY = 'isBilling';
export const IsBilling = () => SetMetadata(IS_BILLING_KEY, true);
