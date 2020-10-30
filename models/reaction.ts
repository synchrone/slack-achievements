import {Entity, PrimaryKey, Property} from "@mikro-orm/core";

@Entity()
export class Reaction {
    @PrimaryKey()
    id!: number

    @Property()
    public user!: string

    @Property()
    public toUser!: string

    @Property()
    public reaction!: string

    @Property()
    public channel!: string

    @Property({onCreate: () => new Date()})
    public createdAt!: Date

    public constructor(props: Partial<Reaction>) {
        Object.assign(this, props)
    }
}