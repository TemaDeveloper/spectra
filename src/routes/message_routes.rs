use axum::{routing::{get, post}, Extension, Router};
use sea_orm::DatabaseConnection;

use crate::handlers::message_handler::{get_all_messages, send_message};

pub fn create_message_routes(db : DatabaseConnection) -> Router {
    Router::new()
        .route("/send", post(send_message))
        .route("/recieve", get(get_all_messages))
        .layer(Extension(db))
}
