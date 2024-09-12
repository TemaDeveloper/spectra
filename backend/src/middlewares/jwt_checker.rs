use crate::redis_manager::session_manager::get_session_id;
use axum::{
    body::Body,
    http::{header, Request, StatusCode},
    middleware::Next,
    response::IntoResponse,
};
use axum_extra::{headers, TypedHeader};
use redis::RedisError;

pub async fn is_logedin(
    cookie: Option<TypedHeader<headers::Cookie>>,
    req: Request<Body>,
    next: Next,
) -> impl IntoResponse {

    if let Some(cookie) = cookie {
        if let Some(bearer_id) = cookie.get("bearer_id") {
            // Check if the token is valid and handle redis logic
            match check_token_in_redis(bearer_id.to_string()).await {
                Ok(exists) => {
                    if exists == true{
                        // Token is valid, proceed with the request
                        next.run(req).await
                    } else {
                        // Token expired or doesn't exist in Redis
                        let mut response =
                            (StatusCode::UNAUTHORIZED, Body::from("bearer_id does not exist in Redis, expired probably"))
                                .into_response();
                        let headers = response.headers_mut();
                        headers.insert(
                            header::SET_COOKIE,
                            "session_id=deleted; HttpOnly; Secure; SameSite=Strict; Max-Age=0"
                                .parse()
                                .unwrap()
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
            (StatusCode::UNAUTHORIZED, Body::from("No Cookies found in storage bearer_id does not exist")).into_response()
        }
    } else {
        (StatusCode::UNAUTHORIZED, Body::from("No Cookies found")).into_response()
    }
}



async fn check_token_in_redis(token: String) -> Result<bool, RedisError> {
    get_session_id(token).await
}
