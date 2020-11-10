import { Migration } from '@mikro-orm/migrations';

export class Migration20201109173838 extends Migration {

  async up(): Promise<void> {
    this.addSql('create table `settings` (`id` integer not null primary key autoincrement, `team_id` varchar not null, `settings` varchar not null);');
    this.addSql('create index `settings_team_id_index` on `settings` (`team_id`);');
  }

}
