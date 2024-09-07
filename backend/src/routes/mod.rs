
use axum::Router;
use sea_orm::DatabaseConnection;
use tower_cookies::CookieManagerLayer;

pub mod user_routes;
pub mod message_routes;

pub fn create_all_routes(db : DatabaseConnection) -> Router{
    Router::new()
        .nest("/user", user_routes::create_user_routes(db.clone()))
        .nest("/message", message_routes::create_message_routes(db))
        .layer(CookieManagerLayer::new())
}
