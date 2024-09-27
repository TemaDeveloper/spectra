use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {

        manager
            .create_table(
                Table::create()
                    .table(Message::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(Message::Id)
                            .integer()
                            .auto_increment()
                            .not_null()
                            .primary_key(),
                    )
                    .col(ColumnDef::new(Message::Room).integer().not_null())
                        .foreign_key(
                            ForeignKey::create()
                                .name("fk-message-room_id")
                                .from(Message::Table, Message::Room)
                                .to(Room::Table, Room::Id)
                        )
                    .col(ColumnDef::new(Message::Conent).string().not_null())
                    .col(ColumnDef::new(Message::SendingTime).string().not_null())
                    .col(ColumnDef::new(Message::SenderId).uuid().not_null())
                        .foreign_key(
                            ForeignKey::create()
                                .name("fk-message-user_id")
                                .from(Message::Table, Message::SenderId)
                                .to(User::Table, User::Id)
                        )
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {

        manager
            .drop_table(Table::drop().table(Message::Table).to_owned())
            .await
    }
}

#[derive(DeriveIden)]
enum Message {
    Table,
    Id,
    SenderId,
    Conent,
    Room, 
    SendingTime
}

#[derive(Iden)]
enum Room {
    Table,
    Id,
}


#[derive(Iden)]
enum User {
    Table,
    Id,
}
