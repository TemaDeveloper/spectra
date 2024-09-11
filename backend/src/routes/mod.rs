
use tower_http::cors::{Any, CorsLayer};
use axum::http::{header::{AUTHORIZATION, CONTENT_TYPE, COOKIE, SET_COOKIE}, HeaderValue, Method};


use axum::Router;
use sea_orm::DatabaseConnection;
use tower_cookies::CookieManagerLayer;

pub mod user_routes;
pub mod message_routes;

pub fn create_all_routes(db : DatabaseConnection) -> Router{

    // let cors = CorsLayer::new()
    //     .allow_origin("http://127.0.0.1".parse::<HeaderValue>().unwrap())
    //     .allow_methods([Method::POST, Method::GET])
    //     .allow_headers(Any);

    Router::new()
        .nest("/user", user_routes::create_user_routes(db.clone()))
        .nest("/message", message_routes::create_message_routes(db))
        .layer(CookieManagerLayer::new())
        .layer(CorsLayer::very_permissive())
}
