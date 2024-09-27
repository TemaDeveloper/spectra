use std::sync::Arc;

use axum::{routing::{get, post}, Extension, Router};
use sea_orm::DatabaseConnection;
use crate::handlers::room_handler::{create_room, get_rooms};


pub fn create_rooms_routes (db : Arc<DatabaseConnection>) -> Router {
    Router::new()
        .route("/create-room", post(create_room))
        .route("/get-rooms", get(get_rooms))
        .layer(Extension(db))
}
