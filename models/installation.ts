import {Entity, PrimaryKey, Property} from "@mikro-orm/core";

@Entity()
export class Installation {
    @PrimaryKey()
    id!: number

    @Property()
    public teamId!: string

    @Property()
    public botAccessToken!: string

    @Property()
    public botUserId!: string

    @Property()
    public authedUserId!: string

    @Property({onCreate: () => new Date()})
    public createdAt!: Date

    public constructor(props: Partial<Installation>) {
        Object.assign(this, props)
    }
}