
use axum::http::header::{AUTHORIZATION, CONTENT_TYPE, COOKIE, SET_COOKIE};
use socketioxide::layer::SocketIoLayer;
use tower::ServiceBuilder;
use tower_http::cors::CorsLayer;
use axum::http::{HeaderValue, Method};


use axum::Router;
use sea_orm::DatabaseConnection;
use tower_cookies::CookieManagerLayer;

pub mod user_routes;
pub mod message_routes;

pub fn create_all_routes(db : DatabaseConnection, ws_layer : SocketIoLayer) -> Router{

    let cors = CorsLayer::new()
        .allow_origin("http://10.10.9.136:3002".parse::<HeaderValue>().unwrap())
        .allow_methods([Method::POST, Method::GET])
        .allow_headers([AUTHORIZATION, SET_COOKIE, COOKIE, CONTENT_TYPE])
        .allow_credentials(true);

    Router::new()
        .nest("/user", user_routes::create_user_routes(db.clone()))
        .nest("/message", message_routes::create_message_routes(db))
        .layer(CookieManagerLayer::new())
        .layer(ServiceBuilder::new().layer(CorsLayer::very_permissive()))  // Add CORS for HTTP requests
        .layer(ws_layer)
}
