use std::sync::Arc;

use axum::{routing::{get, post}, Extension, Router};
use sea_orm::DatabaseConnection;
use crate::handlers::user_handlers::{get_user_name, insert_user, login, logout};

pub fn create_user_routes(db : Arc<DatabaseConnection>) -> Router{

    Router::new()
        .route("/login", post(login))
        .route("/insert", post(insert_user))
        .route("/logout", post(logout))
        .route("/get-user-name/:id", get(get_user_name))
        .layer(Extension(db))

}
