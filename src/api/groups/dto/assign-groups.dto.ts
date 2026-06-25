import { ArrayNotEmpty, IsArray, IsUUID } from 'class-validator';

export class AssignGroupsDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  groupIds: string[];
}
