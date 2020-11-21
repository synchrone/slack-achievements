import {Entity, PrimaryKey, Property, Unique} from "@mikro-orm/core";

@Entity()
@Unique({properties: ['channel', 'user', 'toUser', 'toItem', 'reaction']})
export class Reaction {
    @PrimaryKey()
    id!: number

    @Property()
    public user!: string

    @Property()
    public toUser!: string

    @Property()
    public toItem!: string

    @Property()
    public reaction!: string

    @Property()
    public channel!: string

    @Property({onCreate: (e: Reaction) => e.createdAt || new Date()})
    public createdAt!: Date

    public constructor(props: Partial<Reaction>) {
        Object.assign(this, props)
    }
}