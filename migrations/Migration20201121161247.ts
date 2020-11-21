import { Migration } from '@mikro-orm/migrations';

export class Migration20201121161247 extends Migration {

  async up(): Promise<void> {
    this.addSql('alter table `reaction` add column `to_item` varchar null;');
    this.addSql(`update reaction set to_item = cast(created_at/1000 as int) || '.000000' where to_item is null`);
    this.addSql('delete from reaction where id in (select id from reaction GROUP BY `channel`, `user`, `to_user`, `to_item`, `reaction` having count(0) > 1);');
    this.addSql('create unique index `reaction_channel_user_to_user_to_item_reaction_unique` on `reaction` (`channel`, `user`, `to_user`, `to_item`, `reaction`);');
  }
}
