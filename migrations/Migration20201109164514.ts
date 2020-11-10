import { Migration } from '@mikro-orm/migrations';

export class Migration20201109164514 extends Migration {

  async up(): Promise<void> {
    this.addSql('alter table `installation` add column `authed_user_id` varchar null;');
  }
}
