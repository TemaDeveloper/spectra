use std::sync::Arc;

use axum::{extract::Path, http::StatusCode, response::IntoResponse, Extension, Json};
use entity::message;
use sea_orm::{ColumnTrait, DatabaseConnection, EntityTrait, QueryFilter, Set};
use crate::models::message_model::{AllMessagesRecieving, MessagePosting, MessageRecieving};


pub async fn get_all_messages(
    Path(room_id) : Path<String>,
    db : Extension<Arc<DatabaseConnection>>
) -> impl IntoResponse {

    let messages = message::Entity::find()
        .filter(message::Column::Room.eq(room_id))
        .all(db.as_ref())
        .await;

        match messages {
            Ok(res) if !res.is_empty() => {
                let messages: Vec<MessageRecieving> = res.iter().map(|m| MessageRecieving {
                    content: m.conent.to_string(),  // Ensure this matches the DB schema
                    sender_id: m.sender_id.to_string(),
                    room: m.room.to_string(),
                    sending_time: m.sending_time.to_string(),
                }).collect();
    
                (StatusCode::OK, Json(AllMessagesRecieving { messages }))
            }
            Ok(_) => {
                tracing::warn!("No messages found for room_id");
                (StatusCode::NOT_FOUND, Json::default())
            }
            Err(err) => {
                tracing::error!("Error fetching messages for room_id: {:?}", err);
                (StatusCode::INTERNAL_SERVER_ERROR, Json::default())
            }
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
        sender_id: Set(message_data.sender_id.to_string()),
        sending_time: Set(message_data.sending_time.to_string()),
        ..Default::default()
    };

    message::Entity::insert(new_message)
        .exec(db.as_ref())
        .await
        .unwrap();

}

