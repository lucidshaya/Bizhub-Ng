import { IsString, IsNotEmpty, IsOptional, IsArray } from 'class-validator';

export class CreateRoomDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsString()
  @IsNotEmpty()
  type: string; // 'DM', 'GROUP', 'CHANNEL'

  @IsArray()
  @IsString({ each: true })
  memberIds: string[];
}

export class SendMessageDto {
  @IsString()
  @IsNotEmpty()
  text: string;

  @IsString()
  @IsNotEmpty()
  roomId: string;
}
