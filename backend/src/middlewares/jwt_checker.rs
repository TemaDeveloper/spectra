use crate::auth::jwt::SECRET_KEY;
use crate::{models::jwt_claims::Claims, redis_manager::session_manager::get_session_id};
use axum::{
    body::Body,
    http::{header, Request, StatusCode},
    middleware::Next,
    response::{IntoResponse, Redirect},
};
use axum_extra::headers::{authorization::Bearer, Authorization};
use axum_extra::{headers, TypedHeader};
use chrono::Utc;
use jsonwebtoken::{decode, DecodingKey, Validation};
use redis::RedisError;

pub async fn is_logedin(
    bearer: Option<TypedHeader<Authorization<Bearer>>>,
    cookie: Option<TypedHeader<headers::Cookie>>,
    req: Request<Body>,
    next: Next,
) -> impl IntoResponse {
    let token = match bearer {
        Some(TypedHeader(Authorization(bearer))) => bearer.token().to_string(),
        None => {
            println!("No Bearer Token found");
            return (StatusCode::UNAUTHORIZED, Redirect::temporary("/login")).into_response();
        }
    };
    // Decode the JWT token
    let claims = match decode_token(token) {
        Some(claims) => claims,
        None => return StatusCode::UNAUTHORIZED.into_response(),
    };

    if let Some(cookie) = cookie {
        if let Some(bearer_id) = cookie.get("bearer_id") {
            // Check if the token is valid and handle redis logic
            match check_token_in_redis(bearer_id.to_string()).await {
                Ok(exists) => {
                    if exists == true && claims.exp >= Utc::now().timestamp() as usize {
                        // Token is valid, proceed with the request
                        next.run(req).await
                    } else {
                        // Token expired or doesn't exist in Redis
                        let mut response =
                            (StatusCode::UNAUTHORIZED, Redirect::temporary("/login"))
                                .into_response();
                        let headers = response.headers_mut();
                        headers.insert(
                            header::SET_COOKIE,
                            "session_id=deleted; HttpOnly; Secure; SameSite=Strict; Max-Age=0"
                                .parse()
                                .unwrap(),
                        );
                        return response;
                    }
                }
                Err(_) => {
                    // Redis error
                    StatusCode::UNAUTHORIZED.into_response()
                }
            }
        } else {
            (StatusCode::UNAUTHORIZED, Redirect::temporary("/login")).into_response()
        }
    } else {
        (StatusCode::UNAUTHORIZED, Redirect::temporary("/login")).into_response()
    }
}

// Function to decode JWT token
fn decode_token(token: String) -> Option<Claims> {
    match decode::<Claims>(
        token.as_str(),
        &DecodingKey::from_secret(SECRET_KEY.as_bytes()),
        &Validation::default(),
    ) {
        Ok(token_data) => Some(token_data.claims),
        Err(_) => None,
    }
}

// Async function to check if the token exists in Redis
async fn check_token_in_redis(token: String) -> Result<bool, RedisError> {
    // Redis exists returns i64 (1 if exists, 0 otherwise)
    get_session_id(token).await
}
