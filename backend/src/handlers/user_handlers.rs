use axum::{body::Body, http::{header::{self}, Response, StatusCode}, response::IntoResponse, Extension, Json};
use ::entity::user;
use sea_orm::{ColumnTrait, Condition, DatabaseConnection, EntityTrait, QueryFilter, Set};
use uuid::Uuid;
use crate::models::user_models::{CreateUser, LoginRequest};
use crate::auth::jwt::issue_jwt;

pub async fn insert_user(
    Extension(db) : Extension<DatabaseConnection>,
    user_data : Json<CreateUser>, 
) -> impl IntoResponse{

    let new_user = user::ActiveModel{
        id: Set(Uuid::new_v4()),
        username: Set(user_data.username.to_string()),
        password: Set(user_data.password.to_string()),
        role: Set("User".to_string()),
    };

    let inserted_user = user::Entity::insert(new_user)
        .exec(&db)
        .await;

    match inserted_user {
        Ok(_) => (StatusCode::CREATED, "User was inserted"),
        Err(_) => (StatusCode::BAD_REQUEST, "Something went wrong inserting a new user"),
    }

}

pub async fn login (
    Extension(db) : Extension<DatabaseConnection>,
    user_data : Json<LoginRequest>
) -> impl IntoResponse {

    let user = user::Entity::find()
        .filter(
            Condition::all()
                .add(user::Column::Password.eq(user_data.password.to_string()))
                .add(user::Column::Username.eq(user_data.username.to_string())
             )
        )
        .one(&db)
        .await;

    match user {
        Ok(res) => (
            StatusCode::OK,
            { 
                match res {
                    Some(res) => {
                        let id = res.id.to_string();
                        match issue_jwt(id, "User".to_string()) {
                            Ok(token) => {
                                Response::builder()
                                    .status(StatusCode::OK)
                                    .header(header::AUTHORIZATION, format!("Bearer {}", token))
                                    .body(Body::default())
                                    .unwrap()
                                },
                            Err(_) => {
                                StatusCode::INTERNAL_SERVER_ERROR.into_response()
                            }
                        }
                    },
                None => eprintln!("Can't find the User model").into_response(),
                }
            }
        ),
        Err(_) => (StatusCode::INTERNAL_SERVER_ERROR, println!("The error occurs, no user found").into_response()),
    }

}   
