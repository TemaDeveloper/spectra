use std::sync::Arc;

use axum::{http::StatusCode, response::IntoResponse, Extension, Json};
use entity::message;
use sea_orm::{DatabaseConnection, EntityTrait, Set};
use crate::models::message_model::{AllMessagesRecieving, MessagePosting, MessageRecieving};


pub async fn get_all_messages(
    Extension(db) : Extension<DatabaseConnection>
) -> impl IntoResponse {

    let messages = message::Entity::find().all(&db).await;
    match messages {
        Ok(res) => (
            StatusCode::ACCEPTED, 
            Json(AllMessagesRecieving {
                messages : res.iter().map(|m| MessageRecieving {
                    content: m.conent.to_string(),
                    sender_id: m.sender_id.to_string(),
                    room: m.room.to_string(),
                    sending_time: m.sending_time.to_string(),
                }).collect()
            }),
        ),
        Err(_) => (StatusCode::NOT_FOUND, Json::default())
    }

}   

pub async fn send_message(
    db : Arc<DatabaseConnection>,
    message_data : Json<MessagePosting>
) -> impl IntoResponse{
    //TODO: Change the model at ActiveModel in postgres. 
    //TODO: Set the message as it is at room, also take a look at the MessageIn and MessageOut Models.
    let new_message = message::ActiveModel{
        room: Set(message_data.room.to_string()),
        conent: Set(message_data.content.to_string()),
        sender_id: Set(message_data.user_id.to_string()),
        sending_time: Set(message_data.sending_time.to_string()),
        ..Default::default()
    };

    message::Entity::insert(new_message)
        .exec(db.as_ref())
        .await
        .unwrap();

}

