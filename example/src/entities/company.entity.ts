import {Column, Entity, PrimaryGeneratedColumn} from "typeorm";

@Entity({name: 'companies'})
export class Company {
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