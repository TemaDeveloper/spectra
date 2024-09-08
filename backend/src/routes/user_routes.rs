use axum::{routing::post, Extension, Router};
use sea_orm::DatabaseConnection;
use crate::handlers::user_handlers::{insert_user, login, logout};

pub fn create_user_routes(db : DatabaseConnection) -> Router{

    Router::new()
        .route("/insert", post(insert_user))
        .route("/login", post(login))
        .route("/logout/:id", post(logout))
        .layer(Extension(db))

}
