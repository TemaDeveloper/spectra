use crate::auth::jwt::issue_jwt;
use crate::redis_manager::session_manager::delete_session_id;
use crate::{
    models::user_models::{decode_credentials, CreateUser, LoginPayload},
    redis_manager::session_manager::set_session_id,
};
use ::entity::user;
use axum::{
    body::Body,
    extract::Path,
    http::{
        header::{self},
        Response, StatusCode,
    },
    response::{IntoResponse, Redirect},
    Extension, Json,
};
use axum_extra::{headers, TypedHeader};
use entity::user::Column;
use sea_orm::{ColumnTrait, Condition, DatabaseConnection, EntityTrait, QueryFilter, Set};
use tower_cookies::{cookie::SameSite, Cookie, Cookies};
use uuid::Uuid;

pub async fn insert_user(
    cookies: Cookies,
    Extension(db): Extension<DatabaseConnection>,
    user_data: Json<CreateUser>,
) -> impl IntoResponse {
    let bearer_id = Uuid::new_v4();
    let user_id = Uuid::new_v4();

    let new_user = user::ActiveModel {
        id: Set(user_id),
        username: Set(user_data.username.to_string()),
        password: Set(user_data.password.to_string()),
        role: Set("User".to_string()),
    };

    user::Entity::insert(new_user).exec(&db).await.unwrap();

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
            cookie.set_same_site(SameSite::Strict);
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
//TODO: redis always 839327d5-6e44-4a05-9068-0673e4d2741b store this instead of creating a new one (add to the cookie)
//TODO: Hide authorization token (header)
//TODO: Think about Cors and resolve the question with all privacy

pub async fn login(
    cookies: Cookies,
    Extension(db): Extension<DatabaseConnection>,
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
        .one(&db)
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
    cookie.set_secure(true);
    cookie.set_path("/");
    cookie.set_same_site(SameSite::Strict);
    cookies.add(cookie);

    // Return success response with JWT token in Authorization header
    Response::builder()
        .status(StatusCode::OK)
        .header("Authorization", format!("Bearer {}", token))
        .body(Body::from("Login successful"))
        .unwrap()
}

fn decode_cred(user_data: Json<LoginPayload>) -> Result<(String, String), String> {
    match decode_credentials(&user_data.credentials) {
        Ok((username, password)) => {
            // Return both username and password in the Ok variant
            Ok((username, password))
        }
        Err(_) => {
            // Return an error string if the decoding fails
            Err("Failed to decode credentials".to_string())
        }
    }
}

pub async fn logout(
    cookie: Option<TypedHeader<headers::Cookie>>,
    Extension(db): Extension<DatabaseConnection>,
    Path(id): Path<Uuid>,
) -> impl IntoResponse {
    let user = user::Entity::find()
        .filter(Column::Id.eq(id))
        .one(&db)
        .await;

    match user {
        Ok(_) => {
            let mut response =
                (StatusCode::UNAUTHORIZED, Redirect::temporary("/login")).into_response();

            if let Some(cookie) = cookie {
                if let Some(bearer_id) = cookie.get("bearer_id") {
                    if let Ok(res) = delete_session_id(bearer_id.to_owned()).await {
                        println!("The session was deleted: {res}");
                    }
                }
            }

            let headers = response.headers_mut();
            headers.insert(
                header::SET_COOKIE,
                "session_id=deleted; HttpOnly; Secure; SameSite=Strict; Max-Age=0"
                    .parse()
                    .unwrap(),
            );
            return response;
        }
        Err(_) => (StatusCode::INTERNAL_SERVER_ERROR, Body::default()).into_response(),
    }
}
