use std::sync::Arc;

use crate::auth::jwt::issue_jwt;
use crate::redis_manager::session_manager::{delete_session_id, get_session_id_value};
use crate::{
    models::user_models::{decode_credentials, CreateUser, LoginPayload},
    redis_manager::session_manager::set_session_id,
};
use axum::extract::Path;
use ::entity::user;
use axum::{
    body::Body,
    http::{
        header::{self},
        Response, StatusCode,
    },
    response::IntoResponse,
    Extension, Json,
};
use axum_extra::{headers, TypedHeader};
use random_color::RandomColor;
use sea_orm::{ColumnTrait, Condition, DatabaseConnection, EntityTrait, QueryFilter, Set};
use tower_cookies::cookie::time::Duration;
use tower_cookies::{cookie::SameSite, Cookie, Cookies};
use uuid::Uuid;

pub async fn insert_user(
    cookies: Cookies,
    Extension(db): Extension<Arc<DatabaseConnection>>,
    user_data: Json<CreateUser>,
) -> impl IntoResponse {
    let bearer_id = Uuid::new_v4();
    let user_id = Uuid::new_v4();

    let mut random_color = RandomColor::new();
    let user_color = random_color.to_hex(); 

    let new_user = user::ActiveModel {
        id: Set(user_id),
        username: Set(user_data.username.to_string()),
        password: Set(user_data.password.to_string()),
        color: Set(user_color.to_string()),
        role: Set("User".to_string()),
        public_key: Set("key".to_string()),
    };

    user::Entity::insert(new_user).exec(db.as_ref()).await.unwrap();

    match issue_jwt(user_id.to_string(), "User".to_string()) {
        Ok(token) => {
            let token_clone = token.clone();

            match set_session_id(bearer_id.to_string(), user_id.to_string()).await {
                Ok(_) => println!("The bearer_id was stored in redis"),
                Err(_) => eprintln!("The error occured in storing bearer_id into redis"),
            }

            let mut cookie = Cookie::new("bearer_id", bearer_id.to_string());
            cookie.set_http_only(true);
            cookie.set_path("/");
            cookie.set_secure(true);
            cookie.set_max_age(Duration::hours(24));
            cookie.set_same_site(SameSite::None);
            cookies.add(cookie);

            Response::builder()
                .header(header::AUTHORIZATION, format!("Bearer {}", token_clone))
                .status(StatusCode::CREATED)
                .body(Body::default())
                .unwrap()
        }
        Err(_) => Response::builder()
            .status(StatusCode::INTERNAL_SERVER_ERROR)
            .body(Body::default())
            .unwrap(),
    }
}

