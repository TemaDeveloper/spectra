use std::sync::Arc;

use axum::{http::StatusCode, response::IntoResponse, Extension, Json};
use entity::room;
use sea_orm::{DatabaseConnection, EntityTrait, Set};

use crate::models::room_model::{AllRoomsRecieveing, RoomGeneration, RoomRecieveing};



pub async fn create_room(
    Extension(db) : Extension<Arc<DatabaseConnection>>, 
    room_data : Json<RoomGeneration>,
) -> impl IntoResponse{

    let new_room = room::ActiveModel {
        room_name: Set(room_data.room_name.to_string()),
        ..Default::default()
    };

    let result = room::Entity::insert(new_room).exec(db.as_ref()).await;

    match result {
        Ok(_) => StatusCode::CREATED,
        Err(_) => StatusCode::INTERNAL_SERVER_ERROR,
    }

}

pub async fn get_rooms (
    Extension(db) : Extension<Arc<DatabaseConnection>>, 
) -> impl IntoResponse{
    let rooms_getter_res = room::Entity::find().all(db.as_ref()).await;
    match rooms_getter_res {
        Ok(res) => (
            StatusCode::ACCEPTED, 
            Json(AllRoomsRecieveing {
                rooms : res.iter().map(|r| RoomRecieveing {
                    room_name: r.room_name.to_string(),
                    room_id: r.id,
                }).collect()
            }),
        ),
        Err(_) => (StatusCode::NOT_FOUND, Json::default())
    }

}

