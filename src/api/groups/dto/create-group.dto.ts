import { IsString, Length } from 'class-validator';

export class CreateGroupDto {
  @IsString()
  @Length(2, 50)
  name: string;
}
