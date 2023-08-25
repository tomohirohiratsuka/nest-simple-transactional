import {Column, Entity, PrimaryGeneratedColumn} from "typeorm";

@Entity({name: 'users'})
export class User {
    @PrimaryGeneratedColumn()
    readonly id?: number

    @Column()
    name: string

    constructor(
        name: string
    ) {
        this.name = name
    }
}