pub async fn login(
    cookies: Cookies,
    Extension(db): Extension<Arc<DatabaseConnection>>,
    user_data: Json<LoginPayload>,
) -> impl IntoResponse {
    let bearer_id = Uuid::new_v4();

    // Decode credentials
    let credentials = match decode_cred(user_data) {
        Ok(creds) => creds,
        Err(_) => {
            eprintln!("Failed to decode credentials");
            return (StatusCode::BAD_REQUEST, Body::from("Invalid credentials")).into_response();
        }
    };

    // Find user in the database
    let user_result = user::Entity::find()
        .filter(
            Condition::all()
                .add(user::Column::Password.eq(credentials.1)) // Password
                .add(user::Column::Username.eq(credentials.0)), // Username
        )
        .one(db.as_ref())
        .await;

    // Handle database query result
    let user = match user_result {
        Ok(Some(user)) => user, // User found
        Ok(None) => {
            eprintln!("User not found with provided credentials");
            return (StatusCode::UNAUTHORIZED, Body::from("User not found")).into_response();
        }
        Err(err) => {
            eprintln!("Database error: {}", err);
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Body::from("Database error"),
            )
                .into_response();
        }
    };

    /*
        -> DONE (1): Generate the RSA pair keys in frontend (when login) send the public key back to the backend with the request
        -> DONE (2): Store the public key in the DB, check (when login) whether the public key is already exist or not, if not create a new one. 
        TODO (3): Private keys are stored in indexed.db in keys.pem file if the user wants to change the browser -> transfer this file to another browser. 
    
    */
    
    if user.public_key.eq("key") {
        let mut active_user: user::ActiveModel = user.clone().into();
        active_user.public_key = Set(credentials.2);
        user::Entity::update(active_user).exec(db.as_ref()).await.unwrap();
    } 
    

    // Issue JWT
    let token = match issue_jwt(user.id.to_string(), "User".to_string()) {
        Ok(token) => token,
        Err(_) => {
            eprintln!("Failed to issue JWT");
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Body::from("Failed to issue token"),
            )
                .into_response();
        }
    };

    // Store session ID in Redis
    if let Err(err) = set_session_id(bearer_id.to_string(), user.id.to_string()).await {
        eprintln!("Failed to store session ID in Redis: {}", err);
        return (
            StatusCode::INTERNAL_SERVER_ERROR,
            Body::from("Failed to store session"),
        )
            .into_response();
    }

    // Set cookie with bearer ID

    let mut cookie = Cookie::new("bearer_id", bearer_id.to_string());
    cookie.set_http_only(true);
    cookie.set_secure(true); //TODO: When I will use HTTPS turn on again
    cookie.set_path("/");
    cookie.set_max_age(Duration::hours(24));
    cookie.set_same_site(SameSite::None);
    cookies.add(cookie);

    // Return success response with JWT token in Authorization header
    Response::builder()
        .status(StatusCode::OK)
        .header("Authorization", format!("Bearer {}", token))
        .body(Body::from(format!("{}", "Successfully Logged In")))
        .unwrap()
}

fn decode_cred(user_data: Json<LoginPayload>) -> Result<(String, String, String), String> {
    match decode_credentials(&user_data.credentials) {
        Ok((username, password, public_key)) => {
            // Return both username and password in the Ok variant
            Ok((username, password, public_key))
        }
        Err(_) => {
            // Return an error string if the decoding fails
            Err("Failed to decode credentials".to_string())
        }
    }
}

pub async fn logout(
    cookie: Option<TypedHeader<headers::Cookie>>,
) -> impl IntoResponse {

    if let Some(cookie) = cookie {
        if let Some(bearer_id) = cookie.get("bearer_id") {
            match delete_session_id(bearer_id.to_string()).await {
                Ok(res) => {
                     return(
                        StatusCode::OK,
                        Body::from(format!("The user was logged out {}", res)),
                    )
                }
                Err(_) => {
                    return (
                        StatusCode::INTERNAL_SERVER_ERROR,
                        Body::from(format!("The error occured deleting cache")),
                    )
                        
                }
            }
        }else{
            (StatusCode::INTERNAL_SERVER_ERROR, Body::from("Cannot find bearer_id in cookies".to_string()))
        }
    }else{
        (StatusCode::INTERNAL_SERVER_ERROR, Body::from("Cannot find cookies".to_string()))
    }
}

pub async fn get_user_name(
    Path(id) : Path<Uuid>,
    Extension(db): Extension<Arc<DatabaseConnection>>
) -> impl IntoResponse {

    let username = user::Entity::find()
        .filter(user::Column::Id.eq(id))
        .one(db.as_ref())
        .await;

    match username {
        Ok(Some(user)) => {
            let response = serde_json::json!({ "user_name": user.username });
            (StatusCode::OK, Json(response))
        }
        Ok(None) => {
            (StatusCode::NOT_FOUND, Json(serde_json::json!({"error": "User not found"})))
        }
        Err(_) => {
            (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({"error": "Internal server error"})))
        }
    }

}

pub async fn check_auth(cookies: Cookies) -> impl IntoResponse {
    if let Some(cookie) = cookies.get("bearer_id") {
        // Verify the session and get the user ID
        let user_id = get_session_id_value(cookie.value().to_string()).await;
        if let Ok(user_id) = user_id {
            return (StatusCode::OK, user_id); // Respond with the user ID
        }
    }

    (
        StatusCode::INTERNAL_SERVER_ERROR,
        format!("The bearer id no longer exists in cache"),
    )
    // If no valid session is found, respond with an error
}
