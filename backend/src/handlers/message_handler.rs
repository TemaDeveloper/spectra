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
                    name: m.name.to_string(),
                }).collect()
            }),
        ),
        Err(_) => (StatusCode::NOT_FOUND, Json::default())
    }

}   

pub async fn send_message(
    Extension(db) : Extension<DatabaseConnection>,
    message_data : Json<MessagePosting>
) -> impl IntoResponse{

    let new_message = message::ActiveModel{
        name: Set(message_data.name.to_string()),
        conent: Set(message_data.content.to_string()),
        user_id: Set(message_data.user_id),
        ..Default::default()
    };

    message::Entity::insert(new_message)
        .exec(&db)
        .await
        .unwrap();

}

