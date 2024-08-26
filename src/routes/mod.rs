
use axum::Router;
use sea_orm::DatabaseConnection;
pub mod user_routes;

pub fn create_all_routes(db : DatabaseConnection) -> Router{
    Router::new()
        .nest("/user", user_routes::create_user_routes(db))
}
