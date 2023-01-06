import { InputType, Field } from 'type-graphql';
import { Test } from './test.entity';

@InputType()
export class TestInput implements Partial<Test> {}