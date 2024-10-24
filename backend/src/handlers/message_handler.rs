use std::sync::Arc;

use axum::{extract::Path, http::StatusCode, response::IntoResponse, Extension, Json};
use entity::{message, user};
use sea_orm::{ColumnTrait, DatabaseConnection, EntityTrait, QueryFilter, Set};
use serde_json::json;
use uuid::Uuid;
use crate::models::message_model::{AllMessagesRecieving, MessagePosting, MessageRecieving, SessionKey};


pub async fn get_all_messages(
    Path(room_id): Path<String>,
    db: Extension<Arc<DatabaseConnection>>
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
                iv: m.iv.clone().to_string()
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
    //TODO: Set the message as it is at room, also take a look at the MessageIn and MessageOut Models.
    let new_message = message::ActiveModel{
        room: Set(message_data.room.to_string()),
        conent: Set(message_data.content.to_string()),
        sender_id: Set(message_data.sender_id.to_string()),
        sending_time: Set(message_data.sending_time.to_string()),
        iv: Set(message_data.iv.to_string()),
        ..Default::default()
    };

    message::Entity::insert(new_message)
        .exec(db.as_ref())
        .await
        .unwrap();

}


pub async fn check_session_key(
    Extension(db): Extension<Arc<DatabaseConnection>>,
) -> impl IntoResponse {
    // Find any user where session_key is not "sess"
    let user_option = user::Entity::find()
        .filter(user::Column::SessionKey.ne("sess"))
        .one(db.as_ref())
        .await
        .unwrap();

    if let Some(user) = user_option {
        // Session key exists, return it
        (
            StatusCode::OK,
            Json(json!({ "session_key": user.session_key })),
        )
            .into_response()
    } else {
        // Session key does not exist
        (StatusCode::OK, Json(json!({}))).into_response()
    }
}

pub async fn check_update_session_key(
    Path(id) : Path<Uuid>, 
    db : Extension<Arc<DatabaseConnection>>,
    Json(session_key_obj) : Json<SessionKey>,
) -> impl IntoResponse {

    let user_option = user::Entity::find()
        .filter(user::Column::Id.eq(id))
        .one(db.as_ref())
        .await
        .unwrap();

        if let Some(user) = user_option {

            if user.session_key.eq("sess") {
                let mut active_user: user::ActiveModel = user.clone().into();
                active_user.session_key = Set(session_key_obj.session_key);
    
                user::Entity::update(active_user)
                    .exec(db.as_ref())
                    .await
                    .unwrap(); 

                (StatusCode::OK, Json(json!({"info" : user.session_key}))).into_response()
            }else{
                (StatusCode::OK, Json(json!({"session_key" : user.session_key.clone()}))).into_response()
            }

        } else {
            (StatusCode::NOT_FOUND, Json(json!({"error" : "User Not Found"}))).into_response()
        }

}

pub async fn retrieve_public_key(
    Path(id) : Path<Uuid>,
    db : Extension<Arc<DatabaseConnection>>,
) -> impl IntoResponse{
    //TODO: make the finding of the public key more efficient (faster) or understand where to keep it in frontend part

    let user = user::Entity::find()
        .filter(user::Column::Id.eq(id))
        .one(db.as_ref())
        .await;

    match user {
        Ok(Some(user)) => {
            (StatusCode::FOUND, Json(serde_json::json!({"public_key" : user.public_key})))
        },
        Ok(None) => {
            (StatusCode::NOT_FOUND, Json(serde_json::json!({"error:": "public key not found"})))
        },

        Err(_) => {
            (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({"error:" : "Internal Server Error"})))
        },
    }

}
