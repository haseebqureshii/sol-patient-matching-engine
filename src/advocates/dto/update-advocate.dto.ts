import { PartialType } from '@nestjs/mapped-types';
import { CreateAdvocateDto } from './create-advocate.dto';

export class UpdateAdvocateDto extends PartialType(CreateAdvocateDto) {}
