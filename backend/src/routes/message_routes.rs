use std::sync::Arc;

use axum::{middleware, routing::{get, post}, Extension, Router};
use sea_orm::DatabaseConnection;
use tower::ServiceBuilder;
use tower_http::cors::CorsLayer;
use crate::{handlers::message_handler::{check_session_key, check_update_session_key, get_all_messages, retrieve_public_key}, middlewares::jwt_checker::is_logedin};

pub fn create_message_routes(db : Arc<DatabaseConnection>) -> Router {
    Router::new()
        .route("/check-session-key", get(check_session_key))
        .route("/update-session-key/:id", post(check_update_session_key))
        .route("/retrieve-pub-key/:id", get(retrieve_public_key))
        .route("/recieve/:room_id", get(get_all_messages))
        .layer(Extension(db))
        .route_layer(middleware::from_fn(is_logedin))
        .layer(ServiceBuilder::new().layer(CorsLayer::very_permissive()))
}
