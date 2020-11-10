import {Entity, Index, PrimaryKey, Property} from "@mikro-orm/core";

export interface SettingsObject {
    outputChannel?: string
    admins?: string
}

@Entity()
export class Settings {
    @PrimaryKey()
    id!: number

    @Property()
    @Index()
    public teamId!: string

    @Property()
    public settings?: string

    protected _settings: SettingsObject = {}
    public get settingObject(): SettingsObject {
        if (!this._settings) {
            this._settings =  JSON.parse(this.settings || '{}')
        }
        return this._settings
    }
    public prepare(){
        this.settings = JSON.stringify(this._settings)
        return this
    }

    public get(key: keyof SettingsObject, def?: string){
        return this.settingObject[key] || def
    }

    public set(key: keyof SettingsObject, value: string){
        this._settings[key] = value
    }

    public constructor(teamId: string){
        this.teamId = teamId
    }
}