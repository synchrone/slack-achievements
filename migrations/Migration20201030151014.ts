import { Migration } from '@mikro-orm/migrations';

export class Migration20201030151014 extends Migration {

  async up(): Promise<void> {
    this.addSql('create table `reaction` (`id` integer not null primary key autoincrement, `user` varchar not null, `to_user` varchar not null, `reaction` varchar not null, `channel` varchar not null, `created_at` datetime not null);');

    this.addSql('create table `installation` (`id` integer not null primary key autoincrement, `team_id` varchar not null, `bot_access_token` varchar not null, `bot_user_id` varchar not null, `created_at` datetime not null);');
  }

}
