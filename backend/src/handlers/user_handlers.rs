use axum::{body::Body, http::{header::{self, SET_COOKIE}, Response, StatusCode}, response::IntoResponse, Extension, Json};
use ::entity::user;
use sea_orm::{ColumnTrait, Condition, DatabaseConnection, EntityTrait, QueryFilter, Set};
use uuid::Uuid;
use crate::{models::user_models::{CreateUser, LoginRequest}, redis_manager::session_manager::set_session_id};
use crate::auth::jwt::issue_jwt;

pub async fn insert_user(
    Extension(db) : Extension<DatabaseConnection>,
    user_data : Json<CreateUser>, 
) -> impl IntoResponse{

    let bearer_id = Uuid::new_v4(); 
    let user_id = Uuid::new_v4();

    let new_user = user::ActiveModel{
        id: Set(user_id),
        username: Set(user_data.username.to_string()),
        password: Set(user_data.password.to_string()),
        role: Set("User".to_string()),
    };

    user::Entity::insert(new_user)
        .exec(&db)
        .await
        .unwrap();

    match issue_jwt(user_id.to_string(), "User".to_string()) {
        Ok(token) => {

            let token_clone = token.clone();

            match set_session_id(token.to_string(), user_id.to_string()).await {
                Ok(_) => println!("The session_id was stored in redis"), 
                Err(_) => eprintln!("The error occured in storing session_id into redis"),
            }

            Response::builder()
                .header(SET_COOKIE, String::from(bearer_id))
                .header(header::AUTHORIZATION, format!("Bearer {}", token_clone))
                .status(StatusCode::CREATED)
                .body("The user was created!")
                .unwrap();
            },
        Err(_) => {
            Response::builder()
                .status(StatusCode::INTERNAL_SERVER_ERROR)
                .body("The user is not created!")
                .unwrap();
        }
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

                                let token_clone = token.clone();

                                match set_session_id(token.to_string(), res.id.to_string()).await {
                                    Ok(_) => println!("The session_id was stored in redis"), 
                                    Err(_) => eprintln!("The error occured in storing session_id into redis"),
                                }

                                Response::builder()
                                    .status(StatusCode::OK)
                                    .header(header::AUTHORIZATION, format!("Bearer {}", token_clone))
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
