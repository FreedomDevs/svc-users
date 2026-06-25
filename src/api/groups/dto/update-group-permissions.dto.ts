import { ArrayNotEmpty, IsArray, IsString } from 'class-validator';

export class UpdateGroupPermissionsDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  permissions: string[];
}
