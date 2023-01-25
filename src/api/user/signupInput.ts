import { InputType, Field } from 'type-graphql';
import { Length, IsEmail } from 'class-validator';
import { User } from './user.entity';

@InputType()
export class SignupInput implements Partial<User> {
    @Field(()=>String)
    @Length(1, 255)
    username!: string;

    @Field(()=>String)
    @Length(6, 32)
    password!: string;

    @Field(()=>String)
    @IsEmail()
    email!: string;
}

@InputType()
export class LoginInput implements Partial<User> {
    @Field(()=>String)
    @Length(6, 32)
    password!: string;

    @Field(()=>String)
    @IsEmail()
    email!: string;
}