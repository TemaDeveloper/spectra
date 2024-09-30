use std::sync::Arc;

use axum::{middleware, routing::get, Extension, Router};
use sea_orm::DatabaseConnection;
use tower::ServiceBuilder;
use tower_http::cors::CorsLayer;
use crate::{handlers::message_handler::get_all_messages, middlewares::jwt_checker::is_logedin};

pub fn create_message_routes(db : Arc<DatabaseConnection>) -> Router {
    Router::new()
        //.route("/send", post(send_message))
        .route("/recieve/:room_id", get(get_all_messages))
        .layer(Extension(db))
        .route_layer(middleware::from_fn(is_logedin))
        .layer(ServiceBuilder::new().layer(CorsLayer::very_permissive()))
}
