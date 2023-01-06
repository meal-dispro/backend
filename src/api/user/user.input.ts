import { InputType, Field } from 'type-graphql';
import { Length, IsEmail } from 'class-validator';
import { User } from './user.entity';

@InputType()
export class UserInput implements Partial<User> {
    @Field(()=>String)
    @Length(1, 255)
    username!: String;

    @Field(()=>String)
    @IsEmail()
    email!: String;
}