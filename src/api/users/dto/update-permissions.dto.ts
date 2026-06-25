import { ArrayNotEmpty, IsArray, IsString } from 'class-validator';

export class UpdatePermissionsDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  permissions: string[];
}
