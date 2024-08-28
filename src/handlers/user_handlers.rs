use axum::{http::StatusCode, response::IntoResponse, Extension, Json};
use ::entity::user;
use sea_orm::{DatabaseConnection, EntityTrait, Set};
use uuid::Uuid;
use crate::models::user_models::CreateUser;

pub async fn insert_user(
    Extension(db) : Extension<DatabaseConnection>,
    user_data : Json<CreateUser>, 
) -> impl IntoResponse{

    let new_user = user::ActiveModel{
        id: Set(Uuid::new_v4()),
        name: Set(user_data.name.to_string()),
        login: Set(user_data.login.to_string()),
    };

    let inserted_user = user::Entity::insert(new_user)
        .exec(&db)
        .await;

    match inserted_user {
        Ok(_) => (StatusCode::CREATED, "User was inserted"),
        Err(_) => (StatusCode::BAD_REQUEST, "Something went wrong inserting a new user"),
    }


}
