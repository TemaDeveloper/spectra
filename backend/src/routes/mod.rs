
use axum::http::header::{AUTHORIZATION, CONTENT_TYPE, COOKIE, SET_COOKIE};
use tower_http::cors::CorsLayer;
use axum::http::{HeaderValue, Method};


use axum::Router;
use sea_orm::DatabaseConnection;
use tower_cookies::CookieManagerLayer;

pub mod user_routes;
pub mod message_routes;

pub fn create_all_routes(db : DatabaseConnection) -> Router{

    let cors = CorsLayer::new()
        .allow_origin("http://localhost:3001".parse::<HeaderValue>().unwrap())
        .allow_methods([Method::POST, Method::GET])
        .allow_headers([AUTHORIZATION, SET_COOKIE, COOKIE, CONTENT_TYPE])
        .allow_credentials(true);

    Router::new()
        .nest("/user", user_routes::create_user_routes(db.clone()))
        .nest("/message", message_routes::create_message_routes(db))
        .layer(CookieManagerLayer::new())
        .layer(cors)
}
