import { Migration } from '@mikro-orm/migrations';

export class Migration20201027203825 extends Migration {

  async up(): Promise<void> {
    this.addSql('create table `reaction` (`id` integer not null primary key autoincrement, `user` varchar not null, `to_user` varchar not null, `reaction` varchar not null, `channel` varchar not null, `created_at` datetime not null);');
  }

}
