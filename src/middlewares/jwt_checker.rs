use axum::{body::Body, http::{request, Request, StatusCode}, middleware::Next, response::{IntoResponse, Redirect}};
use axum_extra::{headers::{authorization::Bearer, Authorization}, TypedHeader};
use chrono::Utc;
use jsonwebtoken::{DecodingKey, Validation, decode};
use crate::models::jwt_claims::Claims;
use crate::auth::jwt::SECRET_KEY;


pub async fn is_logedin(
    bearer: Option<TypedHeader<Authorization<Bearer>>>, 
    req: Request<Body>,
    next: Next
) -> impl IntoResponse{

    if bearer.is_none() {
        println!("No Bearer Token found");
        return (StatusCode::UNAUTHORIZED, Redirect::temporary("/login")).into_response();
    }else{
        if let Some(TypedHeader(Authorization(token))) = bearer {
            let claims = if let Ok(claims) = decode::<Claims>(
                token.token(),
                &DecodingKey::from_secret(SECRET_KEY.as_bytes()),
                &Validation::default(),
            ) {
                claims
            } else {
                return StatusCode::UNAUTHORIZED.into_response();
            };
    
            if claims.claims.exp >= Utc::now().timestamp() as usize {
                next.run(req).await
            } else {
                StatusCode::UNAUTHORIZED.into_response()
            }
        } else {
            /* should not happen in release ever */
            println!("No bearer token, although debug mode");
            next.run(req).await
        }
    } 

}
