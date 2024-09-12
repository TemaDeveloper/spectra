use axum::{middleware, routing::{get, post}, Extension, Router};
use sea_orm::DatabaseConnection;
use crate::handlers::user_handlers::check_auth;
use crate::{handlers::message_handler::{get_all_messages, send_message}, middlewares::jwt_checker::is_logedin};

pub fn create_message_routes(db : DatabaseConnection) -> Router {
    Router::new()
        .route("/send", post(send_message))
        .route("/recieve", get(get_all_messages))
        .route("/check-auth", get(check_auth))
        .layer(Extension(db))
        .route_layer(middleware::from_fn(is_logedin))
}
